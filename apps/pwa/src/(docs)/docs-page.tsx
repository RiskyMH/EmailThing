import { cn } from "@/utils/tw";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardTableOfContents, type TOC } from "../components/toc.client";
import { buttonVariants } from "../components/ui/button";

interface DocsPageProps {
    toc: TOC[];
    title: string;
    description?: string;
    children: ReactNode;
    pager: DocsPagerProps;
}

export function DocsPage({ children, toc, title, description, pager }: DocsPageProps) {
    return (
        <main className="relative lg:gap-10 lg:py-5 xl:grid xl:grid-cols-[1fr_200px] h-fit ">
            <div className="mx-auto w-full min-w-0 bg-background max-sm:px-6 sm:px-6 md:rounded-lg py-5 mb-5">
                <DocsPageHeader heading={title} text={description} />
                {/* <Mdx code={doc.body.code} /> */}
                {children}

                <hr className="my-4 md:my-6" />
                <DocsPager {...pager} />
            </div>
            <div className="hidden text-sm xl:block bg-sidebar">
                <div className="-mt-10 sticky top-16 max-h-[calc(var(--vh)-4rem)] overflow-y-auto pt-10">
                    <DashboardTableOfContents toc={toc} />
                </div>
            </div>
        </main>
    );
}

interface DocsPageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    heading: string;
    text?: string;
}
export function DocsPageHeader({ heading, text, className, ...props }: DocsPageHeaderProps) {
    return (
        <>
            <div className={cn("flex flex-col gap-4", className)} {...props}>
                <h1 className="inline-block font-heading text-4xl lg:text-5xl">{heading}</h1>
                {text && <p className="text-muted-foreground text-xl">{text}</p>}
            </div>
            <hr className="my-4" />
        </>
    );
}

interface DocsPagerProps {
    prev?: { title: string; href: string };
    next?: { title: string; href: string };
}

export function DocsPager({ prev, next }: DocsPagerProps) {
    return (
        <div className="flex flex-row items-center justify-between">
            {prev && (
                <Link href={prev.href} className={cn(buttonVariants({ variant: "ghost" }))} rel="prev">
                    <ChevronLeftIcon className="mr-2 size-4" />
                    {prev.title}
                </Link>
            )}
            {next && (
                <Link href={next.href} className={cn(buttonVariants({ variant: "ghost" }), "ml-auto")} rel="next">
                    {next.title}
                    <ChevronRightIcon className="ml-2 size-4" />
                </Link>
            )}
        </div>
    );
}
