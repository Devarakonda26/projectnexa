import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCart } from "@/components/shop/AddToCart";
import { Gallery, type GalleryImage } from "@/components/shop/Gallery";
import { PriceLine, ProductGrid, StockBadge } from "@/components/shop/ProductCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Faq } from "@/components/ui/Faq";
import { Icon } from "@/components/ui/icons";
import { DIFFICULTY_LABEL, productKindLabel, productKindTone } from "@/lib/catalogue/labels";
import { getProductBySlug, listRelated } from "@/lib/catalogue/queries";
import { SITE } from "@/lib/site";
import { PLACEHOLDER_IMAGE, productImageUrl } from "@/lib/storage/public-urls";

type Props = { params: Promise<{ slug: string }> };
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!SLUG.test(slug)) return {};
  const product = await getProductBySlug(slug);
  return product ? { title: product.title, description: product.summary } : {};
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex gap-3 text-slate-700">
          <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

async function Related({ product }: { product: { id: string; branchSlug: string | null; categorySlug: string | null } }) {
  const related = await listRelated(product, 4);
  if (related.length === 0) return null;
  return (
    <Section title="Related projects">
      <ProductGrid products={related} />
    </Section>
  );
}

async function ProductContent({ params }: Props) {
  const { slug } = await params;
  if (!SLUG.test(slug)) notFound();
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const hardware = p.product_type === "hardware" && !p.is_quote_only;
  const digital = p.product_type === "digital" && !p.is_quote_only;
  const soldOut = hardware && p.stock ? !p.stock.in_stock : false;
  const projectId = p.sku ?? p.slug;

  const images: GalleryImage[] = [p.cover_image_path, ...p.gallery_paths].map((path, i) => ({
    src: productImageUrl(path) ?? PLACEHOLDER_IMAGE,
    alt: i === 0 ? `${p.title}: project illustration` : `${p.title}: technologies`,
  }));
  if (images.length === 0 || !p.cover_image_path) images.unshift({ src: PLACEHOLDER_IMAGE, alt: `${p.title}: placeholder illustration` });

  const includedTitle = p.is_quote_only ? "What you get" : hardware ? "What's in the kit" : p.is_sample ? "Planned package contents" : "Files included";
  const hasRequirements = p.software_requirements.length > 0 || p.hardware_requirements.length > 0;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Projects", href: "/products" },
          ...(p.branch ? [{ label: p.branch.short_name, href: `/branches/${p.branch.slug}` }] : []),
          { label: p.title },
        ]}
      />

      {p.is_sample ? (
        <div role="note" className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <Icon name="list" className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <strong>Sample listing.</strong> This page shows how a ProjectNexa listing looks. The project has not been built, tested or verified, and the files, stock and delivery shown are not yet available.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <Gallery images={images} />

        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${productKindTone(p)}`}>{productKindLabel(p)}</span>
            <span className="text-slate-500">Project ID: <span className="font-mono text-slate-700">{projectId}</span></span>
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900">{p.title}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {p.branch ? <Link href={`/branches/${p.branch.slug}`} className="font-medium text-blue-700 hover:underline">{p.branch.short_name}</Link> : null}
            {p.category ? <> · {p.category.name}</> : null}
            {p.subdomain ? <> · {p.subdomain}</> : null}
          </p>
          <p className="mt-4 text-lg leading-relaxed text-slate-700">{p.summary}</p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <PriceLine p={p} size="lg" />
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              {p.is_quote_only ? "Free to ask. You pay only if you accept a written quote." : null}
              {digital ? "Digital project package · download after payment is verified" : null}
              {hardware ? <>Hardware kit · shipped across India <StockBadge stock={p.stock} sample={p.is_sample} /></> : null}
            </p>
            {hardware && p.cod_eligible ? <p className="mt-1 text-sm text-slate-600">Cash on delivery available for eligible orders.</p> : null}
            <div className="mt-5">
              {p.is_quote_only ? (
                <Link href="/custom-projects/new" className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">
                  <Icon name="message" className="h-5 w-5" /> Request a Quote
                </Link>
              ) : (
                <AddToCart productId={p.id} hardware={hardware} disabled={soldOut} returnTo={`/products/${p.slug}`} soldOutLabel={p.is_sample ? "Sample: stock not set" : "Out of stock"} />
              )}
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {p.difficulty ? <Fact label="Difficulty" value={DIFFICULTY_LABEL[p.difficulty]} /> : null}
            {p.estimated_time ? <Fact label={p.is_quote_only ? "Timeline" : "Estimated time"} value={p.estimated_time} /> : null}
            <Fact label="Type" value={productKindLabel(p)} />
            <Fact label="Availability" value={p.is_quote_only ? "By quotation" : digital ? "Instant download after verification" : soldOut ? (p.is_sample ? "Sample: not stocked" : "Out of stock") : p.stock?.low_stock ? "Only a few left" : "In stock"} />
          </dl>

          {p.tech_stack.length ? (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Technologies and tools">
              {p.tech_stack.map((t) => <li key={t} className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">{t}</li>)}
            </ul>
          ) : null}
        </div>
      </div>

      {p.description ? (
        <Section title="About this project">
          {/* Plain text only: rendered as text, never as HTML. */}
          <div className="max-w-3xl whitespace-pre-line leading-relaxed text-slate-700">{p.description}</div>
        </Section>
      ) : null}

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        {p.features.length ? <section><h2 className="mb-4 text-xl font-semibold text-slate-900">Key features</h2><CheckList items={p.features} /></section> : null}
        {p.deliverables.length ? (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-slate-900">{includedTitle}</h2>
            <CheckList items={p.deliverables} />
            {p.is_sample && !hardware ? <p className="mt-3 text-sm text-slate-500">Planned contents. Because this is a sample listing, there are no files to download yet.</p> : null}
          </section>
        ) : null}
      </div>

      {hasRequirements ? (
        <Section title="Requirements">
          <div className="grid gap-6 sm:grid-cols-2">
            {p.software_requirements.length ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><Icon name="code" className="h-5 w-5 text-blue-600" />Software</h3>
                <ul className="list-disc space-y-1.5 pl-5 text-slate-700">{p.software_requirements.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            ) : null}
            {p.hardware_requirements.length ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><Icon name="cpu" className="h-5 w-5 text-blue-600" />Hardware</h3>
                <ul className="list-disc space-y-1.5 pl-5 text-slate-700">{p.hardware_requirements.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {hardware ? (
        <Section title="Delivery">
          <div className="flex max-w-3xl gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-slate-700">
            <Icon name="truck" className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <p>
              We ship within India. Delivery usually takes {SITE.deliveryDaysMin} to {SITE.deliveryDaysMax} working days after dispatch. This is an estimate, not a guarantee. See the <Link href="/shipping" className="text-blue-700 underline">shipping policy</Link> and <Link href="/refunds" className="text-blue-700 underline">returns policy</Link>.
            </p>
          </div>
        </Section>
      ) : null}

      {digital ? (
        <Section title="How you get the files">
          <div className="flex max-w-3xl gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-slate-700">
            <Icon name="download" className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <p>Pay by UPI or bank transfer and submit your reference. After we verify the payment, a private download button appears on your order page. See the <Link href="/refunds" className="text-blue-700 underline">refund policy</Link>.</p>
          </div>
        </Section>
      ) : null}

      {p.faq.length ? <Section title="Frequently asked questions"><div className="max-w-3xl"><Faq items={p.faq} /></div></Section> : null}

      <Suspense fallback={null}>
        <Related product={{ id: p.id, branchSlug: p.branch?.slug ?? null, categorySlug: p.category?.slug ?? null }} />
      </Suspense>
    </>
  );
}

export default function ProductPage({ params }: Props) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-slate-200" aria-label="Loading project" role="status" />}>
        <ProductContent params={params} />
      </Suspense>
    </main>
  );
}
