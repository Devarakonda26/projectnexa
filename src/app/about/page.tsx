import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ABOUT_VALUES, BUSINESS_LINES } from "@/data/site-content";
import { SITE } from "@/lib/site";

export const metadata = { title: "About us", description: "ProjectNexa – Engineering Ideas. Real Solutions." };

export default function AboutPage() {
  return (
    <main>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <Breadcrumbs tone="dark" items={[{ label: "Home", href: "/" }, { label: "About us" }]} />
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">About {SITE.brand}</h1>
          <p className="mt-3 text-lg text-sky-300">Engineering Ideas. Real Solutions.</p>
        </div>
      </section>
      <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:px-6">
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">What we do</h2>
          <p className="mt-3 leading-relaxed text-slate-600">
            {SITE.brand} is an online store for engineering students and builders in India. We offer project packages you download, hardware kits we ship,
            and custom engineering work built to your brief.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {BUSINESS_LINES.map((b) => (
              <li key={b.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-900">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{b.text}</p>
                <Link href={b.href} className="mt-3 inline-block text-sm font-medium text-blue-700 underline">{b.cta}</Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">How we work</h2>
          <ul className="mt-4 space-y-3">
            {ABOUT_VALUES.map((v) => (
              <li key={v.title} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{v.title}</p>
                <p className="mt-1 text-sm text-slate-600">{v.text}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Contact</h2>
          <p className="mt-3 text-slate-600">
            Email <a className="text-blue-700 underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> or call {SITE.supportPhone}. {SITE.supportHours}.
          </p>
          <p className="mt-2 text-sm text-slate-500">See also our <Link className="underline" href="/privacy">privacy</Link>, <Link className="underline" href="/terms">terms</Link>, <Link className="underline" href="/refunds">refund</Link> and <Link className="underline" href="/shipping">shipping</Link> policies.</p>
        </section>
      </div>
    </main>
  );
}
