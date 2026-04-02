import type { Metadata } from "next";
import "@fontsource/inter";
import "@fontsource/jetbrains-mono";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Vesper | Spatial Edge Streaming",
  description: "A premium experimental music streaming client.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen selection:bg-white/30 selection:text-white bg-zinc-950 text-white/90 overflow-hidden font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
