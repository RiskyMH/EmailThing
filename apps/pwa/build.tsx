#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { cp, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { build } from "bun";
import plugin from "bun-plugin-tailwind";
import { reactCompiler } from "./src/build-plugins/react-compiler";

// Helper function to format file sizes
const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

// Parse CLI arguments with our magical parser
const outdir = path.join(process.cwd(), "dist");

if (existsSync(outdir)) {
  console.info(`🗑️ Cleaning previous build at ${outdir}`);
  await rm(outdir, { recursive: true, force: true });
}

const start = performance.now();

// Scan for all HTML files in the project
const entrypoints = [...new Bun.Glob("src/*.html").scanSync(import.meta.dir)]
  .map((a) => path.resolve(import.meta.dir, a))
  .filter((dir) => !dir.includes("node_modules"));

// Build all the HTML files
const result = await build({
  entrypoints,
  outdir,
  plugins: [plugin, reactCompiler()],
  // packages: 'external',
  minify: true,
  target: "browser",
  sourcemap: "linked",
  splitting: true,
  env: "NEXT_PUBLIC_*",
  external: ["*.woff2", "*.woff", "*.ttf"],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  naming: {
    entry: "/[dir]/[name].[ext]",
    chunk: "/_bun/static/[dir]/[name].[hash].[ext]",
    asset: "/[dir]/[name].[hash].[ext]",
  },
});

await cp(path.join(import.meta.dir, "./public"), path.join(import.meta.dir, "./dist"), {
  recursive: true,
});
// await cp(path.join(require.resolve("@fontsource/inter"), "/../files"), path.join(import.meta.dir, "./dist/_bun/static/fonts"), { recursive: true })
const fontFiles = [
  "inter-cyrillic-ext-wght-normal.woff2",
  "inter-cyrillic-wght-normal.woff2",
  "inter-greek-ext-wght-normal.woff2",
  "inter-greek-wght-normal.woff2",
  "inter-vietnamese-wght-normal.woff2",
  "inter-latin-ext-wght-normal.woff2",
  "inter-latin-wght-normal.woff2",
];
await Promise.all(
  fontFiles.map(async (file) => {
    await cp(
      path.join(require.resolve("@fontsource-variable/inter"), `/../files/${file}`),
      path.join(import.meta.dir, `./dist/_bun/static/fonts/${file}`),
    );
  }),
);

const cssFile = await Bun.file(path.join(import.meta.dir, "./dist/app.html")).text();
const cssFilePath = cssFile.match(/(<link rel="stylesheet".*?_bun.*?>)/)?.[1]
  .replace('<link ', '<link fetchpriority="high" ');

for (const file of result.outputs) {
  if (file.path.endsWith(".css")) {
    const content = (await Bun.file(file.path).text())
      .replaceAll("./files/", "/_bun/static/fonts/")
      .replaceAll("@fontsource-variable/inter/files/", "/_bun/static/fonts/")
      .replaceAll("../public/", "/");
    await Bun.write(file.path, content);
  } else if (file.path.endsWith(".html")) {
    const content = (await Bun.file(file.path).text())
      .replace(/(<link rel="stylesheet".*?_bun.*?>)/, cssFilePath || "")
      .replaceAll("./_bun/", "/_bun/")
      .replaceAll("../public/", "/");
    await Bun.write(file.path, content);
  }
}

const publicFiles = [
  ...(await readdir(path.join(import.meta.dir, "./public"), { recursive: true })),
  // ...await readdir(require.resolve("@fontsource/inter") + "/../files", {recursive: true}),
];
// Print the results
const end = performance.now();

const outputTable = [
  ...result.outputs.map((output) => ({
    File: path.relative(process.cwd(), output.path),
    Type: output.kind,
    Size: formatFileSize(output.size),
  })),
  ...publicFiles.map((file) => ({
    File: path.relative(process.cwd(), file),
    Type: "public",
    Size: "",
  })),
];

if (cssFilePath) {
  const css = (await Bun.file(path.join(import.meta.dir, "./dist/app.html")).text()).match(
    /<link rel="stylesheet".*?href="(\/_bun\/static.*?\.css)"*?>/,
  )?.[1];

  await Bun.write(
    "./dist/_headers",
    (await Bun.file("./public/_headers").text()).replace(
      "# Link: </index.css>; ",
      `Link: <${css}>; `,
    ),
  );
}

