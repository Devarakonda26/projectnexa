"use client";

import { useRef, useState } from "react";
/** Same file as PLACEHOLDER_IMAGE in lib/storage/public-urls (not imported: client components must not import from lib/storage). */
const PLACEHOLDER_IMAGE = "/images/placeholder.svg";

/**
 * <img> that falls back to the ProjectNexa placeholder if the picture fails to load
 * (including a failure that happened before the page became interactive).
 */
export function SmartImage({ src, alt, className = "", priority = false, width = 800, height = 600 }: {
  src: string; alt: string; className?: string; priority?: boolean; width?: number; height?: number;
}) {
  const [failed, setFailed] = useState(false);
  const checked = useRef(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={(el) => {
        if (el && !checked.current) {
          checked.current = true;
          if (el.complete && el.naturalWidth === 0) setFailed(true);
        }
      }}
      src={failed ? PLACEHOLDER_IMAGE : src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
