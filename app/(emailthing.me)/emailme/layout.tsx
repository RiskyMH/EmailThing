import { Header, MainNavItem } from "@/(home)/components.client"
import Logo, { EmailthingText } from "@/components/logo"
import { SiteFooter } from "@/components/site-footer"
import { buttonVariants } from "@/components/ui/button"
import type { Metadata } from "next"
import Link from "next/link"

interface DocsLayoutProps {
    children: React.ReactNode
}

// export const runtime = "edge"

export const metadata = {
    title: {
        default: "EmailThing.me",
        template: "%s - EmailThing.me"
    },
    description: "EmailThing.me is your own contact page to make emailing easy!",
    openGraph: {
        title: "EmailThing.me",
        description: "EmailThing.me is your own contact page to make emailing easy!",
        siteName: "EmailThing.me",
        images: [
            "/logo.png",
        ],
        locale: "en_US",
        url: "https://emailthing.me",
        type: "website"
    },
    twitter: {
        title: "EmailThing.me",
        description: "EmailThing.me is your own contact page to make emailing easy!",
        card: "summary",
        images: [
            "/logo.png",
        ],
        creator: "EmailThing_"
    },
} satisfies Metadata

export default function DocsLayout({ children }: DocsLayoutProps) {
    return (
        <>
            <Header className="container z-40 top-0 sticky flex h-20 items-center justify-between py-6 w-full transition-[height]">
                <div className="flex gap-6 md:gap-10">
                    <Link href="/" className="items-center gap-1 flex group">
                        <Logo className="size-7 shrink-0 flex" />
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
                        className={buttonVariants({ variant: "secondary", size: "sm", className: "px-4" })}
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
            <main className="flex-1">
                {children}
            </main>

            <SiteFooter className="border-t">
                {" and powered by "}
                <a
                    href="https://emailthing.app/home"
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
                        "logo": "https://emailthing.app/logo.png",
                        "email": "contact@emailthing.xyz",
                        "url": "https://emailthing.me/"
                    })
                }} />
        </>
    )
}