import { getCurrentUser } from "@/app/utils/jwt";
import { RefreshButton } from "../components.client";
import { getDraftEmailList, getEmailList, getJustEmailsList, getDraftJustEmailsList } from "./tools"
import LoadMore from "@/app/components/loadmore.client";
import { EmailItem } from "./email-item";
import { mailboxCategories, userMailboxAccess } from "../tools";
import { cn } from "@/app/utils/tw";
import Link from "next/link";

interface EmailListProps {
    mailboxId: string;
    type?: "inbox" | "sent" | "drafts" | "trash" | "starred";
    categoryId?: string;
}

export default async function EmailList({ mailboxId, categoryId, type = "inbox" }: EmailListProps) {
    const baseUrl = `/mail/${mailboxId}${type === "inbox" ? "" : `/${type}`}`

    const emailFetchOptions = {
        isBinned: type === "trash",
        isSender: type === "sent",
        isStarred: type === "starred" ? true : undefined,
        categoryId
    }

    const [emails, categories, emailCount] = (type !== "drafts")
        ? await getEmailList(mailboxId, emailFetchOptions)
        : await getDraftEmailList(mailboxId)
    const nextEmailId = emails.length === 11 ? emails.pop()?.id : null

    async function fetchMoreEmails(nextEmailId: string) {
        "use server";
        const userId = await getCurrentUser()
        if (!userId) throw new Error()
        if (!await userMailboxAccess(mailboxId, userId)) throw new Error()

        const emails = (type !== "drafts")
            ? await getJustEmailsList(mailboxId, emailFetchOptions, nextEmailId)
            : await getDraftJustEmailsList(mailboxId, nextEmailId)

        if (emails.length === 0) throw new Error("No more emails")

        const nextPageEmailId = emails.length === 11 ? emails.pop() : null
        const categories = await mailboxCategories(mailboxId)

        return [
            emails.map(email => (
                <EmailItem
                    key={email.id}
                    email={email}
                    categories={categories}
                    mailboxId={mailboxId}
                    type={type}
                />
            )),
            nextPageEmailId?.id ?? null,
        ] as const
    }

    return (
        <>
            <div className="flex-col gap-2 p-5 flex w-full min-w-0">
                <div className="sm:flex flex-row w-full min-w-0 pb-3 border-b-2 -mt-4 pt-3 gap-6 hidden overflow-y-scroll">
                    <input type="checkbox" disabled id="select" className="mr-2 self-start mt-1 h-4 w-4 flex-shrink-0" />
                    <div className="flex flex-row w-full min-w-0 pb-3 -mb-3 gap-6 overflow-y-scroll">
                        <CategoryItem
                            circleColor={null}
                            name="All"
                            count={emailCount || 0}
                            link={baseUrl}
                            category={null}
                            isCurrent={!categoryId}
                        />
                        {(categories || []).map(category => (
                            <CategoryItem
                                isCurrent={category.id === categoryId}
                                key={category.id}
                                circleColor={category.color || "grey"}
                                name={category.name}
                                count={category._count.emails}
                                link={baseUrl}
                                category={category.id}
                            />
                        ))}
                    </div>

                    <div className="ms-auto me-2 flex-shrink-0">
                        <RefreshButton />
                    </div>
                </div>
                {nextEmailId ? (
                    <LoadMore loadMoreAction={fetchMoreEmails} startId={nextEmailId} refreshId={Date.now()} >
                        {emails.map(email => (
                            <EmailItem key={email.id} email={email} categories={categories} mailboxId={mailboxId} type={type} />
                        ))}
                    </LoadMore>
                ) : (
                    emails.map(email => (
                        <EmailItem key={email.id} email={email} categories={categories} mailboxId={mailboxId} type={type} />
                    ))
                )}
            </div>
        </>

    )
}

export function CategoryItem({ circleColor, name, count, link, category, isCurrent = false }: { circleColor: string | null, name: string, count: number, link: string, category: string | null, isCurrent: boolean }) {
    return (
        <Link href={link + (category ? "?category=" + category : "")} className={cn("group flex-shrink-0 inline-flex items-center gap-1 px-1 max-w-fit w-auto font-bold border-b-3 border-transparent", isCurrent && "border-blue")}>
            {circleColor && <div className="w-2.5 h-2.5 rounded-full mr-1" style={{ backgroundColor: circleColor }}></div>}
            <span className="font-medium group-hover:text-muted-foreground">{name}</span>
            <span className="text-sm text-muted-foreground group-hover:text-muted-foreground/50">({count})</span>
        </Link>
    )
}