import { serve } from "bun";
import home from "./src/home.html";
import app from "./src/app.html";
import docs from "./src/docs.html";

const server = serve({
  routes: {
    "/": home,
    "/home": home,
    "/pricing": home,

    "/mail/:a": app,

    "/docs": docs,
    "/docs/:a": docs,
  },
    development: true,
    fetch: () => new Response("404", {status: 404})
  });

  console.log(`🚀 Server running at ${server.url}`);
