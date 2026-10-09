import Link from "next/link";
import { Suspense } from "react";
import { SmartImage } from "@/components/shop/SmartImage";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { branchImage } from "@/lib/branch-images";
import { listBranches } from "@/lib/catalogue/queries";

export const metadata = { title: "Engineering branches", description: "Find engineering projects and hardware kits by branch." };

async function Branches() {
  const branches = await listBranches();
  if (!branches.length) return <p className="text-slate-600">Branches will appear here soon.</p>;
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {branches.map((b) => (
        <li key={b.id}>
          <Link href={`/branches/${b.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition motion-safe:hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
            <SmartImage src={branchImage(b.slug)} alt="" width={640} height={400} className="aspect-[8/5] w-full bg-navy object-cover" />
            <span className="flex flex-1 flex-col p-5">
              <span className="text-lg font-semibold text-slate-900 group-hover:text-blue-700">{b.name}</span>
              {b.description ? <span className="mt-1 text-sm text-slate-600">{b.description}</span> : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function BranchesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Engineering branches" }]} />
      <h1 className="mb-6 mt-3 text-3xl font-bold tracking-tight text-slate-900">Engineering branches</h1>
      <Suspense fallback={<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-60 animate-pulse rounded-2xl bg-slate-200" />)}</div>}>
        <Branches />
      </Suspense>
    </main>
  );
}
