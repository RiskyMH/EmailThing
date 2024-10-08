import type { Metadata } from "next";
import { pageMailboxAccess } from "../../tools";
import EmailList from "../email-list";

export const metadata = {
    title: "Sent",
} as Metadata;

export default async function Mailbox({
    params,
    searchParams,
}: {
    params: {
        mailbox: string;
    };
    searchParams?: {
        category?: string;
        take?: string;
        q?: string;
    };
}) {
    await pageMailboxAccess(params.mailbox);

    return (
        <EmailList
            mailboxId={params.mailbox}
            initialTake={searchParams?.take}
            type="sent"
            categoryId={searchParams?.category}
            search={searchParams?.q}
        />
    );
}
