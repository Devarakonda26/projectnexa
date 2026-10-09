import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">We could not find that page</h1>
      <p className="mt-2 text-slate-600">The link may be old or mistyped.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-800 hover:bg-slate-50">Home</Link>
        <Link href="/products" className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Browse projects</Link>
      </div>
    </main>
  );
}
