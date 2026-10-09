"use client";

import { useActionState } from "react";
import { addToCartAction } from "@/app/cart/actions";
import type { FormState } from "@/lib/validation/form";

export function AddToCart({ productId, hardware, disabled, returnTo }: { productId: string; hardware: boolean; disabled: boolean; returnTo: string }) {
  const [state, action, pending] = useActionState(addToCartAction, {} as FormState);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {hardware ? (
        <div>
          <label htmlFor="quantity" className="mr-2 text-sm font-medium">Quantity</label>
          <input id="quantity" name="quantity" type="number" min={1} max={10} defaultValue={1} className="w-20 rounded-md border border-slate-300 px-2 py-1.5" />
        </div>
      ) : null}
      <button
        disabled={disabled || pending}
        className="w-full rounded-md bg-blue-700 px-4 py-3 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled ? "Out of stock" : pending ? "Adding…" : "Add to cart"}
      </button>
      <p role="status" className={`text-sm ${state.error ? "text-red-700" : "text-green-800"}`}>
        {state.error ?? state.message}
        {state.ok ? <> <a href="/cart" className="underline">View cart</a></> : null}
      </p>
    </form>
  );
}
