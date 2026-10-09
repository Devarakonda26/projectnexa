import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = { title: "Refunds & returns" };

export default function RefundsPage() {
  return (
    <LegalPage title="Refund, return & cancellation policy">
      <h2>Digital projects</h2>
      <ul>
        <li>Digital project packages can be downloaded straight after payment is verified, so we <strong>do not offer refunds once a file has been downloaded</strong> or the download link has been used.</li>
        <li>You can cancel an unpaid order from your order page at any time.</li>
        <li>If a file is corrupted, wrong, or missing something that was clearly listed on the product page, contact us within {SITE.hardwareReturnDays} days. We will replace the file or refund you.</li>
      </ul>

      <h2>Hardware kits</h2>
      <ul>
        <li>You can cancel an order before it is dispatched. Prepaid orders are refunded in full.</li>
        <li>If the kit arrives <strong>damaged, defective or different from what you ordered</strong>, contact us within {SITE.hardwareReturnDays} days of delivery with your order number and clear photos or a short video of the parcel and the item.</li>
        <li>After we confirm the problem we will replace the item or refund you, whichever you prefer.</li>
        <li>Items damaged by wrong wiring, misuse, or modification are not covered.</li>
        <li>Please keep the original packaging until the problem is resolved.</li>
      </ul>

      <h2>Custom projects</h2>
      <ul>
        <li>Custom work is built for you after you accept a quote, so it is covered by the quote and milestones we agreed together.</li>
        <li>Before the work starts, an accepted quote can be cancelled and any advance is refunded.</li>
        <li>For milestones you have approved, amounts already paid are not refundable, because the work was delivered and accepted.</li>
        <li>If we cannot deliver what the quote promised, we will refund the amount paid for the part not delivered.</li>
      </ul>

      <h2>How refunds are paid</h2>
      <ul>
        <li>Refunds go back to the bank account or UPI ID the payment came from. We will confirm the details with you first.</li>
        <li>Once a refund is approved, it reaches you within {SITE.refundWorkingDays} working days.</li>
        <li>For cash on delivery orders that were not accepted or are refunded, we will ask for your UPI ID or bank details.</li>
      </ul>

      <h2>How to ask</h2>
      <p>Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> with your order number. See also our <Link href="/shipping">shipping policy</Link>.</p>
    </LegalPage>
  );
}
