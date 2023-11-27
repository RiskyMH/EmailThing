/* eslint-disable */

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

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

        if (new URL(request.url).searchParams.get("auth") !== env['auth']) {
            return new Response("Unauthorised", { status: 401 })
        }

        const send_request = await fetch('https://api.mailchannels.net/tx/v1/send', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                ...request.headers
            },
            body: await request.text()
        });

        return new Response(JSON.stringify(await send_request.json()), { status: send_request.status });

    },
}
