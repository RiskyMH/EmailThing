import { cn } from "@/utils/tw";
// import { codeToHtml } from "shiki";
import Link from "next/link"

// TODO: fix types as these seem to be nothing extra
export const Components = {
    h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h1
            className={cn(
                "mt-2 scroll-m-20 text-4xl font-bold tracking-tight",
                className
            )}
            {...props}
        />
    ),
    h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h2
            className={cn(
                "mt-10 scroll-m-20 border-b pb-1 text-3xl font-semibold tracking-tight first:mt-0",
                className
            )}
            {...props}
        />
    ),
    h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h3
            className={cn(
                "mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
                className
            )}
            {...props}
        />
    ),
    h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h4
            className={cn(
                "mt-8 scroll-m-20 text-xl font-semibold tracking-tight",
                className
            )}
            {...props}
        />
    ),
    h5: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h5
            className={cn(
                "mt-8 scroll-m-20 text-lg font-semibold tracking-tight",
                className
            )}
            {...props}
        />
    ),
    h6: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h6
            className={cn(
                "mt-8 scroll-m-20 text-base font-semibold tracking-tight",
                className
            )}
            {...props}
        />
    ),
    a: ({ className, ...props }: React.HTMLAttributes<HTMLAnchorElement> & { href?: string, target?: string }) => (
        <a
            className={cn("font-medium underline underline-offset-4", className)}
            {...props}
        />
    ),
    p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p
            className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
            {...props}
        />
    ),
    ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
        <ul className={cn("my-6 ml-6 list-disc", className)} {...props} />
    ),
    ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
        <ol className={cn("my-6 ml-6 list-decimal", className)} {...props} />
    ),
    li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
        <li className={cn("mt-2", className)} {...props} />
    ),
    blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
        <blockquote
            className={cn(
                "mt-6 border-l-2 pl-6 italic [&>*]:text-muted-foreground",
                className
            )}
            {...props}
        />
    ),
    img: ({
        className,
        alt,
        ...props
    }: React.ImgHTMLAttributes<HTMLImageElement>) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={cn("rounded-md border", className)} alt={alt} {...props} />
    ),
    hr: ({ ...props }) => <hr className="my-4 md:my-8" {...props} />,
    table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
        <div className="my-6 w-full overflow-y-auto">
            <table className={cn("w-full", className)} {...props} />
        </div>
    ),
    tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
        <tr
            className={cn("m-0 border-t p-0 even:bg-muted", className)}
            {...props}
        />
    ),
    th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
        <th
            className={cn(
                "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
                className
            )}
            {...props}
        />
    ),
    td: ({ className, ...props }: React.HTMLAttributes<HTMLTableDataCellElement>) => (
        <td
            className={cn(
                "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
                className
            )}
            {...props}
        />
    ),
    pre: ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
        <pre
            className={cn(
                "mb-4 mt-6 overflow-x-auto rounded-lg border bg-black py-4",
                className
            )}
            {...props}
        />
    ),
    code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
        <code
            className={cn(
                "relative rounded border px-[0.3rem] py-[0.2rem] font-mono text-sm",
                className
            )}
            {...props}
        />
    ),
}

export default Components

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    href?: string
    disabled?: boolean
}

export function MdxCard({
    href,
    className,
    children,
    disabled,
    ...props
}: CardProps) {
    return (
        <div
            className={cn(
                "group relative rounded-lg border p-6 shadow-md transition-shadow hover:shadow-lg bg-secondary",
                disabled && "cursor-not-allowed opacity-60",
                className
            )}
            {...props}
        >
            <div className="flex flex-col justify-between gap-4">
                <div className="space-y-2 [&>h3]:!mt-0 [&>h4]:!mt-0 [&>p]:text-muted-foreground">
                    {children}
                </div>
            </div>
            {href && (
                <Link href={disabled ? "#" : href} className="absolute inset-0">
                    <span className="sr-only">View</span>
                </Link>
            )}
        </div>
    )
}

interface CalloutProps {
    icon?: string
    children?: React.ReactNode
}

export function Callout({
    children,
    icon,
    ...props
}: CalloutProps) {
    return (
        <div
            className={"my-6 flex items-start rounded-md border border-l-4 p-4"}
            {...props}
        >
            {icon && <span className="mr-4 text-2xl">{icon}</span>}
            <div>{children}</div>
        </div>
    )
}

// export async function CodeBlock({lang, theme = "github-dark", code}: {lang: string, theme?: string, code: string}) {
//     return (
//         <div className="overflow-auto max-h-52 bg-[#17171e] p-2 rounded-md text-sm" dangerouslySetInnerHTML={{
//             __html:
//                 await codeToHtml(
//                     code,
//                     {
//                         lang,
//                         theme,
//                         mergeWhitespaces: true,
//                         transformers: [
//                             {
//                                 line(node, line) {
//                                     this.addClassToHast(node, ["break-words", ""]);
//                                 },
//                                 pre(hast) {
//                                     this.addClassToHast(hast, "!bg-transparent");
//                                 },
//                             },
//                         ],
//                     }
//                 )
//         }} />

//     )
// }