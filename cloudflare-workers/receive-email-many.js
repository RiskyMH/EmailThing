/* eslint-disable */

// This is an example worker for many mailboxes or domains


/**
 * 
 * @param {import("@cloudflare/workers-types").ReadableStream<any>} stream
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
}


export default {
    /**
     * 
     * @param {import("@cloudflare/workers-types").ForwardableEmailMessage} message 
     * @param {{auth1: string, auth2: string, forward?: string}} env 
     * @param {any} ctx 
     */
    async email(message, env, ctx) {

        const rawEmail = await streamToArrayBuffer(message.raw, message.rawSize);
        const raw = new TextDecoder("utf-8").decode(rawEmail);

        if (env.forward) await message.forward(env.forward);

        let auth = null;
        if (message.to === "me@domain1.com") {
            auth = env.auth1;
        } else if (message.to === "you@domain2.com") {
            auth = env.auth2;
        }

        const req = await fetch("https://emailthing.app/api/v0/receive-email", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${auth}`
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
