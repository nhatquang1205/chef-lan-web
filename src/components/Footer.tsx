import Image from "next/image";
import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { contact, telHref } from "@/lib/contact";

export function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <footer className="mt-24 border-t border-beige/15 bg-olive">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[auto_1fr]">
        <Image src="/logo.png" alt="Bon Bocon — Italian homemade restaurant" width={160} height={160} className="h-40 w-40 rounded" />

        <div>
          <h2 className="font-display text-xl">{dict.footer.contact}</h2>
          <ul className="mt-4 grid gap-x-10 gap-y-2 text-beige/85 sm:grid-cols-2">
            <li>{dict.footer.hours}</li>
            {contact.addresses.map((address) => (
              <li key={address}>{address}</li>
            ))}
            {contact.phones.map((phone) => (
              <li key={phone.number}>
                <a href={telHref(phone.number)} className="hover:text-beige hover:underline">
                  {phone.number}
                </a>{" "}
                <span className="text-beige/55">({phone.label})</span>
              </li>
            ))}
            {contact.social.map((item) => (
              <li key={item.href}>
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-beige hover:underline">
                  {item.label} {item.handle}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-beige/10 px-4 py-5 text-center text-sm text-beige/55">
        <nav aria-label="Legal" className="mb-2 flex flex-wrap justify-center gap-x-6 gap-y-1">
          {(["terms", "privacy", "refund"] as const).map((doc) => (
            <Link key={doc} href={localePath(lang, `/${doc}`)} className="hover:text-beige hover:underline">
              {dict.footer[doc]}
            </Link>
          ))}
        </nav>
        <p>© {dict.footer.rights}</p>
      </div>
    </footer>
  );
}
