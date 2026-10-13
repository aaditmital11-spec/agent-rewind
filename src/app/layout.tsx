import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Agent Rewind",
  description: "Record, inspect, and replay AI agent runs",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} antialiased`}>
      <body className="min-h-screen bg-bg font-sans text-fg">
        <header className="sticky top-0 z-10 border-b border-line bg-surface">
          <nav className="mx-auto flex h-11 max-w-[1440px] items-center gap-6 px-4 sm:px-6">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              Agent Rewind
            </Link>
            <Link href="/" className="text-sm text-muted hover:text-fg">
              Runs
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
