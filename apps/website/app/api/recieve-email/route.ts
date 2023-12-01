// @ts-ignore
import PostalMime from 'postal-mime';
type PostalMime = import("../../../../../node_modules/postal-mime/postal-mime").default;
import { prisma } from '@email/db';
import { env } from '@/app/utils/env';


export async function POST(request: Request) {
    const { searchParams } = new URL(request.url)
    const zone = searchParams.get('zone')

    const auth = request.headers.get("x-auth")
    if (auth !== env.EMAIL_AUTH_TOKEN) {
        return Response.json({ error: 'unauthorized' }, { status: 401 })
    }

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
                    domain: zone,
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
            snippet: body.slice(0, 100),
            mailbox: {
                connect: mailbox
            }
        },
        select: {
            id: true,
        }
    })

    // todo: attachments

    return Response.json({
        success: true,
        id: e.id,
    })
}