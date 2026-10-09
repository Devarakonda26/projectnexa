import { Icon } from "./icons";

export type FaqItem = { q: string; a: string };

/** Accessible accordion built on <details>: works without JavaScript and with the keyboard. */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {items.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left font-medium text-slate-900 hover:bg-slate-50">
            {f.q}
            <Icon name="chevron" className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
          </summary>
          <p className="px-5 pb-5 leading-relaxed text-slate-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
