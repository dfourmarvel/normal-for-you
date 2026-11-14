import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Normal for you, normal for space",
  description: "Astronaut self-check: normal for people, normal for you, normal for this mission day.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-canvas font-sans text-charcoal">
        <header className="border-b border-border bg-card">
          <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              Normal for you
            </Link>
            <Link href="/proof" className="text-sm text-secondary underline-offset-4 hover:text-charcoal hover:underline">
              Proof
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
