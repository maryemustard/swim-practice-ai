import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Wave } from "@/components/Wave";
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
      <body className="min-h-full flex flex-col bg-gradient-to-b from-cyan-50 via-teal-50 to-white text-slate-900">
        <header className="relative bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600">
          <nav className="mx-auto max-w-5xl px-6 pt-4 pb-8 flex items-center gap-6">
            <Link href="/" className="font-semibold text-lg tracking-tight text-white flex items-center gap-1.5">
              <span>🌊</span> Swim Practice AI
            </Link>
            <Link href="/groups" className="text-sm text-cyan-50/90 hover:text-white transition-colors">
              Groups
            </Link>
            <Link href="/practices" className="text-sm text-cyan-50/90 hover:text-white transition-colors">
              Practice Log
            </Link>
            <Link href="/calendar" className="text-sm text-cyan-50/90 hover:text-white transition-colors">
              Team Calendar
            </Link>
          </nav>
          <Wave className="absolute -bottom-px left-0 w-full h-6" fill="#ecfeff" />
        </header>
        <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
        <footer className="mt-auto">
          <Wave className="w-full h-8 rotate-180" fill="#0d9488" />
          <div className="bg-teal-700 text-teal-100 text-xs text-center py-3">
            Made with 🐬 for coaches who&apos;d rather coach than build spreadsheets.
          </div>
        </footer>
      </body>
    </html>
  );
}
