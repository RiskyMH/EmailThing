import Link from "next/link";
import { userAdminCheck } from "./tools";
import { cn } from "@/utils/tw";
import { Button, buttonVariants } from "@/components/ui/button";
import { CheckIcon, ChevronLeft, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import db, { MailboxAlias, User } from "@/db";
import { desc, count, eq } from "drizzle-orm";
import { SmartDrawer, SmartDrawerTrigger, SmartDrawerContent, SmartDrawerHeader, SmartDrawerTitle, SmartDrawerDescription, SmartDrawerFooter, SmartDrawerClose } from "@/components/ui/smart-drawer";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import LocalTime from "@/components/localtime";
import { Input } from "@/components/ui/input";


export default async function AdminPage() {
    const user = await userAdminCheck()

    const [users, usersCount, aliases, aliasesCount, defaultDomains] = await db.batch([
        db.query.User.findMany({
            orderBy: desc(User.createdAt),
            // limit: 5
        }),
        db.select({ count: count() }).from(User),

        db.query.MailboxAlias.findMany({
            orderBy: desc(MailboxAlias.createdAt),
            with: {
                mailbox: {
                    with: {
                        aliases: {
                            where: eq(MailboxAlias.default, true),
                            limit: 1
                        }
                    }
                }
            },
            // limit: 5
        }),
        db.select({ count: count() }).from(MailboxAlias),

        db.query.DefaultDomain.findMany()
    ])

    return (
            <div className="mx-auto w-full flex flex-col gap-3 sm:w-[750px] mt-16 mb-7">
                <h1 className="text-2xl text-center pb-2">The secret admin page!</h1>

                <div className="mb-3">
                    <h2 className="text-lg font-semibold">Users</h2>
                    <div className="flex items-center py-4 gap-4">
                        <Input
                            placeholder="Filter users..."
                            // value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
                            // onChange={(event) =>
                            //     table.getColumn("email")?.setFilterValue(event.target.value)
                            // }
                            className="max-w-sm border-none bg-secondary"
                        />
                        <SmartDrawer>
                            <SmartDrawerTrigger asChild>
                                <Button className="ms-auto flex gap-2" variant="secondary">
                                    <PlusIcon className='h-4 w-4' /> Invite User
                                </Button>
                            </SmartDrawerTrigger>
                            <SmartDrawerContent className="sm:max-w-[425px]">
                                <SmartDrawerHeader>
                                    <SmartDrawerTitle>Invite User</SmartDrawerTitle>
                                    <SmartDrawerDescription>Enter your chosen email and name to create alias</SmartDrawerDescription>
                                </SmartDrawerHeader>

                                {/* <AddAliasForm mailboxId={params.mailbox} /> */}

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
                                        <p>Username</p>
                                    </TableHead>
                                    <TableHead className="bg-tertiary w-1">
                                        <p>Created</p>
                                    </TableHead>
                                    <TableHead className="text-center bg-tertiary w-1">
                                        <p>Admin</p>
                                    </TableHead>
                                    <TableHead className="bg-tertiary rounded-se-md w-1" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length ? (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium py-3">
                                                {user.username}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <LocalTime time={user.createdAt} />
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {user.admin ? <CheckIcon className="h-4 w-4 mx-auto" /> : null}
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
                                                        <DropdownMenuItem>
                                                            Something
                                                        </DropdownMenuItem>
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
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            {users.length} of{" "}
                            {usersCount[0].count} users(s) visible.
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                // onClick={() => table.previousPage()}
                                // disabled={!table.getCanPreviousPage()}
                                disabled
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                            // onClick={() => table.nextPage()}
                            // disabled={!table.getCanNextPage()}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mb-3">
                    <h2 className="text-lg font-semibold">Aliases</h2>
                    <div className="flex items-center py-4 gap-4">
                        <Input
                            placeholder="Filter aliases..."
                            // value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
                            // onChange={(event) =>
                            //     table.getColumn("email")?.setFilterValue(event.target.value)
                            // }
                            className="max-w-sm border-none bg-secondary"
                        />
                    </div>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="bg-tertiary rounded-ss-md">
                                        <p>Alias</p>
                                    </TableHead>
                                    <TableHead className="bg-tertiary w-1">
                                        <p>Mailbox</p>
                                    </TableHead>
                                    <TableHead className="bg-tertiary w-1">
                                        <p>Created</p>
                                    </TableHead>
                                    <TableHead className="bg-tertiary rounded-se-md w-1" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {aliases.length ? (
                                    aliases.map((alias) => (
                                        <TableRow key={alias.id}>
                                            <TableCell className="py-3 font-medium">
                                                {alias.alias.endsWith("@emailthing.xyz") ? (
                                                    <>
                                                        <span className="font-bold">{alias.alias.slice(0, alias.alias.length - "@emailthing.xyz".length)}</span>
                                                        {"@emailthing.xyz"}
                                                    </>
                                                ) : (
                                                    alias.alias
                                                )}
                                                {/* {alias.alias} */}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {alias.mailbox?.aliases?.length ? alias.mailbox.aliases[0].alias : "No mailbox"}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <LocalTime time={alias.createdAt} />
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
                                                        <DropdownMenuItem>
                                                            Something
                                                        </DropdownMenuItem>
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
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            {aliases.length} of{" "}
                            {aliasesCount[0].count} alias(s) visible.
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                // onClick={() => table.previousPage()}
                                // disabled={!table.getCanPreviousPage()}
                                disabled
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                            // onClick={() => table.nextPage()}
                            // disabled={!table.getCanNextPage()}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mb-3">
                    <div className="flex items-center py-4 gap-4">
                        <h2 className="text-lg font-semibold">Default Domains</h2>
                        <SmartDrawer>
                            <SmartDrawerTrigger asChild>
                                <Button className="ms-auto flex gap-2" variant="secondary">
                                    <PlusIcon className='h-4 w-4' /> Add domain
                                </Button>
                            </SmartDrawerTrigger>
                            <SmartDrawerContent className="sm:max-w-[425px]">
                                <SmartDrawerHeader>
                                    <SmartDrawerTitle>Add default domain</SmartDrawerTitle>
                                    <SmartDrawerDescription>Enter the domain and wether to make it for temp</SmartDrawerDescription>
                                </SmartDrawerHeader>

                                {/* <AddAliasForm mailboxId={params.mailbox} /> */}

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
                                        <p>Domain</p>
                                    </TableHead>
                                    <TableHead className="text-center bg-tertiary w-1">
                                        <p>Temp</p>
                                    </TableHead>
                                    <TableHead className="bg-tertiary rounded-se-md w-1" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {defaultDomains.length ? (
                                    defaultDomains.map((domain) => (
                                        <TableRow key={domain.id}>
                                            <TableCell className="font-medium py-3">
                                                {domain.domain}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {domain.tempDomain ? <CheckIcon className="h-4 w-4 mx-auto" /> : null}
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
                                                        <DropdownMenuItem>
                                                            Something
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell className="h-24 text-center" colSpan={4}>
                                            No default domains yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
        </div>
    )
}