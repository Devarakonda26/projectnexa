import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/auth/dal";
import { SITE } from "@/lib/site";
import { DesktopNav, DesktopNavFallback, MobileMenu } from "./NavLinks";
import { SearchBox } from "./SearchBox";

const pill = "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-blue-700";

async function AccountLinks({ compact = false }: { compact?: boolean }) {
  // Signed-in state is per-visitor, so this must run on each request (not at build time).
  await connection();
  const user = await getCurrentUser();
  const cls = compact ? "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800" : pill;
  if (!user) {
    return (
      <>
        <Link href="/cart" className={cls}><Icon name="cart" className="h-[18px] w-[18px]" />Cart</Link>
        <Link href="/login" className={cls}><Icon name="user" className="h-[18px] w-[18px]" />Sign in</Link>
        <Link href="/signup" className="inline-flex items-center rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Sign up</Link>
      </>
    );
  }
  return (
    <>
      {user.role === "admin" ? <Link href="/admin" className={cls}><Icon name="shield" className="h-[18px] w-[18px]" />Admin</Link> : null}
      <Link href="/cart" className={cls}><Icon name="cart" className="h-[18px] w-[18px]" />Cart</Link>
      <Link href="/account" className={cls}><Icon name="user" className="h-[18px] w-[18px]" />Account</Link>
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="relative">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Logo />
          <div className="mx-4 hidden max-w-xl flex-1 md:block">
            <SearchBox id="site-search" />
          </div>
          <div className="ml-auto hidden items-center gap-1 lg:flex">
            <Suspense fallback={<span className="h-9 w-48" aria-hidden />}>
              <AccountLinks />
            </Suspense>
          </div>
          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <Suspense fallback={<span className="inline-block h-10 w-10" aria-hidden />}>
              <MobileMenu>
                <Suspense fallback={null}>
                  <AccountLinks compact />
                </Suspense>
              </MobileMenu>
            </Suspense>
          </div>
        </div>
        <div className="mx-auto px-4 pb-3 md:hidden">
          <SearchBox id="site-search-mobile" />
        </div>
        <Suspense fallback={<DesktopNavFallback />}>
          <DesktopNav />
        </Suspense>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const link = "text-slate-300 transition-colors hover:text-white";
  return (
    <footer className="mt-20 bg-navy text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo tone="dark" />
          <p className="mt-3 text-sm font-medium text-sky-300">Engineering Ideas. Real Solutions.</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">
            Digital project packages, hardware kits and custom-built engineering projects, sold and managed by one company. We sell within India.
          </p>
        </div>
        <nav aria-label="Explore">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Explore</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/branches" className={link}>Engineering branches</Link></li>
            <li><Link href="/products?type=digital" className={link}>Digital projects</Link></li>
            <li><Link href="/products?type=hardware" className={link}>Hardware kits</Link></li>
            <li><Link href="/custom-projects" className={link}>Custom projects</Link></li>
            <li><Link href="/about" className={link}>About us</Link></li>
          </ul>
        </nav>
        <nav aria-label="Policies">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Policies</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/terms" className={link}>Terms of use</Link></li>
            <li><Link href="/privacy" className={link}>Privacy policy</Link></li>
            <li><Link href="/refunds" className={link}>Refunds &amp; returns</Link></li>
            <li><Link href="/shipping" className={link}>Shipping &amp; delivery</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Contact</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li className="flex items-start gap-2"><Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" /><a href={`mailto:${SITE.supportEmail}`} className={link}>{SITE.supportEmail}</a></li>
            <li className="flex items-start gap-2"><Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" /><span>{SITE.supportPhone}</span></li>
            <li className="flex items-start gap-2"><Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" /><span>{SITE.supportHours}</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:justify-between">
          <p>© ProjectNexa. Sales within India only. Prices in INR.</p>
          <p>Payments are verified manually after you submit your UPI / bank-transfer reference.</p>
        </div>
      </div>
    </footer>
  );
}
