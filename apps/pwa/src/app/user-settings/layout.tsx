import { MainNavItem } from "@/home/layout";
import { EmailThing } from "@/components/logo";
import UserNav from "@/components/user-navbar";
import Link from "@/components/link";

interface DocsLayoutProps {
    children: React.ReactNode;
}

export default function SettingsLayout({ children }: DocsLayoutProps) {
    return (
        <div className="flex flex-col bg-background" vaul-drawer-wrapper="">
            <header className="sticky top-0 z-40 border-b-2 bg-tertiary">
                <div className="container flex h-16 items-center gap-6 text-clip sm:justify-between sm:gap-10">
                    <Link href="/mail" className="group flex items-center gap-1">
                        <EmailThing />
                    </Link>

                    <div className="flex gap-6">
                        <MainNavItem href="/settings" title="Settings" mobileShow />
                    </div>

                    <div className="-me-2 flex flex-1 items-center justify-end gap-4 sm:me-0">
                        <nav className="flex">
                            <div className="flex px-4">
                                <UserNav />
                            </div>
                        </nav>
                    </div>
                </div>
            </header>
            {children}
        </div>
    );
}
