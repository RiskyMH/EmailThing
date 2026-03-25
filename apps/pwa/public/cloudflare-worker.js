// Creating `token` env var is in next step

export default {
    /**
     * The main email function:
     * @param {ForwardableEmailMessage} message
     * @param {{token: string, forward?: string}} env
     */
    async email(message, env, ctx) {
        if (!message.raw)
            throw new Error(
                "Raw email content not present.\n" +
                "Make sure this email was sent correctly (and not using the demo one)",
            );

        const raw = await new Response(message.raw).text()

        if (env.forward) await message.forward(env.forward);

        const req = await fetch("https://api.emailthing.app/api/v0/receive-email", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${env.token}`,
            },
            body: JSON.stringify({
                email: raw,
                from: message.from,
                to: message.to,
                // category_id: "<optional-category-id-here>"
            }),
        });

        if (!req.ok) {
            const error = await req.text();
            message.setReject(error);
            console.error(error);
        }
    },
};
