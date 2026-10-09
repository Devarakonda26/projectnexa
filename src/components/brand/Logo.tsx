import Link from "next/link";

/** Text-and-icon logo: a circuit-style "N" mark plus the wordmark. */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pnx-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#pnx-logo)" />
      <path d="M12 29V11l16 18V11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.6" fill="#0B1220" stroke="#fff" strokeWidth="1.6" />
      <circle cx="28" cy="29" r="2.6" fill="#0B1220" stroke="#fff" strokeWidth="1.6" />
    </svg>
  );
}

export function Logo({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <Link href="/" aria-label="ProjectNexa home" className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className={`text-xl font-bold tracking-tight ${tone === "dark" ? "text-white" : "text-slate-900"}`}>
        Project<span className={tone === "dark" ? "text-sky-400" : "text-blue-600"}>Nexa</span>
      </span>
    </Link>
  );
}
