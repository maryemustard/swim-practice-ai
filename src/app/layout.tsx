import type { Metadata } from "next";
import Link from "next/link";
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
  title: "Swim Practice AI",
  description: "AI-generated swim practices, tuned to each group.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto max-w-5xl px-6 py-4 flex items-center gap-6">
            <Link href="/" className="font-semibold text-lg tracking-tight">
              🏊 Swim Practice AI
            </Link>
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
              Groups
            </Link>
            <Link href="/practices" className="text-sm text-slate-600 hover:text-slate-900">
              Practice Log
            </Link>
          </nav>
        </header>
        <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
