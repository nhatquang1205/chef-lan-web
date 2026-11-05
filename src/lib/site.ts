/** The public origin, for absolute URLs in the sitemap and Open Graph tags. Set NEXT_PUBLIC_SITE_URL in production. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
