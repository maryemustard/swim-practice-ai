import type { Metadata } from "next";
import Link from "next/link";
import { Sora, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--display-font",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--body-font",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--data-font",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Wavelength",
  description: "Swim practices generated in your coaches' own voice, personalized to every swimmer's pace.",
};

const NAV_LINKS = [
  { href: "/groups", label: "Groups" },
  { href: "/practices", label: "Practice log" },
  { href: "/calendar", label: "Team calendar" },
  { href: "/drills", label: "Standard" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ground text-ink font-sans">
        <header className="bg-deep">
          <nav className="mx-auto max-w-5xl px-6 py-4 flex items-center gap-7">
            <Link href="/" className="font-display font-semibold text-lg tracking-tight text-white">
              Wavelength
            </Link>
            <div className="flex items-center gap-5 font-mono text-[13px]">
              {NAV_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="text-pool-100 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-9">{children}</main>
        <footer className="border-t border-line bg-surface">
          <div className="mx-auto max-w-5xl px-6 py-4 text-xs text-ink-mute font-mono">
            Wavelength — practices and technique, on one standard.
          </div>
        </footer>
      </body>
    </html>
  );
}
