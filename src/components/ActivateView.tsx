"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api/client";
import { useAuth, type AuthFailure } from "@/lib/auth/AuthProvider";
import { template } from "@/lib/format";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

const CONTACT_PHONE = "0932 046 296";

type Phase =
  | { kind: "checking" }
  | { kind: "missing" }
  | { kind: "expired" }
  | { kind: "error"; message: string }
  | { kind: "ready"; email: string; fullName: string };

interface InviteInfo {
  email: string;
  fullName: string;
}

/** The mail link carries the token in the fragment, so it never reaches server logs. */
function takeTokenFromHash(): string | null {
  const match = /(?:^#|&)token=([^&]*)/.exec(window.location.hash);
  // Drop the fragment from the address bar and history whether or not it held a token.
  window.history.replaceState(null, "", window.location.pathname + window.location.search);

  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]) || null;
  } catch {
    return match[1] || null;
  }
}

function failureMessage(failure: AuthFailure, dict: Dictionary): string {
  const errors = dict.auth.errors;

  switch (failure.kind) {
    case "rateLimited": return template(errors.rateLimited, { seconds: failure.seconds });
    case "validation": return errors.validation;
    case "network": return errors.network;
    default: return errors.unknown;
  }
}

export function ActivateView({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const auth = useAuth();
  const router = useRouter();
  const uid = useId();
  const tokenRef = useRef<string | null>(null);
  const readHash = useRef(false);
  const [phase, setPhase] = useState<Phase>({ kind: "checking" });
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    // Read once: in development React runs effects twice and the second read would find the hash already gone.
    if (!readHash.current) {
      readHash.current = true;
      tokenRef.current = takeTokenFromHash();
    }

    const token = tokenRef.current;

    if (!token) {
      // Deferred so the effect does not set state synchronously.
      queueMicrotask(() => setPhase({ kind: "missing" }));
      return;
    }

    const controller = new AbortController();

    apiFetch<InviteInfo>("/api/v1/auth/invitations/inspect", { method: "POST", body: { token }, signal: controller.signal })
      .then((info) => setPhase({ kind: "ready", email: info.email, fullName: info.fullName }))
      .catch((failure: unknown) => {
        if (failure instanceof DOMException && failure.name === "AbortError") {
          return;
        }

        if (failure instanceof ApiError && failure.code === "customer.invite_invalid") {
          setPhase({ kind: "expired" });
        } else if (failure instanceof ApiError && failure.status === 429) {
          setPhase({ kind: "error", message: template(dict.auth.errors.rateLimited, { seconds: failure.retryAfterSeconds ?? 60 }) });
        } else if (failure instanceof ApiError) {
          setPhase({ kind: "error", message: dict.auth.errors.unknown });
        } else {
          setPhase({ kind: "error", message: dict.auth.errors.network });
        }
      });

    return () => controller.abort();
  }, [dict]);

  async function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");

    setError(null);
    setFieldErrors({});

    if (password !== confirm) {
      setError(dict.activate.mismatch);
      return;
    }

    const token = tokenRef.current;

    if (!token) {
      setPhase({ kind: "missing" });
      return;
    }

    setPending(true);
    const result = await auth.acceptInvite(token, password);

    if (result.ok) {
      router.replace(`${localePath(lang, "/account/courses")}?activated=1`);
      return;
    }

    setPending(false);

    if (result.failure.kind === "inviteInvalid") {
      setPhase({ kind: "expired" });
      return;
    }

    setError(failureMessage(result.failure, dict));
    setFieldErrors(result.fieldErrors ?? {});
  }

  const field = "w-full rounded border border-beige/30 bg-olive px-3 py-2.5 text-beige placeholder:text-beige/40";
  const label = "mb-1 block text-xs font-semibold uppercase tracking-widest text-beige/70";
  const notice = (title: string, text: string) => (
    <div className="space-y-4 text-center">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="text-beige/80">{text}</p>
      <p className="text-beige/80">
        {dict.activate.contact}:{" "}
        <a href={`tel:${CONTACT_PHONE.replaceAll(" ", "")}`} className="font-semibold text-beige underline underline-offset-4">
          {CONTACT_PHONE}
        </a>
      </p>
      <Link href={localePath(lang, "/login")} className="inline-block font-semibold text-beige underline underline-offset-4">
        {dict.activate.loginLink}
      </Link>
    </div>
  );

  if (phase.kind === "checking") {
    return <p className="text-center text-beige/70" role="status">{dict.activate.checking}</p>;
  }

  if (phase.kind === "missing") {
    return notice(dict.activate.invalidTitle, dict.activate.invalidText);
  }

  if (phase.kind === "expired") {
    return notice(dict.activate.expiredTitle, dict.activate.expiredText);
  }

  if (phase.kind === "error") {
    return (
      <div role="alert" className="rounded border border-terracotta bg-terracotta/25 px-4 py-3 text-beige">
        {phase.message}
      </div>
    );
  }

  const passwordErrors = fieldErrors.password ?? fieldErrors.Password;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="text-center">
        <p className="font-display text-2xl">{template(dict.activate.hello, { name: phase.fullName })}</p>
        <p className="mt-2 text-beige/75">{dict.activate.intro}</p>
      </div>

      {error && (
        <div role="alert" className="rounded border border-terracotta bg-terracotta/25 px-4 py-3 text-beige">
          {error}
        </div>
      )}

      <div>
        <label htmlFor={`${uid}-email`} className={label}>{dict.auth.email}</label>
        <input
          id={`${uid}-email`}
          type="email"
          value={phase.email}
          readOnly
          autoComplete="username"
          className={`${field} cursor-default opacity-75`}
        />
      </div>

      <div>
        <label htmlFor={`${uid}-password`} className={label}>{dict.activate.newPassword}</label>
        <div className="relative">
          <input
            id={`${uid}-password`}
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            className={`${field} pr-20`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-semibold uppercase tracking-widest text-beige/75 hover:text-beige"
          >
            {showPassword ? dict.auth.hide : dict.auth.show}
          </button>
        </div>
        <p className="mt-1 text-sm text-beige/60">{dict.auth.passwordHint}</p>
        {passwordErrors?.map((text) => <p key={text} className="mt-1 text-sm text-beige/80">{text}</p>)}
      </div>

      <div>
        <label htmlFor={`${uid}-confirm`} className={label}>{dict.activate.confirmPassword}</label>
        <input
          id={`${uid}-confirm`}
          name="confirm"
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className={field}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-terracotta px-5 py-3 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover disabled:opacity-60"
      >
        {pending ? dict.activate.submitting : dict.activate.submit}
      </button>
    </form>
  );
}
