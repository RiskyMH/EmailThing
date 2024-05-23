import { MainNavItem } from "@/(home)/components.client"
import Logo, { EmailthingText } from "@/components/logo"
import { SiteFooter } from "@/components/site-footer"
import UserNav from "@/components/user-navbar"
import { MenuIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

interface DocsLayoutProps {
    children: React.ReactNode
}

// export const runtime = "edge"
export const experimental_ppr = true

export const metadata = {
    title: {
        default: "Documentation",
        template: "%s - EmailThing"
    },
    description: "The docs for EmailThing",
    openGraph: {
        title: "Documentation",
        description: "The docs for EmailThing",
        siteName: "EmailThing",
    },
} satisfies Metadata

export default function DocsLayout({ children }: DocsLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 border-b-2 bg-tertiary">
                <div className="container flex overflow-clip h-16 items-center gap-6 sm:gap-10 sm:justify-between">
                    <Link href="/home" className="items-center gap-1 flex group">
                        <Logo className="h-7 w-7" />
                        <EmailthingText />
                    </Link>

                    <div className="gap-6 flex">
                        <MainNavItem href="/docs" title="Documentation" mobileShow />
                        <MainNavItem href="#guides" title="Guides" />
                    </div>

                    <div className="flex flex-1 items-center gap-4 justify-end -me-2 sm:me-0">
                        <nav className="flex">
                            {/* user icon/login */}
                            {/* <div className="h-8 w-8 rounded-full bg-secondary animate-pulse" /> */}
                            <div className="px-4 hidden sm:flex">
                                <UserNav fallbackLogin={true} />
                            </div>

                            <MenuIcon className="sm:hidden" />
                        </nav>
                    </div>
                </div>
            </header>
            <div className="container flex-1">{children}</div>
            <SiteFooter className="border-t" />
        </div>
    )
}