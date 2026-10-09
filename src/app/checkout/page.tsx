import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { requireUser } from "@/lib/auth/dal";
import { computeTotals, type CartLine } from "@/lib/commerce/pricing";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Checkout" };

type Row = { quantity: number; product: { title: string; product_type: "digital" | "hardware"; price_paise: number; cod_eligible: boolean; status: string } | null };

async function CheckoutContent() {
  const user = await requireUser("/checkout");
  const supabase = await createClient();

  const [{ data: cart }, { data: settings }, { data: addrs }] = await Promise.all([
    supabase.from("cart_items").select("quantity, product:products(title, product_type, price_paise, cod_eligible, status)").eq("user_id", user.id),
    supabase.from("store_settings").select("key, value").in("key", ["shipping_flat_paise", "free_shipping_threshold_paise", "cod_max_total_paise"]),
    supabase.from("addresses").select("id, label, recipient_name, phone, line1, line2, city, state, pincode, is_default").eq("user_id", user.id).order("created_at"),
  ]);

  const rows = ((cart ?? []) as unknown as Row[]).filter((r) => r.product && r.product.status === "published");
  if (rows.length === 0) redirect("/cart");

  const s = Object.fromEntries((settings ?? []).map((r) => [r.key as string, Number(r.value)]));
  const lines: CartLine[] = rows.map((r) => ({ priceP: r.product!.price_paise, quantity: r.quantity, type: r.product!.product_type, codEligible: r.product!.cod_eligible }));
  const totals = computeTotals(lines, {
    shippingFlatPaise: s.shipping_flat_paise ?? 0,
    freeShippingThresholdPaise: s.free_shipping_threshold_paise ?? 0,
    codMaxTotalPaise: s.cod_max_total_paise ?? 0,
  });

  const addresses = (addrs ?? []).map((a) => ({
    id: a.id as string,
    label: a.label as string,
    isDefault: !!a.is_default,
    summary: `${a.recipient_name}, ${a.line1}${a.line2 ? `, ${a.line2}` : ""}, ${a.city}, ${a.state} ${a.pincode} · ${a.phone}`,
  }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <CheckoutForm
        addresses={addresses}
        needsAddress={totals.hasPhysical}
        codAvailable={totals.codAvailable}
        codReason={totals.codReason}
        canPayOnline
      />
      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 text-sm">
        <h2 className="font-semibold">Order summary</h2>
        <ul className="mt-3 space-y-1">
          {rows.map((r, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>{r.product!.title}{r.product!.product_type === "hardware" && r.quantity > 1 ? ` × ${r.quantity}` : ""}</span>
              <span>{formatINR(r.product!.price_paise * (r.product!.product_type === "digital" ? 1 : r.quantity))}</span>
            </li>
          ))}
        </ul>
        <hr className="my-3" />
        <p className="flex justify-between"><span>Subtotal</span><span>{formatINR(totals.subtotalPaise)}</span></p>
        <p className="flex justify-between"><span>Shipping</span><span>{totals.hasPhysical ? (totals.shippingPaise === 0 ? "Free" : formatINR(totals.shippingPaise)) : "—"}</span></p>
        <p className="mt-2 flex justify-between text-base font-semibold"><span>Total</span><span>{formatINR(totals.totalPaise)}</span></p>
        <p className="mt-3 text-xs text-slate-600">The final amount is calculated again on our server when you place the order.</p>
        <Link href="/cart" className="mt-3 inline-block text-blue-800 underline">Edit cart</Link>
      </aside>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Checkout</h1>
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}
