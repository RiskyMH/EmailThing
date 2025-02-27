import { serve } from "bun";
import home from "./src/home.html";
import app from "./src/app.html";
import docs from "./src/docs.html";

const server = serve({
  routes: {
    "/": home,
    "/home": home,
    "/pricing": home,
    "/login": home,
    "/register": home,

    "/mail/*": app,

    "/docs": docs,
    "/docs/*": docs,
  },
    development: true,
    fetch: () => new Response("404", {status: 404})
  });

  console.log(`🚀 Server running at ${server.url}`);
