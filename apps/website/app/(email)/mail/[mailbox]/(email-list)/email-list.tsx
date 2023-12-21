import LocalTime from "@/app/components/localtime";
import { cn } from "@/app/utils/tw";
import { getCurrentUser } from "@/app/utils/user";
import { prisma } from "@email/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ClientStar } from "./components.client";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/app/components/ui/tooltip";
import TooltipText from "@/app/components/tooltip-text";


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
        <div className="flex-col space-y-3 p-5 flex w-full min-w-0">
            {emails.map(email => (
                <Link
                    key={email.id}
                    href={`/mail/${mailboxId}/${email.id}`}
                    className={cn("rounded shadow-sm h-16 px-5 py-1.5 inline-flex gap-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", email.isRead ? "hover:bg-card/60" : "text-card-foreground bg-card hover:bg-card/60")}
                >
                    <TooltipText text={email.category?.name ?? "No category"}>
                        <span
                            className="self-center rounded-full h-3 w-3 m-2 inline-block mx-auto flex-shrink-0"
                            style={{ backgroundColor: email.category?.color ?? "grey" }}
                        />
                    </TooltipText>

                    <TooltipText text={`${email.from?.name} (${email.from?.address})`}>
                        <span className="self-center w-56 font-bold truncate">
                            {email.from?.name}
                        </span>
                    </TooltipText>

                    <span className="self-center w-64 sm:font-bold truncate">{email.subject}</span>

                    <span className="self-center w-full hidden sm:inline-flex gap-4 flex-shrink">

                        {!email.isRead && (
                            <span className="select-none bg-red self-center text-white text-xs rounded px-3 py-1 font-bold inline h-6">
                                NEW
                            </span>
                        )}
                        <span className="text-muted-foreground line-clamp-2 text-sm">
                            {email.snippet}
                        </span>
                    </span>
                    <ClientStar enabled={!!email.isStarred} action={starEmail.bind(null, email.id, !email.isStarred)} className="self-center text-muted-foreground hover:text-foreground flex-shrink-0 ms-auto -me-2" />
                    <LocalTime type="hour-min" time={email.createdAt} className="float-right self-center text-muted-foreground text-sm flex-shrink-0 w-16 text-right" />

                </Link>
            ))}
        </div>
    )
}

