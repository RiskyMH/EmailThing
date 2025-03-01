import Header from "./root-layout-header";
import { useParams } from "react-router-dom";
import Sidebar from "./root-layout-sidebar";
import RootLayout from "../layout";

export default function MailLayout({ children }: { children: React.ReactNode }) {
    const params = useParams<"mailboxId" | "mailId">()
    
    // const userId = await getCurrentUser()
    // if (!userId) return redirect("/login?from=/mail/" + params.mailbox)

    // const userHasAccess = await userMailboxAccess(params.mailbox, userId)
    // if (!userHasAccess) return notFound()

    return (
        <RootLayout>
            <div className="min-h-screen bg-background" vaul-drawer-wrapper="">
                <Header mailbox={params.mailboxId!} />
                <div className="flex h-[calc(100vh-4.1rem)] w-screen max-w-full">
                <Sidebar mailbox={params.mailboxId!} className="hidden min-h-[calc(100vh-4.1rem)] sm:flex" />
                    <div className="h-[calc(100vh-4.1rem)] w-screen max-w-full overflow-y-auto">{children}</div>
                </div>
            </div>
        </RootLayout>
    );
}
