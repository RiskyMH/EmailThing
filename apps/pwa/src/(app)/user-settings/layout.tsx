import Link from "@/components/link";
import { EmailThing } from "@/components/logo";
import UserNav from "@/components/user-navbar";
import { MainNavItem } from "@/(home)/layout";
import { useEffect, useState } from "react";
import { cn } from "@/utils/tw";

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: DocsLayoutProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 0;
      setScrolled(isScrolled);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col bg-sidebar" vaul-drawer-wrapper="">
      <style dangerouslySetInnerHTML={{
        __html: /*css*/`
        body {
          overflow-y: scroll;
          background-color: var(--sidebar) !important;
        }
        `.replaceAll(/(\s{2,}|\n+)/gm, "")
      }} />
      <header className={cn("sticky top-0 z-40 bg-sidebar border-b-2", scrolled && "border-b-2")}>
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
