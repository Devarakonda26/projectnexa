/**
 * Order states, mirrored from the database enum `order_status`.
 * The DATABASE is the source of truth: `order_transition_allowed()` in migration 4 rejects illegal moves
 * no matter what this file says. `isTransitionAllowed` exists so the UI can show only valid buttons,
 * and tests/golden/order-transitions.json keeps both implementations in lock-step (see t_08 and order-status.test.ts).
 */

export const ORDER_STATUSES = [
  "pending_payment",
  "pending_confirmation",
  "payment_submitted",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["upi", "bank_transfer", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function isTransitionAllowed(
  from: OrderStatus,
  to: OrderStatus,
  method: PaymentMethod,
  hasPhysical: boolean,
): boolean {
  const cod = method === "cod";
  switch (`${from}>${to}`) {
    case "pending_payment>payment_submitted": return !cod;
    case "pending_payment>cancelled": return true;
    case "payment_submitted>paid": return !cod;
    case "payment_submitted>pending_payment": return !cod;
    case "pending_confirmation>processing": return cod;
    case "pending_confirmation>cancelled": return cod;
    case "paid>processing": return hasPhysical;
    case "paid>completed": return !hasPhysical;
    case "processing>shipped": return hasPhysical;
    case "processing>cancelled": return cod;
    case "shipped>delivered": return true;
    case "delivered>completed": return true;
    default:
      return to === "refunded" && ["paid", "processing", "shipped", "delivered", "completed"].includes(from);
  }
}

/** Statuses an admin may set directly. `paid` and `payment_submitted` only change through the payment workflow. */
export function adminNextStatuses(from: OrderStatus, method: PaymentMethod, hasPhysical: boolean): OrderStatus[] {
  return ORDER_STATUSES.filter(
    (to) => to !== "paid" && to !== "payment_submitted" && to !== "pending_payment" && isTransitionAllowed(from, to, method, hasPhysical),
  );
}

export function canCustomerCancel(status: OrderStatus): boolean {
  return status === "pending_payment" || status === "pending_confirmation";
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  pending_confirmation: "Awaiting confirmation",
  payment_submitted: "Payment under review",
  paid: "Payment verified",
  processing: "Preparing your order",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const STATUS_TONE: Record<OrderStatus, "neutral" | "warning" | "info" | "success" | "danger"> = {
  pending_payment: "warning",
  pending_confirmation: "warning",
  payment_submitted: "info",
  paid: "info",
  processing: "info",
  shipped: "info",
  delivered: "success",
  completed: "success",
  cancelled: "danger",
  refunded: "neutral",
};

/** Progress steps shown on the customer's tracking page. */
export function trackingSteps(method: PaymentMethod, hasPhysical: boolean): OrderStatus[] {
  if (!hasPhysical) return ["pending_payment", "payment_submitted", "completed"];
  if (method === "cod") return ["pending_confirmation", "processing", "shipped", "delivered", "completed"];
  return ["pending_payment", "payment_submitted", "paid", "processing", "shipped", "delivered", "completed"];
}
