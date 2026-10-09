import { Icon } from "@/components/ui/icons";

export function SearchBox({ defaultValue = "", className = "", id = "site-search" }: { defaultValue?: string; className?: string; id?: string }) {
  return (
    <form action="/products" method="get" role="search" className={`flex w-full items-center gap-2 ${className}`}>
      <label htmlFor={id} className="sr-only">Search projects and kits</label>
      <div className="relative min-w-0 flex-1">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          name="q"
          type="search"
          maxLength={100}
          defaultValue={defaultValue}
          placeholder="Search projects, kits, technologies…"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-600/30"
        />
      </div>
      <button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">Search</button>
    </form>
  );
}
