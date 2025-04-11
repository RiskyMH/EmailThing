import Header from "./root-layout-header";
import { useParams, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./root-layout-sidebar";
import RootLayout from "../layout";
import { Suspense } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/utils/data/db";
export default function MailLayout({ children }: { children: React.ReactNode }) {
    // const params = useParams<"mailboxId" | "mailId">()
    
    // const userId = await getCurrentUser()
    // if (!userId) return redirect("/login?from=/mail/" + params.mailbox)

    // const userHasAccess = await userMailboxAccess(params.mailbox, userId)
    // if (!userHasAccess) return notFound()

    return (
        <RootLayout>
            <div className="min-h-screen bg-background" vaul-drawer-wrapper="">
                <Header />
                <div className="flex h-[calc(100vh-4.1rem)] w-screen max-w-full">
                <Sidebar className="hidden min-h-[calc(100vh-4.1rem)] sm:flex" />
                    <div className="h-[calc(100vh-4.1rem)] w-screen max-w-full overflow-y-auto" id="mail-layout-content">
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
    const user = useLiveQuery(async () => {
        // return db.localSyncData.toArray()
        const localSyncData = await db.localSyncData.toArray()
        if (localSyncData.length === 0) {
            // sleep 100ms and try again
            await new Promise(resolve => setTimeout(resolve, 100))
            return (await db.localSyncData.count()) > 0
        }
        return localSyncData.length > 0
    }, [], null)
    const location = useLocation()
    const mailboxId = useParams<"mailboxId">().mailboxId
    if (user === false && mailboxId !== "demo") {
        return <Navigate to={`/login?from=${location.pathname}`} state={{ from: location }} />
    }
}   

function RedirectTilde() {
    const params = useParams<"mailboxId">()
    const url = useLocation()
    const mailboxId = params.mailboxId
    if (mailboxId === "~") {
        const defaultMailboxId = document.cookie.split("; ").find(row => row.startsWith("mailboxId="))?.split("=")[1] || "demo";
        return <Navigate to={url.pathname.replace("~", defaultMailboxId)} replace />
    }
}