interface SendEmailRequest {
    from: string;
    to: string | string[];
    subject: string;
    bcc?: string | string[];
    cc?: string | string[];
    reply_to?: string | string[];
    html?: string;
    text?: string;
    react?: React.ReactNode;
    headers?: Record<string, string>;
    scheduledAt?: string;
    topicId?: string;
    attachments?: {
        content?: Buffer | string;
        filename?: string;
        path?: string;
        content_type?: string;
        content_id?: string;
    }[];
    tags?: {
        name: string;
        value: string;
    }[];
    template?: {
        id: string;
        variables?: Record<string, string>;
    };
}

interface SendEmailResponse {
    id: string;
}

export async function sendResendEmail(data: SendEmailRequest, key: string, url = "https://api.resend.com"): Promise<{ success: SendEmailResponse } | { error: string }> {
    const res = await fetch(`${url}/emails`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
            "user-agent": "EmailThing (https://emailthing.app)",
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorData = await res.json();
        return { error: `${res.status} - ${errorData.message}` };
    }

    const responseData = await res.json();
    return { success: responseData as any };
}
