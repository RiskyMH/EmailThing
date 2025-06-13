import cfWorkerCodeText from "@/../public/cloudflare-worker.js" with { type: "text" };
import CopyButton from "@/components/copy-button.client";
import { Button } from "@/components/ui/button";
import { ClipboardIcon } from "lucide-react";
import { cloudflareWorkerCode } from "./macro" with { type: "macro" };

const cfWorkerCode = await cloudflareWorkerCode();

const _cfWorkerCodeText = cfWorkerCodeText as any as string;

// export {
//     cfWorkerCode,
//     _cfWorkerCodeText as cfWorkerCodeText
// }

export default function CustomDomainDyn() {
  return (
    <>
      <Button className="absolute right-6 m-2 shadow-md" size="sm" variant="secondary" asChild>
        <CopyButton text={_cfWorkerCodeText}>
          <ClipboardIcon className="size-4" />
        </CopyButton>
      </Button>

      <div
        className="max-h-52 overflow-auto rounded-md bg-[#17171e] p-2 text-xs"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: It's generated server side (with static content)
        dangerouslySetInnerHTML={{
          __html: cfWorkerCode,
        }}
      />
    </>
  );
}
