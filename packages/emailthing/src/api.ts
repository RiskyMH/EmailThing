import type { EmailSendOptions, EmailSendResponse, ReceiveEmailPostOptions, ReceiveEmailResponse, WhoamiResponse } from "./types";

/**
 * **EmailThing API**
 *
 * Raw api docs: https://emailthing.app/docs/api
 */
export default class EmailThing {
    constructor(token: string) {
        if (!token) throw new Error("No EmailThing token provided.");
        this.token = token;
    }

    baseURL = "https://api.emailthing.app/api/v0";
    token: string;

    private async fetch(
        pathname: string,
        method: "GET" | "POST" | "PATCH",
        json?: Record<string, any>,
        retryAmount = 10,
    ): Promise<Response> {
        const res = await fetch(`${this.baseURL}${pathname}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                authorization: `Bearer ${this.token}`,
            },
            body: json ? JSON.stringify(json) : undefined,
        });

        if (!res.ok) {
            // if rate limited, retry based on Retry-After header
            if (res.status === 429) {
                const retryAfter = Number(res.headers.get("Retry-After"));
                if (retryAfter) {
                    await new Promise((r) => setTimeout(r, retryAfter));
                    return this.fetch(pathname, method, json, retryAmount - 1);
                }
            } else if (res.status === 401) {
                throw new Error("Unauthorized. Check your token.");
            } else if (res.status === 404) {
                throw new Error(`Route not found: ${pathname}`);
            } else if (res.status === 400) {
                throw new Error(`EmailThing API Error 400: ${await res.text() || "Bad request. Check your request body."}`);
            }
            throw new Error((await res.text()) || "An error occurred while using the EmailThing API.");
        }

        return res;
    }

    /**
     * Send an email with the EmailThing api.
     * @throws on error
     */
    async send(options: EmailSendOptions): Promise<EmailSendResponse> {
        const res = await this.fetch("/send", "POST", options);
        return res.json();
    }

    /**
     * Receive an email with the EmailThing api.
     * (adds email to your mailbox)
     * @throws on error
     */
    async receiveEmail(options: ReceiveEmailPostOptions): Promise<ReceiveEmailResponse> {
        const res = await this.fetch("/receive-email", "POST", options);
        return res.json();
    }

    /**
     * Get the token info.
     * @throws on error
     */
    async whoami(): Promise<WhoamiResponse> {
        const res = await this.fetch("/whoami", "GET");
        return res.json();
    }
}

export { EmailThing };
