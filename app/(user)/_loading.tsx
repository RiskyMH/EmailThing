import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex h-screen w-full items-center justify-center flex-col">
            <Loader2 className="size-12 animate-spin text-muted-foreground" />
        </div>
    )
}