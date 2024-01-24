import { prisma } from "@email/db";

export interface EmailListFindOptions {
    isBinned?: boolean;
    isSender?: boolean;
    categoryId?: string;
    isStarred?: boolean;
}

export async function getJustEmailsList(mailboxId: string, options: EmailListFindOptions = {}, startEmailId?: string) {
    return prisma.email.findMany({
        where: {
            mailboxId: mailboxId,
            binnedAt: options.isBinned ? {
                not: null
            } : null,
            isStarred: options.isStarred === undefined ? undefined : options.isStarred,
            isSender: options.isSender ? true : false,
            category: options.categoryId ? {
                id: options.categoryId
            } : undefined,
        },
        select: {
            id: true,
            snippet: true,
            subject: true,
            body: true,
            createdAt: true,
            isRead: true,
            isStarred: true,
            raw: true,
            binnedAt: true,
            category: {
                select: {
                    name: true,
                    id: true,
                    color: true
                }
            },
            from: {
                select: {
                    name: true,
                    address: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 11,
        cursor: startEmailId ? {
            id: startEmailId
        } : undefined
    });
}

export async function getEmailList(mailboxId: string, options: EmailListFindOptions = {}) {
    const emails = getJustEmailsList(mailboxId, options)

    const categories = prisma.mailboxCategory.findMany({
        where: {
            mailboxId: mailboxId,
        },
        select: {
            id: true,
            name: true,
            color: true,
            _count: {
                select: {
                    emails: {
                        where: {
                            mailboxId: mailboxId,
                            binnedAt: options.isBinned ? {
                                not: null
                            } : null,
                            isSender: options.isSender ? true : false,
                            isStarred: options.isStarred === undefined ? undefined : options.isStarred,

                        }
                    }
                }
            }
        }
    });

    const allCount = prisma.email.count({
        where: {
            mailboxId: mailboxId,
            binnedAt: options.isBinned ? {
                not: null
            } : null,
            isSender: options.isSender ? true : false,
            isStarred: options.isStarred === undefined ? undefined : options.isStarred,
        }
    })

    return Promise.all([emails, categories, allCount])
}

export async function getDraftJustEmailsList(mailboxId: string, nextEmailId?: string) {
    const emails = await prisma.draftEmail.findMany({
        where: {
            mailboxId: mailboxId,
        },
        select: {
            id: true,
            subject: true,
            body: true,
            updatedAt: true,
            from: true,
        },
        orderBy: {
            updatedAt: "desc"
        },
        take: 11,
        cursor: nextEmailId ? {
            id: nextEmailId
        } : undefined
    });

    const emailsFormatted = emails.map(email => ({
        ...email,
        snippet: email.body,
        createdAt: email.updatedAt,
        isStarred: null,
        isRead: true,
        from: {
            address: email.from!,
            name: null
        },
        draft: true,
        binnedAt: null,
        category: null as any as { name: string, color?: string, id: string } | null
    }))

    return emailsFormatted;
}

export async function getDraftEmailList(mailboxId: string) {
    const emails = getDraftJustEmailsList(mailboxId);

    const allCount = prisma.draftEmail.count({
        where: {
            mailboxId: mailboxId,
        }
    })

    return Promise.all([emails, null, allCount])
}
