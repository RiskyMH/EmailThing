// @ts-ignore
import PostalMime from 'postal-mime';
type PostalMime = import("../../../../../node_modules/postal-mime/postal-mime").default;
import { prisma } from '@email/db';
import { env } from '@/app/utils/env';
import webpush from 'web-push';

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
    const mailbox = await prisma.mailbox.findFirst({
        where: {
            OR: [
                {
                    aliases: {
                        some: {
                            alias: to,
                        }
                    },

                },
                {
                    mailboxCustomDomains: {
                        some: {
                            domain: zone!,
                            authKey: auth!,
                        }
                    },
                }
            ]
        },
        select: {
            id: true,
        }
    })

    if (!mailbox) {
        return Response.json({ error: 'mailbox not found' }, { status: 400 })
    }

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
                connect: mailbox
            }
        },
        select: {
            id: true,
        }
    })

    // todo: attachments


    // send push notifications
    const notifications = await prisma.mailboxNotification.findMany({
        where: {
            mailboxId: mailbox.id,
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
            url: `/mail/${mailbox.id}/${e.id}`,
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
                await prisma.mailboxNotification.delete({
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