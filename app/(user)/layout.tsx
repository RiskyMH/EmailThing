import { MainNavItem } from "@/(home)/components.client"
import Logo, { EmailthingText } from "@/components/logo"
import UserNav from "@/components/user-navbar"
import type { Metadata } from "next"
import Link from "next/link"
import { MenuItem } from "./components.client"

interface DocsLayoutProps {
    children: React.ReactNode
}

export const metadata = {
    title: "User Settings",
} satisfies Metadata

export default function SettingsLayout({ children }: DocsLayoutProps) {
    return (
        <div className="flex flex-col" vaul-drawer-wrapper="">
            <header className="sticky top-0 z-40 border-b-2 bg-tertiary">
                <div className="container flex overflow-clip h-16 items-center gap-6 sm:gap-10 sm:justify-between">
                    <Link href="/" className="items-center gap-1 flex group">
                        <Logo className="h-7 w-7" />
                        <EmailthingText />
                    </Link>

                    <div className="gap-6 flex">
                        <MainNavItem href="/settings" title="Settings" mobileShow />
                    </div>

                    <div className="flex flex-1 items-center gap-4 justify-end -me-2 sm:me-0">
                        <nav className="flex">
                            <div className="px-4 flex">
                                <UserNav />
                            </div>
                        </nav>
                    </div>
                </div>
            </header>
            {children}
        </div>
    )
}
