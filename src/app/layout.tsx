import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/shop/SiteHeader";

export const metadata: Metadata = {
  title: {
    default: "ProjectNexa — Engineering projects, kits & custom builds",
    template: "%s | ProjectNexa",
  },
  description:
    "Digital project packages, hardware kits and custom-built engineering projects for CSE, IT, ECE, EEE, Mechanical, Civil, AI/Data Science and Robotics students in India.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
          Skip to content
        </a>
        <SiteHeader />
        <div id="main" className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
