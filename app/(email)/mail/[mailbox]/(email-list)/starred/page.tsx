import type { Metadata } from "next";
import { pageMailboxAccess } from "../../tools";
import EmailList from "../email-list";

export const metadata = {
    title: "Starred",
} as Metadata;

export default async function Mailbox(props: {
    params: Promise<{
        mailbox: string;
    }>;
    searchParams?: Promise<{
        category?: string;
        take?: string;
        q?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const params = await props.params;
    await pageMailboxAccess(params.mailbox);

    return (
        <EmailList
            mailboxId={params.mailbox}
            initialTake={searchParams?.take}
            type="starred"
            categoryId={searchParams?.category}
            search={searchParams?.q}
        />
    );
}
