import Link from "next/link";

export const metadata = {
    title: "Not found",
};

export default function NotFound() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center">
            <h1 className="text-center font-bold text-4xl text-foreground">Not found</h1>
            <p className="px-2 text-center text-muted-foreground">
                This user can not be found, if this is you please {" "}
                <Link
                    href="https://emailthing.app/settings/emailthing-me"
                    className="underline hover:text-blue"
                    target="_blank"
                >
                    enable it
                </Link>
            </p>
        </div>
    );
}
