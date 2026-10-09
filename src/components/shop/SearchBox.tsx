export function SearchBox({ defaultValue = "", className = "" }: { defaultValue?: string; className?: string }) {
  return (
    <form action="/products" method="get" role="search" className={`flex w-full gap-2 ${className}`}>
      <label htmlFor="site-search" className="sr-only">Search projects and kits</label>
      <input
        id="site-search"
        name="q"
        type="search"
        maxLength={100}
        defaultValue={defaultValue}
        placeholder="Search projects, kits, technologies…"
        className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-2 focus:outline-blue-600"
      />
      <button className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800">Search</button>
    </form>
  );
}
