import { getTokenMailbox } from "../tools";

export const revalidate = 0;

export async function GET(request: Request) {
    const mailboxId = await getTokenMailbox();
    if (!mailboxId) {
        return new Response('Unauthorized', { status: 401 });
    }

    return Response.json({ mailboxId });
}