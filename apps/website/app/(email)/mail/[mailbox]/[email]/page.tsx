import { getCurrentUser } from "@/app/utils/jwt"
import { notFound } from "next/navigation"
import { pageMailboxAccess, userMailboxAccess } from "../tools"
import { Metadata } from "next"
import { prisma } from "@email/db"
import { MarkRead, ViewSelect } from "./components.client"
import { revalidatePath } from "next/cache"
import ParseHTML, { parseHTML } from "./parse-html"
import { marked } from 'marked';
import TopButtons from "./top-buttons"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { gravatar } from "@/app/utils/tools"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { Button } from "@/app/components/ui/button"
import { ChevronDown } from "lucide-react"
import LocalTime from "@/app/components/localtime"
import { getEmail } from "./tools"


export async function generateMetadata(props: { params: { mailbox: string, email: string } }): Promise<Metadata> {
    if (!await pageMailboxAccess(props.params.mailbox, false)) return {}
    
    const mail = await getEmail(props.params.mailbox, props.params.email)
    if (!mail) return notFound()

    return {
        title: mail.subject,
    }
}

export default async function Email({
    params,
    searchParams
}: {
    params: {
        mailbox: string,
        email: string
    },
    searchParams: {
        view?: "text" | "markdown" | "html"
    }
}) {
    await pageMailboxAccess(params.mailbox, false)
    const email = await getEmail(params.mailbox, params.email)
    if (!email) return notFound()

    async function markRead() {
        "use server"
        const userId = await getCurrentUser()
        if (!userId || !await userMailboxAccess(params.mailbox, userId))
            return "No access to mailbox";

        await prisma.email.update({
            data: {
                isRead: true
            },
            where: {
                id: params.email,
                mailboxId: params.mailbox,
            }

        });

        revalidatePath(`/mail/${params.mailbox}/${params.email}`)

    }

    const view = searchParams?.view || "markdown"

    return (
        <div className="min-w-0 p-5 w-full h-full flex flex-col gap-3">
            <TopButtons mailboxId={params.mailbox} emailId={params.email} />
            {!email.isRead && <MarkRead action={markRead} />}

            <h1 className="font-bold text-3xl break-words mt-3">{email.subject}</h1>
            <div className="bg-card p-3 rounded-md flex flex-col gap-3">
                {/* from info and gravatar */}
                <div className="flex gap-2">
                    <Avatar className="h-12 w-12">
                        <AvatarImage className="bg-tertiary rounded-full" src={gravatar(email.from!.address)} />
                        <AvatarFallback className="bg-tertiary rounded-full">
                            {(email.from?.name || email.from!.address).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col overflow-hidden">
                        <div className="flex gap-2 overflow-ellipsis whitespace-nowrap">
                            <b className="font-bold">{email.from?.name || email.from!.address}</b>
                            {email.from?.name && <p className="text-muted-foreground text-sm">{`<${email.from.address}>`}</p>}
                        </div>
                        <div className="text-muted-foreground text-sm flex">
                            <p className="self-center">to {email.recipients.map(e => e.name || e.address).join(", ")}</p>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="auto" className="rounded-full p-1 -m-1 ms-1 text-muted-foreground hover:text-foreground hover:bg-background">
                                        <ChevronDown className="h-5 w-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-screen sm:w-96">
                                    <div className="grid gap-2 text-sm">
                                        <div className="grid grid-cols-5 items-center gap-4">
                                            <p className="text-muted-foreground text-end">from:</p>
                                            <p className="flex gap-1 overflow-y-auto col-span-4 whitespace-nowrap ">
                                                {email.from?.name || email.from!.address}
                                                {email.from?.name && <span className="text-muted-foreground"> &lt;{email.from.address}&gt;</span>}
                                            </p>
                                        </div>

                                        {/* to */}
                                        <div className="grid grid-cols-5 items-center gap-4">
                                            <p className="text-muted-foreground text-end">to:</p>
                                            <div className="overflow-y-auto col-span-4">
                                                {email.recipients.filter(e => !e.cc).map(e => (
                                                    <p key={e.address} className="flex gap-1 whitespace-nowrap">
                                                        {e.name || e.address}
                                                        {e.name && <span className="text-muted-foreground"> &lt;{e.address}&gt;</span>}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>

                                        {/* cc */}
                                        {email.recipients.some(e => e.cc) && <div className="grid grid-cols-5 items-center gap-4">
                                            <p className="text-muted-foreground text-end">cc:</p>
                                            <div className="overflow-y-auto col-span-4">
                                                {email.recipients.filter(e => e.cc).map(e => (
                                                    <p key={e.address} className="flex gap-1 whitespace-nowrap">
                                                        {e.name || e.address}
                                                        {e.name && <span className="text-muted-foreground"> &lt;{e.address}&gt;</span>}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>}

                                        {/* date */}
                                        <div className="grid grid-cols-5 items-center gap-4">
                                            <p className="text-muted-foreground text-end">date:</p>
                                            {/* <p className="col-span-4">{email.createdAt.toLocaleString()}</p> */}
                                            {/* above but always utc+0 */}
                                            <p className="col-span-4 flex gap-1">
                                                {email.createdAt.toLocaleString('en-US', { timeZone: 'UTC' })}
                                                <span className="text-muted-foreground">(UTC)</span>
                                            </p>
                                        </div>

                                        {/* subject */}
                                        <div className="grid grid-cols-5 items-center gap-4">
                                            <p className="text-muted-foreground text-end">subject:</p>
                                            <p className="col-span-4">{email.subject}</p>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                    </div>
                    <LocalTime className="text-muted-foreground text-sm ms-auto mt-2 hidden lg:inline" time={email.createdAt} type="full" />
                    <ViewSelect selected={view} htmlValid={!!email.html} className="hidden md:flex ms-auto lg:ms-0" />
                </div>

                {view === "text" ? <p className="whitespace-pre-wrap break-words leading-normal">{email.body}</p> : null}
                {view === "markdown" ? <ParseHTML className="prose dark:prose-invert max-w-full break-words" body={await marked.parse(email.body, { breaks: true })} /> : null}
                {/* {view === "html" ? <ParseHTML className="rounded-lg" body={mail.html || mail.body} /> : null} */}
                {view === "html" ? <iframe className="rounded-lg w-full h-screen bg-card" sandbox='allow-popups' srcDoc={await parseHTML(email.html || email.body, true)} /> : null}
            </div>

        </div>

    )
}