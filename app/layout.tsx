// app/layout.tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "pay402 — x402 Payment Analytics",
  description: "Real-time analytics dashboard for x402 payments on Aptos.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        suppressHydrationWarning
        className={`
          ${inter.variable}
          ${jetbrainsMono.variable}
          min-h-screen bg-gray-950 text-gray-100
          font-sans antialiased
        `}
      >
        {children}
      </body>
    </html>
  );
}
