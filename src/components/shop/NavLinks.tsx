"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icons";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/branches", label: "Engineering Branches" },
  { href: "/products?type=digital", label: "Digital Projects" },
  { href: "/products?type=hardware", label: "Hardware Kits" },
  { href: "/custom-projects", label: "Custom Projects" },
  { href: "/about", label: "About Us" },
] as const;

function isActive(pathname: string, href: string): boolean {
  const path = href.split("?")[0];
  if (href.includes("?")) return false; // filtered listings share /products; only the plain pages are highlighted
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");
}

/** Reads the current URL, so it must be rendered inside <Suspense> (see SiteHeader). */
export function DesktopNav() {
  return <DesktopNavView pathname={usePathname()} />;
}

/** Same links without the "current page" highlight; used as the Suspense fallback so links are in the first HTML. */
export function DesktopNavFallback() {
  return <DesktopNavView pathname="" />;
}

function DesktopNavView({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main" className="hidden border-t border-slate-200/70 lg:block">
      <ul className="mx-auto flex max-w-6xl items-center gap-1 px-4">
        {NAV_LINKS.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative block px-3 py-3 text-sm font-medium transition-colors hover:text-blue-700 ${active ? "text-blue-700 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-blue-600" : "text-slate-700"}`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Phone / tablet menu. Opens a panel under the header; closes on navigation and on Escape. */
export function MobileMenu({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname; // navigating to another page closes it automatically

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenOn(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpenOn(open ? null : pathname)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-800 hover:bg-slate-100"
      >
        <Icon name={open ? "close" : "menu"} className="h-6 w-6" />
      </button>
      {open ? (
        <div id="mobile-menu" className="absolute inset-x-0 top-full z-50 border-b border-slate-200 bg-white shadow-lg">
          <nav aria-label="Mobile" className="mx-auto max-w-6xl px-4 py-3">
            <ul className="divide-y divide-slate-100">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} aria-current={isActive(pathname, l.href) ? "page" : undefined} className="flex items-center justify-between py-3 text-base font-medium text-slate-800 hover:text-blue-700">
                    {l.label}
                    <Icon name="arrow" className="h-4 w-4 text-slate-400" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-100 pt-3">{children}</div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
