import { Suspense } from "react";
import { ActionForm, inputCls } from "@/components/admin/ActionForm";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { saveBranchAction, saveCategoryAction } from "../actions";

export const metadata = { title: "Admin · Branches & categories", robots: { index: false } };

type Branch = { id: string; name: string; short_name: string; slug: string; description: string | null; sort_order: number; is_active: boolean };
type Category = { id: string; branch_id: string; name: string; slug: string; description: string | null; sort_order: number; is_active: boolean };

function BranchFields({ b }: { b?: Branch }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {b ? <input type="hidden" name="id" value={b.id} /> : null}
      <input name="name" required placeholder="Name" defaultValue={b?.name} aria-label="Name" className={inputCls} />
      <input name="shortName" required placeholder="Short name (CSE)" defaultValue={b?.short_name} aria-label="Short name" className={inputCls} />
      <input name="slug" required placeholder="url-slug" defaultValue={b?.slug} aria-label="Slug" className={inputCls} />
      <input name="description" placeholder="Description" defaultValue={b?.description ?? ""} aria-label="Description" className={`${inputCls} sm:col-span-2`} />
      <input name="sortOrder" inputMode="numeric" placeholder="Order" defaultValue={b?.sort_order ?? 100} aria-label="Sort order" className={inputCls} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={b?.is_active ?? true} /> Active</label>
    </div>
  );
}

async function Content() {
  await requireAdmin("/admin/categories");
  const supabase = await createClient();
  const [{ data: branches }, { data: categories }] = await Promise.all([
    supabase.from("branches").select("*").order("sort_order"),
    supabase.from("categories").select("*").order("sort_order"),
  ]);
  const cats = (categories ?? []) as Category[];
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Branches</h2>
        <div className="space-y-3">
          {((branches ?? []) as Branch[]).map((b) => (
            <details key={b.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <summary className="cursor-pointer text-sm font-medium">{b.name} {b.is_active ? "" : "(inactive)"} <span className="text-slate-500">· {cats.filter((c) => c.branch_id === b.id).length} categories</span></summary>
              <div className="mt-3 space-y-4">
                <ActionForm action={saveBranchAction} submitLabel="Save branch"><BranchFields b={b} /></ActionForm>
                <div className="border-t pt-3">
                  <p className="mb-2 text-sm font-medium">Categories</p>
                  {cats.filter((c) => c.branch_id === b.id).map((c) => (
                    <ActionForm key={c.id} action={saveCategoryAction} submitLabel="Save" className="mb-2 grid gap-2 sm:grid-cols-[1fr_1fr_5rem_auto_auto] sm:items-center">
                      <input type="hidden" name="id" value={c.id} /><input type="hidden" name="branchId" value={b.id} /><input type="hidden" name="description" value={c.description ?? ""} />
                      <input name="name" required defaultValue={c.name} aria-label="Category name" className={inputCls} />
                      <input name="slug" required defaultValue={c.slug} aria-label="Category slug" className={inputCls} />
                      <input name="sortOrder" defaultValue={c.sort_order} aria-label="Order" className={inputCls} />
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="isActive" defaultChecked={c.is_active} /> Active</label>
                    </ActionForm>
                  ))}
                  <ActionForm action={saveCategoryAction} submitLabel="Add category" resetOnSuccess className="grid gap-2 sm:grid-cols-[1fr_1fr_5rem_auto_auto] sm:items-center">
                    <input type="hidden" name="branchId" value={b.id} />
                    <input name="name" required placeholder="New category" aria-label="New category name" className={inputCls} />
                    <input name="slug" required placeholder="url-slug" aria-label="New category slug" className={inputCls} />
                    <input name="sortOrder" defaultValue={100} aria-label="Order" className={inputCls} />
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="isActive" defaultChecked /> Active</label>
                  </ActionForm>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Add a branch</h2>
        <ActionForm action={saveBranchAction} submitLabel="Add branch" resetOnSuccess><BranchFields /></ActionForm>
      </section>
    </div>
  );
}

export default function AdminCategoriesPage() {
  return <main><h1 className="mb-4 text-2xl font-semibold">Branches &amp; categories</h1><Suspense fallback={<p className="text-sm">Loading…</p>}><Content /></Suspense></main>;
}
