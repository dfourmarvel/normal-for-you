import type { Metadata } from "next";
<<<<<<< HEAD
import { Inter } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { RoleProvider } from "@/lib/role-context";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BioTensor Q-Health",
  description:
    "Experimental astronaut health monitoring & decision-support UI — NASA Space Apps 2026 prototype. Simulated data. Not for clinical or flight use.",
};

const themeBoot = `try{if(localStorage.getItem('biotensor-theme')==='dark'){document.documentElement.setAttribute('data-theme','dark');document.documentElement.style.colorScheme='dark'}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider>
          <RoleProvider>
            <AppShell>{children}</AppShell>
          </RoleProvider>
        </ThemeProvider>
      </body>
=======
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Normal for you, normal for space",
  description: "Astronaut self-check: normal for people, normal for you, normal for this mission day.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
>>>>>>> 3abde7629b6cfeb66c0ae4db3ad9c4033cace3a1
    </html>
  );
}
