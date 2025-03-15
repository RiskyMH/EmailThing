import { Loader2 } from "lucide-react";
import { cn } from "@/utils/tw";

export default function Loading() {
    return (
        <div className="flex size-full flex-col items-center justify-center fade-in">
            <Loader2 className="size-12 animate-spin text-muted-foreground" />
        </div>
    );
}
