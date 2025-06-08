import { db } from "@/utils/data/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Suspense } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import RootLayout from "../layout";
import Header from "./root-layout-header";
import Sidebar from "./root-layout-sidebar";
export default function MailLayout({ children }: { children: React.ReactNode }) {
  // const params = useParams<"mailboxId" | "mailId">()

  // const userId = await getCurrentUser()
  // if (!userId) return redirect("/login?from=/mail/" + params.mailbox)

  // const userHasAccess = await userMailboxAccess(params.mailbox, userId)
  // if (!userHasAccess) return notFound()

  return (
    <RootLayout>
      <div className="//min-h-screen bg-sidebar-bg h-screen overflow-hidden emailscolumn" vaul-drawer-wrapper="" id="app:root-layout">
        <Header />
        <div className="flex h-[calc(100vh-4.1rem)] w-screen max-w-full bg-sidebar-bg">
          <Sidebar className="hidden min-h-[calc(100vh-4.1rem)] sm:flex pt-0 sm:pt-0" />
          <div
            className="h-[calc(100vh-4.1rem)] w-screen max-w-full overflow-y-auto sm:rounded-tl-lg"
            id="mail-layout-content"
          >
            {children}
          </div>
        </div>
      </div>
      <Suspense>
        <RedirectToLoginOnLogout />
        <RedirectTilde />
      </Suspense>
    </RootLayout>
  );
}

function RedirectToLoginOnLogout() {
  const user = useLiveQuery(
    async () => {
      return (await db.localSyncData.count()) > 0;
    },
    [],
    null,
  );

  const location = useLocation();
  const mailboxId = useParams<"mailboxId">().mailboxId;
  if (user === false && mailboxId !== "demo") {
    return <Navigate to={`/login?from=${location.pathname}`} state={{ from: location }} />;
  }
}

function RedirectTilde() {
  const params = useParams<"mailboxId">();
  const url = useLocation();
  const mailboxId = params.mailboxId;
  if (mailboxId === "~") {
    const defaultMailboxId =
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("mailboxId="))
        ?.split("=")[1] || "demo";
    return <Navigate to={url.pathname.replace("~", defaultMailboxId) + url.search} replace />;
  }
}
