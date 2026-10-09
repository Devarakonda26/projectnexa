import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>This policy explains what personal information {SITE.legalName} (&ldquo;we&rdquo;) collects on {SITE.brand}, why, and what you can do about it. It is written to follow Indian law, including the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address and password. Passwords are handled by our sign-in provider and we cannot read them.</li>
        <li><strong>Delivery details:</strong> recipient name, phone number and address, only if you order hardware.</li>
        <li><strong>Order and payment details:</strong> what you ordered, amounts, the payer name and the UPI or bank transaction reference you submit. We do not collect or store card numbers, UPI PINs or net-banking logins.</li>
        <li><strong>Custom project requests:</strong> your description, budget, dates and any files you attach.</li>
        <li><strong>Technical data:</strong> basic logs such as IP address, browser type and the pages that fail, used to keep the site secure and working.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To create your account and keep you signed in.</li>
        <li>To process, verify and deliver your orders, and to give you downloads.</li>
        <li>To quote and carry out custom projects.</li>
        <li>To send emails about your account and orders (such as sign-up confirmation and password reset).</li>
        <li>To prevent fraud and keep the site safe, and to meet legal and accounting duties.</li>
      </ul>
      <p>We do not sell your personal data. We do not use it for third-party advertising.</p>

      <h2>Who handles it for us</h2>
      <p>We use trusted service providers to run the site. They process data only to provide their service to us:</p>
      <ul>
        <li>Our database, sign-in and file-storage provider (Supabase).</li>
        <li>Our website hosting provider.</li>
        <li>Our email delivery provider, for account and order emails.</li>
        <li>Courier partners, who receive your name, phone number and address to deliver hardware.</li>
      </ul>
      <p>Some of these providers store data outside India. We also share information when the law requires it, for example in response to a lawful request from authorities.</p>

      <h2>How we protect it</h2>
      <p>Access is limited by role. Customers can see only their own orders and files. Downloads and attachments are stored privately and are shared only through short-lived links. Our staff can see order and payment information only to do their work, and their actions are logged. No system is perfectly secure, but we work to keep your data safe.</p>

      <h2>How long we keep it</h2>
      <p>We keep your account while it is open. We keep order and payment records for as long as the law requires us to keep accounting and tax records. You can ask us to delete your account, and we will delete or anonymise data we no longer need.</p>

      <h2>Your rights</h2>
      <p>You can ask us to give you a copy of your data, correct it, or delete it, and you can withdraw consent where we rely on it. Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> and we will respond within a reasonable time. If you are not satisfied, you may contact our grievance officer below, and then the Data Protection Board of India when it is available to you.</p>

      <h2>Cookies</h2>
      <p>We use only the cookies needed to keep you signed in and the site working. We do not use advertising cookies.</p>

      <h2>Children</h2>
      <p>The site is meant for students and adults. If you are under 18, please use it with a parent or guardian.</p>

      <h2>Changes and contact</h2>
      <p>If we change this policy, we will update the date above. See also our <Link href="/terms">terms of use</Link>.</p>
      <p><strong>Grievance officer:</strong> {SITE.grievanceOfficer.name}, <a href={`mailto:${SITE.grievanceOfficer.email}`}>{SITE.grievanceOfficer.email}</a>, {SITE.address}.</p>
    </LegalPage>
  );
}
