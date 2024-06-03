import { getCurrentUser } from "@/utils/jwt";
import { RefreshButton } from "../components.client";
import { getDraftEmailList, getEmailList, getJustEmailsList, getDraftJustEmailsList, getTempAliases } from "./tools"
import LoadMore from "@/components/loadmore.client";
import { EmailItem } from "./email-item";
import { mailboxCategories, userMailboxAccess } from "../tools";
import { cn } from "@/utils/tw";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SmartDrawer, SmartDrawerTrigger, SmartDrawerContent } from "@/components/ui/smart-drawer";
import { tempEmailsLimit } from "@/utils/limits";
import { CreateTempEmailForm } from "./temp/modal";
import db, { Mailbox } from "@/db";
import { eq } from "drizzle-orm";
import { formatTimeAgo } from "@/utils/tools";

interface EmailListProps {
    mailboxId: string;
    type?: "inbox" | "sent" | "drafts" | "trash" | "starred" | "temp";
    categoryId?: string;
    initialTake?: string;
    search?: string
}

export default async function EmailList({ mailboxId, categoryId, type = "inbox", initialTake, search }: EmailListProps) {
    const baseUrl = `/mail/${mailboxId}${type === "inbox" ? "" : `/${type}`}`

    const take = initialTake ? parseInt(initialTake) : 10
    const emailFetchOptions = {
        isBinned: type === "trash",
        isSender: type === "sent",
        isStarred: type === "starred" ? true : undefined,
        categoryId,
        take,
        search,
        selectCategories: !search && type !== "drafts",
        isTemp: type === "temp"
    }

    const [emails, categoryCounts, emailCount] = (type !== "drafts")
        ? await getEmailList(mailboxId, emailFetchOptions)
        : await getDraftEmailList(mailboxId, emailFetchOptions)

    const categories = emailFetchOptions.selectCategories && await (type === "temp" ? getTempAliases : mailboxCategories)(mailboxId)
    const mailboxPlan = type === "temp" ? await db.query.Mailbox.findFirst({
        where: eq(Mailbox.id, mailboxId),
        columns: {
            plan: true
        }
    }) : undefined

    const nextEmail = emails.length === take + 1 ? emails.pop() : null
    const currentCategory = categories && categories?.find(c => c.id === categoryId)

    async function fetchMoreEmails(curser?: { emailId: string, createdAt: Date }) {
        "use server";
        const userId = await getCurrentUser()
        if (!userId) throw new Error()
        if (!await userMailboxAccess(mailboxId, userId)) throw new Error()

        const emails = (type !== "drafts")
            ? await getJustEmailsList(mailboxId, { ...emailFetchOptions, selectCategories: false, take: 10 }, curser)
            : await getDraftJustEmailsList(mailboxId, { take: 10, search }, curser)

        if (emails.length === 0) {
            console.error("No more emails")
            return [[], null] as [JSX.Element[], null]
        }

        const nextPageEmail = emails.length >= 11 ? emails.pop() : null
        const categories = type === "temp" ? undefined : await mailboxCategories(mailboxId)

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
            nextPageEmail ? { emailId: nextPageEmail.id, createdAt: nextPageEmail.createdAt } : null,
        ] as const
    }

    return (
        <>
            <div className="flex-col gap-2 p-5 flex w-full min-w-0">
                <div className="flex flex-row w-full min-w-0 pb-3 border-b-2 -mt-4 pt-3 gap-6 overflow-y-auto sticky top-0 z-10 bg-background">
                    <input type="checkbox" disabled id="select" className="mr-2 self-start mt-1 h-4 w-4 flex-shrink-0" />
                    <div className="flex flex-row w-full min-w-0 pb-3 -mb-3 gap-6 overflow-y-auto">
                        <CategoryItem
                            circleColor={null}
                            name={type === "drafts" ? "Drafts" : search ? "Search results" : "All"}
                            count={emailCount[0].count || 0}
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
                                count={categoryCounts?.find(c => c.categoryId === category.id)?.count || 0}
                                link={baseUrl}
                                category={category.id}
                            />
                        ))}
                    </div>
                    {type === "temp" && (
                        <SmartDrawer>
                            <SmartDrawerTrigger asChild>
                                <Button size="sm" className="h-auto py-1 -my-1" disabled={((categories && categories?.length) || 0) >= (tempEmailsLimit)[mailboxPlan?.plan ?? "FREE"]}>
                                    Create email
                                </Button>
                            </SmartDrawerTrigger>
                            <SmartDrawerContent className="sm:max-w-[425px]">
                                <CreateTempEmailForm mailboxId={mailboxId} />
                            </SmartDrawerContent>
                        </SmartDrawer>
                    )}
                    <div className="ms-auto me-2 flex-shrink-0">
                        <RefreshButton />
                    </div>
                </div>
                {type === "trash" && (
                    <div className="text-muted-foreground text-center font-bold">
                        Messages that have been in the Bin for more than 30 days will be deleted automatically
                    </div>
                )}
                {type === "temp" && (
                    <div className="text-muted-foreground text-center font-bold">
                        {categoryId
                            // @ts-expect-error types are boring
                            ? `This email address and emails will be automatically deleted ${formatTimeAgo(currentCategory?.expiresAt || new Date(Date.now() * 1000 * 60 * 60 * 24))}`
                            : `Email addresses will be automatically deleted in 24 hours after creation.`
                        }
                        {categoryId && (
                            <p className="pt-1 font-normal">
                                {/* @ts-expect-error types are boring */}
                                {currentCategory?.alias}
                            </p>
                        )}
                    </div>
                )}
                {emails.length === 0 && (
                    <div className="text-center text-muted-foreground">
                        {
                            search ? `Couldn't find any emails matching "${search}"`
                                : type === "drafts" ? "No drafts"
                                    : "No emails"
                        }
                    </div>
                )}
                {nextEmail ? (
                    <LoadMore loadMoreAction={fetchMoreEmails} startId={{ emailId: nextEmail.id, createdAt: nextEmail.createdAt }} refreshId={Date.now()} initialLength={take} >
                        {emails.map(email => (
                            <EmailItem key={email.id} email={email} categories={categories || undefined} mailboxId={mailboxId} type={type} />
                        ))}
                    </LoadMore>
                ) : (
                    emails.map(email => (
                        <EmailItem key={email.id} email={email} categories={categories || undefined} mailboxId={mailboxId} type={type} />
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