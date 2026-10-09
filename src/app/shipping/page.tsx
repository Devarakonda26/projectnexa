import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = { title: "Shipping & delivery" };

export default function ShippingPage() {
  return (
    <LegalPage title="Shipping & delivery policy">
      <p>{SITE.brand} sells digital project packages, hardware kits and custom-built projects. We deliver within India only.</p>

      <h2>Digital projects</h2>
      <ul>
        <li>Nothing is shipped. After we verify your payment, a <strong>Download</strong> button appears on your order page in your account.</li>
        <li>We verify payments by hand, so this can take some time. We aim to verify within one working day during {SITE.supportHours}.</li>
        <li>If your order is cancelled or refunded, download access is removed.</li>
      </ul>

      <h2>Hardware kits</h2>
      <ul>
        <li>We ship to addresses in India. We do not ship outside India.</li>
        <li>Orders are packed after payment is verified (for cash on delivery, after we confirm the order).</li>
        <li>Delivery usually takes {SITE.deliveryDaysMin} to {SITE.deliveryDaysMax} working days after dispatch. Remote locations can take longer.</li>
        <li>When your order is dispatched, the courier name and tracking number appear on your order page.</li>
        <li>The shipping fee and the order value above which shipping is free are shown at checkout before you pay.</li>
        <li>Please check the parcel when it arrives. If it is damaged or open, take photos and contact us the same day. See the <Link href="/refunds">refund and return policy</Link>.</li>
      </ul>

      <h2>Custom projects</h2>
      <p>Custom projects follow the quote and milestones agreed with you. Delivery dates are set in the quote. Any hardware that is part of the project ships as described above.</p>

      <h2>Contact</h2>
      <p>Questions about an order? Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> or call {SITE.supportPhone} ({SITE.supportHours}).</p>
    </LegalPage>
  );
}
