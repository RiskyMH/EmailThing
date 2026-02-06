import type { BunFile } from "bun";
import { watch } from "node:fs";

const DIST_PATH = process.env.DIST_PATH || `${import.meta.dir}/dist`;

const files = new Bun.Glob("**/*").scan({ cwd: DIST_PATH });

async function getRoutes() {
  const routes: Record<string, Response | BunFile> = {};
  for await (const filename of files) {
    try {
      const path = filename.replace(/\[([^\]]+)\]/g, ":$1").replace(/\\/g, "/");
      const file = Bun.file(`${DIST_PATH}/${filename}`);
      routes[`/${path}`] = file;
      if (path.endsWith(".html")) {
        routes[`/${path.replace(".html", "")}`] = file;
        if (path.endsWith("index.html")) {
          routes[`/${path.replace("index.html", "")}`] = file;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
  const redirects = await Bun.file(`${DIST_PATH}/_redirects`).text();
  for (const redirect of redirects.split("\n")) {
    if (redirect.startsWith("#")) continue;
    const [from, to, status] = redirect.split(" ");
    if (status === "200") continue;
    routes[from] = Response.redirect(to, Number(status) || 301);
  }
  return routes;
}

const server = Bun.serve({
  routes: await getRoutes(),
});
console.info(`Server is running on ${server.url}`);

watch(`${DIST_PATH}`, {}, async () => {
  // server.reload({
  //     routes: await getRoutes(),
  //     fetch(request) {
  //         return new Response("404", { status: 404 })
  //     }
  // })
  // console.log(`Server is running on ${server.url} (reloaded)`);
  console.info("may want to reload (dist changed)")
})

watch(`${DIST_PATH}`, {}, async () => { });
