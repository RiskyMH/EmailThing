import LoadMore from "@/components/loadmore.client";
import { Button } from "@/components/ui/button";
import { SmartDrawer, SmartDrawerContent, SmartDrawerTrigger } from "@/components/ui/smart-drawer";
import db, { Mailbox } from "@/db";
import { getCurrentUser } from "@/utils/jwt";
import { tempEmailsLimit } from "@/utils/limits";
import { formatTimeAgo } from "@/utils/tools";
import { cn } from "@/utils/tw";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { RefreshButton } from "../components.client";
import { mailboxCategories, userMailboxAccess } from "../tools";
import { EmailItem } from "./email-item";
import { CreateTempEmailForm } from "./temp/modal";
import { getDraftEmailList, getDraftJustEmailsList, getEmailList, getJustEmailsList, getTempAliases } from "./tools";

interface EmailListProps {
    mailboxId: string;
    type?: "inbox" | "sent" | "drafts" | "trash" | "starred" | "temp";
    categoryId?: string;
    initialTake?: string;
    search?: string;
}

export default async function EmailList({
    mailboxId,
    categoryId,
    type = "inbox",
    initialTake,
    search,
}: EmailListProps) {
    const baseUrl = `/mail/${mailboxId}${type === "inbox" ? "" : `/${type}`}`;

    const take = initialTake ? Number.parseInt(initialTake) : 25;
    const emailFetchOptions = {
        isBinned: type === "trash",
        isSender: type === "sent",
        isStarred: type === "starred" ? true : undefined,
        categoryId,
        take,
        search,
        selectCategories: !search && type !== "drafts",
        isTemp: type === "temp",
    };

    const [emails, categoryCounts, emailCount] =
        type !== "drafts"
            ? await getEmailList(mailboxId, emailFetchOptions)
            : await getDraftEmailList(mailboxId, emailFetchOptions);

    const categories =
        emailFetchOptions.selectCategories && (await (type === "temp" ? getTempAliases : mailboxCategories)(mailboxId));
    const mailboxPlan =
        type === "temp"
            ? await db.query.Mailbox.findFirst({
                  where: eq(Mailbox.id, mailboxId),
                  columns: {
                      plan: true,
                  },
              })
            : undefined;

    const nextEmail = emails.length === take + 1 ? emails.pop() : null;
    // biome-ignore lint/complexity/useOptionalChain: <explanation>
    const currentCategory = categories && categories?.find((c) => c.id === categoryId);

    async function fetchMoreEmails(curser?: {
        emailId: string;
        createdAt: Date;
    }) {
        "use server";
        const userId = await getCurrentUser();
        if (!userId) throw new Error();
        if (!(await userMailboxAccess(mailboxId, userId))) throw new Error();

        const emails =
            type !== "drafts"
                ? await getJustEmailsList(
                      mailboxId,
                      {
                          ...emailFetchOptions,
                          selectCategories: false,
                          take: 25,
                      },
                      curser,
                  )
                : await getDraftJustEmailsList(mailboxId, { take: 25, search }, curser);

        if (emails.length === 0) {
            console.error("No more emails");
            return [[], null] as [JSX.Element[], null];
        }

        const nextPageEmail = emails.length >= 26 ? emails.pop() : null;
        const categories = type === "temp" ? undefined : await mailboxCategories(mailboxId);

        return [
            emails.map((email) => (
                <EmailItem key={email.id} email={email} categories={categories} mailboxId={mailboxId} type={type} />
            )),
            nextPageEmail
                ? {
                      emailId: nextPageEmail.id,
                      createdAt: nextPageEmail.createdAt,
                  }
                : null,
        ] as const;
    }

    return (
        <>
            <div className="flex w-full min-w-0 flex-col gap-2 p-5 px-3 pt-0">
                <div className="overflow sticky top-0 z-10 flex h-12 w-full min-w-0 flex-row items-center justify-center gap-3 overflow-y-hidden border-b-2 bg-background px-2">
                    <input type="checkbox" disabled id="select" className="my-auto mr-2 size-4 shrink-0 self-start" />
                    <div className="flex h-6 w-full min-w-0 flex-row gap-6 overflow-y-hidden">
                        <CategoryItem
                            circleColor={null}
                            name={type === "drafts" ? "Drafts" : search ? "Search results" : "All"}
                            count={emailCount[0].count || 0}
                            link={baseUrl}
                            category={null}
                            isCurrent={!categoryId}
                        />
                        {(categories || []).map((category) => (
                            <CategoryItem
                                isCurrent={category.id === categoryId}
                                key={category.id}
                                circleColor={category.color || "grey"}
                                name={category.name}
                                count={categoryCounts?.find((c) => c.categoryId === category.id)?.count || 0}
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
                                        tempEmailsLimit[mailboxPlan?.plan ?? "FREE"]
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
                        <RefreshButton className="shrink-0" />
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
                {nextEmail ? (
                    <LoadMore
                        loadMoreAction={fetchMoreEmails}
                        startId={{
                            emailId: nextEmail.id,
                            createdAt: nextEmail.createdAt,
                        }}
                        refreshId={Date.now()}
                        initialLength={take}
                    >
                        {emails.map((email) => (
                            <EmailItem
                                key={email.id}
                                email={email}
                                categories={categories || undefined}
                                mailboxId={mailboxId}
                                type={type}
                            />
                        ))}
                    </LoadMore>
                ) : (
                    emails.map((email) => (
                        <EmailItem
                            key={email.id}
                            email={email}
                            categories={categories || undefined}
                            mailboxId={mailboxId}
                            type={type}
                        />
                    ))
                )}
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
