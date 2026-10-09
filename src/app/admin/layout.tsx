import Link from "next/link";
import type { ReactNode } from "react";

const LINKS = [
  ["/admin", "Overview"],
  ["/admin/payments", "Payments"],
  ["/admin/orders", "Orders"],
  ["/admin/products", "Products"],
  ["/admin/categories", "Branches & categories"],
  ["/admin/inventory", "Inventory"],
  ["/admin/requests", "Custom requests"],
  ["/admin/customers", "Customers"],
  ["/admin/audit", "Audit log"],
] as const;

/** Navigation only. Authorization is enforced in every page and action (layouts do not re-run on navigation). */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[13rem_1fr]">
      <nav aria-label="Admin" className="flex flex-wrap gap-2 lg:flex-col lg:gap-1 lg:self-start">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-slate-200">{label}</Link>
        ))}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
