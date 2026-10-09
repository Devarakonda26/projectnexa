import type { ReactNode } from "react";
import { SITE } from "@/lib/site";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">Last updated: {SITE.policiesUpdated}</p>
      <div className="mt-6 space-y-4 leading-relaxed text-slate-800 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1 [&_a]:text-blue-800 [&_a]:underline">
        {children}
      </div>
    </main>
  );
}
