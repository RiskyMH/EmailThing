import { MainNavItem } from "@/(home)/layout";
import Link from "@/components/link";
import { EmailThing } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { UserNavLogin } from "@/components/user-navbar.static";
import { cn } from "@/utils/tw";
import { MenuIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { DocsSidebarNav } from "./components.client";
import { docsNav } from "./pages";

const UserNav = lazy(() => import("@/components/user-navbar"));
const DemoLink = lazy(() =>
  import("@/components/user-navbar").then((mod) => ({ default: mod.DemoLink })),
);

// import UserNav from "@/components/user-navbar";

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
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
    <div className="flex min-h-screen flex-col bg-sidebar" vaul-drawer-wrapper="">
      <style>
        {`
          body {
            background-color: var(--sidebar) !important;
          }
        `}
      </style>
      <header className={cn("sticky top-0 z-40 bg-sidebar max-sm:border-b-2", scrolled && "border-b-2")}>
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
                {typeof document === "undefined" ? (
                  <UserNavLogin />
                ) : document.cookie.includes("mailboxId") ? (
                  <Suspense fallback={<UserNavLogin />}>
                    {/* <DemoLink /> */}
                    <UserNav fallbackLogin={true} />
                  </Suspense>
                ) : (
                  <>
                    {/* <DemoLinkButton /> */}
                    <UserNavLogin />
                  </>
                )}
              </div>

              <MenuIcon className="sm:hidden" />
            </nav>
          </div>
        </div>
      </header>

      <div className="lg:container max-sm:mx-auto md:max-lg:px-5 flex-1 bg-sidebar">
        <div className="flex-1 md:grid md:grid-cols-[200px_1fr] md:gap-4 lg:grid-cols-[240px_1fr] lg:gap-4">
          <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto //border-r py-5 pr-2 md:sticky md:block lg:py-5 bg-sidebar">
            <DocsSidebarNav items={docsNav} />
          </aside>
          {/* <div className=""> */}
            {children}
          {/* </div> */}
        </div>
      </div>

      <SiteFooter className="lg:border-t //max-lg:-mt-5" />
    </div>
  );
}
