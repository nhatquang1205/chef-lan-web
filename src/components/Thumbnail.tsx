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
  sizes,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
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

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      // `priority` is deprecated in Next 16; above-the-fold images load eagerly instead.
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      sizes={sizes}
      className={`object-cover ${className}`}
    />
  );
}
