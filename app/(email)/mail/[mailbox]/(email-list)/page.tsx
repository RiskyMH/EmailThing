import type { Metadata } from "next";
import EmailList from "./email-list";

export const metadata = {
    title: "Inbox",
} as Metadata;

export default async function Mailbox(
    props: {
        params: Promise<{
            mailbox: string;
        }>;
        searchParams?: Promise<{
            category?: string;
            take?: string;
            q?: string;
        }>;
    }
) {
    const searchParams = await props.searchParams;
    const params = await props.params;
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
