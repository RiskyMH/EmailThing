// @ts-ignore
import PostalMime from 'postal-mime';
type PostalMime = import("../../../node_modules/postal-mime/postal-mime").default;
import { prisma } from '@/utils/prisma';
import { env } from '@/utils/env';
import webpush from 'web-push';
import { storageLimit } from '@/utils/limits';

webpush.setVapidDetails(
    'mailto:test@example.com',
    env.NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY,
    env.WEB_NOTIFICATIONS_PRIVATE_KEY
)


export const revalidate = 0

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url)
    const zone = searchParams.get('zone')
    const auth = request.headers.get("x-auth")
    // if (auth !== env.EMAIL_AUTH_TOKEN) {
    //     return Response.json({ error: 'unauthorized' }, { status: 401 })
    // }

    const { email: rawEmail, from, to } = await request.json() as Record<string, string>
    if (!rawEmail || !from || !to) {
        return Response.json({ error: 'missing required fields' }, { status: 400 })
    }

    const parser = new PostalMime() as PostalMime
    const email = await parser.parse(rawEmail as string);

    // work out which mailbox to put it in
    let mailboxId: string | undefined = undefined

    // check if its a default domain first (and if so, check the alias and get the mailbox id)
    const defaultDomain = await prisma.mailboxDefaultDomain.findFirst({
        where: {
            domain: zone!,
            authKey: auth!,
        },
        select: {
            id: true,
        }
    });


    if (defaultDomain) {
        const alias = await prisma.mailboxAlias.findFirst({
            where: {
                alias: to
            },
            select: {
                mailboxId: true,
            }
        })

        if (alias) {
            mailboxId = alias.mailboxId
        }

    } else {
        // check if its a custom domain
        const customDomain = await prisma.mailboxCustomDomain.findFirst({
            where: {
                domain: zone!,
                authKey: auth!,
            },
            select: {
                mailboxId: true,
            }
        });

        if (customDomain) {
            mailboxId = customDomain.mailboxId
        }
    }

    if (!mailboxId) {
        return new Response('Mailbox not found', { status: 400 })
    }

    // get storage used and see if over limit
    const mailbox = await prisma.mailbox.findUnique({
        where: {
            id: mailboxId
        },
        select: {
            storageUsed: true,
            plan: true,
        }
    })

    const limit = storageLimit[mailbox!.plan as 'FREE' | 'UNLIMITED']
    if (mailbox!.storageUsed > limit) {
        // todo: send email to user to warn them about unreceived emails 
        // (and they can upgrade to pro to get more storage or delete some emails to free up space)
        return new Response('Mailbox over storage limit', { status: 400 })
    }

    const emailSize = new Blob([rawEmail]).size

    const body = email.text || email.html || email.attachments.map((a) => a.content).join('\n')

    const e = await prisma.email.create({
        data: {
            raw: rawEmail,
            from: {
                create: {
                    address: email.from.address,
                    name: email.from.name,
                }
            },
            recipients: {
                createMany: {
                    data: [
                        // @ts-expect-error i want the error here
                        ...email.to.map((to) => ({
                            address: to.address,
                            name: to.name,
                        })),
                        ...email.cc?.map((cc) => ({
                            address: cc.address,
                            name: cc.name,
                            cc: true
                        })) ?? [],
                    ]
                }
            },
            subject: email.subject,
            body: body,
            html: email.html,
            snippet: slice(body, 200),
            mailbox: {
                connect: { id: mailboxId }
            },
            replyTo: email.replyTo?.[0]?.address,
            size: emailSize,
        },
        select: {
            id: true,
        }
    })

    await prisma.mailbox.update({
        where: {
            id: mailboxId
        },
        data: {
            storageUsed: {
                increment: emailSize
            }
        }
    })

    // todo: attachments


    // send push notifications
    const notifications = await prisma.userNotification.findMany({
        where: {
            user: {
                mailboxes: {
                    some: {
                        mailboxId
                    }
                }
            }
        },
        select: {
            endpoint: true,
            p256dh: true,
            auth: true,
        }
    });

    await Promise.all(notifications.map(async (n) => {
        const payload = JSON.stringify({
            title: email.from.address,
            body: email.subject ? slice(email.subject, 200) : undefined,
            url: `/mail/${mailboxId}/${e.id}`,
        })

        try {
            await webpush.sendNotification({
                endpoint: n.endpoint,
                keys: {
                    p256dh: n.p256dh,
                    auth: n.auth,
                }
            }, payload)

        } catch (e: any) {
            // delete the notification if it's no longer valid
            if (e.statusCode === 410) {
                await prisma.userNotification.delete({
                    where: {
                        endpoint: n.endpoint,
                    }
                })
            } else {
                throw e
            }
        }
    }))


    return Response.json({
        success: true,
        id: e.id,
    })
}

function slice(text: string, length: number) {
    return text.slice(0, length) + (length < text.length ? '…' : '')
}