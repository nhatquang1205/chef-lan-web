"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError, NetworkError } from "@/lib/api/client";
import type { Customer, CustomerAuthResponse } from "@/lib/api/types";

/**
 * Tokens live in localStorage. That is readable by any script on the page, so an XSS bug
 * would expose them; refresh-token rotation with reuse detection (backend) limits the damage
 * to one stolen session. Chosen over httpOnly cookies on purpose (see docs/customer-web).
 */
const STORAGE_KEY = "cheflan.session";
const REFRESH_MARGIN_MS = 60_000;

interface Session {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  customer: Customer;
}

export type AuthFailure =
  | { kind: "invalid" | "notActivated" | "locked" | "inactive" | "emailUsed" | "validation" | "network" | "unknown" }
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
  customer: Customer | null;
  login(email: string, password: string): Promise<AuthResult>;
  register(input: RegisterInput): Promise<AuthResult>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
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

  const store = useCallback((next: Session | null) => {
    writeSession(next);
    setSession(next);
    setStatus(next ? "authenticated" : "anonymous");
  }, []);

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
        setSession(saved);
        setStatus("authenticated");
        return;
      }

      try {
        const renewed = await apiFetch<CustomerAuthResponse>("/api/v1/auth/refresh", {
          method: "POST",
          body: { refreshToken: saved.refreshToken },
        });

        if (!cancelled) {
          store(renewed);
        }
      } catch (error) {
        // A network blip must not sign the user out; a real rejection must.
        if (!cancelled) {
          if (error instanceof ApiError) {
            store(null);
          } else {
            setSession(saved);
            setStatus("authenticated");
          }
        }
      }
    }

    void restore();

    return () => {
      cancelled = true;
    };
  }, [store]);

  const login = useCallback<AuthContextValue["login"]>(
    async (email, password) => {
      try {
        store(
          await apiFetch<CustomerAuthResponse>("/api/v1/auth/login", {
            method: "POST",
            body: { email, password },
          }),
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
          await apiFetch<CustomerAuthResponse>("/api/v1/auth/register", {
            method: "POST",
            body: { ...input, phone: input.phone || null },
          }),
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
      let active = current;

      if (new Date(current.accessTokenExpiresAt).getTime() <= Date.now()) {
        active = await apiFetch<CustomerAuthResponse>("/api/v1/auth/refresh", {
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

  const value = useMemo<AuthContextValue>(
    () => ({ status, customer: session?.customer ?? null, login, register, logout }),
    [status, session, login, register, logout],
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
