import { LEGAL_UPDATED, legal, type LegalDoc } from "@/content/legal";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { template } from "@/lib/format";

export function LegalPage({ doc, lang, dict }: { doc: LegalDoc; lang: Locale; dict: Dictionary }) {
  const content = legal[lang][doc];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <title>{content.title}</title>
      <h1 className="font-display text-4xl sm:text-5xl">{content.title}</h1>
      <p className="mt-2 text-sm text-beige/60">{template(dict.footer.updated, { date: LEGAL_UPDATED })}</p>
      <p className="mt-6 text-beige/90">{content.intro}</p>
      {content.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="font-display text-2xl">{section.heading}</h2>
          {section.paragraphs.map((text) => (
            <p key={text} className="mt-3 text-beige/85">{text}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
