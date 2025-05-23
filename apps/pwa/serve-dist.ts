import { watch } from "node:fs";

const files = new Bun.Glob("**/*").scan({ cwd: "./dist" });

async function getRoutes() {
  const routes: Record<string, Response> = {};
  for await (const filename of files) {
    try {
      const path = filename.replace(/\[([^\]]+)\]/g, ":$1").replace(/\\/g, "/");
      const file = Bun.file(`./dist/${filename}`);
      const res = new Response(await file.arrayBuffer(), {
        headers: {
          "Content-Type": file.type,
        },
      });
      routes[`/${path}`] = res;
      if (path.endsWith(".html")) {
        routes[`/${path.replace(".html", "")}`] = res;
        if (path.endsWith("index.html")) {
          routes[`/${path.replace("index.html", "")}`] = res;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
  return routes;
}

const server = Bun.serve({
  routes: await getRoutes(),
});
console.info(`Server is running on ${server.url}`);

watch("./dist", {}, async () => {
    // server.reload({
    //     routes: await getRoutes(),
    //     fetch(request) {
    //         return new Response("404", { status: 404 })
    //     }
    // })
    // console.log(`Server is running on ${server.url} (reloaded)`);
    console.info("may want to reload (dist changed)")
})

watch("./dist", {}, async () => {});
