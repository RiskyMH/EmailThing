import { Header, MainNavItem } from "@/components/header";
import Logo, { EmailthingText } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { cn } from "@/utils/tw";
import type { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";


interface DocsLayoutProps {
    children: React.ReactNode;
}

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

const fontHeading = localFont({
    src: "../../pwa/public/CalSans-SemiBold.woff2",
    variable: "--font-heading",
});


// export const runtime = "edge"

export const metadata = {
    title: {
        default: "EmailThing.me",
        template: "%s - EmailThing.me",
    },
    metadataBase: new URL("https://emailthing.me"),
    description: "EmailThing.me is your own contact page to make emailing easy!",
    openGraph: {
        title: "EmailThing.me",
        description: "EmailThing.me is your own contact page to make emailing easy!",
        siteName: "EmailThing.me",
        images: ["https://emailthing.app/logo.png"],
        locale: "en_US",
        url: "https://emailthing.me",
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
        title: "EmailThing.me",
        description: "EmailThing.me is your own contact page to make emailing easy!",
        card: "summary",
        images: ["https://emailthing.app/logo.png"],
        creator: "EmailThing_",
    },
    generator: "Next.js",
} satisfies Metadata;

export const viewport: Viewport = {
    themeColor: "#292932",
};

export default function DocsLayout({ children }: DocsLayoutProps) {
    return (
        <html lang="en">
            <body
                className={cn(
                    "min-h-screen bg-background font-sans antialiased",
                    fontSans.variable,
                    fontHeading.variable,
                )}
            >

                <Header
                    className="container sticky top-0 z-40 flex h-20 w-full items-center justify-between bg-background py-6 transition-[height]"
                    vaul-drawer-wrapper=""
                >
                    <div className="flex gap-6 md:gap-10">
                        <Link href="/" className="group flex items-center gap-1">
                            <Logo className="flex size-7 shrink-0" />
                            <EmailthingText className="flex" text="EmailThing.me" />
                        </Link>
                        <div className="flex gap-6">
                            <MainNavItem href="https://emailthing.app/home" title="EmailThing" />
                            {/* <MainNavItem href="/pricing" title="Pricing" mobileShow />
                        <MainNavItem href="/docs" title="Documentation" /> */}
                        </div>
                    </div>
                    <nav className="flex gap-2">
                        <Link
                            href="https://emailthing.app/register?from=/settings/emailthing-me"
                            className={buttonVariants({
                                variant: "secondary",
                                size: "sm",
                                className: "px-4",
                            })}
                            target="_blank"
                        >
                            Make your own
                        </Link>
                        {/* <Link
                        href="https://emailthing.app/login?from=/settings"
                        className={buttonVariants({ variant: "default", size: "sm", className: "px-4" })}
                        target="_blank"
                    >
                        Login
                    </Link> */}
                    </nav>
                </Header>
                <main className="flex-1">{children}</main>

                <SiteFooter className="border-t">
                    {" and powered by "}
                    <a
                        href="https://emailthing.app/home"
                        target="_blank"
                        className="font-medium underline underline-offset-4"
                        rel="noreferrer"
                    >
                        EmailThing
                    </a>
                </SiteFooter>

                <script
                    type="application/ld+json"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            name: "EmailThing.me",
                            author: {
                                "@type": "Person",
                                name: "RiskyMH",
                            },
                            description: "EmailThing.me is your own contact page to make emailing easy!",
                            logo: "https://emailthing.app/logo.png",
                            email: "contact@emailthing.xyz",
                            url: "https://emailthing.me/",
                        }),
                    }}
                />
                <Sonner />
            </body>
        </html>
    );
}
