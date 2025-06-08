import cfWorkerCodeText from "@/../public/cloudflare-worker.js" with { type: "text" };
import { codeToHtml } from "shiki";

export async function cloudflareWorkerCode() {
  if (typeof window === "undefined" && process?.platform === "win32")
    return cfWorkerCodeText as any as string;

  return codeToHtml(cfWorkerCodeText as any as string, {
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
}
