import type { Metadata, Viewport } from "next"
import { Inter as FontSans } from "next/font/google"
import "./globals.css"
import { cn } from "@/app/utils/tw"
import { Toaster } from "@/app/components/ui/toaster"
import { Toaster as Sonner } from "@/app/components/ui/sonner"
import { ReactNode } from "react";

const fontSans = FontSans({
  subsets: ["latin"],
})

export const metadata = {
  title: {
    default: "EmailThing",
    template: "%s - EmailThing",
  },
  description: "An Email Client",
  openGraph: {
    title: "EmailThing",
    description: "An Email Client",
    images: [
      "/icon.png",
    ],
  },
  twitter: {
    title: "EmailThing",
    description: "An Email Client",
    card: "summary",
    images: [
      "/icon.png",
    ],
  }
} satisfies Metadata

export const viewport: Viewport = {
  themeColor: '#150436',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(
        "min-h-screen bg-background antialiased",
        fontSans.className,
      )}>
        {children}
        <Toaster />
        <Sonner />
      </body>
    </html>
  )
}