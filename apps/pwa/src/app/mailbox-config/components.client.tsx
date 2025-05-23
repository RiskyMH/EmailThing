"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

export function DeleteButton({
  action,
  text = "Delete",
  instant = false,
}: { action: () => Promise<any> | undefined; text?: string; instant?: boolean }) {
  const [isPending, startTransition] = useTransition();

  const onClick = (event: any) => {
    event.preventDefault();
    if (instant) document.getElementById("smart-drawer:close")?.click();
    if (isPending) return;

    startTransition(async () => {
      const res = await action();
      if (res?.error) {
        toast.error(res.error);
      } else {
        document.getElementById("smart-drawer:close")?.click();
      }
    });
  };

  return (
    <Button
      type="submit"
      disabled={isPending}
      className="gap-2"
      variant="destructive"
      onClick={onClick}
      autoFocus
    >
      {isPending && <Loader2 className="size-5 animate-spin" />}
      {text}
    </Button>
  );
}
