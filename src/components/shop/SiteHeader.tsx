import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/dal";
import { SearchBox } from "./SearchBox";

async function AccountLinks() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <>
        <Link href="/login" className="hover:underline">Sign in</Link>
        <Link href="/signup" className="rounded-md bg-blue-700 px-3 py-1.5 text-white hover:bg-blue-800">Sign up</Link>
      </>
    );
  }
  return (
    <>
      {user.role === "admin" ? <Link href="/admin" className="hover:underline">Admin</Link> : null}
      <Link href="/cart" className="hover:underline">Cart</Link>
      <Link href="/account" className="hover:underline">Account</Link>
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight text-blue-800">ProjectNexa</Link>
        <nav aria-label="Main" className="flex items-center gap-4 text-sm font-medium">
          <Link href="/products" className="hover:underline">Projects</Link>
          <Link href="/branches" className="hover:underline">Branches</Link>
          <Link href="/custom-projects" className="hover:underline">Custom projects</Link>
        </nav>
        <div className="order-last w-full md:order-none md:w-auto md:flex-1 md:max-w-md">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-4 text-sm font-medium">
          <Suspense fallback={<span className="w-24" />}>
            <AccountLinks />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-sm text-slate-600">
      <div className="mx-auto max-w-6xl px-4">
        <p>© ProjectNexa. Sales within India only. Prices in INR.</p>
        <p className="mt-1">Payments are verified manually after you submit your UPI / bank-transfer reference.</p>
      </div>
    </footer>
  );
}
