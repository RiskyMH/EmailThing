"use client";
import Link from "@/components/link";
import { EmailThing } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { DemoLinkButton, UserNavLogin } from "@/components/user-navbar.static";
import { type PropsWithChildren, Suspense } from "react";
import { lazy } from "react";
import { Header, MainNavItem } from "./components";

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

export { Header, MainNavItem }
