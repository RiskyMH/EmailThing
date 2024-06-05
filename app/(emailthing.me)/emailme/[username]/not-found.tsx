import Link from "next/link"

export const metadata = {
    title: "Not found",
}

export default function NotFound() {
    return (
        <div className="flex h-screen w-full items-center justify-center flex-col">
            <h1 className="text-4xl font-bold text-foreground text-center">Not found</h1>
            <p className="text-muted-foreground text-center px-2">This user can not be found, if this is you please <Link href="https://emailthing.xyz/settings/emailthing-me" className="underline hover:text-blue" target="_blank">enable it</Link></p>
        </div>
    )
}