// todo: prob hard code the imports so its faster to load lol


// const routes = {} as Record<string, any>
// for await (const route of new Bun.Glob("**/route.ts").scan(`${import.meta.dir}/routes`)) {
//     const imp = await import(`./routes/${route}`);
//     const routeName = `/api/${route.replace(/\/route\.ts$/, "")}`;
//     routes[routeName] = "default" in imp ? imp.default : imp;
// }

import routes from "./routes.ts";
import db from "@emailthing/db/connect";
import { sql } from "drizzle-orm";

const httpExports = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "HEAD",
    "OPTIONS",
]

const server = Bun.serve({
    idleTimeout: 60 * 2,
    port: process.env.PORT || 3000,
    routes: {
        // "/": Response.redirect("https://emailthing.app/docs/api"),
        "/": Response.redirect("/sitemap.json", 307),
        "/internal/*": (req) => {
            const url = new URL(req.url);
            url.pathname = `/api/internal/${url.pathname.slice(1)}`;
            Response.redirect(url.pathname, 308);
        },
        "/v0/*": (req) => {
            const url = new URL(req.url);
            url.pathname = `/api/v0/${url.pathname.slice(1)}`;
            Response.redirect(url.pathname, 308);
        },
        "/alive": () => new Response("OK"),
        "/sitemap.json": () => Response.json(
            Object.entries(routes).flatMap(([route, handlers]) =>
                Object.keys(handlers)
                    .filter(key => httpExports.includes(key))
                    .map(method => `${method.padEnd(8)} ${route}`)
            )
        ),
        // old routes that had misspellings
        "/recieve-email": Response.redirect("/api/v0/receive-email", 308),
        "/api/recieve-email": Response.redirect("/api/v0/receive-email", 308),
        ...routes,
    },
    fetch(req, server) {
        // fallback 404
        const { pathname } = new URL(req.url);
        return new Response(
            JSON.stringify({ error: "Not Found", path: pathname }, null, 2),
            { status: 404, headers: { "Content-Type": "application/json" } }
        );
    }
});

console.log(`Server is running on ${server.url}api/v0`);

await db.execute(sql`SELECT 1`);
