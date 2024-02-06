import { getCurrentUser } from "@/utils/jwt";
import prisma from "@/utils/prisma";


export async function GET() {
    const currentUser = await getCurrentUser()
    const user = await prisma.user.findUnique({
        where: {
            id: currentUser || ''
        },
        select: {
            admin: true,
            id: true
        }
    })
    console.log(user, currentUser)

    if (!user || !user.admin) {
        return new Response('Unauthorized', { status: 401 })
    }

    const invite = await prisma.inviteCode.create({
        data: {
            code: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            expiresAt: new Date(Date.now() + 86400000),
            createdBy: user.id
        }
    })

    return Response.json({
        ...invite,
        url: `https://emailthing.xyz/register?invite=${invite.code}`
    }, { status: 200 })
}