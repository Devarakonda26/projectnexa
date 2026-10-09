"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ForbiddenError, assertUser } from "@/lib/auth/dal";
import { loginUrl } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/common";
import type { FormState } from "@/lib/validation/form";

const qty = z.coerce.number().int().min(1).max(10);
const addSchema = z.object({ productId: uuid, quantity: qty.default(1), returnTo: z.string().optional() });
const updateSchema = z.object({ productId: uuid, quantity: qty });
const removeSchema = z.object({ productId: uuid });

async function userOrLogin(returnTo: string) {
  try {
    return await assertUser();
  } catch (e) {
    if (e instanceof ForbiddenError) redirect(loginUrl(returnTo));
    throw e;
  }
}

export async function addToCartAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const returnTo = typeof formData.get("returnTo") === "string" ? String(formData.get("returnTo")) : "/products";
  const user = await userOrLogin(returnTo);
  const parsed = addSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Could not add this item." };

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, product_type")
    .eq("id", parsed.data.productId)
    .eq("status", "published")
    .maybeSingle();
  if (!product) return { error: "This item is no longer available." };

  // Digital packages are bought once per order; kits can be bought in quantity.
  const wanted = product.product_type === "digital" ? 1 : parsed.data.quantity;

  const { data: existing } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("product_id", product.id)
    .maybeSingle();

  if (existing) {
    const next = product.product_type === "digital" ? 1 : Math.min(10, existing.quantity + wanted);
    const { error } = await supabase.from("cart_items").update({ quantity: next }).eq("user_id", user.id).eq("product_id", product.id);
    if (error) return { error: "Could not update your cart." };
  } else {
    const { error } = await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity: wanted });
    if (error) return { error: "Could not add this item." };
  }
  revalidatePath("/cart");
  return { ok: true, message: "Added to your cart." };
}

export async function updateCartAction(formData: FormData): Promise<void> {
  const user = await userOrLogin("/cart");
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.from("cart_items").update({ quantity: parsed.data.quantity }).eq("user_id", user.id).eq("product_id", parsed.data.productId);
  revalidatePath("/cart");
}

export async function removeFromCartAction(formData: FormData): Promise<void> {
  const user = await userOrLogin("/cart");
  const parsed = removeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", parsed.data.productId);
  revalidatePath("/cart");
}
