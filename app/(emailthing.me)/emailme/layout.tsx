import { Header, MainNavItem } from "@/(home)/components.client"
import Logo, { EmailthingText } from "@/components/logo"
import { SiteFooter } from "@/components/site-footer"
import { buttonVariants } from "@/components/ui/button"
import type { Metadata } from "next"
import Link from "next/link"

interface DocsLayoutProps {
    children: React.ReactNode
}

// export const runtime = process.env.STANDALONE ? "nodejs" : "edge"

export const metadata = {
    title: {
        default: "EmailThing.me",
        template: "%s - EmailThing.me"
    },
    description: "Forms to email someone!",
    openGraph: {
        title: "EmailThing.me",
        description: "Forms to email someone!",
        siteName: "EmailThing.me",
    },
} satisfies Metadata

export default function DocsLayout({ children }: DocsLayoutProps) {
    return (
        <>
            <Header className="container z-40 top-0 sticky flex h-20 items-center justify-between py-6 w-full transition-[height]">
                <div className="flex gap-6 md:gap-10">
                    <Link href="/emailme" className="items-center gap-1 flex group">
                        <Logo className="h-7 w-7 flex-shrink-0 flex" />
                        <EmailthingText className="flex" text="EmailThing.me" />
                    </Link>
                    <div className="flex gap-6">
                        <MainNavItem href="https://emailthing.xyz/home" title="EmailThing" />
                        {/* <MainNavItem href="/pricing" title="Pricing" mobileShow />
                        <MainNavItem href="/docs" title="Documentation" /> */}
                    </div>
                </div>
                <nav className="flex gap-2">
                    <Link
                        href="https://emailthing.xyz/register?from=/settings/emailthing.me"
                        className={buttonVariants({ variant: "secondary", size: "sm", className: "px-4" })}
                        target="_blank"
                    >
                        Make your own
                    </Link>
                    {/* <Link
                        href="https://emailthing.xyz/login?from=/settings"
                        className={buttonVariants({ variant: "default", size: "sm", className: "px-4" })}
                        target="_blank"
                    >
                        Login
                    </Link> */}
                </nav>
            </Header>
            <main className="flex-1">
                {children}
            </main>

            <SiteFooter className="border-t">
                {" and powered by "}
                <a
                    href="https://emailthing.xyz/home"
                    target="_blank"
                    className="font-medium underline underline-offset-4"
                >
                    EmailThing
                </a>
            </SiteFooter>

            <script type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "EmailThing.me",
                        "author": {
                            "@type": "Person",
                            "name": "RiskyMH"
                        },
                        "description": "EmailThing.me is your own contact page to make emailing easy!",
                        "logo": "https://emailthing.xyz/logo.png",
                        "email": "contact@emailthing.xyz",
                        // "url": "https://emailthing.me/"
                    })
                }} />
        </>
    )
}