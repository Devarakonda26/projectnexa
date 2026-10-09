import Link from "next/link";
import { Suspense } from "react";
import { ProductImage } from "@/components/shop/ProductCard";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/money";
import { removeFromCartAction, updateCartAction } from "./actions";

export const metadata = { title: "Your cart" };

type Row = {
  quantity: number;
  product: { id: string; slug: string; title: string; product_type: "digital" | "hardware"; price_paise: number; cover_image_path: string | null; status: string } | null;
};

async function CartContent() {
  const user = await requireUser("/cart");
  const supabase = await createClient();
  const { data } = await supabase
    .from("cart_items")
    .select("quantity, product:products(id, slug, title, product_type, price_paise, cover_image_path, status)")
    .eq("user_id", user.id)
    .order("created_at");
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.product && r.product.status === "published");

  const hardwareIds = rows.filter((r) => r.product!.product_type === "hardware").map((r) => r.product!.id);
  const stock = new Map<string, boolean>();
  if (hardwareIds.length) {
    const { data: s } = await supabase.from("public_stock_status").select("product_id, in_stock").in("product_id", hardwareIds);
    for (const r of s ?? []) stock.set(r.product_id as string, !!r.in_stock);
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">
        Your cart is empty. <Link href="/products" className="text-blue-800 underline">Browse projects</Link>
      </p>
    );
  }

  const subtotal = rows.reduce((sum, r) => sum + r.product!.price_paise * r.quantity, 0);
  const blocked = rows.some((r) => r.product!.product_type === "hardware" && stock.get(r.product!.id) === false);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {rows.map((r) => {
          const p = r.product!;
          const out = p.product_type === "hardware" && stock.get(p.id) === false;
          return (
            <li key={p.id} className="flex gap-4 p-4">
              <ProductImage path={p.cover_image_path} alt="" className="h-20 w-24 shrink-0 rounded" />
              <div className="min-w-0 flex-1">
                <Link href={`/products/${p.slug}`} className="font-medium hover:underline">{p.title}</Link>
                <p className="text-sm text-slate-600">{formatINR(p.price_paise)} each{out ? <span className="ml-2 font-medium text-red-700">Out of stock</span> : null}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {p.product_type === "hardware" ? (
                    <form action={updateCartAction} className="flex items-center gap-2">
                      <input type="hidden" name="productId" value={p.id} />
                      <label htmlFor={`q-${p.id}`} className="text-sm">Qty</label>
                      <input id={`q-${p.id}`} name="quantity" type="number" min={1} max={10} defaultValue={r.quantity} className="w-16 rounded border border-slate-300 px-2 py-1" />
                      <button className="text-sm text-blue-800 underline">Update</button>
                    </form>
                  ) : (
                    <span className="text-sm text-slate-600">Digital download</span>
                  )}
                  <form action={removeFromCartAction}>
                    <input type="hidden" name="productId" value={p.id} />
                    <button className="text-sm text-red-700 underline">Remove</button>
                  </form>
                </div>
              </div>
              <p className="font-semibold">{formatINR(p.price_paise * r.quantity)}</p>
            </li>
          );
        })}
      </ul>
      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Summary</h2>
        <p className="mt-3 flex justify-between"><span>Subtotal</span><span className="font-semibold">{formatINR(subtotal)}</span></p>
        <p className="mt-1 text-xs text-slate-600">Shipping (hardware only) is calculated at checkout.</p>
        {blocked ? <p className="mt-3 text-sm text-red-700">Remove out-of-stock items to continue.</p> : null}
        {blocked ? (
          <span className="mt-4 block rounded-md bg-slate-300 px-4 py-2.5 text-center font-medium text-slate-600">Checkout unavailable</span>
        ) : (
          <Link href="/checkout" className="mt-4 block rounded-md bg-blue-700 px-4 py-2.5 text-center font-medium text-white hover:bg-blue-800">Proceed to checkout</Link>
        )}
      </aside>
    </div>
  );
}

export default function CartPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Your cart</h1>
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <CartContent />
      </Suspense>
    </main>
  );
}
