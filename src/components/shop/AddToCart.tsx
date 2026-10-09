"use client";

import { useActionState } from "react";
import { addToCartAction } from "@/app/cart/actions";
import { Icon } from "@/components/ui/icons";
import type { FormState } from "@/lib/validation/form";

export function AddToCart({ productId, hardware, disabled, returnTo, soldOutLabel = "Out of stock" }: { productId: string; hardware: boolean; disabled: boolean; returnTo: string; soldOutLabel?: string }) {
  const [state, action, pending] = useActionState(addToCartAction, {} as FormState);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {hardware ? (
        <div>
          <label htmlFor="quantity" className="mr-2 text-sm font-medium text-slate-700">Quantity</label>
          <input id="quantity" name="quantity" type="number" min={1} max={10} defaultValue={1} className="w-20 rounded-lg border border-slate-300 px-2 py-1.5" />
        </div>
      ) : null}
      <button
        disabled={disabled || pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
      >
        {disabled ? soldOutLabel : pending ? "Adding…" : <><Icon name="cart" className="h-5 w-5" /> Add to cart</>}
      </button>
      <p role="status" className={`text-sm ${state.error ? "text-red-700" : "text-green-800"}`}>
        {state.error ?? state.message}
        {state.ok ? <> <a href="/cart" className="underline">View cart</a></> : null}
      </p>
    </form>
  );
}
