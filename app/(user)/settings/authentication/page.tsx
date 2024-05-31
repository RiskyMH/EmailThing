import { getCurrentUser } from "@/utils/jwt";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CardForm, ClientInput } from "../../components.client";
import { changeBackupEmail, changePassword, changeUsername, deletePasskey } from "../../actions";
import { eq } from "drizzle-orm";
import { db, User } from "@/db";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, Trash2Icon, TrashIcon } from "lucide-react";
import { SmartDrawer, SmartDrawerClose, SmartDrawerContent, SmartDrawerDescription, SmartDrawerFooter, SmartDrawerHeader, SmartDrawerTitle, SmartDrawerTrigger } from "@/components/ui/smart-drawer";
import { DeleteButton } from "@/(email)/mail/[mailbox]/config/components.client";
import LocalTime from "@/components/localtime";
import PasskeysSetup from "./passkeys.client";

export const metadata = {
    title: "User Settings",
} satisfies Metadata


export default async function UserSettingsPage() {
    const userId = await getCurrentUser();
    if (!userId) return redirect("/login?from=/settings");

    const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            id: true,
            backupEmail: true,
            username: true
        },
        with: {
            passkeys: true
        }
    })
    if (!user) return notFound();

    return (
        <>
            <div className="flex flex-col gap-1.5">
                <CardTitle>Authentication</CardTitle>
                <CardDescription>
                    Change your password or create a passkey.
                </CardDescription>
            </div>

            <Card>
                <CardForm action={changePassword} subtitle="Please set a secure password.">
                    <CardHeader>
                        <CardTitle>Password</CardTitle>
                        <CardDescription>
                            Used to login and access your mailboxes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Label htmlFor="password">Current password</Label>
                        <ClientInput
                            name="password"
                            id="password"
                            className="border-none bg-background sm:w-[300px] w-full"
                            required
                            type="password"
                            autoComplete="password"
                        />

                        <Label htmlFor="new-password">New password</Label>
                        <ClientInput
                            name="new-password"
                            id="new-password"
                            className="border-none bg-background sm:w-[300px] w-full"
                            required
                            type="password"
                            autoComplete="new-password"
                        />

                    </CardContent>
                </CardForm>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Passkeys</CardTitle>
                    <CardDescription>
                        The new fancy way of signing in.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="border-muted-foreground/30 border rounded-md bg-background">
                        <Table>
                            <TableHeader className="sr-only">
                                <TableRow>
                                    <TableHead>
                                        <p>Name</p>
                                    </TableHead>
                                    <TableHead className="w-1" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {user.passkeys.map(p => (
                                    <TableRow key={p.id} className="border-muted-foreground/30">
                                        <TableCell>{p.name}</TableCell>
                                        <TableCell className="ms-auto text-end flex gap-2 float-end">
                                            <LocalTime time={p.createdAt} className="text-muted-foreground self-center" type="ago" />

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontalIcon className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <SmartDrawer>
                                                        <DropdownMenuItem asChild>
                                                            <SmartDrawerTrigger className="text-red flex gap-2">
                                                                <Trash2Icon className="h-4 w-4" /> Delete Passkey
                                                            </SmartDrawerTrigger>
                                                        </DropdownMenuItem>

                                                        <SmartDrawerContent className="sm:max-w-[425px]">
                                                            <SmartDrawerHeader>
                                                                <SmartDrawerTitle>Delete Passkey</SmartDrawerTitle>
                                                                <SmartDrawerDescription>
                                                                    Are you sure you want to delete the passkey <strong>{p.name}</strong>.
                                                                </SmartDrawerDescription>
                                                            </SmartDrawerHeader>
                                                            <SmartDrawerFooter className="pt-2 flex">
                                                                <SmartDrawerClose className={buttonVariants({ variant: "secondary" })}>Cancel</SmartDrawerClose>
                                                                <DeleteButton action={deletePasskey.bind(null, p.id)} />
                                                            </SmartDrawerFooter>
                                                        </SmartDrawerContent>
                                                    </SmartDrawer>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                    </div>
                    <PasskeysSetup
                        userId={userId}
                        username={user.username}
                    />
                </CardContent>
                <CardFooter className="border-muted-foreground/30 border-t px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                        Something something passkeys!
                    </span>

                    {/* <Button type="submit" className="ms-auto" size="sm">Create new</Button> */}
                </CardFooter>
            </Card>

            <Card>
                <CardForm action={changeBackupEmail} subtitle="Please ensure you have access to this email.">
                    <CardHeader>
                        <CardTitle>Backup Email</CardTitle>
                        <CardDescription>
                            Enter the email addresses you want to use to be able reset password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ClientInput
                            name="email"
                            id="email"
                            className="border-none bg-background sm:w-[300px] w-full"
                            defaultValue={user.backupEmail || undefined}
                            maxLength={20}
                            minLength={4}
                            required
                            placeholder="emailthing@gmail.com"
                        />
                    </CardContent>
                </CardForm>
            </Card>

        </>
    );
}

