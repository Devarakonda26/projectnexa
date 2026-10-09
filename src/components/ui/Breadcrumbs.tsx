import Link from "next/link";

export type Crumb = { label: string; href?: string };

/** Visual + accessible breadcrumb trail. The last crumb is the current page. */
export function Breadcrumbs({ items, tone = "light" }: { items: Crumb[]; tone?: "light" | "dark" }) {
  const base = tone === "dark" ? "text-slate-300" : "text-slate-500";
  const hover = tone === "dark" ? "hover:text-white" : "hover:text-blue-700";
  return (
    <nav aria-label="Breadcrumb" className={`text-sm ${base}`}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2">
              {c.href && !last ? <Link href={c.href} className={`${hover} underline-offset-2 hover:underline`}>{c.label}</Link> : <span aria-current={last ? "page" : undefined} className={last ? (tone === "dark" ? "text-white" : "font-medium text-slate-800") : ""}>{c.label}</span>}
              {last ? null : <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
