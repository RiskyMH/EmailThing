// Creating `token` env var is in next step

export default {
    /**
     * The main email function:
     * @param {ForwardableEmailMessage} message 
     * @param {{token: string, forward?: string}} env 
     */
    async email(message, env, ctx) {
        if (!message.raw) throw new Error(
            "Raw email content not present.\n" +
            "Make sure this email was sent correctly (and not using the demo one)"
        );
        const rawEmail = await streamToArrayBuffer(message.raw, message.rawSize);
        const raw = new TextDecoder("utf-8").decode(rawEmail);

        if (env.forward) await message.forward(env.forward);

        const req = await fetch("https://emailthing.app/api/v0/receive-email", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${env.token}`
            },
            body: JSON.stringify({
                email: raw,
                from: message.from,
                to: message.to,
            })
        });

        if (!req.ok) {
            const error = await req.text();
            message.setReject(error);
            console.error(error);
        }
    }
};


/**
 * 
 * @param {ReadableStream<any>} stream
 * @param {number} streamSize
 */
async function streamToArrayBuffer(stream, streamSize) {
    let result = new Uint8Array(streamSize);
    let bytesRead = 0;
    const reader = stream.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        result.set(value, bytesRead);
        bytesRead += value.length;
    }
    return result;
};

