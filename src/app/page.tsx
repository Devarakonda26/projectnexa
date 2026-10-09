import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/shop/ProductCard";
import { SmartImage } from "@/components/shop/SmartImage";
import { Faq } from "@/components/ui/Faq";
import { Icon, type IconName } from "@/components/ui/icons";
import {
  BUSINESS_LINES, CUSTOM_PROCESS, HOME_BRANCHES, HOME_FAQ, HOW_IT_WORKS, POPULAR_DOMAINS, WHY_CHOOSE,
} from "@/data/site-content";
import { listFeatured, listFeaturedKits } from "@/lib/catalogue/queries";
import { SITE } from "@/lib/site";

const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-500";
const btnGhost = "inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10";

function Section({ id, title, intro, action, children, tone = "light" }: {
  id?: string; title: string; intro?: string; action?: { href: string; label: string }; children: React.ReactNode; tone?: "light" | "white";
}) {
  return (
    <section id={id} className={tone === "white" ? "bg-white" : ""} aria-labelledby={id ? `${id}-h` : undefined}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id={id ? `${id}-h` : undefined} className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
            {intro ? <p className="mt-2 max-w-2xl text-slate-600">{intro}</p> : null}
          </div>
          {action ? <Link href={action.href} className="text-sm font-semibold text-blue-700 hover:underline">{action.label} →</Link> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

async function Featured() {
  const products = await listFeatured(8);
  if (products.length === 0) return <p className="text-slate-600">New projects are being added. Check back soon.</p>;
  return <ProductGrid products={products} />;
}

async function Kits() {
  const kits = await listFeaturedKits(4);
  if (kits.length === 0) return <p className="text-slate-600">Hardware kits are being added. Check back soon.</p>;
  return <ProductGrid products={kits} />;
}

const Skeleton = () => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Loading">
    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200" />)}
  </div>
);

function Steps({ items }: { items: readonly { title: string; text: string }[] }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
      {items.map((s, i) => (
        <li key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white" aria-hidden="true">{i + 1}</span>
          <h3 className="mt-3 font-semibold text-slate-900">{s.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-sky-400">Engineering Ideas. Real Solutions.</p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Build Your Next Engineering Breakthrough</h1>
            <p className="mt-4 max-w-xl text-lg text-slate-300">
              Discover engineering projects, practical hardware kits, and custom-built solutions for your next big idea.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/products" className={btnPrimary}>Explore Projects <Icon name="arrow" className="h-4 w-4" /></Link>
              <Link href="/custom-projects/new" className={btnGhost}>Request a Custom Project</Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
            <SmartImage src="/images/hero.svg" alt="Illustration of a circuit board, sensors and a dashboard representing engineering projects" priority width={800} height={600} className="h-auto w-full" />
          </div>
        </div>
      </section>

      {/* Branches */}
      <Section id="branches" title="Engineering Branches" intro="Pick your branch to see projects and kits built for it." action={{ href: "/branches", label: "All branches" }}>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {HOME_BRANCHES.map((b) => (
            <li key={b.slug}>
              <Link href={b.href} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition motion-safe:hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
                <SmartImage src={`/images/branches/${b.slug}.svg`} alt="" width={640} height={400} className="aspect-[8/5] w-full bg-navy object-cover" />
                <span className="flex flex-1 flex-col p-4">
                  <span className="font-semibold text-slate-900 group-hover:text-blue-700">{b.label}</span>
                  <span className="mt-1 text-sm text-slate-600">{b.blurb}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* Featured projects */}
      <Section id="featured" tone="white" title="Featured Projects" action={{ href: "/products", label: "View all projects" }}>
        <Suspense fallback={<Skeleton />}><Featured /></Suspense>
      </Section>

      {/* Business categories */}
      <Section id="categories" title="What We Offer">
        <ul className="grid gap-6 md:grid-cols-3">
          {BUSINESS_LINES.map((b) => (
            <li key={b.title} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon name={b.icon as IconName} className="h-6 w-6" /></span>
              <h3 className="mt-4 text-xl font-semibold text-slate-900">{b.title}</h3>
              <p className="mt-2 flex-1 leading-relaxed text-slate-600">{b.text}</p>
              <Link href={b.href} className="mt-4 font-semibold text-blue-700 hover:underline">{b.cta} →</Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* Popular domains */}
      <Section id="domains" tone="white" title="Popular Domains" intro="Jump straight to a topic.">
        <ul className="flex flex-wrap gap-3">
          {POPULAR_DOMAINS.map((d) => (
            <li key={d.label}>
              <Link href={`/products?q=${encodeURIComponent(d.q)}`} className="inline-block rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-blue-500 hover:text-blue-700">{d.label}</Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* Why choose */}
      <Section id="why" title="Why Choose ProjectNexa">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_CHOOSE.map((w) => (
            <li key={w.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon name={w.icon as IconName} className="h-5 w-5" /></span>
              <div>
                <h3 className="font-semibold text-slate-900">{w.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{w.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* How it works */}
      <Section id="how" tone="white" title="How It Works"><Steps items={HOW_IT_WORKS} /></Section>

      {/* Hardware kits */}
      <Section id="kits" title="Featured Hardware Kits" action={{ href: "/products?type=hardware", label: "All hardware kits" }}>
        <Suspense fallback={<Skeleton />}><Kits /></Suspense>
      </Section>

      {/* Custom process */}
      <section className="bg-navy text-white" aria-labelledby="custom-h">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 id="custom-h" className="text-2xl font-bold tracking-tight sm:text-3xl">Need Something Built Just for You?</h2>
          <p className="mt-2 max-w-2xl text-slate-300">Our custom project process, from idea to delivery.</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CUSTOM_PROCESS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="text-sm font-bold text-sky-400">Step {i + 1}</span>
                <h3 className="mt-1 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{s.text}</p>
              </li>
            ))}
          </ol>
          <Link href="/custom-projects/new" className={`${btnPrimary} mt-8`}>Request a Custom Project</Link>
        </div>
      </section>

      {/* FAQ */}
      <Section id="faq" title="Frequently Asked Questions">
        <div className="max-w-3xl"><Faq items={[...HOME_FAQ]} /></div>
      </Section>

      {/* Contact */}
      <section id="contact" className="bg-white" aria-labelledby="contact-h">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 id="contact-h" className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Contact Us</h2>
          <p className="mt-2 text-slate-600">Questions about a project, an order or a custom build? Write to us.</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-5"><dt className="flex items-center gap-2 font-semibold text-slate-900"><Icon name="mail" className="h-5 w-5 text-blue-600" />Email</dt><dd className="mt-1 text-slate-600"><a className="text-blue-700 underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a></dd></div>
            <div className="rounded-2xl border border-slate-200 p-5"><dt className="flex items-center gap-2 font-semibold text-slate-900"><Icon name="phone" className="h-5 w-5 text-blue-600" />Phone</dt><dd className="mt-1 text-slate-600">{SITE.supportPhone}</dd></div>
            <div className="rounded-2xl border border-slate-200 p-5"><dt className="flex items-center gap-2 font-semibold text-slate-900"><Icon name="clock" className="h-5 w-5 text-blue-600" />Hours</dt><dd className="mt-1 text-slate-600">{SITE.supportHours}</dd></div>
          </dl>
        </div>
      </section>
    </main>
  );
}
