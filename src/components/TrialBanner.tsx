import { contact } from "@/lib/contact";
import type { Dictionary } from "@/i18n/dictionaries";

export function TrialBanner({ dict }: { dict: Dictionary }) {
  const chefPage = contact.social.find((item) => "chef" in item && item.chef)!;

  return (
    <div className="bg-terracotta/90 px-4 py-2 text-center text-sm text-beige">
      {dict.banner.text}{" "}
      <a href={chefPage.href} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 hover:text-white">
        {dict.banner.link}
      </a>
      .
    </div>
  );
}
