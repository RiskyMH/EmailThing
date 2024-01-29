'use client'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="flex h-screen w-full items-center justify-center flex-col">
            <h1 className="text-4xl font-bold text-foreground">Something went wrong!</h1>
            <p className="text-muted-foreground">500 | Internal Server Error</p>
            {/* <button onClick={() => reset()}>Try again</button> */}
        </div>
    )
}