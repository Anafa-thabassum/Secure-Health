import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureHealth | Zero-Trust EHR Security",
  description: "Centralized records. Controlled access. Explainable security.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark" suppressHydrationWarning><body className="antialiased">{children}</body></html>;
}
