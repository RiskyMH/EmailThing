import { prisma } from "@email/db";


interface EmailListFindOptions {
    isBinned?: boolean;
    isSender?: boolean;
    categoryId?: string;
    isStarred?: boolean;
}

export async function getEmailList(mailboxId: string, options: EmailListFindOptions = {}) {

    const emails = prisma.email.findMany({
        where: {
            mailboxId: mailboxId,
            binnedAt: options.isBinned ? {
                not: null
            } : null,
            isStarred: options.isStarred === undefined ? undefined : options.isStarred,
            isSender: options.isSender ? true : false,
            category: options.categoryId ? {
                id: options.categoryId
            } : undefined
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
        }
    });

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