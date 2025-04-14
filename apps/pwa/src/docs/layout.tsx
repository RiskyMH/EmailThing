import { MainNavItem } from "@/(home)/components.client";
import { EmailThing } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { MenuIcon } from "lucide-react";
import Link from "@/components/link";
import { lazy, Suspense } from "react";
import { UserNavLogin } from "@/components/user-navbar";

// const UserNav = lazy(() => import("@/components/user-navbar"))
import UserNav from "@/components/user-navbar";

interface DocsLayoutProps {
    children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background" vaul-drawer-wrapper="">
            <header className="sticky top-0 z-40 border-b-2 bg-tertiary">
                <div className="container flex h-16 items-center gap-6 text-clip sm:justify-between sm:gap-10">
                    <Link href="/home" className="group flex items-center gap-1">
                        <EmailThing />
                    </Link>

                    <div className="flex gap-6">
                        <MainNavItem href="/docs" title="Documentation" mobileShow />
                        <MainNavItem href="#guides" title="Guides" />
                    </div>

                    <div className="-me-2 flex flex-1 items-center justify-end gap-4 sm:me-0">
                        <nav className="flex">
                            {/* user icon/login */}
                            {/* <div className="size-8 rounded-full bg-secondary animate-pulse" /> */}
                            <div className="hidden px-4 sm:flex">
                                {/* <Suspense fallback={<UserNavLogin />}> */}
                                    <UserNav fallbackLogin={true} />
                                {/* </Suspense> */}
                            </div>

                            <MenuIcon className="sm:hidden" />
                        </nav>
                    </div>
                </div>
            </header>
            <div className="container flex-1">{children}</div>
            <SiteFooter className="border-t" />
        </div>
    );
}
