"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AccountMenu } from "./AccountMenu";
import { LanguageToggle } from "./LanguageToggle";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useOutsideClose } from "@/lib/useOutsideClose";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

const subscribeNothing = () => () => {};

/**
 * False while hydrating, true afterwards. The header streams in behind a Suspense boundary, so
 * by the time it hydrates the auth provider may already have read localStorage; rendering the
 * account area from that state would not match the server HTML.
 */
function useHydrated() {
  return useSyncExternalStore(subscribeNothing, () => true, () => false);
}

export function SiteHeader({
  lang,
  dict,
  categoryLinks,
}: {
  lang: Locale;
  dict: Dictionary;
  /** The <li> items of the Categories dropdown, rendered on the server (see CategoryLinks). */
  categoryLinks: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const pathname = usePathname();
  const auth = useAuth();
  const hydrated = useHydrated();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [menuPath, setMenuPath] = useState(pathname);

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useOutsideClose(open, [menuRef, menuButtonRef], () => setOpen(false));
  useOutsideClose(categoriesOpen, [categoriesRef], () => setCategoriesOpen(false));

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const home = localePath(lang, "/");
  const items = [
    { key: "home", href: home, label: dict.nav.home, active: pathname === home },
    // Plain anchor: from any other page, Next navigates to the landing page and scrolls.
    { key: "categories", href: `${home === "/" ? "" : home}/#categories`, label: dict.nav.categories, active: false, menu: true },
    {
      key: "courses",
      href: localePath(lang, "/courses"),
      label: dict.nav.courses,
      active: pathname.startsWith(localePath(lang, "/courses")),
    },
    // Only for signed-in customers, and only once hydrated: the server HTML cannot know who is looking.
    ...(hydrated && auth.status === "authenticated" && auth.user?.actor === "Customer"
      ? [{ key: "myCourses", href: localePath(lang, "/account/courses"), label: dict.nav.myCourses, active: pathname.startsWith(localePath(lang, "/account/courses")) }]
      : []),
  ];

  const linkClass = (active: boolean) =>
    `rounded px-3 py-2 text-sm font-semibold uppercase tracking-widest transition-colors ${
      active ? "text-beige underline decoration-terracotta decoration-2 underline-offset-8" : "text-beige/75 hover:text-beige"
    }`;

  const loading = !hydrated || auth.status === "loading";
  const user = auth.status === "authenticated" ? auth.user : null;

  const loginLink = (className: string) => (
    <Link
      href={localePath(lang, "/login")}
      aria-current={pathname === localePath(lang, "/login") ? "page" : undefined}
      className={`rounded bg-terracotta font-semibold uppercase tracking-widest text-beige hover:bg-terracotta-hover ${className}`}
    >
      {dict.nav.login}
    </Link>
  );

  const renderAccount = () => loading ? (
    // Reserve the space so the header does not jump when the session is read.
    <div aria-hidden className="h-9 w-28" />
  ) : user ? (
      <AccountMenu lang={lang} dict={dict} />
    ) : (
      loginLink("px-4 py-2 text-sm")
    );

  return (
    <header className="sticky top-0 z-40 border-b border-beige/15 bg-olive/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo lang={lang} />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {items.map((item) =>
            "menu" in item ? (
              // Opens on hover, on focus, and on tap/click of the chevron; Escape or leaving closes it.
              <div
                key={item.key}
                ref={categoriesRef}
                className="relative flex items-center"
                onMouseEnter={() => setCategoriesOpen(true)}
                onMouseLeave={() => setCategoriesOpen(false)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setCategoriesOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setCategoriesOpen(false);
                }}
                onClick={() => setCategoriesOpen(false)}
              >
                <Link href={item.href} className={`${linkClass(false)} pr-1`}>
                  {item.label}
                </Link>
                <button
                  type="button"
                  aria-label={dict.nav.categoriesMenu}
                  aria-haspopup="menu"
                  aria-expanded={categoriesOpen}
                  onClick={(event) => {
                    event.stopPropagation();
                    setCategoriesOpen((value) => !value);
                  }}
                  className="rounded p-1 text-beige/75 hover:text-beige"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden className={categoriesOpen ? "rotate-180" : ""}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {categoriesOpen && (
                  // The pt-2 wrapper bridges the gap, so the pointer never leaves the hover area.
                  <div className="absolute left-0 top-full z-50 pt-2">
                    <ul role="menu" className="min-w-52 rounded-lg border border-beige/20 bg-olive-raised p-1 shadow-xl">
                      {categoryLinks}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Link key={item.key} href={item.href} aria-current={item.active ? "page" : undefined} className={linkClass(item.active)}>
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <LanguageToggle lang={lang} label={dict.nav.language} />
          {renderAccount()}
        </div>

        <div className="flex min-w-0 items-center gap-2 md:hidden">
          {loading ? (
            <div aria-hidden className="h-8 w-16" />
          ) : user ? (
            <p className="flex min-w-0 max-w-40 items-center gap-2 text-sm font-semibold text-beige">
              <span className="truncate">{user.name}</span>
              {user.actor === "Staff" && (
                <span className="shrink-0 rounded bg-terracotta px-2 py-0.5 text-xs font-semibold uppercase tracking-widest">{dict.auth.adminBadge}</span>
              )}
            </p>
          ) : (
            loginLink("px-3 py-1.5 text-xs")
          )}
          <button
            ref={menuButtonRef}
            type="button"
            className="shrink-0 rounded p-2"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? dict.nav.closeMenu : dict.nav.menu}
            onClick={() => setOpen((value) => !value)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div ref={menuRef} id="mobile-menu" className="border-t border-beige/15 px-4 pb-5 pt-3 md:hidden" onClick={() => setOpen(false)}>
          <nav aria-label="Main" className="flex flex-col">
            {items.map((item) => (
              <div key={item.key}>
                <Link href={item.href} aria-current={item.active ? "page" : undefined} className={`${linkClass(item.active)} block py-3`}>
                  {item.label}
                </Link>
                {"menu" in item && <ul className="mb-2 ml-3 border-l border-beige/20 pl-2">{categoryLinks}</ul>}
              </div>
            ))}
          </nav>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4 border-t border-beige/15 pt-4">
            <LanguageToggle lang={lang} label={dict.nav.language} />
            {!loading && user && <AccountMenu lang={lang} dict={dict} inline />}
          </div>
        </div>
      )}
    </header>
  );
}
