
export const metadata = {
    title: "Not found",
}

export default function NotFound() {
    return (
        <div className="flex h-screen w-full items-center justify-center flex-col">
            <h1 className="text-4xl font-bold text-foreground">Not found</h1>
            <p className="text-muted-foreground text-center px-2">The page you are looking for does not exist</p>
        </div>
    )
}