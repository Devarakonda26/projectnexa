export const REQUEST_STATUS_LABEL = {
  submitted: "Submitted",
  under_review: "Under review",
  quoted: "Quotation ready",
  accepted: "Quote accepted",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Not taken up",
  cancelled: "Cancelled",
} as const;
export type RequestStatus = keyof typeof REQUEST_STATUS_LABEL;

export const MILESTONE_STATUS_LABEL = {
  pending: "Not started",
  in_progress: "In progress",
  submitted: "Ready for your review",
  approved: "Approved",
} as const;

/** Statuses in which the customer may still cancel (mirrors cancel_custom_request()). */
export function customerCanCancelRequest(status: RequestStatus): boolean {
  return status === "submitted" || status === "under_review" || status === "quoted";
}
