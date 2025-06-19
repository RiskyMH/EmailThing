// todo: prob hard code the imports so its faster to load lol


// const routes = {} as Record<string, any>
// for await (const route of new Bun.Glob("**/route.ts").scan(`${import.meta.dir}/routes`)) {
//     const imp = await import(`./routes/${route}`);
//     const routeName = `/api/${route.replace(/\/route\.ts$/, "")}`;
//     routes[routeName] = "default" in imp ? imp.default : imp;
// }

const routes = {} as Record<string, any>
for await (const route of new Bun.Glob("**/route.ts").scan({ cwd: `${import.meta.dir}/../../web/app/api`, absolute: true })) {
    const imp = await import(route);
    const routeName = route
        .replace(/^.*?\/app\/api/, "/api")
        .replace(/\/route\.ts$/, "");

    routes[routeName] = "default" in imp ? imp.default : imp;
}

const server = Bun.serve({
    idleTimeout: 60 * 2,
    port: process.env.PORT || 3000,
    routes,
});

console.log(`Server is running on ${server.url}`);