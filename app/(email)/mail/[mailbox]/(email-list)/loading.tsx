export default function Loading() {
    return (
        <div className="flex w-full min-w-0 flex-col gap-2 p-5">
            <div className="-mt-1 flex w-full min-w-0 animate-pulse flex-row gap-6 border-b-2 pb-3">
                <input type="checkbox" disabled id="select" className="mt-1 mr-2 size-4 self-start" />
                <div className="inline-flex w-auto max-w-fit items-center gap-1 border-transparent border-b-3 px-1 font-bold">
                    <span className="h-6 w-36 self-center rounded bg-muted-foreground/25" />
                </div>

                <div className="ms-auto me-2 h-5">
                    <span className="inline-block size-5 rounded-full bg-muted-foreground/25 p-2" />
                </div>
            </div>

            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex h-16 w-full animate-pulse gap-4 rounded bg-card py-2 pr-5 pl-5 shadow-sm">
                    <span
                        className="m-2 mx-auto inline-block size-3 shrink-0 self-center rounded-full"
                        style={{ backgroundColor: "grey" }}
                    />
                    <span className="h-5 w-56 self-center rounded bg-muted-foreground/50" />
                    <span className="h-5 w-80 self-center rounded bg-muted-foreground/50" />
                    <span className="hidden h-7 w-full shrink-[2] self-center rounded-lg bg-muted-foreground/25 sm:flex" />
                    <span className="-me-2 mx-auto hidden size-5 shrink-0 self-center truncate rounded-full bg-muted-foreground/25 sm:inline-block" />
                    <span className="float-right h-4 w-16 shrink-0 self-center rounded bg-muted-foreground/25 text-right text-sm" />
                </div>
            ))}
        </div>
    );
}
