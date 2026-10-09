/**
 * Maps database exception codes raised by our RPCs (see migration 4) to messages safe to show customers.
 * Anything unrecognised becomes a generic message, so internal details never leak to the browser.
 */
const MESSAGES: Record<string, string> = {
  not_authenticated: "Please sign in again.",
  cart_empty: "Your cart is empty.",
  product_unavailable: "An item in your cart is no longer available. Please review your cart.",
  already_purchased: "You already own one of the digital items in your cart. Remove it to continue.",
  address_required: "Choose a delivery address for your hardware items.",
  cod_not_available_for_digital: "Cash on delivery is not available with digital downloads.",
  cod_not_eligible: "Cash on delivery is not available for one of these items.",
  cod_limit_exceeded: "This order is above the cash-on-delivery limit. Please pay by UPI or bank transfer.",
  insufficient_stock: "Some items just went out of stock. Please review your cart.",
  order_not_found: "We could not find that order.",
  order_not_awaiting_payment: "This order is not waiting for a payment.",
  invalid_reference: "Enter a valid transaction reference (6-30 letters or digits).",
  invalid_payer_name: "Enter the name of the person who made the payment.",
  invalid_proof_path: "The payment screenshot could not be attached. Please try again.",
  reference_already_used: "That transaction reference has already been submitted. Check it and try again.",
  order_not_cancellable: "This order can no longer be cancelled.",
};

export function friendlyDbError(message: string | null | undefined, fallback = "Something went wrong. Please try again."): string {
  if (!message) return fallback;
  const key = Object.keys(MESSAGES).find((k) => message === k || message.startsWith(k + ":") || message.includes(k));
  return key ? MESSAGES[key] : fallback;
}
