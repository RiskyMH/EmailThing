import { cn } from "@/utils/tw";
import { StarIcon } from "lucide-react";

export default function Loading({ className }: { className?: string }) {
    return (
        <div className={cn("flex w-full min-w-0 flex-col gap-2 p-5 px-3 pt-0", className)}>
            <div className="sticky top-0 z-10 flex h-12 w-full min-w-0 animate-pulse flex-row items-center justify-center gap-3 border-b-2 bg-background px-2">
                <EmailListCategoryLoadingSkeleton />
            </div>

            <EmailListLoadingSkeleton />
        </div>
    );
}

export function EmailListLoadingSkeleton({ className }: { className?: string }) {
    return (
        Array.from({ length: 25 }).map((_, i) => (
            <div
                key={i}
                className={cn("bg-card flex h-12 w-full animate-pulse gap-3 rounded-md px-4 py-1.5", className)}
            >
                <span
                    className="m-2 mx-auto inline-block size-4 shrink-0 self-center rounded-full"
                    style={{ backgroundColor: "grey" }}
                />
                <StarIcon className="hidden size-4 shrink-0 self-center text-muted-foreground sm:inline-block" />
                <div className="h-4 w-1/4 shrink-0 self-center sm:w-32 md:w-56">
                    <span className="me-auto block h-4 w-full max-w-20 rounded bg-muted-foreground/50" />
                </div>
                <div className="h-4 w-full self-center ">
                    <span className="me-auto block h-4 w-full max-w-56 rounded bg-muted-foreground/50 md:max-w-72 lg:max-w-[30rem]" />
                </div>
                <span className="float-right h-4 w-10 shrink-0 self-center rounded bg-muted-foreground/25 text-right text-sm sm:w-16" />
            </div>
        ))
    );
}


export function EmailListCategoryLoadingSkeleton({ className }: { className?: string }) {
    return (
        <>
            <input type="checkbox" disabled id="select" className={cn("my-auto mr-2 size-4 self-start", className)} />
            <div className={cn("inline-flex h-6 w-auto max-w-fit items-center justify-center gap-1 border-transparent border-b-3 px-1 font-bold", className)}>
                <span className="h-5 w-36 self-center rounded bg-muted-foreground/25" />
            </div>

            <div className={cn("ms-auto me-2 flex h-6 shrink-0 items-center justify-center", className)}>
                <span className="-m-2 size-5 rounded-full bg-muted-foreground/25 p-2" />
            </div>
        </>
    )
}
