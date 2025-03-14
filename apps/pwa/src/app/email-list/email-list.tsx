"use client"
import { useParams, useSearchParams } from "react-router-dom"
import { Suspense } from "react"
import Loading from "./email-list-loading"
import { Button } from "@/components/ui/button"
import RefreshButton from "./refresh-button"
import { SmartDrawer, SmartDrawerTrigger, SmartDrawerContent } from "@/components/ui/smart-drawer"
import { tempEmailsLimit } from "@/utils/limits";
import { CreateTempEmailForm } from "./email-list-temp-modal"
import { EmailItem } from "./email-list-item"
import Link from "@/components/link"
import { cn } from "@/utils/tw"
import { formatTimeAgo } from "@/utils/tools"
import { getEmailList } from "@/utils/data/queries/email-list"
import { useLiveQuery } from 'dexie-react-hooks';


export default function EmailListSuspenced({ filter }: { filter: "inbox" | "drafts" | "sent" | "starred" | "trash" | "temp" }) {
    return <Suspense fallback={<Loading />}>
        <EmailList filter={filter} />
    </Suspense>
}


export interface Email {
    id: string
    subject: string
    snippet?: string
    body?: string
    html?: string
    createdAt: Date
    isRead?: boolean
    isStarred?: boolean
    binnedAt?: Date | null
    categoryId?: string | null
    /** if draft, its actually the recipient */
    from: {
        name: string
        address: string
    }
}

export interface Category {
    id: string
    name: string
    /** hex color */
    color?: string
}


function EmailList({ filter: type }: { filter: "inbox" | "drafts" | "sent" | "starred" | "trash" | "temp" }) {
    const params = useParams<"mailboxId">()
    const searchParams = useSearchParams()[0]
    const categoryId = searchParams.get("category") as string | null
    const search = searchParams.get("q") as string | null
    const mailboxId = (params.mailboxId === "[mailboxId]" || !params.mailboxId) ? "demo" : params.mailboxId

    const data = useLiveQuery(async () => {
        const emails = await getEmailList({
            mailboxId,
            type,
            categoryId: categoryId ?? undefined,
            search: search ?? undefined,
        })
        return emails
    }, [mailboxId, type, categoryId, search])

    const isLoading = !data
    const error = null

    if (error) return <div>failed to load {type} ({error})</div>
    if (isLoading || !data) return <Loading />

    const { emails, categories, mailboxPlan, allCount } = data

    const baseUrl = `/mail/${mailboxId}${type === "inbox" ? "" : `/${type}`}`;

    return (
        <>
            <div className="flex w-full min-w-0 flex-col gap-2 p-5 px-3 pt-0">
                <div className="overflow sticky top-0 z-10 flex h-12 w-full min-w-0 flex-row items-center justify-center gap-3 overflow-y-hidden border-b-2 bg-background px-2">
                    <input type="checkbox" disabled id="select" className="my-auto mr-2 size-4 shrink-0 self-start" />
                    <div className="flex h-6 w-full min-w-0 flex-row gap-6 overflow-y-hidden">
                        <CategoryItem
                            circleColor={null}
                            name={type === "drafts" ? "Drafts" : search ? "Search results" : "All"}
                            count={allCount}
                            link={baseUrl}
                            category={null}
                            isCurrent={!categoryId}
                        />
                        {(type !== "drafts" && type !== "temp" && !search) && (categories || []).map((category) => (
                            <CategoryItem
                                isCurrent={category.id === categoryId}
                                key={category.id}
                                circleColor={category.color || "grey"}
                                name={category.name}
                                count={category.count || 0}
                                link={baseUrl}
                                category={category.id}
                            />
                        ))}
                    </div>
                    {type === "temp" && (
                        <SmartDrawer>
                            <SmartDrawerTrigger asChild>
                                <Button
                                    size="sm"
                                    className="-my-1 h-auto py-1"
                                    disabled={
                                        // biome-ignore lint/complexity/useOptionalChain: <explanation>
                                        ((categories && categories?.length) || 0) >=
                                        tempEmailsLimit[mailboxPlan?.plan as keyof typeof tempEmailsLimit]
                                    }
                                >
                                    Create email
                                </Button>
                            </SmartDrawerTrigger>
                            <SmartDrawerContent className="sm:max-w-[425px]">
                                <CreateTempEmailForm mailboxId={mailboxId} />
                            </SmartDrawerContent>
                        </SmartDrawer>
                    )}
                    <div className="ms-auto flex h-6 shrink-0 items-center justify-center">
                        <RefreshButton />
                    </div>
                </div>
                {type === "trash" && (
                    <div className="text-center font-bold text-muted-foreground">
                        Messages that have been in the Bin for more than 30 days will be deleted automatically
                    </div>
                )}
                {type === "temp" && (
                    <div className="text-center font-bold text-muted-foreground">
                        {categoryId
                            ? // @ts-expect-error types are boring
                            `This email address and emails will be automatically deleted ${formatTimeAgo(currentCategory?.expiresAt || new Date(Date.now() * 1000 * 60 * 60 * 24))}`
                            : "Email addresses will be automatically deleted in 24 hours after creation."}
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
                        {search
                            ? `Couldn't find any emails matching "${search}"`
                            : type === "drafts"
                                ? "No drafts"
                                : "No emails"}
                    </div>
                )}
                {emails.map((email) => (
                    <EmailItem
                        key={email.id}
                        email={email}
                        categories={categories || undefined}
                        mailboxId={mailboxId}
                        type={type}
                    />
                ))}
            </div>
        </>
    );
}

export function CategoryItem({
    circleColor,
    name,
    count,
    link,
    category,
    isCurrent = false,
}: {
    circleColor: string | null;
    name: string;
    count: number;
    link: string;
    category: string | null;
    isCurrent: boolean;
}) {
    return (
        <Link
            href={link + (category ? `?category=${category}` : "")}
            className={cn(
                "group inline-flex w-auto max-w-fit shrink-0 items-center gap-1 border-transparent border-b-3 px-1 font-bold",
                isCurrent && "border-blue",
            )}
        >
            {circleColor && <div className="mr-1 size-2.5 rounded-full" style={{ backgroundColor: circleColor }} />}
            <span className="font-medium text-base group-hover:text-muted-foreground">{name}</span>
            <span className="text-muted-foreground text-sm group-hover:text-muted-foreground/50">({count})</span>
        </Link>
    );
}



