import Image from "next/image";
import type { Dictionary } from "@/i18n/dictionaries";

// From the Bon Bocon brand guide (business card, page 4). Not language dependent.
const contact = {
  email: "bonboconrestaurant@gmail.com",
  phones: [
    { label: "Mrs. Lan", number: "0932 046 296" },
    { label: "Hotline", number: "0905 734 875" },
  ],
  social: [
    { label: "Facebook", handle: "@bonboconrestaurant", href: "https://www.facebook.com/bonboconrestaurant" },
    { label: "Instagram", handle: "@bonboconrestaurant", href: "https://www.instagram.com/bonboconrestaurant" },
  ],
};

export function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer className="mt-24 border-t border-beige/15 bg-olive">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[auto_1fr]">
        <Image src="/logo.png" alt="Bon Bocon — Italian homemade restaurant" width={160} height={160} className="h-40 w-40 rounded" />

        <div>
          <h2 className="font-display text-xl">{dict.footer.contact}</h2>
          <ul className="mt-4 grid gap-x-10 gap-y-2 text-beige/85 sm:grid-cols-2">
            <li>{dict.footer.hours}</li>
            <li>{dict.footer.address}</li>
            {contact.phones.map((phone) => (
              <li key={phone.number}>
                <a href={`tel:${phone.number.replaceAll(" ", "")}`} className="hover:text-beige hover:underline">
                  {phone.number}
                </a>{" "}
                <span className="text-beige/55">({phone.label})</span>
              </li>
            ))}
            <li>
              <a href={`mailto:${contact.email}`} className="hover:text-beige hover:underline">
                {contact.email}
              </a>
            </li>
            {contact.social.map((item) => (
              <li key={item.label}>
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-beige hover:underline">
                  {item.label} {item.handle}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="border-t border-beige/10 py-5 text-center text-sm text-beige/55">
        © {dict.footer.rights}
      </p>
    </footer>
  );
}
