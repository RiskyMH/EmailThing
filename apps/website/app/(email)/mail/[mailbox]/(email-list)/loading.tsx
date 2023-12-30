
export default function Loading() {
    return (
        <div className="flex flex-col gap-2 p-5 w-full min-w-0">
            <div className="sm:flex flex-row w-full min-w-0 pb-3 border-b-2 -mt-1 gap-6 hidden animate-pulse">
                <input type="checkbox" disabled id="select" className="mr-2 self-start mt-1 h-4 w-4" />
                <div className="inline-flex items-center gap-1 px-1 max-w-fit w-auto font-bold border-b-3 border-transparent">
                    <span className="self-center w-36 bg-muted-foreground/25 h-6 rounded" />
                </div>

                <div className="ms-auto me-2 h-5">
                    <span className="inline-block bg-muted-foreground/25 rounded-full p-2 h-5 w-5" />
                </div>
            </div>

            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded shadow-sm h-16 pl-5 pr-5 py-2 w-full flex gap-4 animate-pulse bg-card">
                    <span
                        className="self-center rounded-full h-3 w-3 m-2 inline-block mx-auto flex-shrink-0"
                        style={{ backgroundColor: "grey" }}
                    />
                    <span className="self-center w-56 bg-muted-foreground/50 h-5 rounded" />
                    <span className="self-center w-80 bg-muted-foreground/50 h-5 rounded" />
                    <span className="self-center w-full hidden sm:flex bg-muted-foreground/25 h-7 flex-shrink-[2] rounded-lg" />
                    <span className="self-center truncate bg-muted-foreground/25 mx-auto flex-shrink-0 rounded-full h-5 w-5 -me-2 hidden sm:inline-block" />
                    <span className="float-right self-center text-sm flex-shrink-0 w-16 bg-muted-foreground/25 h-4 rounded text-right" />

                </div>
            ))}
        </div>

    )
}