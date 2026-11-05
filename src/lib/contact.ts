// From the Bon Bocon brand guide (business card, page 4). Not language dependent.
export const contact = {
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

export const CONTACT_PHONE = contact.phones[0].number;

export function telHref(number: string): string {
  return `tel:${number.replaceAll(" ", "")}`;
}
