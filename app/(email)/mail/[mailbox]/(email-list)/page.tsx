import type { Metadata } from "next";
import EmailList from "./email-list";

export const metadata = {
    title: "Inbox",
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
    return (
        <EmailList
            mailboxId={params.mailbox}
            initialTake={searchParams?.take}
            type="inbox"
            categoryId={searchParams?.category}
            search={searchParams?.q}
        />
    );
}
