"use client";

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center">
            <h1 className="text-center font-bold text-4xl text-foreground">Something went wrong!</h1>
            <p className="px-2 text-center text-muted-foreground">
                {error.digest ? "500 | Internal Server Error" : `Client Error | ${error.message}`}
            </p>
            {/* <button onClick={() => reset()}>Try again</button> */}
        </div>
    );
}
