import { Suspense } from "react";
import { ActionForm, inputCls } from "@/components/admin/ActionForm";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { hideSampleProductsAction, saveStoreSettingsAction } from "../actions";

export const metadata = { title: "Admin · Store settings", robots: { index: false } };

/** paise -> "1299" or "1299.50" for an input box. */
function toRupeesText(paise: number): string {
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}

async function Content() {
  await requireAdmin("/admin/settings");
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_settings")
    .select("key, value")
    .in("key", ["shipping_flat_paise", "free_shipping_threshold_paise", "cod_max_total_paise"]);
  const { count: sampleCount } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("is_sample", true).eq("status", "published");
  const get = (key: string) => {
    const n = Number(data?.find((r) => r.key === key)?.value);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <div className="space-y-10">
    <ActionForm action={saveStoreSettingsAction} submitLabel="Save settings" className="max-w-xl space-y-5">
      <div>
        <label htmlFor="shippingFee" className="mb-1 block text-sm font-medium">Shipping fee (₹)</label>
        <input id="shippingFee" name="shippingFee" inputMode="decimal" required defaultValue={toRupeesText(get("shipping_flat_paise"))} className={inputCls} />
        <p className="mt-1 text-xs text-slate-600">Charged on orders that include a hardware kit. Digital-only orders never pay shipping.</p>
      </div>
      <div>
        <label htmlFor="freeShippingFrom" className="mb-1 block text-sm font-medium">Free shipping from (₹)</label>
        <input id="freeShippingFrom" name="freeShippingFrom" inputMode="decimal" required defaultValue={toRupeesText(get("free_shipping_threshold_paise"))} className={inputCls} />
        <p className="mt-1 text-xs text-slate-600">Orders at or above this amount ship free. Enter 0 to always charge the shipping fee.</p>
      </div>
      <div>
        <label htmlFor="codMax" className="mb-1 block text-sm font-medium">Cash on delivery limit (₹)</label>
        <input id="codMax" name="codMax" inputMode="decimal" required defaultValue={toRupeesText(get("cod_max_total_paise"))} className={inputCls} />
        <p className="mt-1 text-xs text-slate-600">Largest order total that can use cash on delivery (hardware kits only). Enter 0 to turn COD off.</p>
      </div>
    </ActionForm>

    <section className="max-w-xl rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Sample listings</h2>
      <p className="mt-1 text-sm text-slate-600">
        {sampleCount ?? 0} sample/demo listing(s) are visible in the shop. When you are ready to sell only real products, hide them all here.
        Nothing is deleted: you can publish any of them again from its edit page.
      </p>
      <ActionForm action={hideSampleProductsAction} submitLabel="Hide all sample listings" className="mt-3" buttonClassName="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60">
        <span className="sr-only">This hides every published sample listing from customers.</span>
      </ActionForm>
    </section>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Store settings</h1>
      <Suspense fallback={<p className="text-sm">Loading…</p>}><Content /></Suspense>
    </main>
  );
}
