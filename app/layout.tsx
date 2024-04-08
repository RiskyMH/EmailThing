import type { Metadata, Viewport } from "next"
import { Inter as FontSans } from "next/font/google"
import localFont from "next/font/local"
import "./globals.css"
import { cn } from "@/utils/tw"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { ReactNode } from "react";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontHeading = localFont({
  src: "../public/CalSans-SemiBold.woff2",
  variable: "--font-heading",
})

// export const runtime = 'edge';

export const metadata = {
  title: {
    default: "EmailThing",
    template: "%s - EmailThing",
  },
  metadataBase: new URL("https://emailthing.xyz"),
  description: "A modern email client designed for simplicity and the web.",
  keywords: [
    "email",
    "email client",
    "open source",
    "email thing",
    "riskymh"
  ],
  openGraph: {
    title: "EmailThing",
    description: "A modern email client designed for simplicity and the web.",
    images: [
      "/logo.png",
    ],
    locale: "en_US",
    url: "https://emailthing.xyz/home",
    type: "website"
  },
  authors: [
    {
      name: "RiskyMH",
      url: "https://riskymh.dev",
    },
  ],
  creator: "RiskyMH",
  twitter: {
    title: "EmailThing",
    description: "A modern email client designed for simplicity and the web.",
    card: "summary",
    images: [
      "/logo.png",
    ],
  },
  generator: 'Next.js',
} satisfies Metadata

export const viewport: Viewport = {
  themeColor: '#222229',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        fontSans.variable,
        fontHeading.variable
      )}>
        {children}
        <Toaster />
        <Sonner />
      </body>
    </html>
  )
}