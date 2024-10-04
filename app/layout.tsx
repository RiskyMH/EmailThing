import type { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { cn } from "@/utils/tw";
import type { ReactNode } from "react";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const fontHeading = localFont({
    src: "../public/CalSans-SemiBold.woff2",
    variable: "--font-heading",
});

// export const runtime = 'edge';

export const metadata = {
    title: {
        default: "EmailThing",
        template: "%s - EmailThing",
    },
    metadataBase: new URL("https://emailthing.app"),
    description: "A modern email client designed for simplicity and the web.",
    keywords: ["email", "email client", "open source", "email thing", "riskymh"],
    openGraph: {
        title: "EmailThing",
        description: "A modern email client designed for simplicity and the web.",
        images: ["/logo.png"],
        locale: "en_US",
        url: "https://emailthing.app/home",
        type: "website",
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
        images: ["/logo.png"],
        creator: "EmailThing_",
    },
    generator: "Next.js",
} satisfies Metadata;

export const viewport: Viewport = {
    themeColor: "#292932",
};

export default function RootLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <html lang="en">
            <body
                className={cn(
                    "min-h-screen bg-background font-sans antialiased",
                    fontSans.variable,
                    fontHeading.variable,
                )}
            >
                {children}
                <Sonner />
                <script
                    type="application/ld+json"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            name: "EmailThing",
                            author: {
                                "@type": "Person",
                                name: "RiskyMH",
                            },
                            description: "A modern email client designed for simplicity and the web.",
                            logo: "https://emailthing.app/logo.png",
                            email: "contact@emailthing.xyz",
                            url: "https://emailthing.app/",
                        }),
                    }}
                />
            </body>
        </html>
    );
}
