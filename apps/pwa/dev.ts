import { serve, type BunFile } from "bun";
import service from "./public/service.js" with { type: "text" };
import app from "./src/app.html";
import docs from "./src/docs.html";
import home from "./src/home.html";

const publicFiles: Record<string, BunFile> = {};
for await (const file of new Bun.Glob("**").scan({ cwd: "./public" })) {
  publicFiles[`/${file}`] = Bun.file(`./public/${file}`);
}

const server = serve({
  routes: {
    "/": home,
    "/home": home,
    "/pricing": home,
    "/login": home,
    "/register": home,

    "/mail/*": app,
    "/mail": app,
    "/settings": app,
    "/settings/*": app,

    "/docs": docs,
    "/docs/*": docs,

    // public files
    ...publicFiles,
    "/service.js": new Response(service, { headers: { "Content-Type": "text/javascript" } }),
  },
  development: {
    console: true,
    hmr: true,
  },
  fetch: () => new Response("404", { status: 404 }),
});

console.info(`🚀 Server running at ${server.url}`);
