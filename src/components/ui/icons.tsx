import type { SVGProps } from "react";

/** Small stroke icons (24x24). Decorative by default: pass a title/aria-label where an icon stands alone. */
const PATHS = {
  cart: "M6 6h15l-1.5 9h-12zM6 6 5 3H2M9 20.5a.5.5 0 1 0 0 .01M18 20.5a.5.5 0 1 0 0 .01",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6 6 18",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3",
  arrow: "M5 12h14M13 6l6 6-6 6",
  check: "M5 12l5 5L20 7",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  download: "M12 3v12M7 10l5 5 5-5M4 21h16",
  box: "M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  tool: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-.6-.6-2.6z",
  truck: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  rupee: "M7 5h10M7 9h10M7 5c6 0 6 8 0 8l7 7",
  message: "M4 5h16v11H9l-5 4z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",
  chevron: "M6 9l6 6 6-6",
  cpu: "M7 7h10v10H7zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4",
  code: "M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14",
  list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  home: "M3 11l9-8 9 8M5 10v10h14V10",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5", ...rest }: { name: IconName; className?: string } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden={rest["aria-label"] ? undefined : true} {...rest}>
      <path d={PATHS[name]} />
    </svg>
  );
}
