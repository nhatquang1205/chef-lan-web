import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/account", "/en/account", "/activate", "/en/activate"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
