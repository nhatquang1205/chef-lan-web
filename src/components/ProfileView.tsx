"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getProvinces, updateProfile } from "@/lib/api/profile";
import type { Province } from "@/lib/api/types";
import { useAuth, type AuthUser } from "@/lib/auth/AuthProvider";
import { safeNext, stripLocale } from "@/lib/auth/profileRedirect";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

const PHONE = /^\+?[0-9]{9,15}$/;

const field = "w-full rounded border border-beige/30 bg-olive px-3 py-2.5 text-beige placeholder:text-beige/40";
const label = "mb-1 block text-xs font-semibold uppercase tracking-widest text-beige/70";

export function ProfileView({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const auth = useRequireAuth(lang);
  const [provinces, setProvinces] = useState<Province[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getProvinces(controller.signal)
      .then(setProvinces)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setFailed(true);
        }
      });

    return () => controller.abort();
  }, []);

  if (auth.status === "authenticated" && auth.user?.actor === "Staff") {
    return <p role="status" className="text-center text-beige/75">{dict.profile.staff}</p>;
  }

  if (failed) {
    return <p role="alert" className="rounded border border-terracotta bg-terracotta/25 px-4 py-3 text-beige">{dict.profile.loadFailed}</p>;
  }

  if (auth.status !== "authenticated" || !auth.user || !provinces) {
    return <p role="status" className="text-center text-beige/70">{dict.profile.loading}</p>;
  }

  return <ProfileForm lang={lang} dict={dict} user={auth.user} provinces={provinces} />;
}

function ProfileForm({ lang, dict, user, provinces }: { lang: Locale; dict: Dictionary; user: AuthUser; provinces: Province[] }) {
  const { getAccessToken, updateCustomer } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const uid = useId();
  const [fullName, setFullName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [provinceCode, setProvinceCode] = useState(user.provinceCode ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const fieldError = (name: string) =>
    errors[name]?.map((text) => (
      <p key={text} className="mt-1 text-sm text-beige/80">{text}</p>
    ));

  async function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = fullName.trim();
    const digits = phone.replace(/[\s.]/g, "");
    const invalid: Record<string, string[]> = {};

    if (!name) invalid.fullName = [dict.profile.nameRequired];
    if (!PHONE.test(digits)) invalid.phone = [dict.profile.phoneInvalid];
    if (!provinceCode) invalid.provinceCode = [dict.profile.provinceRequired];

    setError(null);
    setErrors(invalid);

    if (Object.keys(invalid).length > 0) {
      return;
    }

    setPending(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        setPending(false);
        return;
      }

      updateCustomer(await updateProfile(token, { fullName: name, phone: digits, provinceCode }));

      const target = next && stripLocale(next.split(/[?#]/)[0]) !== "/account/profile" ? next : localePath(lang, "/account/courses");
      router.replace(target);
    } catch (failure) {
      setPending(false);

      if (failure instanceof ApiError && failure.status === 400) {
        const byField: Record<string, string[]> = {};

        for (const [key, messages] of Object.entries(failure.problem.errors ?? {})) {
          byField[key[0].toLowerCase() + key.slice(1)] = messages;
        }

        setErrors(byField);
        setError(dict.auth.errors.validation);
      } else {
        setError(failure instanceof ApiError ? dict.auth.errors.unknown : dict.auth.errors.network);
      }
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <p className="text-center text-beige/75">{dict.profile.intro}</p>

      {error && (
        <div role="alert" className="rounded border border-terracotta bg-terracotta/25 px-4 py-3 text-beige">
          {error}
        </div>
      )}

      <div>
        <label htmlFor={`${uid}-name`} className={label}>{dict.profile.name}</label>
        <input id={`${uid}-name`} value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={200} autoComplete="name" className={field} />
        {fieldError("fullName")}
      </div>

      <div>
        <label htmlFor={`${uid}-email`} className={label}>{dict.profile.email}</label>
        <input id={`${uid}-email`} type="email" value={user.email ?? ""} readOnly autoComplete="username" className={`${field} cursor-default opacity-75`} />
      </div>

      <div>
        <label htmlFor={`${uid}-phone`} className={label}>{dict.profile.phone}</label>
        <input id={`${uid}-phone`} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required maxLength={20} autoComplete="tel" className={field} />
        {fieldError("phone")}
      </div>

      <div>
        <label htmlFor={`${uid}-province`} className={label}>{dict.profile.province}</label>
        <select id={`${uid}-province`} value={provinceCode} onChange={(event) => setProvinceCode(event.target.value)} required autoComplete="address-level1" className={field}>
          <option value="">{dict.profile.provincePlaceholder}</option>
          {provinces.map((province) => (
            <option key={province.code} value={province.code}>{province.name}</option>
          ))}
        </select>
        {fieldError("provinceCode")}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-terracotta px-5 py-3 font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover disabled:opacity-60"
      >
        {pending ? dict.profile.saving : dict.profile.save}
      </button>
    </form>
  );
}
