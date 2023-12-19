import LocalTime from "@/app/components/localtime";
import { Card } from "@/app/components/ui/card";
import { cn } from "@/app/utils/tw";
import { getCurrentUser } from "@/app/utils/user";
import { prisma } from "@email/db";
import { StarIcon } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ClientStar } from "./components.client";


interface EmailListProps {
    emails: {
        id: string;
        subject: string | null;
        snippet: string | null;
        createdAt: Date;
        isRead: boolean | null;
        isStarred: boolean | null;
        category?: {
            name: string;
            id: string;
            color: string | null;
        } | null;
        from: {
            name: string | null;
            address: string;
        } | null;
    }[];

    mailbox: string
    type?: "inbox" | "sent" | "drafts" | "bin" | "starred"

}

export default function EmailList({ emails, mailbox: mailboxId, type }: EmailListProps) {

    async function starEmail(emailId: string, state: boolean) {
        "use server"
        const userId = await getCurrentUser()
        if (!userId) throw new Error()

        await prisma.email.update({
            data: {
                isStarred: state
            },
            where: {
                id: emailId,
                mailbox: {
                    id: mailboxId,
                    users: {
                        some: {
                            userId: userId
                        }
                    }
                }
            }

        });

        revalidatePath(`/mail/${mailboxId}${type === "inbox" ? "" : `/${type}`}`)
    }


    return (
        <div className="lg:ml-52 flex flex-col space-y-4 p-5">
            {emails.map(email => (
                <Link
                    key={email.id}
                    href={`/mail/${mailboxId}/${email.id}`}
                >
                    <span key={email.id} className={cn("rounded shadow-sm h-16 pl-5 pr-5 py-2 w-full flex gap-4", email.isRead ? "hover:bg-card/60" : "text-card-foreground bg-card hover:bg-card/60")}>
                        <span
                            className="self-center rounded-full h-3 w-3 m-2 inline-block mx-auto flex-shrink-0"
                            style={{ backgroundColor: email.category?.color ?? "grey" }}
                            title={email.category?.name ?? "No category"}
                        />
                        <span className="self-center w-56 font-bold truncate" title={`${email.from?.name} (${email.from?.address})`}>
                            {email.from?.name}
                        </span>
                        <span className="self-center w-56 sm:font-bold truncate">{email.subject}</span>
                        <span className="self-center w-full hidden sm:flex gap-4">

                            {!email.isRead && (
                                <span className="select-none bg-red self-center text-white text-xs rounded px-3 py-1 font-bold inline h-6">
                                    NEW
                                </span>
                            )}
                            <span className="text-muted-foreground line-clamp-2 text-sm">
                                {email.snippet}
                            </span>
                        </span>
                        <span className="self-center truncate text-muted-foreground hover:text-foreground flex-shrink-0 flex ml-auto -mr-2">
                            <ClientStar enabled={!!email.isStarred} action={starEmail.bind(null, email.id, !email.isStarred)} />
                        </span>
                        <LocalTime type="hour-min" time={email.createdAt} className="float-right self-center text-muted-foreground text-sm flex-shrink-0 w-16 text-right" />
                    </span>


                </Link>
            ))}
        </div>
    )
}

