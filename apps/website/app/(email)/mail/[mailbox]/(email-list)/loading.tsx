import { cn } from "@/app/utils/tw";


export default function Loading() {
    return (
        <div className="lg:ml-52 flex flex-col space-y-4 p-5">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={cn("rounded shadow-sm h-16 pl-5 pr-5 py-2 w-full flex gap-4 animate-pulse bg-card")}>
                    <span
                        className="self-center rounded-full h-3 w-3 m-2 inline-block mx-auto flex-shrink-0"
                        style={{ backgroundColor: "grey" }}
                    />
                    <span className="self-center w-56 bg-muted-foreground/50 h-5 rounded" />
                    <span className="self-center w-56 bg-muted-foreground/50 h-5 rounded" />
                    <span className="self-center w-full hidden sm:flex gap-4 bg-muted-foreground/25 h-7 rounded-lg" />
                    <span className="self-center truncate bg-muted-foreground/25 mx-auto inline-block flex-shrink-0 rounded-full h-5 w-5" />
                    <span className="float-right self-center text-sm flex-shrink-0 w-16 bg-muted-foreground/25 h-4 rounded text-right" />

                </div>
            ))}
        </div>

    )
}