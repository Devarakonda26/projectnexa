/**
 * Business details shown on the policy pages and footer.
 * EDIT THE VALUES BELOW before launch. Everything else on those pages fills in from here.
 * (Indian e-commerce rules require a named grievance officer and a way to contact them.)
 */
export const SITE = {
  brand: "ProjectNexa",
  /** Legal name of the business that sells on the site (as on your GST / registration papers). */
  legalName: "ProjectNexa (add your registered business name)",
  /** Full postal address of the business. */
  address: "Add your business address, city, state, PIN code",
  supportEmail: "support@example.com",
  supportPhone: "+91 00000 00000",
  /** Support hours shown to customers. */
  supportHours: "Monday to Saturday, 10:00 am to 6:00 pm IST",
  grievanceOfficer: {
    name: "Add the grievance officer's name",
    email: "support@example.com",
  },
  /** Date shown as "Last updated" on the policy pages. Change it whenever you edit a policy. */
  policiesUpdated: "9 October 2026",
  /** How many days a customer has to report a damaged/defective hardware item. */
  hardwareReturnDays: 7,
  /** Typical delivery time shown on the shipping page. */
  deliveryDaysMin: 3,
  deliveryDaysMax: 7,
  /** How many working days refunds take once approved. */
  refundWorkingDays: 7,
} as const;
