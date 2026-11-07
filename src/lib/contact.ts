// From the Bon Bocon brand guide (business card, page 4). Not language dependent.
export const contact = {
  addresses: ["164 Châu Thị Vĩnh Tế, Ngũ Hành Sơn, Đà Nẵng", "K35 Dương Đình Nghệ, An Hải, Đà Nẵng"],
  phones: [
    { label: "Mrs. Lan", number: "0775 965 143" },
    { label: "Hotline", number: "0932 046 296" },
  ],
  social: [
    { label: "Facebook", handle: "@bonboconrestaurant", href: "https://www.facebook.com/bonboconrestaurant" },
    // Chef Lan's own page: where a customer who chose to contact her directly is sent.
    { label: "Facebook", handle: "@Chefphuonglandoan", href: "https://www.facebook.com/Chefphuonglandoan", chef: true },
    { label: "Instagram", handle: "@bonboconrestaurant", href: "https://www.instagram.com/bonboconrestaurant" },
  ],
};

export const CONTACT_PHONE = contact.phones[0].number;

export function telHref(number: string): string {
  return `tel:${number.replaceAll(" ", "")}`;
}
