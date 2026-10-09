import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <p>These terms apply when you use {SITE.brand} (the &ldquo;site&rdquo;), operated by {SITE.legalName}, {SITE.address}. By creating an account or placing an order you agree to them.</p>

      <h2>1. What we sell</h2>
      <p>We sell digital engineering project packages, hardware kits and custom-built projects. We sell only to customers in India, and all prices are in Indian rupees (INR).</p>

      <h2>2. Your account</h2>
      <ul>
        <li>Give correct details and keep your password private. You are responsible for what happens under your account.</li>
        <li>You must be at least 18, or use the site with a parent or guardian.</li>
        <li>We may suspend an account that is used for fraud or abuse.</li>
      </ul>

      <h2>3. Prices and orders</h2>
      <ul>
        <li>The price you pay is the price calculated by our server when you place the order. An order is only confirmed after we have verified your payment (or accepted a cash-on-delivery order).</li>
        <li>If a price or stock level is wrong, we may cancel the order and refund anything you have paid.</li>
      </ul>

      <h2>4. Payments</h2>
      <ul>
        <li>We currently accept manual UPI and bank transfers, and cash on delivery on eligible hardware orders.</li>
        <li>You pay to the account shown at checkout and then submit the transaction reference. Our team checks it against our bank records, and only then is the order marked paid.</li>
        <li>Submitting a false or someone else&rsquo;s transaction reference is fraud and may be reported.</li>
        <li>We do not store your card, bank login, or UPI PIN. We never ask for them.</li>
      </ul>

      <h2>5. Digital products and how you may use them</h2>
      <ul>
        <li>When you buy a digital project you get a personal, non-transferable licence to use it for your own learning and academic work.</li>
        <li>You may not resell, share publicly, upload to file-sharing sites or distribute the files, in whole or in part.</li>
        <li>Download links are personal and expire quickly. We may restrict access if we see misuse.</li>
        <li>Projects are provided for learning. You are responsible for following your college&rsquo;s rules about submitting work.</li>
      </ul>

      <h2>6. Custom projects</h2>
      <p>Custom requests are free to submit. Work starts only after you accept a written quote. The quote, its milestones and any dates in it form the agreement for that project.</p>

      <h2>7. Refunds and delivery</h2>
      <p>See our <Link href="/refunds">refund policy</Link> and <Link href="/shipping">shipping policy</Link>. They are part of these terms.</p>

      <h2>8. What you must not do</h2>
      <ul>
        <li>Try to access other people&rsquo;s accounts, orders or files, or break or overload the site.</li>
        <li>Upload files that are illegal, harmful or contain malware.</li>
      </ul>

      <h2>9. Our responsibility</h2>
      <p>We take care with every project and kit, but we cannot promise they will fit every syllabus or purpose. To the extent allowed by law, our liability for any order is limited to the amount you paid for that order.</p>

      <h2>10. Changes, law and contact</h2>
      <ul>
        <li>We may update these terms. The date at the top shows the latest version.</li>
        <li>These terms are governed by the laws of India. Courts at the location of our registered office have jurisdiction, subject to your rights under consumer protection law.</li>
        <li>Questions or complaints: <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. See our <Link href="/privacy">privacy policy</Link> for how we handle your data.</li>
      </ul>

      <h2>Grievance officer</h2>
      <p>{SITE.grievanceOfficer.name}, <a href={`mailto:${SITE.grievanceOfficer.email}`}>{SITE.grievanceOfficer.email}</a>, {SITE.address}. We acknowledge complaints within 48 hours and aim to resolve them within one month.</p>
    </LegalPage>
  );
}
