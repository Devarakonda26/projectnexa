import type { OrderStatus } from "./status";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  pending_confirmation: "Awaiting confirmation (COD)",
  payment_submitted: "Payment under review",
  paid: "Payment verified",
  processing: "Being prepared",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const STATUS_HELP: Partial<Record<OrderStatus, string>> = {
  pending_payment: "Pay using the details below, then submit your transaction reference.",
  pending_confirmation: "We will call or message you to confirm this cash-on-delivery order.",
  payment_submitted: "We are checking your payment against our bank records. This usually takes a few hours on working days.",
  paid: "Your payment has been verified.",
};

export const SHIPMENT_LABEL: Record<string, string> = {
  preparing: "Preparing",
  shipped: "Shipped",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  returned: "Returned",
};
