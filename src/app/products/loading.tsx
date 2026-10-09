export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-busy="true">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200" />)}
      </div>
    </main>
  );
}
