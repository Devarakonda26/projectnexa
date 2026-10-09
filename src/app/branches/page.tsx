import Link from "next/link";
import { Suspense } from "react";
import { listBranches } from "@/lib/catalogue/queries";

export const metadata = { title: "Engineering branches" };

async function Branches() {
  const branches = await listBranches();
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {branches.map((b) => (
        <li key={b.id}>
          <Link href={`/branches/${b.slug}`} className="block h-full rounded-lg border border-slate-200 bg-white p-5 hover:border-blue-700">
            <h2 className="font-semibold">{b.name}</h2>
            {b.description ? <p className="mt-1 text-sm text-slate-600">{b.description}</p> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function BranchesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Engineering branches</h1>
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <Branches />
      </Suspense>
    </main>
  );
}
