import { POST as postReceiveEmail } from "../route";


export async function POST(request: Bun.BunRequest) {
    const event = await request.json() as {
        type: 'email.received';
        data: {
            email_id: string;
        };
    };
    const params = new URL(request.url).searchParams;
    const emailthingKey = params.get("emailthing_key");
    const resendKey = params.get("resend_key");
    const categoryId = params.get("category_id");

    if (event.type === 'email.received') {
        const res = await fetch(`https://api.resend.com/emails/receiving/${event.data.email_id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendKey}`,
                "user-agent": "EmailThing (https://emailthing.app)",
            },
        });

        if (!res.ok) {
            const errorData = await res.json();
            return new Response(`Failed to fetch email data: ${res.status} - ${errorData.message}`, { status: 500 });
        }

        const emailData = await res.json() as {
            from: string;
            to: string[];
            raw: {
                download_url: string;
            };
        };

        const rawReq = await fetch(emailData.raw.download_url)

        if (!rawReq.ok) {
            return new Response(`Failed to download raw email: ${rawReq.status} - ${await rawReq.text()}`, { status: 500 });
        }

        const rawEmail = await rawReq.text();

        const newRequest = new Request(`https://api.emailthing.app/v0/receive-email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${emailthingKey}`,
                ...request.headers,
            },
            body: JSON.stringify({
                raw: rawEmail,
                from: emailData.from,
                to: emailData.to[0],
                category_id: categoryId,
            }),
        });

        return await postReceiveEmail(newRequest);
    }

    return new Response("Unknown event type")
}
