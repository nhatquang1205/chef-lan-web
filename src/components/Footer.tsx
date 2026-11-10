import Image from "next/image";
import type { Dictionary } from "@/i18n/dictionaries";
import { contact, telHref } from "@/lib/contact";

const facebook = contact.social.filter((item) => item.label === "Facebook");
const otherSocial = contact.social.filter((item) => item.label !== "Facebook");

function socialItem(item: (typeof contact.social)[number]) {
  return (
    <li key={item.href}>
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-beige hover:underline">
        {item.label} {item.handle}
      </a>
    </li>
  );
}

export function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer className="mt-24 border-t border-beige/15 bg-olive">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[auto_1fr]">
        <Image src="/logo.png" alt="Bon Bocon — Italian homemade restaurant" width={160} height={160} className="h-40 w-40 rounded" />

        <div>
          <h2 className="font-display text-xl">{dict.footer.contact}</h2>
          <ul className="mt-4 grid gap-x-10 gap-y-2 text-beige/85 sm:grid-cols-2">
            {/* Two columns filled row by row, so the pairs line up: addresses, phones, Facebook pages, then hours beside Instagram. */}
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
            {facebook.map(socialItem)}
            <li>{dict.footer.hours}</li>
            {otherSocial.map(socialItem)}
          </ul>
        </div>
      </div>
      <div className="border-t border-beige/10 px-4 py-5 text-center text-sm text-beige/55">
        <p>© {dict.footer.rights}</p>
      </div>
    </footer>
  );
}
