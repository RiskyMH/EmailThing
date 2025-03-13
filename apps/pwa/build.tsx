#!/usr/bin/env bun
import { build, type BuildConfig } from "bun";
import plugin from "bun-plugin-tailwind";
import { existsSync } from "fs";
import { rm, cp, readdir, writeFile } from "fs/promises";
import path from "path";

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

console.log("\n🚀 Starting build process...\n");

// Parse CLI arguments with our magical parser
const outdir = path.join(process.cwd(), "dist");

if (existsSync(outdir)) {
  console.log(`🗑️ Cleaning previous build at ${outdir}`);
  await rm(outdir, { recursive: true, force: true });
}

const start = performance.now();

// Scan for all HTML files in the project
const entrypoints = [...new Bun.Glob("src/*.html").scanSync(import.meta.dir)]
  .map(a => path.resolve(import.meta.dir, a))
  .filter(dir => !dir.includes("node_modules"));
console.log(`📄 Found ${entrypoints.length} HTML ${entrypoints.length === 1 ? "file" : "files"} to process\n`);

// Build all the HTML files
const result = await build({
  entrypoints,
  outdir,
  plugins: [plugin],
  // packages: 'external',
  minify: true,
  target: "browser",
  sourcemap: "linked",
  splitting: true,
  external: [
    "*.woff2",
    "*.woff",
    "*.ttf",
  ],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  naming: {
    entry: "/[dir]/[name].[ext]",
    chunk: "/_bun/static/[dir]/[name].[hash].[ext]",
    asset: "/[dir]/[name].[hash].[ext]",
  }
});

await cp(path.join(import.meta.dir, "../web/public"), path.join(import.meta.dir, "./dist"), { recursive: true })
await cp(path.join(import.meta.dir, "./public"), path.join(import.meta.dir, "./dist"), { recursive: true })
await cp(path.join(require.resolve("@fontsource/inter"), "/../files"), path.join(import.meta.dir, "./dist/_bun/static/fonts"), { recursive: true })

for (const file of result.outputs) {
  if (file.path.endsWith(".css")) {
    const content = (await Bun.file(file.path).text())
      .replaceAll("./files/", "/_bun/static/fonts/")
      .replaceAll("../public/", "/")
    await Bun.write(file.path, content)
  }

  else if (file.path.endsWith(".html")) {
    const content = (await Bun.file(file.path).text())
      .replaceAll("./_bun/", "/_bun/")
      .replaceAll("../public/", "/")
    await Bun.write(file.path, content)
  }
}

const publicFiles = [
  ...await readdir(path.join(import.meta.dir, "./public"), { recursive: true }),
  ...await readdir(path.join(import.meta.dir, "../web/public"), { recursive: true }),
  // ...await readdir(require.resolve("@fontsource/inter") + "/../files", {recursive: true}),
]
// Print the results
const end = performance.now();

const outputTable = [
  ...result.outputs.map(output => ({
    "File": path.relative(process.cwd(), output.path),
    "Type": output.kind,
    "Size": formatFileSize(output.size),
  })),
  ...publicFiles.map(file => ({
    "File": path.relative(process.cwd(), file),
    "Type": "public",
    "Size": ""
  }))
]

console.table(outputTable);
const buildTime = (end - start).toFixed(2);

console.log(`\n✅ Build completed in ${buildTime}ms\n`);


// ------------
// ------------
// ------------
// ------------
// ------------
const start2 = performance.now();

import { renderToStaticMarkup } from "react-dom/server";
import type _routes from "./src/routes.js";
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from "react-router-dom";

const routes = (await import("./src/routes.js")).default as typeof _routes;


const replace = "<!-- Root code -->"

const [appHtml, docsHtml, homeHtml] = await Promise.all([
  Bun.file("./dist/app.html").text(),
  Bun.file("./dist/docs.html").text(),
  Bun.file("./dist/home.html").text(),
])

const templates = {
  "app.html": appHtml,
  "docs.html": docsHtml,
  "home.html": homeHtml,
}


const { query, dataRoutes } = createStaticHandler(routes);

for (const route of routes) {
  if (route.path === "*") continue;

  const path = route.path
    .replaceAll(/:(\w*)/g, '[$1]')

  const context = await query(new Request(`http://localhost${path}`));

  if (context instanceof Response) {
    continue;
  }


  const router = createStaticRouter(dataRoutes, context);
  // const newHtml =
  const prerendered = renderToStaticMarkup(
    <StaticRouterProvider
      router={router}
      context={context}
    />
  )

  const _html = templates[route.preferTemplate || "app.html"]
    .replaceAll(/(\s{2,}|\n+)/gm, '')
    // .replaceAll(/\n+/gm, '')
    .replace(replace, prerendered)
    .replace(/<script>window\.__staticRouterHydrationData.*\);<\/script>/gm, '')

  await Bun.write(`./dist/${path === "/" ? "index" : path}.html`, _html)
  // await Bun.write(`./dist/${path}/index.html`, _html)

}

const buildTime2 = (performance.now() - start2).toFixed(2);

console.log(`\n✅ Prerender completed in ${buildTime2}ms\n`);





// Generate list of static assets to cache
const generateServiceWorkerAssets = async () => {
  const staticAssets = new Set<string>();

  // Add known static assets
  staticAssets.add('/offline');
  // staticAssets.add('/index.css');
  staticAssets.add('/logo.svg');
  staticAssets.add('/service.js');
  staticAssets.add('/manifest.webmanifest');

  // Add font files
  const distFiles = await readdir(path.join(import.meta.dir, "./dist/_bun"), { recursive: true });
  for (const file of distFiles) {
    staticAssets.add(`/_bun/${file.replace(/\\/g, '/')}`);
  }

  // Update service worker with asset list
  const serviceWorkerPath = path.join(outdir, 'service.js');
  let serviceWorkerContent = await Bun.file(serviceWorkerPath).text();

  const assetsArray = JSON.stringify([...staticAssets], null, 2);
  serviceWorkerContent = serviceWorkerContent.replace(
    /const\s+STATIC_ASSETS\s*=\s*\[(\n|.)*?\]/m,
    `const STATIC_ASSETS = ${assetsArray}`
  );

  const gitsha = await Bun.$`git rev-parse HEAD`.text()
  serviceWorkerContent = serviceWorkerContent.replace(
    "const CACHE_NAME = 'emailthing-offline-v1';",
    `const CACHE_NAME = 'emailthing-${gitsha.trim()}';`
  );

  await Bun.write(serviceWorkerPath, serviceWorkerContent);

  console.log('\n📦 Generated service worker asset list with', staticAssets.size, 'files');
};

// Add to build process
await generateServiceWorkerAssets();
