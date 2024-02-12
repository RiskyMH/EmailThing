/* eslint-disable */

//Adjust to your usecase
const zone = "your-domain.xyz"

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
     * @param {{auth: string, forward: string}} env 
     * Add the auth value provided in the emailthing dashboard  to the cloudflare worker env.
     * 
     * Go to worker > your email worker > settings > variables > add new variable `auth`
     * @param {any} ctx 
     */
    async email(message, env, ctx) {

        const rawEmail = await streamToArrayBuffer(message.raw, message.rawSize);
        const raw = new TextDecoder("utf-8").decode(rawEmail);

        if (env.forward) await message.forward(env.forward);

        const req = await fetch(`https://emailthing.xyz/api/recieve-email?zone=${zone}`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-auth": env.auth
            },
            body: JSON.stringify({
                email: raw,
                from: message.from,
                to: message.to,
            })
        });

        if (!req.ok) {
            const error = await req.text()
            message.setReject(error);
            console.error(error);
        }
    }
};