console.table(outputTable);
const buildTime = (end - start).toFixed(2);

console.info(`\n✅ Build completed in ${buildTime}ms\n`);


// ------------
// ------------
// ------------
// ------------
// ------------
const start2 = performance.now();

import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouterProvider, createStaticHandler, createStaticRouter } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import type _routes from "./src/routes.js";
const routes = (await import("./src/routes.js")).default as typeof _routes;

const replace = "<!-- Root code -->";

const [appHtml, docsHtml, homeHtml] = await Promise.all([
  Bun.file("./dist/app.html").text(),
  Bun.file("./dist/docs.html").text(),
  Bun.file("./dist/home.html").text(),
]);

const templates = {
  "app.html": appHtml,
  "docs.html": docsHtml,
  "home.html": homeHtml,
} as Record<string, string>;

// Precompute modulepreload links per base template (handles static & side-effect imports only; excludes dynamic imports)
async function computeModulePreloadsForHtml(html: string): Promise<string> {
  const jsImportMatch = html.match(/<script[^>]*src="([^"]*\/_bun\/static\/[^"]*\.js)"[^>]*>/);
  if (!jsImportMatch) return "";

  const mainJsPath = jsImportMatch[1];
  const entryPath = path.join(outdir, mainJsPath.replace('/_bun/static/', '_bun/static/'));
  if (!existsSync(entryPath)) return "";

  const content = await Bun.file(entryPath).text();
  const collected = new Set<string>();
  for (const m of content.matchAll(/import\s*[^'"\n]*?from\s*["']\.\/([^"']+\.js)["']/g)) {
    collected.add(m[1]);
  }
  for (const m of content.matchAll(/import\s*["']\.\/([^"']+\.js)["']/g)) {
    collected.add(m[1]);
  }
  if (collected.size === 0) return "";

  return Array.from(collected).map((rel) => `<link rel=\"modulepreload\" crossorigin href=\"/_bun/static/${rel}\" fetchpriority="medium">`).join("");
}

for (const [name, html] of Object.entries(templates)) {
  const links = await computeModulePreloadsForHtml(html);
  if (links) {
    const updated = html.replace('</head>', `${links}</head>`);
    templates[name] = updated;
    await Bun.write(`./dist/${name}`, updated);
  }
}

const { query, dataRoutes } = createStaticHandler(routes);

async function processRoute(route: RouteObject & { preferTemplate?: string }) {
  if (!route.path || route.path.includes("*")) return;

  const path = route.path.replaceAll(/:(\w*)/g, "[$1]");

  const context = await query(new Request(`http://localhost${path}`));

  if (context instanceof Response) {
    return;
  }

  const meta = `
  <title>${route.meta?.title || "EmailThing"}</title>
  <meta name="description" content="${route.meta?.description || "A modern email client designed for simplicity and the web."}">
  <meta name="title" content="${route.meta?.title || "EmailThing"}">
  <meta property="og:title" content="${route.meta?.ogTitle || route.meta?.title || "EmailThing"}">
  <meta property="og:description" content="${route.meta?.description || "A modern email client designed for simplicity and the web."}">
  <meta property="og:image" content="https://emailthing.app/logo.png">
  ${route.meta?.canonical ? `<meta property="og:url" content="${route.meta?.canonical}">` : `<meta property="og:url" content="https://emailthing.app${path}">`}
  <meta property="og:type" content="website">
  <!-- <meta property="og:site_name" content="EmailThing"> -->
  ${route.meta?.siteName ? `<meta property="og:site_name" content="${route.meta?.siteName}">` : ""}
  <meta property="og:locale" content="en_US">
  ${route.meta?.canonical ? `<meta name="canonical" content="${route.meta?.canonical}">` : ""}
  <meta name="robots" content="${route.meta?.noIndex ? "noindex" : "index"}">
  <meta name="theme-color" content="#17171E">
  <meta name="theme-color" content="#17171E" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#292932" media="(prefers-color-scheme: discord)">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="author" href="https://riskymh.dev">
  <meta name="author" content="RiskyMH">
  <meta name="creator" content="RiskyMH">
  <meta name="generator" content="Bun ${Bun.version}">
  <meta name="keywords" content="email,email client,open source,email thing,riskymh">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${route.meta?.ogTitle || route.meta?.title || "EmailThing"}">
  <meta name="twitter:description" content="${route.meta?.description || "A modern email client designed for simplicity and the web."}">
  <meta name="twitter:image" content="https://emailthing.app/logo.png">
  <meta name="twitter:url" content="${route.meta?.canonical || `https://emailthing.app${path}`}">
  <meta name="twitter:site" content="@EmailThing_">
  <meta name="twitter:creator" content="@EmailThing_">
  <link rel="apple-touch-icon" type="image/png" href="/logo.png" sizes="256x256" />
  <link rel="apple-touch-icon" type="image/svg+xml" href="/logo.svg" sizes="any" />
  <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" sizes="256x256" />
  <link rel="shortcut icon" type="image/png" href="/icon.png" sizes="256x256" />
  <link rel="shortcut icon" type="image/svg+xml" href="/icon.svg" sizes="any" />
  <link rel="mask-icon" href="/icon.svg" color="#292932" sizes="any">
  <link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="256x256" />
  <link rel="icon" type="image/png" href="/icon.png" sizes="256x256" />
  <link rel="icon" type="image/svg+xml" href="/icon.svg" sizes="any" />
  `.replaceAll(/(\n|\s{2,})+/gm, '');

  const router = createStaticRouter(dataRoutes, context);
  // const newHtml =
  const prerendered = renderToStaticMarkup(
    <StaticRouterProvider router={router} context={context} />,
  );

  let _html = templates[route.preferTemplate || "app.html"]
    .replaceAll(/(\s{2,}|\n+)/gm, "")
    // .replaceAll(/\n+/gm, '')
    .replace(replace, prerendered)
    // .replaceAll(/(\s{2,}|\n+)/gm, "")
    .replace(/<!-- META -->.*?<!-- \/META -->/gm, meta)
    .replace(/<script>window\.__staticRouterHydrationData.*\);<\/script>/gm, "");

  // Preloads are already baked into the template


  await Bun.write(`./dist/${path === "/" ? "index" : path}.html`, _html);
  // await Bun.write(`./dist/${path}/index.html`, _html)
}

const promises = [];
for (const route of routes) {
  if (route.children) {
    for (const child of route.children) {
      promises.push(processRoute({ preferTemplate: route.preferTemplate, ...child }));
    }
  } else {
    promises.push(processRoute(route));
  }
}

await Promise.all(promises);

const buildTime2 = (performance.now() - start2).toFixed(2);

console.info(`\n✅ Prerender completed in ${buildTime2}ms\n`);





// Generate list of static assets to cache
const generateServiceWorkerAssets = async () => {
  const staticAssets = new Set<string>();

  // Add known static assets
  staticAssets.add("/offline");
  // staticAssets.add('/index.css');
  staticAssets.add("/logo.svg");
  staticAssets.add("/icon.svg");
  staticAssets.add("/service.js");
  staticAssets.add("/manifest.webmanifest");

  // Add static files from bun build
  for (const file of result.outputs) {
    const relative = path.relative(`${import.meta.dir}/dist`, file.path).replaceAll("\\", "/");
    if (relative.startsWith("../")) continue;
    staticAssets.add(`/${relative}`);
  }

  // Update service worker with asset list
  const serviceWorkerPath = path.join(outdir, "service.js");
  let serviceWorkerContent = await Bun.file(serviceWorkerPath).text();

  const assetsArray = JSON.stringify([...staticAssets], null, 2);
  serviceWorkerContent = serviceWorkerContent.replace(
    /const\s+STATIC_ASSETS\s*=\s*\[(\n|\r|.)*?\];/m,
    `const STATIC_ASSETS = ${assetsArray};`,
  );

  const gitsha = await Bun.$`git rev-parse HEAD`.text();
  serviceWorkerContent = serviceWorkerContent.replace(
    "const CACHE_NAME = \"emailthing-offline-v1\";",
    `const CACHE_NAME = "emailthing-${gitsha.trim()}";`,
  );

  await Bun.write(serviceWorkerPath, serviceWorkerContent);
  await Bun.write("./dist/health.txt", gitsha.trim())

  console.info('\n📦 Generated service worker asset list with', staticAssets.size, 'files');
};

// Add to build process
await generateServiceWorkerAssets();
