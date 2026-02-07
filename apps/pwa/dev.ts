import { serve, type BunFile } from "bun";
// @ts-ignore - we are just getting the file's content, not the file itself
import service from "./public/service.js" with { type: "text" };
import app from "./src/app.html";
import docs from "./src/docs.html";
import home from "./src/home.html";
import notFound from "./src/404.html";

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
    // "/pwa": home,

    "/mail/*": app,
    "/mail": app,
    "/settings": app,
    "/settings/*": app,

    "/docs": docs,
    "/docs/*": docs,

    "/404": notFound,

    // public files
    ...publicFiles,
    "/service.js": new Response(service, { headers: { "Content-Type": "text/javascript" } }),
    "/*": new Response("404 :(", { status: 404 }),
  },
  development: {
    console: true,
    hmr: true,
  },
});

console.info(`🚀 Server running at ${server.url}`);
