import { Metadata } from "next"
import { pageMailboxAccess } from "../tools"
import { db, Mailbox, MailboxAlias, MailboxCategory, MailboxCustomDomain, MailboxForUser, MailboxTokens } from "@/db";
import { notFound } from "next/navigation"
import { customDomainLimit, storageLimit, aliasLimit } from "@/utils/limits"
import { AddAliasForm, AddCustomDomainForm, CreateCategoryForm, CreateTokenForm, DeleteButton, EditAliasForm, InviteUserForm } from "./components.client"
import { Button, buttonVariants } from "@/components/ui/button"
import { SmartDrawer, SmartDrawerClose, SmartDrawerContent, SmartDrawerDescription, SmartDrawerFooter, SmartDrawerHeader, SmartDrawerTitle, SmartDrawerTrigger } from "@/components/ui/smart-drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { asc, eq } from "drizzle-orm";
import { PlusIcon, MoreHorizontalIcon, CheckIcon, Trash2Icon, PencilIcon, ClipboardIcon, UserRoundXIcon } from "lucide-react";
import { ContextMenuAction } from "../components.client";
import { changeDefaultAlias, deleteAlias, deleteCategory, deleteCustomDomain, deleteToken, leaveMailbox, removeUserFromMailbox } from "./actions";
import LocalTime from "@/components/localtime";
import { codeToHtml } from "shiki";
import { readFileSync } from "fs";
import CopyButton from "@/components/copy-button.client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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
    const userId = await pageMailboxAccess(params.mailbox)
    if (!userId) return notFound()

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
            },
            categories: {
                columns: {
                    id: true,
                    name: true,
                    color: true
                },
                orderBy: asc(MailboxCategory.createdAt)
            },
            users: {
                columns: {
                    userId: true,
                    role: true,
                    joinedAt: true,
                },
                orderBy: asc(MailboxForUser.joinedAt),
                with: {
                    user: {
                        columns: {
                            username: true,
                        }
                    }
                }
            }
        }
    })

    if (!mailbox) return notFound()

    const userRole = mailbox.users.find(user => user.userId === userId)?.role
    if (!userRole) return notFound()


    return (
        <div className="min-w-0 p-5 flex flex-col gap-5">
            <h1 className="text-2xl font-semibold">Mailbox Config</h1>

            <div>
                <h2 className="text-lg font-semibold">Storage</h2>
                <p>Used: {Math.ceil((mailbox.storageUsed / 1e+6) * 10) / 10}MB / {storageLimit[mailbox.plan] / 1e+6}MB</p>
            </div>

            <div className="mb-3 max-w-[40rem]">
                <div className="flex pb-2">
                    <h2 className="text-lg font-semibold">Aliases <span className="text-muted-foreground text-sm">({mailbox.aliases.length}/5)</span></h2>
                    <SmartDrawer>
                        <SmartDrawerTrigger asChild>
                            <Button
                                disabled={mailbox.aliases.length >= aliasLimit[mailbox.plan]}
                                className="ms-auto flex gap-2"
                                size="sm"
                                variant="secondary"
                            >
                                <PlusIcon className='size-4' /> Create alias
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
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium py-3">
                                            {row.alias}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {row.name}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {row.default ? <CheckIcon className="size-4 mx-auto" /> : null}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="size-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontalIcon className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <SmartDrawer>
                                                        <DropdownMenuItem asChild>
                                                            <SmartDrawerTrigger className="gap-2 w-full">
                                                                <PencilIcon className="text-muted-foreground size-5" />
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
                                                                <Trash2Icon className="text-muted-foreground size-5" />
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
            <div className="mb-3 max-w-[40rem]">
                <div className="flex pb-2">
                    <h2 className="text-lg font-semibold">Categories</h2>
                    <SmartDrawer>
                        <SmartDrawerTrigger asChild>
                            <Button className="ms-auto flex gap-2" size="sm" variant="secondary">
                                <PlusIcon className='size-4' /> Create category
                            </Button>
                        </SmartDrawerTrigger>
                        <SmartDrawerContent className="sm:max-w-[425px]">
                            <SmartDrawerHeader>
                                <SmartDrawerTitle>Create Category</SmartDrawerTitle>
                                <SmartDrawerDescription>Enter the category name and a hex color</SmartDrawerDescription>
                            </SmartDrawerHeader>

                            <CreateCategoryForm mailboxId={params.mailbox} />

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
                                    <p>Name</p>
                                </TableHead>
                                <TableHead className="bg-tertiary rounded-se-md w-1" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mailbox.categories.length ? (
                                mailbox.categories.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="py-3 font-medium gap-2 h-full">
                                            <span className="self-center rounded-full size-3 mr-2 inline-block shrink-0" style={{ backgroundColor: row.color || "grey" }} />
                                            {row.name}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="size-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontalIcon className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <SmartDrawer>
                                                        <DropdownMenuItem asChild>
                                                            <SmartDrawerTrigger className="gap-2 w-full">
                                                                <PencilIcon className="text-muted-foreground size-5" />
                                                                Edit name
                                                            </SmartDrawerTrigger>
                                                        </DropdownMenuItem>
                                                        <SmartDrawerContent className="sm:max-w-[425px]">
                                                            <SmartDrawerHeader>
                                                                <SmartDrawerTitle>Edit Category</SmartDrawerTitle>
                                                                <SmartDrawerDescription>Enter the new name and hex color</SmartDrawerDescription>
                                                            </SmartDrawerHeader>

                                                            <CreateCategoryForm mailboxId={params.mailbox} name={row.name} id={row.id} color={row.color} />

                                                            <SmartDrawerFooter className="pt-2 flex sm:hidden">
                                                                <SmartDrawerClose asChild>
                                                                    <Button variant="secondary">Cancel</Button>
                                                                </SmartDrawerClose>
                                                            </SmartDrawerFooter>
                                                        </SmartDrawerContent>
                                                    </SmartDrawer>

                                                    <SmartDrawer>
                                                        <DropdownMenuItem className="flex gap-2 w-full" asChild>
                                                            <SmartDrawerTrigger>
                                                                <Trash2Icon className="text-muted-foreground size-5" />
                                                                Delete category
                                                            </SmartDrawerTrigger>
                                                        </DropdownMenuItem>

                                                        <SmartDrawerContent className="sm:max-w-[425px]">
                                                            <SmartDrawerHeader>
                                                                <SmartDrawerTitle>Delete Category</SmartDrawerTitle>
                                                                <SmartDrawerDescription>
                                                                    Are you sure you want to delete <strong>{row.name}</strong>.
                                                                    This will NOT delete any emails in this category.
                                                                </SmartDrawerDescription>
                                                            </SmartDrawerHeader>
                                                            <SmartDrawerFooter className="pt-2 flex">
                                                                <SmartDrawerClose className={buttonVariants({ variant: "secondary" })}>Cancel</SmartDrawerClose>
                                                                <DeleteButton action={deleteCategory.bind(null, params.mailbox, row.id)} />
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
                                    <TableCell className="h-24 text-center" colSpan={2}>
                                        No categories yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="max-w-[40rem]">
                <div className="flex pb-2">
                    <h2 className="text-lg font-semibold">Custom domains <span className="text-muted-foreground text-sm">({mailbox.customDomains.length}/3)</span></h2>
                    <SmartDrawer>
                        <SmartDrawerTrigger asChild>
                            <Button
                                disabled={mailbox.customDomains.length >= customDomainLimit[mailbox.plan]}
                                className="ms-auto flex gap-2"
                                size="sm"
                                variant="secondary"
                            >
                                <PlusIcon className='size-4' /> Add new domain
                            </Button>
                        </SmartDrawerTrigger>
                        <SmartDrawerContent className="sm:max-w-[425px]">
                            <AddCustomDomainForm mailboxId={params.mailbox} cfWorkerCode={cfWorkerCode} />
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
                                                    <Button variant="ghost" className="size-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontalIcon className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <SmartDrawer>
                                                        <DropdownMenuItem className="flex gap-2 w-full" asChild>
                                                            <SmartDrawerTrigger>
                                                                <Trash2Icon className="text-muted-foreground size-5" />
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


                                                    <SmartDrawer>
                                                        <DropdownMenuItem asChild>
                                                            <SmartDrawerTrigger className="w-full">
                                                                Setup again
                                                            </SmartDrawerTrigger>
                                                        </DropdownMenuItem>
                                                        <SmartDrawerContent className="sm:max-w-[425px]">
                                                            <AddCustomDomainForm mailboxId={params.mailbox} cfWorkerCode={cfWorkerCode} initialDomain={row.domain} />
                                                        </SmartDrawerContent>
                                                    </SmartDrawer>

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
                                <PlusIcon className='size-4' /> Create new token
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
                                                    <Trash2Icon className="size-5" />
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
                                    <TableCell className="h-24 text-center" colSpan={4}>
                                        No tokens yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <br />
                If you would like to send emails via the API, see the documentation here: <a href="/docs/api" target="_blank" className="font-bold hover:underline">API Documentation</a>
                <br />
            </div>

            <div className="max-w-[40rem]">
                <div className="flex pb-2">
                    <h2 className="text-lg font-semibold">Users <span className="text-muted-foreground text-sm">({mailbox.users.length}/5)</span></h2>
                    <SmartDrawer>
                        <SmartDrawerTrigger asChild>
                            <Button className="ms-auto flex gap-2" size="sm" variant="secondary" disabled={userRole !== "OWNER"}>
                                <PlusIcon className='size-4' /> Invite user
                            </Button>
                        </SmartDrawerTrigger>
                        <SmartDrawerContent className="sm:max-w-[425px]">
                            <SmartDrawerHeader>
                                <SmartDrawerTitle>Invite user</SmartDrawerTitle>
                                <SmartDrawerDescription>Enter their username and the chosen role type</SmartDrawerDescription>
                            </SmartDrawerHeader>

                            <InviteUserForm mailboxId={params.mailbox} />

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
                                    <p>Username</p>
                                </TableHead>
                                <TableHead className="bg-tertiary">
                                    <p>Added</p>
                                </TableHead>
                                <TableHead className="bg-tertiary w-1">
                                    <p>Role</p>
                                </TableHead>
                                <TableHead className="bg-tertiary rounded-se-md w-1" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mailbox.users.length ? (
                                mailbox.users.map((row) => (
                                    <TableRow key={row.userId}>
                                        <TableCell className="font-medium py-3">
                                            {row.user.username}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <LocalTime time={row.joinedAt} />
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Select defaultValue={row.role || "ADMIN"} disabled={userRole !== "OWNER" || row.role === "OWNER"}>
                                                <SelectTrigger className="w-[125px]">
                                                    <SelectValue placeholder="Role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="OWNER" disabled>Owner</SelectItem>
                                                    <SelectItem value="ADMIN" disabled={row.userId === userId}>Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="size-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontalIcon className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {row.userId === userId ? (
                                                        <SmartDrawer>
                                                            <DropdownMenuItem asChild disabled={row.role === "OWNER"}>
                                                                <SmartDrawerTrigger className="gap-2 w-full">
                                                                    <UserRoundXIcon className="size-5" />
                                                                    Leave mailbox
                                                                </SmartDrawerTrigger>
                                                            </DropdownMenuItem>

                                                            <SmartDrawerContent className="sm:max-w-[425px]">
                                                                <SmartDrawerHeader>
                                                                    <SmartDrawerTitle>Leave Mailbox</SmartDrawerTitle>
                                                                    <SmartDrawerDescription>
                                                                        Are you sure you want to leave this mailbox. You will require an invite to join again.
                                                                    </SmartDrawerDescription>
                                                                </SmartDrawerHeader>
                                                                <SmartDrawerFooter className="pt-2 flex">
                                                                    <SmartDrawerClose className={buttonVariants({ variant: "secondary" })}>Cancel</SmartDrawerClose>
                                                                    <DeleteButton action={leaveMailbox.bind(null, params.mailbox)} text="Leave" />
                                                                </SmartDrawerFooter>
                                                            </SmartDrawerContent>
                                                        </SmartDrawer>
                                                    ) : (
                                                        <SmartDrawer>
                                                            <DropdownMenuItem asChild disabled={row.role === "OWNER" || userRole !== "OWNER"}>
                                                                <SmartDrawerTrigger className="gap-2 w-full">
                                                                    <UserRoundXIcon className="size-5" />
                                                                    Remove user
                                                                </SmartDrawerTrigger>
                                                            </DropdownMenuItem>

                                                            <SmartDrawerContent className="sm:max-w-[425px]">
                                                                <SmartDrawerHeader>
                                                                    <SmartDrawerTitle>Remove User</SmartDrawerTitle>
                                                                    <SmartDrawerDescription>
                                                                        Are you sure you want to remove <strong>{row.user.username}</strong>&apos;s access to this mailbox.
                                                                    </SmartDrawerDescription>
                                                                </SmartDrawerHeader>
                                                                <SmartDrawerFooter className="pt-2 flex">
                                                                    <SmartDrawerClose className={buttonVariants({ variant: "secondary" })}>Cancel</SmartDrawerClose>
                                                                    <DeleteButton action={removeUserFromMailbox.bind(null, params.mailbox, row.userId)} text="Remove User" />
                                                                </SmartDrawerFooter>
                                                            </SmartDrawerContent>
                                                        </SmartDrawer>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                        </TableCell>

                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell className="h-24 text-center" colSpan={4}>
                                        No users yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div >
            <br />
        </div >

    )
}


function hideToken(token: string) {
    const newToken = `et_`
    if (!token.startsWith(newToken)) return token.slice(0, 4) + '......' + token.slice(-4)
    // show first 4 and last 4 characters
    return token.slice(0, newToken.length + 4) + '......' + token.slice(-4)
}


const cfWorkerCodeText = readFileSync("./public/cloudflare-worker.js", "utf-8")
const cfWorkerCode = (
    <>
        <Button className="absolute right-6 m-2 shadow-md" size="sm" variant="secondary" asChild>
            <CopyButton text={cfWorkerCodeText}>
                <ClipboardIcon className="size-4" />
            </CopyButton>
        </Button>

        <div className="overflow-auto max-h-52 bg-[#17171e] p-2 rounded-md text-sm" dangerouslySetInnerHTML={{
            __html:
                await codeToHtml(
                    cfWorkerCodeText,
                    {
                        lang: "javascript",
                        theme: "github-dark",
                        mergeWhitespaces: true,
                        transformers: [
                            {
                                line(node, line) {
                                    this.addClassToHast(node, ["break-words", ""]);
                                },
                                pre(hast) {
                                    this.addClassToHast(hast, "!bg-transparent");
                                },
                            },
                        ],
                    }
                )
        }} />
    </>
)
