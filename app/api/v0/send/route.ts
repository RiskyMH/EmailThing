import { getTokenMailbox } from "../tools"

export const revalidate = 0

export async function POST(request: Request) {
    const mailboxId = await getTokenMailbox()
    if (!mailboxId) return new Response('Unauthorized', { status: 401 })

    return new Response('Not implemented', { status: 501 })
}