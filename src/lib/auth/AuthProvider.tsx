"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, ApiError, NetworkError } from "@/lib/api/client";
import type { SessionResponse } from "@/lib/api/types";

/**
 * Tokens live in localStorage. That is readable by any script on the page, so an XSS bug
 * would expose them; refresh-token rotation with reuse detection (backend) limits the damage
 * to one stolen session. Chosen over httpOnly cookies on purpose (see docs/customer-web).
 */
const STORAGE_KEY = "cheflan.session";
const REFRESH_MARGIN_MS = 60_000;

/** What the UI needs to know about whoever is signed in, customer or admin alike. */
export interface AuthUser {
  id: number;
  name: string;
  actor: "Customer" | "Staff";
  role?: string;
}

interface Session {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  user: AuthUser;
}

/** Maps the API response (customer or staff) onto the stored session. */
function toSession(response: SessionResponse): Session {
  const staff = response.actor === "Staff" ? response.staff : undefined;

  return {
    accessToken: response.accessToken,
    accessTokenExpiresAt: response.accessTokenExpiresAt,
    refreshToken: response.refreshToken,
    user: staff
      ? { id: staff.id, name: staff.displayName, actor: "Staff", role: staff.role }
      : { id: response.customer?.id ?? 0, name: response.customer?.fullName ?? "", actor: "Customer" },
  };
}

export type AuthFailure =
  | { kind: "invalid" | "notActivated" | "locked" | "inactive" | "emailUsed" | "validation" | "inviteInvalid" | "network" | "unknown" }
  | { kind: "rateLimited"; seconds: number };

export type AuthResult = { ok: true } | { ok: false; failure: AuthFailure; fieldErrors?: Record<string, string[]> };

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

interface AuthContextValue {
  status: "loading" | "anonymous" | "authenticated";
  user: AuthUser | null;
  login(email: string, password: string): Promise<AuthResult>;
  register(input: RegisterInput): Promise<AuthResult>;
  /** Sets the first password from an invitation link and signs in, replacing any current session. */
  acceptInvite(token: string, password: string): Promise<AuthResult>;
  logout(): Promise<void>;
  /** A valid access token for API calls from the browser, renewed first if it is about to expire. Null when signed out. */
  getAccessToken(): Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Session;

    // Sessions stored by earlier builds lack `user.id`: sign in again.
    return parsed.user?.id != null ? parsed : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  try {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage blocked (private mode): the session lasts until the page closes.
  }
}

