import { getCurrentUser } from "@/utils/jwt";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CardForm, ClientInput, ClientSelect, ClientSwitch } from "../../components.client";
import { changeBackupEmail, changePassword, changePublicEmail, changePublicEmailStatus, changeUsername, deletePasskey } from "../../actions";
import { eq, inArray } from "drizzle-orm";
import { db, Email, MailboxAlias, User } from "@/db";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, Trash2Icon, TrashIcon } from "lucide-react";
import { SmartDrawer, SmartDrawerClose, SmartDrawerContent, SmartDrawerDescription, SmartDrawerFooter, SmartDrawerHeader, SmartDrawerTitle, SmartDrawerTrigger } from "@/components/ui/smart-drawer";
import { DeleteButton } from "@/(email)/mail/[mailbox]/config/components.client";
import LocalTime from "@/components/localtime";
import { Switch } from "@/components/ui/switch"
import { userMailboxes } from "@/(email)/mail/[mailbox]/tools";
import { SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
            username: true,
            email: true,
            publicContactPage: true,
            publicEmail: true
        },
    })
    if (!user) return notFound();

    const mailboxes = await userMailboxes(userId);
    const aliases = await db.query.MailboxAlias.findMany({
        where: inArray(MailboxAlias.mailboxId, mailboxes.map(e => e.id)),
        columns: {
            id: true,
            alias: true,
        }
    })

    return (
        <>
            <div className="flex flex-col gap-1.5">
                <CardTitle>EmailThing.me</CardTitle>
                <CardDescription>
                    A optional contact form you can make.
                    This can be useful to make it easier to get messages from people.
                </CardDescription>
            </div>

            <div className="gap-2 flex flex-row items-center justify-between rounded-lg bg-secondary p-4">
                <div className="flex gap-2 flex-col">
                    <Label htmlFor="enabled" className="text-xl font-semibold leading-none tracking-tight">Enable public page</Label>
                    <p className="text-muted-foreground text-sm">If you enable this, anyone will be able to send you email easier.</p>
                    {user.publicContactPage && (
                        // todo: fix with getting domain
                        // <a href={`https://emailthing.me/@${user.username}`} className="hover:text-blue underline text-sm transition-colors" target="_blank">
                        <a href={`https://emailthing.xyz/emailme/@${user.username}`} className="hover:text-blue underline text-sm transition-colors" target="_blank">
                            https://emailthing.me/@{user.username}
                        </a>
                    )}
                </div>
                {/* <Switch id="enabled" defaultChecked={emailmeEnabled} /> */}
                <form action={changePublicEmailStatus}>
                    <input name="enabled" value={user.publicContactPage ? "false" : "true"} hidden />
                    <ClientSwitch id="enabled" checked={!!user.publicContactPage} type="submit" />
                </form>
            </div>

            <Card className={!user.publicContactPage ? "opacity-50 cursor-not-allowed" : undefined}>
                <CardForm action={changePublicEmail} subtitle="This email is public, so choose wisely." disabled={!user.publicContactPage}>
                    <CardHeader>
                        <CardTitle>Public Email</CardTitle>
                        <CardDescription>
                            The email shown in contact page and the mailbox that will receive the emails.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ClientSelect name="email" required defaultValue={user.publicEmail || undefined} disabled={!user.publicContactPage}>
                            <SelectTrigger className="sm:w-[300px] w-full bg-background border-none">
                                <SelectValue placeholder="Select an email" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {/* <SelectLabel>Email</SelectLabel> */}
                                    {aliases.map(m => (
                                        <SelectItem key={m.id} value={m.alias}>{m.alias}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </ClientSelect>
                    </CardContent>
                </CardForm>
            </Card>

        </>
    );
}

