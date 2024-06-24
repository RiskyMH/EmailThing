import type { ReactNode } from "react"
import { DashboardTableOfContents, type TOC } from "./toc.client"
import { cn } from "@/utils/tw"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { buttonVariants } from "./ui/button"
import Link from "next/link"

interface DocsPageProps {
    toc: TOC[],
    title: string,
    description?: string,
    children: ReactNode,
    pager: DocsPagerProps
}

export function DocsPage({ children, toc, title, description, pager }: DocsPageProps) {
    return (
        <main className="relative py-6 lg:gap-10 lg:py-10 xl:grid xl:grid-cols-[1fr_300px]">
            <div className="mx-auto w-full min-w-0">
                <DocsPageHeader heading={title} text={description} />
                {/* <Mdx code={doc.body.code} /> */}
                {children}

                <hr className="my-4 md:my-6" />
                <DocsPager {...pager} />
            </div>
            <div className="hidden text-sm xl:block">
                <div className="sticky top-16 -mt-10 max-h-[calc(var(--vh)-4rem)] overflow-y-auto pt-10">
                    <DashboardTableOfContents toc={toc} />
                </div>
            </div>
        </main>
    )
}


interface DocsPageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    heading: string
    text?: string
}
export function DocsPageHeader({
    heading,
    text,
    className,
    ...props
}: DocsPageHeaderProps) {
    return (
        <>
            <div className={cn("flex flex-col gap-4", className)} {...props}>
                <h1 className="inline-block font-heading text-4xl lg:text-5xl">
                    {heading}
                </h1>
                {text && <p className="text-xl text-muted-foreground">{text}</p>}
            </div>
            <hr className="my-4" />
        </>
    )
}

interface DocsPagerProps {
    prev?: { title: string, href: string },
    next?: { title: string, href: string }
}

export function DocsPager({ prev, next }: DocsPagerProps) {
    return (
        <div className="flex flex-row items-center justify-between">
            {prev && (
                <Link
                    href={prev.href}
                    className={cn(buttonVariants({ variant: "ghost" }))}
                    rel="prev"
                >
                    <ChevronLeftIcon className="mr-2 size-4" />
                    {prev.title}
                </Link>
            )}
            {next && (
                <Link
                    href={next.href}
                    className={cn(buttonVariants({ variant: "ghost" }), "ml-auto")}
                    rel="next"
                >
                    {next.title}
                    <ChevronRightIcon className="ml-2 size-4" />
                </Link>
            )}
        </div>
    )
}