"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { useAuth, type AuthFailure } from "@/lib/auth/AuthProvider";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { template } from "@/lib/format";

/** Same-origin paths only: `?next=https://evil.example` or `//evil.example` would be an open redirect. */
function safeNext(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : null;
}

function message(failure: AuthFailure, dict: Dictionary): string {
  const errors = dict.auth.errors;

  switch (failure.kind) {
    case "invalid": return errors.invalid;
    case "notActivated": return errors.notActivated;
    case "locked": return errors.locked;
    case "inactive": return errors.inactive;
    case "emailUsed": return errors.emailUsed;
    case "rateLimited": return template(errors.rateLimited, { seconds: failure.seconds });
    case "validation": return errors.validation;
    case "network": return errors.network;
    default: return errors.unknown;
  }
}

export function AuthForm({ mode, lang, dict }: { mode: "login" | "register"; lang: Locale; dict: Dictionary }) {
  const auth = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const uid = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const isLogin = mode === "login";
  const destination = next ?? localePath(lang, "/");

  async function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    const result = isLogin
      ? await auth.login(email, password)
      : await auth.register({
          email,
          password,
          fullName: String(data.get("fullName") ?? "").trim(),
          phone: String(data.get("phone") ?? "").trim() || undefined,
        });

    if (result.ok) {
      router.replace(destination);
      return;
    }

    setPending(false);
    setError(message(result.failure, dict));
    setFieldErrors(result.fieldErrors ?? {});
  }

  const field = "w-full rounded border border-beige/30 bg-olive px-3 py-2.5 text-beige placeholder:text-beige/40";
  const label = "mb-1 block text-xs font-semibold uppercase tracking-widest text-beige/70";
  const fieldError = (name: string) =>
    (fieldErrors[name] ?? fieldErrors[name[0].toUpperCase() + name.slice(1)])?.map((text) => (
      <p key={text} className="mt-1 text-sm text-beige/80">{text}</p>
    ));

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && (
        <div role="alert" className="rounded border border-terracotta bg-terracotta/25 px-4 py-3 text-beige">
          {error}
        </div>
      )}

      {!isLogin && (
        <div>
          <label htmlFor={`${uid}-name`} className={label}>{dict.auth.fullName}</label>
          <input id={`${uid}-name`} name="fullName" required maxLength={200} autoComplete="name" className={field} />
          {fieldError("fullName")}
        </div>
      )}

      <div>
        <label htmlFor={`${uid}-email`} className={label}>{dict.auth.email}</label>
        <input id={`${uid}-email`} name="email" type="email" required maxLength={254} autoComplete={isLogin ? "username" : "email"} className={field} />
        {fieldError("email")}
      </div>

      <div>
        <label htmlFor={`${uid}-password`} className={label}>{dict.auth.password}</label>
        <div className="relative">
          <input
            id={`${uid}-password`}
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={isLogin ? undefined : 8}
            maxLength={128}
            autoComplete={isLogin ? "current-password" : "new-password"}
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
        {!isLogin && <p className="mt-1 text-sm text-beige/60">{dict.auth.passwordHint}</p>}
        {fieldError("password")}
      </div>

      {!isLogin && (
        <div>
          <label htmlFor={`${uid}-phone`} className={label}>{dict.auth.phone}</label>
          <input id={`${uid}-phone`} name="phone" type="tel" maxLength={20} autoComplete="tel" className={field} />
          {fieldError("phone")}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-terracotta px-5 py-3 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover disabled:opacity-60"
      >
        {pending ? (isLogin ? dict.auth.loggingIn : dict.auth.registering) : isLogin ? dict.auth.loginSubmit : dict.auth.registerSubmit}
      </button>

      <p className="text-center text-sm text-beige/75">
        {isLogin ? dict.auth.noAccount : dict.auth.haveAccount}{" "}
        <Link
          href={`${localePath(lang, isLogin ? "/register" : "/login")}${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-beige underline underline-offset-4"
        >
          {isLogin ? dict.auth.registerLink : dict.auth.loginLink}
        </Link>
      </p>
    </form>
  );
}
