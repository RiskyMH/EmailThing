import { Metadata } from "next"
import { pageMailboxAccess } from "../tools"
import { db, Mailbox, MailboxAlias, MailboxCustomDomain, MailboxTokens } from "@/db";
import { notFound } from "next/navigation"
import { customDomainLimit, storageLimit, aliasLimit } from "@/utils/limits"
import { AddAliasForm, AddCustomDomainForm, CreateTokenForm, DeleteButton, EditAliasForm } from "./components.client"
import { Button, buttonVariants } from "@/components/ui/button"
import { SmartDrawer, SmartDrawerClose, SmartDrawerContent, SmartDrawerDescription, SmartDrawerFooter, SmartDrawerHeader, SmartDrawerTitle, SmartDrawerTrigger } from "@/components/ui/smart-drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { asc, desc, eq } from "drizzle-orm";
import { PlusIcon, MoreHorizontalIcon, CheckIcon, Trash2Icon, PencilIcon } from "lucide-react";
import ToggleVisibilityToken from "@/components/token.client";
import { ContextMenuAction } from "../components.client";
import { changeDefaultAlias, deleteAlias, deleteCustomDomain, deleteToken } from "./actions";
import { init } from "@paralleldrive/cuid2";
import LocalTime from "@/components/localtime";
import { generateToken } from "@/utils/token";


export const metadata: Metadata = {
    title: "Config",
}


