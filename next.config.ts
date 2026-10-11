import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Vietnamese is the default locale and lives at the bare path; every route is nested under
  // app/[lang], so a bare path is rewritten to /vi/... here. English is /en/... and is left
  // alone. (This was a proxy.ts rewrite first; behind nginx's X-Forwarded-Proto: https the
  // proxy rewrite made Next fetch https://localhost:3100 over TLS and every page was a 500.)
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        { source: "/:path((?!en(?:/|$)|vi(?:/|$)|_next/).*)", destination: "/vi/:path" },
      ],
      fallback: [],
    };
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
