import { relative } from "node:path";

const glob = new Bun.Glob("**/route.{ts,tsx}");

const imports = [] as [string, string][];
const exports = [] as [string, string][];

// First check local routes directory
const localRoutes = new Map();
for await (const route of glob.scan({ cwd: `${import.meta.dir}/routes`, absolute: true })) {
    const routeName = route
        .replace(/^.*?\/routes/, "/api")
        .replace(/\/route\.tsx?$/, "");

    localRoutes.set(routeName, route);
}

// Then check Next.js routes, skipping any that exist locally
for await (const route of glob.scan({ cwd: `${import.meta.dir}/../../web/app/api`, absolute: true })) {
    const routeName = route
        .replace(/^.*?\/app\/api/, "/api")
        .replace(/\/route\.tsx?$/, "");

    // Skip if we already have this route locally
    if (localRoutes.has(routeName)) {
        continue;
    }
    localRoutes.set(routeName, route);
}

// Generate imports and exports for all routes
for (const [routeName, route] of localRoutes) {
    let relativePath = relative(import.meta.dir, route);
    if (!relativePath.startsWith('.')) {
        relativePath = `./${relativePath}`;
    }

    const importName = routeName
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/^_/, '')
        .replace(/-/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_/, '');
    const normalizedRouteName = routeName.replace(/\[([^\]]+)\]/g, ':$1');

    const fileContent = await Bun.file(route).text();
    if (fileContent.includes('export default')) {
        imports.push([`${importName}_default`, relativePath]);
        exports.push([normalizedRouteName, `${importName}_default`]);
    } else {
        imports.push([`* as ${importName}`, relativePath]);
        exports.push([normalizedRouteName, importName]);
    }
}

imports.sort((a, b) => b[0].localeCompare(a[0]));
exports.sort((a, b) => b[0].localeCompare(a[0]));


const importsOutput = imports.map(([importName, relativePath]) => `import ${importName} from "${relativePath}";`).join('\n');
const exportsOutput = exports.map(([routeName, importName]) => `    "${routeName}": ${importName},`).join('\n');

const output = `${importsOutput}\n\nexport default {\n${exportsOutput}\n};\n`;

await Bun.write(`${import.meta.dir}/routes.ts`, output);
