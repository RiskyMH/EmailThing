import { useRouteError } from "react-router-dom";

export default function ErrorPage({ notFound }: { notFound?: boolean }) {
    const error = useRouteError();
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center">
            <h1 className="text-center font-bold text-4xl text-foreground">
                {notFound ? "Not Found" : "Something went wrong!"}
            </h1>
            <p className="px-2 text-center text-muted-foreground">
                {notFound ? "The page you are looking for does not exist"
                    // @ts-expect-error i like being sus
                    : `Client Error | ${error?.message ?? error ?? "wow what did you do?"}`
                }
            </p>
        </div>
    );
}
