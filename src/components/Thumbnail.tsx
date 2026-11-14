import Image from "next/image";

/**
 * Course artwork with a fallback for the (common) case of no thumbnail. `unoptimized`
 * because thumbnails come from whatever host chef Lan's media lives on, and next/image would
 * otherwise refuse any host not listed in next.config; the CDN serves them already sized.
 */
export function Thumbnail({
  src,
  alt,
  className = "",
  priority = false,
  loading,
  sizes,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  /** Overrides the loading derived from `priority`, e.g. eager but not high priority for off-screen gallery slides. */
  loading?: "eager" | "lazy";
  sizes?: string;
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-gradient-to-br from-olive-raised via-olive to-terracotta/40 ${className}`}
      />
    );
  }

  const resolvedLoading = loading ?? (priority ? "eager" : "lazy");

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      // `priority` is deprecated in Next 16; above-the-fold images load eagerly instead.
      loading={resolvedLoading}
      fetchPriority={priority ? "high" : resolvedLoading === "eager" ? "low" : "auto"}
      sizes={sizes}
      className={`object-cover ${className}`}
    />
  );
}