function toFailure(error: unknown): AuthResult {
  if (error instanceof NetworkError) {
    return { ok: false, failure: { kind: "network" } };
  }

  if (!(error instanceof ApiError)) {
    return { ok: false, failure: { kind: "unknown" } };
  }

  if (error.status === 429) {
    return { ok: false, failure: { kind: "rateLimited", seconds: error.retryAfterSeconds ?? 60 } };
  }

  if (error.code === "customer.invite_invalid") {
    return { ok: false, failure: { kind: "inviteInvalid" } };
  }

  if (error.status === 400) {
    return { ok: false, failure: { kind: "validation" }, fieldErrors: error.problem.errors };
  }

  const byCode: Record<string, AuthFailure["kind"]> = {
    "customer.invalid_credentials": "invalid",
    "customer.not_activated": "notActivated",
    "customer.account_locked": "locked",
    "customer.account_inactive": "inactive",
    "customer.email_already_used": "emailUsed",
  };

  return { ok: false, failure: { kind: byCode[error.code ?? ""] ?? "unknown" } as AuthFailure };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const sessionRef = useRef<Session | null>(null);
  const renewing = useRef<Promise<string | null> | null>(null);

  // The ref is set together with the state, never from a later effect: child components' effects run
  // BEFORE this provider's, so an effect-synced ref would still be empty when they ask for a token.
  const applySession = useCallback((next: Session | null) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const store = useCallback(
    (next: Session | null) => {
      writeSession(next);
      applySession(next);
      setStatus(next ? "authenticated" : "anonymous");
    },
    [applySession],
  );

  // Restore on mount. A session whose access token is (nearly) expired is refreshed first;
  // if that fails the user is simply signed out.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const saved = readSession();

      if (!saved) {
        setStatus("anonymous");
        return;
      }

      if (new Date(saved.accessTokenExpiresAt).getTime() - Date.now() > REFRESH_MARGIN_MS) {
        applySession(saved);
        setStatus("authenticated");
        return;
      }

      try {
        const renewed = await apiFetch<SessionResponse>("/api/v1/auth/refresh", {
          method: "POST",
          body: { refreshToken: saved.refreshToken },
        });

        if (!cancelled) {
          store(toSession(renewed));
        }
      } catch (error) {
        // A network blip must not sign the user out; a real rejection must.
        if (!cancelled) {
          if (error instanceof ApiError) {
            store(null);
          } else {
            applySession(saved);
            setStatus("authenticated");
          }
        }
      }
    }

    void restore();

    return () => {
      cancelled = true;
    };
  }, [store, applySession]);

  const login = useCallback<AuthContextValue["login"]>(
    async (email, password) => {
      try {
        store(
          toSession(
            await apiFetch<SessionResponse>("/api/v1/auth/login", {
              method: "POST",
              body: { email, password },
            }),
          ),
        );
        return { ok: true };
      } catch (error) {
        return toFailure(error);
      }
    },
    [store],
  );

  const register = useCallback<AuthContextValue["register"]>(
    async (input) => {
      try {
        store(
          toSession(
            await apiFetch<SessionResponse>("/api/v1/auth/register", {
              method: "POST",
              body: { ...input, phone: input.phone || null },
            }),
          ),
        );
        return { ok: true };
      } catch (error) {
        return toFailure(error);
      }
    },
    [store],
  );

  const acceptInvite = useCallback<AuthContextValue["acceptInvite"]>(
    async (token, password) => {
      try {
        store(
          toSession(
            await apiFetch<SessionResponse>("/api/v1/auth/invitations/accept", {
              method: "POST",
              body: { token, password },
            }),
          ),
        );
        return { ok: true };
      } catch (error) {
        return toFailure(error);
      }
    },
    [store],
  );

  const logout = useCallback(async () => {
    const current = session;
    store(null);

    if (!current) {
      return;
    }

    try {
      // Logout needs a valid access token to revoke the refresh token, so renew it first if
      // it has expired. Failing here must not keep the user signed in: we are already
      // signed out locally.
      let active: { accessToken: string; refreshToken: string } = current;

      if (new Date(current.accessTokenExpiresAt).getTime() <= Date.now()) {
        active = await apiFetch<SessionResponse>("/api/v1/auth/refresh", {
          method: "POST",
          body: { refreshToken: current.refreshToken },
        });
      }

      await apiFetch("/api/v1/auth/logout", {
        method: "POST",
        token: active.accessToken,
        body: { refreshToken: active.refreshToken },
      });
    } catch {
      // Already signed out locally.
    }
  }, [session, store]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const current = sessionRef.current;

    if (!current) {
      return null;
    }

    if (new Date(current.accessTokenExpiresAt).getTime() - Date.now() > REFRESH_MARGIN_MS) {
      return current.accessToken;
    }

    // One renewal at a time: refresh tokens rotate, so two parallel renewals would trip reuse detection.
    renewing.current ??= (async () => {
      try {
        const next = toSession(
          await apiFetch<SessionResponse>("/api/v1/auth/refresh", {
            method: "POST",
            body: { refreshToken: current.refreshToken },
          }),
        );
        store(next);
        return next.accessToken;
      } catch (error) {
        // A network blip must not sign the user out; a real rejection must.
        if (error instanceof ApiError) {
          store(null);
        }

        return null;
      } finally {
        renewing.current = null;
      }
    })();

    return renewing.current;
  }, [store]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: session?.user ?? null, login, register, acceptInvite, logout, getAccessToken }),
    [status, session, login, register, acceptInvite, logout, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }

  return context;
}
