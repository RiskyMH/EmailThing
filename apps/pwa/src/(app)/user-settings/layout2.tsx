import Link from "@/components/link";
import { db } from "@/utils/data/db";
import { useLiveQuery } from "dexie-react-hooks";
import { type ReactNode, Suspense } from "react";
import { Navigate, useLocation, useMatch } from "react-router-dom";
import RootLayout from "../layout";

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: DocsLayoutProps) {
  return (
    <RootLayout>
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16)_-_1rem)] w-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="font-semibold text-3xl">Account Settings</h1>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <nav className="flex flex-col gap-4 ps-6 text-muted-foreground text-sm sm:ps-0">
            <MenuItem href="/settings">General</MenuItem>
            <MenuItem href="/settings/authentication">Authentication</MenuItem>
            <MenuItem href="/settings/notifications">Notifications</MenuItem>
            <MenuItem href="/settings/mailboxes">Mailboxes</MenuItem>
            <MenuItem href="/settings/emailthing-me">EmailThing.me</MenuItem>
            <MenuItem href="/settings/#">Advanced</MenuItem>
          </nav>
          <div className="grid gap-6">{children}</div>
        </div>
      </main>
      <Suspense>
        <RedirectToLoginOnLogout />
      </Suspense>
    </RootLayout>
  );
}

export function MenuItem({ href, children }: { href: string; children: ReactNode }) {
  const pathname = useMatch({ path: href });
  return (
    <Link href={href} className={pathname ? "font-semibold text-primary" : undefined}>
      {children}
    </Link>
  );
}

function RedirectToLoginOnLogout() {
  const user = useLiveQuery(
    async () => {
      const localSyncData = await db.localSyncData.toArray();
      if (localSyncData.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return (await db.localSyncData.count()) > 0;
      }
      return localSyncData.length > 0;
    },
    [],
    null,
  );
  const location = useLocation();
  if (user === false) {
    return <Navigate to={`/login?from=${location.pathname}`} state={{ from: location }} />;
  }
  return null;
}
