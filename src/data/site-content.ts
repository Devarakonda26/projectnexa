/** Static marketing copy for the home and About pages. No testimonials, ratings, sales figures or awards appear anywhere here. */

/** The 12 branch cards on the home page. IoT is a topic across branches, so it opens a search instead of a branch page. */
export const HOME_BRANCHES: { slug: string; label: string; blurb: string; href: string }[] = [
  { slug: "cse", label: "CSE", blurb: "Web, apps, security and software systems", href: "/branches/cse" },
  { slug: "ece", label: "ECE", blurb: "Embedded, signals, VLSI and communication", href: "/branches/ece" },
  { slug: "eee", label: "EEE", blurb: "Power, energy, drives and control", href: "/branches/eee" },
  { slug: "mechanical", label: "Mechanical", blurb: "Design, thermal and manufacturing", href: "/branches/mechanical" },
  { slug: "civil", label: "Civil", blurb: "Structures, transport and environment", href: "/branches/civil" },
  { slug: "ai-data-science", label: "AI & Data Science", blurb: "Machine learning, vision and analytics", href: "/branches/ai-data-science" },
  { slug: "robotics", label: "Robotics", blurb: "Robots, manipulators and automation", href: "/branches/robotics" },
  { slug: "iot", label: "IoT", blurb: "Connected sensors, devices and dashboards", href: "/products?q=iot" },
  { slug: "aerospace", label: "Aerospace", blurb: "Drones, flight control and telemetry", href: "/branches/aerospace" },
  { slug: "biomedical", label: "Biomedical", blurb: "Medical instrumentation and monitoring", href: "/branches/biomedical" },
  { slug: "chemical", label: "Chemical", blurb: "Process simulation and plant design", href: "/branches/chemical" },
  { slug: "agricultural", label: "Agricultural", blurb: "Smart farming and irrigation", href: "/branches/agricultural" },
];

export const POPULAR_DOMAINS: { label: string; q: string }[] = [
  { label: "Machine learning", q: "machine learning" },
  { label: "Internet of Things", q: "iot" },
  { label: "Embedded systems", q: "embedded" },
  { label: "Computer vision", q: "vision" },
  { label: "Renewable energy", q: "solar" },
  { label: "Robotics", q: "robot" },
  { label: "Web development", q: "web" },
  { label: "Cybersecurity", q: "security" },
  { label: "Drones", q: "drone" },
  { label: "Smart farming", q: "farm" },
];

export const BUSINESS_LINES = [
  { icon: "download", title: "Digital Projects", text: "Project packages with source code, documentation and presentation material, delivered as secure downloads after your payment is verified.", href: "/products?type=digital", cta: "Browse digital projects" },
  { icon: "box", title: "Hardware Kits", text: "Component kits for hands-on builds, shipped across India. Cash on delivery is available on eligible kits.", href: "/products?type=hardware", cta: "Browse hardware kits" },
  { icon: "tool", title: "Custom Engineering", text: "Tell us what you need built. We reply with a quotation, then you track the work milestone by milestone.", href: "/custom-projects/new", cta: "Request a custom project" },
] as const;

export const WHY_CHOOSE = [
  { icon: "list", title: "Clear project details", text: "Every listing spells out features, requirements and what is included, so you know what you are buying." },
  { icon: "shield", title: "Payments checked by people", text: "UPI and bank-transfer payments are verified by our staff before an order is confirmed." },
  { icon: "lock", title: "Private downloads", text: "Digital files sit in private storage and are shared only through short-lived links for paying customers." },
  { icon: "truck", title: "India-wide delivery", text: "Hardware kits ship across India, with cash on delivery on eligible items." },
  { icon: "message", title: "Build-to-order projects", text: "Need something different? Request a custom project and agree the price before work starts." },
  { icon: "mail", title: "Real support", text: "Questions before or after you order go to a real person by email or phone." },
] as const;

export const HOW_IT_WORKS = [
  { title: "Explore", text: "Browse by branch, domain or type, or search for a topic or technology." },
  { title: "Choose", text: "Read the details, requirements and included items, then add it to your cart." },
  { title: "Pay by UPI or bank transfer", text: "Pay, then submit your transaction reference. Cash on delivery is available on eligible kits." },
  { title: "We verify", text: "Our team checks the payment and confirms your order." },
  { title: "Receive", text: "Download digital files from your account, or track your kit until it arrives." },
] as const;

export const CUSTOM_PROCESS = [
  { title: "Share your idea", text: "Describe the problem, your branch, any deadline and a budget range if you have one." },
  { title: "Get a quotation", text: "We review the request and send a price and a plan, or ask follow-up questions." },
  { title: "Approve and pay in milestones", text: "Accept the quote and pay as each milestone is agreed." },
  { title: "Track and receive", text: "Follow progress from your account and receive the finished deliverables." },
] as const;

export const HOME_FAQ = [
  { q: "How do I pay?", a: "Pay by UPI or bank transfer and submit the transaction reference at checkout. Our team verifies the payment before the order is confirmed. Cash on delivery is available only on eligible hardware kits." },
  { q: "How do I get a digital project?", a: "After your payment is verified, the files appear in the Downloads section of your account. They are never public links." },
  { q: "Are the projects on the site ready-made and tested?", a: "Listings marked Sample are demonstration entries that show how a project page will look. Check each page for what is included before you buy." },
  { q: "Do you deliver hardware kits everywhere in India?", a: "We deliver across India. Delivery time and charges are shown at checkout and on the shipping page." },
  { q: "Can you build a project that is not listed?", a: "Yes. Send a custom project request with your requirements and we will reply with a quotation." },
  { q: "What if my payment is rejected?", a: "You can fix the details and resubmit the payment from your order page." },
] as const;

export const ABOUT_VALUES = [
  { title: "Be clear", text: "Say plainly what a project includes and what it does not." },
  { title: "Be careful with payments", text: "Every payment is checked by a person; we never rely on a customer saying they paid." },
  { title: "Protect your files and data", text: "Downloads and personal details are kept private." },
] as const;
