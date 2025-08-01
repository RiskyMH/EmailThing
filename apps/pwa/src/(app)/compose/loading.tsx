import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fade-in flex size-full flex-col items-center justify-center">
      <Loader2 className="size-12 animate-spin text-muted-foreground" />
    </div>
  );
}
