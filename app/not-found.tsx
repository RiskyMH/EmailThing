export const metadata = {
    title: "Not found",
};

export default function NotFound() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center">
            <h1 className="text-center font-bold text-4xl text-foreground">Not found</h1>
            <p className="px-2 text-center text-muted-foreground">The page you are looking for does not exist</p>
        </div>
    );
}
