// import cfWorkerCodeText from "@/../public/cloudflare-worker.js" with { type: "text" };
// // import { codeToHtml } from "shiki";

// export async function cloudflareWorkerCode() {
//   if (typeof window === "undefined" && process?.platform === "win32")
//     return cfWorkerCodeText as any as string;

//   // sus things to ensure bun doesn't include it in module graph
//   const { codeToHtml } = await import("shiki/bundle-full.mjs") as typeof import("shiki");
//   return codeToHtml(cfWorkerCodeText as any as string, {
//     lang: "javascript",
//     theme: "github-dark",
//     mergeWhitespaces: true,
//     transformers: [
//       {
//         line(node, line) {
//           this.addClassToHast(node, ["break-words", ""]);
//         },
//         pre(hast) {
//           this.addClassToHast(hast, "!bg-transparent");
//         },
//       },
//     ],
//   });
// }



import cfWorkerCodeText from "@/../public/cloudflare-worker.js" with { type: "text" };

export async function cloudflareWorkerCode() {
  if (typeof window === "undefined" && process?.platform === "win32")
    return cfWorkerCodeText as any as string;

  // somehow bun 1.4 macros doesn't work with shiki.. not sure whats going on, but this works fine in a separate proc
  const code = await Bun.$`bun -e '
  import { codeToHtml } from "shiki";
  const code = ${JSON.stringify(cfWorkerCodeText as any as string)};
  const html = await codeToHtml(code, {
    lang: "javascript",
    theme: "github-dark",
    mergeWhitespaces: true,
    transformers: [
      {
        line(node, line) {
          this.addClassToHast(node, ["break-words", ""]);
        },
        pre(hast) {
          this.addClassToHast(hast, "!bg-transparent");
        },
      },
    ],
  });
  console.log(html);
  '`.quiet();

  if (code.exitCode !== 0) {
    console.error("Error generating HTML:", code.stderr.toString());
    throw new Error("Failed to generate HTML from Cloudflare Worker code.");
  }

  return code.stdout.toString();
}
