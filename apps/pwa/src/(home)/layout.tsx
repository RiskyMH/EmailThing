"use client";
import Link from "@/components/link";
import { EmailThing } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { DemoLinkButton, UserNavLogin } from "@/components/user-navbar.static";
import { cn } from "@/utils/tw";
import { ExternalLinkIcon } from "lucide-react";
import { type PropsWithChildren, Suspense, useEffect, useState } from "react";
import { lazy } from "react";
import { useMatch } from "react-router-dom";

const UserNav = lazy(() => import("@/components/user-navbar"));
const DemoLink = lazy(() =>
  import("@/components/user-navbar").then((mod) => ({ default: mod.DemoLink })),
);
// import UserNav, { DemoLink } from "@/components/user-navbar";

export default function HomeLayout({ children }: PropsWithChildren) {
  return (
    <div className="bg-background" vaul-drawer-wrapper="">
      <Header className="container sticky top-0 z-40 flex h-20 w-full items-center justify-between py-6 transition-[height]">
        <div className="flex gap-6 md:gap-10">
          <Link href="/home" className="group flex items-center gap-1">
            <EmailThing />
          </Link>
          <div className="flex gap-6">
            <MainNavItem href="/home#features" title="Features" />
            <MainNavItem href="/pricing" title="Pricing" mobileShow />
            <MainNavItem href="/docs" title="Documentation" />
          </div>
        </div>
        <nav className="flex items-center gap-4">
          {typeof document === "undefined" ? (
            <UserNavLogin />
          ) : document.cookie.includes("mailboxId") ? (
            <Suspense fallback={<UserNavLogin />}>
              <DemoLink />
              <UserNav fallbackLogin={true} />
            </Suspense>
          ) : (
            <>
              <DemoLinkButton />
              <UserNavLogin />
            </>
          )}
        </nav>
      </Header>
      <main className="flex-1 bg-background">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function MainNavItem({
  href,
  title,
  disabled = false,
  mobileShow = false,
}: PropsWithChildren<{
  href: string;
  disabled?: boolean;
  title: string;
  mobileShow?: boolean;
}>) {
  const match = useMatch(`${href}/*`);
  // const segment = useSelectedLayoutSegment();

  return (
    <Link
      href={disabled ? "#" : href}
      target={href.startsWith("http") ? "_blank" : undefined}
      className={cn(
        "hidden items-center gap-2 font-medium text-sm transition-colors hover:text-foreground/80 md:flex",
        match ? "text-foreground" : "text-foreground/60",
        disabled && "cursor-not-allowed opacity-80",
        mobileShow && "flex",
      )}
    >
      {title}
      {href.startsWith("http") && <ExternalLinkIcon className="size-4 stroke-[3px]" />}
    </Link>
  );
}

export function Header({ children, className }: PropsWithChildren<{ className?: string }>) {
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
    <header className={cn(className, scrolled && "h-16 border-b-2 bg-background")}>
      {children}
    </header>
  );
}
