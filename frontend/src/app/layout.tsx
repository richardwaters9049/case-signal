import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeToggle } from "@/components/theme-toggle";
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
  title: "CaseSignal | Workflow exception control centre",
  description: "A safer operator workspace for workflow exceptions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
        <ThemeToggle />
      </body>
      <Script id="theme-preference" strategy="beforeInteractive">{`
        try {
          const storedTheme = localStorage.getItem("casesignal.theme");
          const useDarkTheme = storedTheme ? storedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
          document.documentElement.classList.toggle("dark", useDarkTheme);
          document.documentElement.style.colorScheme = useDarkTheme ? "dark" : "light";
        } catch {
          document.documentElement.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
        }
      `}</Script>
    </html>
  );
}
