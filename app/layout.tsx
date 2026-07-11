import type { Metadata } from "next";
import { ServiceWorkerCleanup } from "@/components/ServiceWorkerCleanup";
import "./globals.css";

export const metadata: Metadata = {
  title: "DESIGN.md Studio",
  description:
    "Visual editor + linter for Google's DESIGN.md design-token spec. Author tokens, preview components, check WCAG contrast, and export Tailwind/DTCG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <ServiceWorkerCleanup />
        {children}
      </body>
    </html>
  );
}
