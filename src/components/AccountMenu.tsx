"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

const itemClass = "block w-full rounded px-3 py-2 text-left text-sm text-beige/85 hover:bg-beige/10 hover:text-beige";

/** The signed-in user's name with a dropdown (hover, focus or chevron tap); `inline` lists the items flat, for the mobile menu. */
export function AccountMenu({ lang, dict, inline = false }: { lang: Locale; dict: Dictionary; inline?: boolean }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) {
    return null;
  }

  const items = (
    <>
      <li role="none">
        <Link role="menuitem" href={localePath(lang, "/account/courses")} className={itemClass}>
          {dict.nav.myCourses}
        </Link>
      </li>
      <li role="none">
        <Link role="menuitem" href={localePath(lang, "/account/history")} className={itemClass}>
          {dict.nav.history}
        </Link>
      </li>
      <li role="none">
        <button type="button" role="menuitem" onClick={() => void logout()} className={itemClass}>
          {dict.nav.logout}
        </button>
      </li>
    </>
  );

  const admin = user.actor === "Staff" && (
    <span className="shrink-0 rounded bg-terracotta px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-beige">
      {dict.auth.adminBadge}
    </span>
  );

  if (inline) {
    return (
      <div className="w-full">
        <p className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-beige">
          <span className="truncate">{user.name}</span>
          {admin}
        </p>
        <ul role="menu" aria-label={dict.account.menuLabel} className="flex flex-col">
          {items}
        </ul>
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
      onClick={() => setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={dict.account.menuLabel}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="flex max-w-56 items-center gap-2 rounded px-3 py-2 text-sm font-semibold text-beige hover:bg-beige/10"
      >
        <span className="truncate">{user.name}</span>
        {admin}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden className={`shrink-0 ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        // The pt-2 wrapper bridges the gap, so the pointer never leaves the hover area.
        <div className="absolute right-0 top-full z-50 pt-2">
          <ul role="menu" aria-label={dict.account.menuLabel} className="min-w-52 rounded-lg border border-beige/20 bg-olive-raised p-1 shadow-xl">
            {items}
          </ul>
        </div>
      )}
    </div>
  );
}
