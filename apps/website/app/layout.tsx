import type { Metadata } from "next"
import { Inter as FontSans } from "next/font/google"
import "./globals.css"
import { cn } from "@/app/utils/tw"
import { Toaster } from "@/app/components/ui/toaster"
import { ReactNode } from "react";

const fontSans = FontSans({
  subsets: ["latin"],
})

export const metadata = {
  title: {
    default: "EmailThing",
    template: "%s | EmailThing",
  },
  description: "An Email Client",
} satisfies Metadata

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
      </body>
    </html>
  )
}