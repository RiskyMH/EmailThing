import { Loader2 } from "lucide-react";
import { cn } from "@/utils/tw";

export default function Loading({ className }: { className?: string }) {
    return (
        <div className={cn("flex size-full flex-col items-center justify-center fade-in", className)}>
            <Loader2 className="size-12 animate-spin text-muted-foreground" />
        </div>
    );
}
