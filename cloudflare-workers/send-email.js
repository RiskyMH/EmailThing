/* eslint-disable */

export default {
    /**
     * 
     * @param {Request} request 
     * @param {{auth: string}} env 
     * @param {import("@cloudflare/workers-types").ExecutionContext} ctx 
     * @returns {Promise<Response>}
     */
    async fetch(request, env, ctx) {
        if (request.method !== 'POST') {
            return new Response("POST required", { status: 400 })
        }
        const authToken = request.headers.get("x-auth") || new URL(request.url).searchParams.get("auth")
        if (authToken !== env.auth) {
            return new Response("Unauthorised", { status: 401 })
        }

        const proxiedReq = await fetch('https://api.mailchannels.net/tx/v1/send', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                ...request.headers
            },
            body: request.body
        });

        return proxiedReq;

    },
}