export default async function EmailConfig({
    params,
}: {
    params: {
        mailbox: string,
        email: string
    }
}) {
    await pageMailboxAccess(params.mailbox)

    const mailbox = await db.query.Mailbox.findFirst({
        where: eq(Mailbox.id, params.mailbox),
        columns: {
            storageUsed: true,
            plan: true,
        },
        with: {
            aliases: {
                columns: {
                    alias: true,
                    name: true,
                    default: true,
                    id: true,
                },
                orderBy: asc(MailboxAlias.createdAt)
            },
            customDomains: {
                columns: {
                    domain: true,
                    authKey: true,
                    id: true,
                    addedAt: true
                },
                orderBy: asc(MailboxCustomDomain.addedAt)
            },
            tokens: {
                columns: {
                    token: true,
                    createdAt: true,
                    name: true,
                    expiresAt: true,
                    id: true
                },
                orderBy: asc(MailboxTokens.createdAt)
            }
        }
    })

    if (!mailbox) return notFound()


    return (
        <div className="min-w-0 p-5 flex flex-col gap-5">
            <h1 className="text-2xl font-semibold">Mailbox Config</h1>

            <div>
                <h2 className="text-lg font-semibold">Storage</h2>
                <p>Used: {Math.ceil(mailbox.storageUsed / 1e+6)}MB / {(storageLimit as any)[mailbox.plan] / 1e+6}MB</p>
            </div>

            <div className="mb-3 max-w-[40rem]">
                <div className="flex pb-2">
                    <h2 className="text-lg font-semibold">Aliases</h2>
                    <SmartDrawer>
                        <SmartDrawerTrigger asChild>
                            <Button
                                disabled={mailbox.aliases.length >= (aliasLimit as any)[mailbox.plan]}
                                className="ms-auto flex gap-2"
                                size="sm"
                                variant="secondary"
                            >
                                <PlusIcon className='h-4 w-4' /> Create alias
                            </Button>
                        </SmartDrawerTrigger>
                        <SmartDrawerContent className="sm:max-w-[425px]">
                            <SmartDrawerHeader>
                                <SmartDrawerTitle>Add Alias</SmartDrawerTitle>
                                <SmartDrawerDescription>Enter your chosen email and name to create alias</SmartDrawerDescription>
                            </SmartDrawerHeader>

                            <AddAliasForm mailboxId={params.mailbox} />

                            <SmartDrawerFooter className="pt-2 flex sm:hidden">
                                <SmartDrawerClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </SmartDrawerClose>
                            </SmartDrawerFooter>
                        </SmartDrawerContent>
                    </SmartDrawer>
                </div>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="bg-tertiary rounded-ss-md">
                                    <p>Alias</p>
                                </TableHead>
                                <TableHead className="bg-tertiary">
                                    <p>Name</p>
                                </TableHead>
                                <TableHead className="text-center bg-tertiary">
                                    <p>Default</p>
                                </TableHead>
                                <TableHead className="bg-tertiary rounded-se-md w-1" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mailbox.aliases.length ? (
                                mailbox.aliases.map((row) => (
                                    <TableRow key={row.alias}>
                                        <TableCell className="font-medium py-3">
                                            {row.alias}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {row.name}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {row.default ? <CheckIcon className="h-4 w-4 mx-auto" /> : null}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontalIcon className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {/* // todo: actions: */}
                                                    <SmartDrawer>
                                                        <DropdownMenuItem asChild>
                                                            <SmartDrawerTrigger className="gap-2 w-full">
                                                                <PencilIcon className="text-muted-foreground h-5 w-5" />
                                                                Edit name
                                                            </SmartDrawerTrigger>
                                                        </DropdownMenuItem>
                                                        <SmartDrawerContent className="sm:max-w-[425px]">
                                                            <SmartDrawerHeader>
                                                                <SmartDrawerTitle>Edit Alias</SmartDrawerTitle>
                                                                <SmartDrawerDescription>Enter your chosen name to update alias</SmartDrawerDescription>
                                                            </SmartDrawerHeader>

                                                            <EditAliasForm mailboxId={params.mailbox} alias={row.alias} id={row.id} name={row.name} />

                                                            <SmartDrawerFooter className="pt-2 flex sm:hidden">
                                                                <SmartDrawerClose asChild>
                                                                    <Button variant="secondary">Cancel</Button>
                                                                </SmartDrawerClose>
                                                            </SmartDrawerFooter>
                                                        </SmartDrawerContent>
                                                    </SmartDrawer>

                                                    <DropdownMenuItem disabled={row.default} className="flex gap-2" asChild>
                                                        <ContextMenuAction
                                                            icon="CheckIcon"
                                                            action={changeDefaultAlias.bind(null, params.mailbox, row.id)}
                                                        >
                                                            Make default
                                                        </ContextMenuAction>
                                                    </DropdownMenuItem>

                                                    <SmartDrawer>
                                                        <DropdownMenuItem
                                                            className="flex gap-2 w-full"
                                                            disabled={row.default || mailbox.aliases.length <= 1}
                                                            asChild
                                                        >
                                                            <SmartDrawerTrigger>
                                                                <Trash2Icon className="text-muted-foreground h-5 w-5" />
                                                                Delete alias
                                                            </SmartDrawerTrigger>
                                                        </DropdownMenuItem>

                                                        <SmartDrawerContent className="sm:max-w-[425px]">
                                                            <SmartDrawerHeader>
                                                                <SmartDrawerTitle>Delete Alias</SmartDrawerTitle>
                                                                <SmartDrawerDescription>
                                                                    Are you sure you want to delete <strong>{row.alias}</strong>.
                                                                </SmartDrawerDescription>
                                                            </SmartDrawerHeader>
                                                            <SmartDrawerFooter className="pt-2 flex">
                                                                <SmartDrawerClose className={buttonVariants({ variant: "secondary" })}>Cancel</SmartDrawerClose>
                                                                <DeleteButton action={deleteAlias.bind(null, params.mailbox, row.id)} />
                                                            </SmartDrawerFooter>
                                                        </SmartDrawerContent>
                                                    </SmartDrawer>

                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>

                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell className="h-24 text-center" colSpan={4}>
                                        No aliases yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="max-w-[40rem]">
                <div className="flex pb-2">
                    <h2 className="text-lg font-semibold">Custom domains</h2>
                    <SmartDrawer>
                        <SmartDrawerTrigger asChild>
                            <Button
                                disabled={mailbox.customDomains.length >= (customDomainLimit as any)[mailbox.plan]}
                                className="ms-auto flex gap-2"
                                size="sm"
                                variant="secondary"
                            >
                                <PlusIcon className='h-4 w-4' /> Add new domain
                            </Button>
                        </SmartDrawerTrigger>
                        <SmartDrawerContent className="sm:max-w-[425px]">
                            <AddCustomDomainForm mailboxId={params.mailbox} />

                            <SmartDrawerFooter className="pt-2 flex sm:hidden">
                                <SmartDrawerClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </SmartDrawerClose>
                            </SmartDrawerFooter>
                        </SmartDrawerContent>
                    </SmartDrawer>
                </div>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow className="rounded-t-lg">
                                <TableHead className="bg-tertiary rounded-ss-md">
                                    <p>Domain</p>
                                </TableHead>
                                <TableHead className="bg-tertiary rounded-se-md w-1" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mailbox.customDomains.length ? (
                                mailbox.customDomains.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium py-3">
                                            {row.domain}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontalIcon className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <SmartDrawer>
                                                        <DropdownMenuItem className="flex gap-2 w-full" asChild>
                                                            <SmartDrawerTrigger>
                                                                <Trash2Icon className="text-muted-foreground h-5 w-5" />
                                                                Delete domain
                                                            </SmartDrawerTrigger>
                                                        </DropdownMenuItem>

                                                        <SmartDrawerContent className="sm:max-w-[425px]">
                                                            <SmartDrawerHeader>
                                                                <SmartDrawerTitle>Delete Domain</SmartDrawerTitle>
                                                                <SmartDrawerDescription>
                                                                    Are you sure you want to delete <strong>{row.domain}</strong>.
                                                                    This will also delete <strong>{mailbox.aliases.filter(alias => alias.alias.endsWith("@" + row.domain)).length}</strong> aliases.
                                                                </SmartDrawerDescription>
                                                            </SmartDrawerHeader>
                                                            <SmartDrawerFooter className="pt-2 flex">
                                                                <SmartDrawerClose className={buttonVariants({ variant: "secondary" })}>Cancel</SmartDrawerClose>
                                                                <DeleteButton action={deleteCustomDomain.bind(null, params.mailbox, row.id)} />
                                                            </SmartDrawerFooter>
                                                        </SmartDrawerContent>
                                                    </SmartDrawer>

                                                    {/* // todo: setup page/modal */}
                                                    <DropdownMenuItem>Setup again</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>

                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell className="h-24 text-center" colSpan={3}>
                                        No domains yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="max-w-[40rem]">
                <div className="flex pb-2">
                    <h2 className="text-lg font-semibold">API Tokens</h2>
                    <SmartDrawer>
                        <SmartDrawerTrigger asChild>
                            <Button className="ms-auto flex gap-2" size="sm" variant="secondary">
                                <PlusIcon className='h-4 w-4' /> Create new token
                            </Button>
                        </SmartDrawerTrigger>
                        <SmartDrawerContent className="sm:max-w-[425px]">
                            <CreateTokenForm mailboxId={params.mailbox} />
                        </SmartDrawerContent>
                    </SmartDrawer>
                </div>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow className="rounded-t-lg">
                                <TableHead className="bg-tertiary rounded-ss-md">
                                    <p>Name</p>
                                    {/* also includes somewhat token */}
                                </TableHead>
                                <TableHead className="bg-tertiary">
                                    <p>Created</p>
                                </TableHead>
                                <TableHead className="bg-tertiary">
                                    <p>Expires</p>
                                </TableHead>
                                <TableHead className="bg-tertiary rounded-se-md w-1" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mailbox.tokens.length ? (
                                mailbox.tokens.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium py-3 flex flex-col">
                                            {row.name ? (
                                                <>
                                                    <span>{row.name}</span>
                                                    <code className="text-muted-foreground">{hideToken(row.token)}</code>
                                                </>
                                            ) : (
                                                <code>{hideToken(row.token)}</code>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <LocalTime time={row.createdAt} />
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {row.expiresAt ? <LocalTime time={row.expiresAt} /> : "Never"}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <SmartDrawer>
                                                <SmartDrawerTrigger className={buttonVariants({ variant: "outline", size: "icon-sm", className: "text-muted-foreground hover:text-destructive hover:border-destructive" })}>
                                                    <Trash2Icon className="h-5 w-5" />
                                                </SmartDrawerTrigger>

                                                <SmartDrawerContent className="sm:max-w-[425px]">
                                                    <SmartDrawerHeader>
                                                        <SmartDrawerTitle>Delete Token</SmartDrawerTitle>
                                                        <SmartDrawerDescription>
                                                            Are you sure you want to delete this token. This cannot be undone.
                                                        </SmartDrawerDescription>
                                                    </SmartDrawerHeader>
                                                    <SmartDrawerFooter className="pt-2 flex">
                                                        <SmartDrawerClose className={buttonVariants({ variant: "secondary" })}>Cancel</SmartDrawerClose>
                                                        <DeleteButton action={deleteToken.bind(null, params.mailbox, row.token)} />
                                                    </SmartDrawerFooter>
                                                </SmartDrawerContent>
                                            </SmartDrawer>

                                        </TableCell>

                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell className="h-24 text-center" colSpan={3}>
                                        No tokens yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div>
                {/* How to receive emails */}
                <h2 className="text-lg font-semibold">How to receive emails</h2>
                You need to setup Cloudflare Email Workers to receive emails. {" "}
                You can use this example script and fill in the <code>auth</code> env var to get started.
                <br />
                Make sure to enable catch all for the worker so all emails come to your inbox.
                <br />
                <a href="https://github.com/RiskyMH/Email/blob/main/cloudflare-workers/receive-email.js" target="_blank" rel="noreferrer" className="font-bold hover:underline">Click here for example script.</a> {" "}
                If you are confused, you can ask for help in the <a href="https://discord.gg/GT9Q2Yz4VS" className="font-bold hover:underline" target="_blank" rel="noreferrer">Discord</a> server.
                <br />
                <br />

                {/* how to send emails */}
                <h2 className="text-lg font-semibold">How to send emails</h2>
                {/* user needs to authorize mailchannels SPF and cf worker */}
                You need to authorize MailChannels and Cloudflare Workers to send emails on your behalf. To do so, add these TXT records.
                <pre className="overflow-auto">
                    {`_mailchannels.<domain> "v=mc1 cfid=riskymh.workers.dev"\n`}
                    {`<domain>               "v=spf1 include:_spf.mx.cloudflare.net include:relay.mailchannels.net -all"`}
                </pre>
                <br />

            </div>

        </div >

    )
}


function hideToken(token: string) {
    const newToken = `et_`
    if (!token.startsWith(newToken)) return token.slice(0, 4) + '......' + token.slice(-4)
    // show first 4 and last 4 characters
    return token.slice(0, newToken.length + 4) + '......' + token.slice(-4)
}