import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center">
            <Loader2 className="size-12 animate-spin text-muted-foreground" />
        </div>
    );
}
