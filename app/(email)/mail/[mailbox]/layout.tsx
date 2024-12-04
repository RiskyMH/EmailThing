import type { Metadata } from "next";
import Header from "./header";
import Sidebar from "./sidebar";
import { mailboxAliases, pageMailboxAccess } from "./tools";

export async function generateMetadata(props: { params: Promise<{ mailbox: string }> }): Promise<Metadata> {
    const params = await props.params;
    await pageMailboxAccess(params.mailbox);

    const { default: defaultAlias } = await mailboxAliases(params.mailbox);

    return {
        title: {
            default: `${defaultAlias?.alias}`,
            template: `%s - ${defaultAlias?.alias} - EmailThing`,
        },
        robots: "noindex",
    };
}

export default async function MailLayout(props: {
    children: React.ReactNode;
    params: Promise<{
        mailbox: string;
    }>;
}) {
    const params = await props.params;

    const { children } = props;

    // const userId = await getCurrentUser()
    // if (!userId) return redirect("/login?from=/mail/" + params.mailbox)

    // const userHasAccess = await userMailboxAccess(params.mailbox, userId)
    // if (!userHasAccess) return notFound()

    return (
        <div className="min-h-screen bg-background" vaul-drawer-wrapper="">
            <Header mailbox={params.mailbox} />
            <div className="flex h-[calc(100vh-4.1rem)] w-screen max-w-full">
                <Sidebar mailbox={params.mailbox} className="hidden min-h-[calc(100vh-4.1rem)] sm:flex" />
                <div className="h-[calc(100vh-4.1rem)] w-screen max-w-full overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}
