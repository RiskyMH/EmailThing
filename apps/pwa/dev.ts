import { serve } from "bun";
import home from "./src/home.html";
import app from "./src/app.html";
import docs from "./src/docs.html";
import service from "./public/service.js" with { type: "text" };

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
    "/service.js": new Response(service, { headers: { "Content-Type": "text/javascript" } }),
  },
  development: {
    console: true,
    hmr: true,
  },
  fetch: () => new Response("404", { status: 404 })
});

console.log(`🚀 Server running at ${server.url}`);
