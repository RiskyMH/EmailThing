import { getTokenMailbox } from "../tools";

export async function GET(request: Request) {
    const mailboxId = await getTokenMailbox(request.headers);
    if (!mailboxId) {
        return new Response("Unauthorized", { status: 401 });
    }

    return Response.json({ mailboxId });
}
