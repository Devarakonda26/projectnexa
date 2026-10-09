import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
