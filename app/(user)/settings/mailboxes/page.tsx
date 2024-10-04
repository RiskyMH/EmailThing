import { leaveMailbox } from "@/(email)/mail/[mailbox]/config/actions";
import { DeleteButton } from "@/(email)/mail/[mailbox]/config/components.client";
import { userMailboxes } from "@/(email)/mail/[mailbox]/tools";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import {
    SmartDrawer,
    SmartDrawerClose,
    SmartDrawerContent,
    SmartDrawerDescription,
    SmartDrawerFooter,
    SmartDrawerHeader,
    SmartDrawerTitle,
    SmartDrawerTrigger,
} from "@/components/ui/smart-drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser } from "@/utils/jwt";
import { gravatar } from "@/utils/tools";
import { PlusIcon, UserX2Icon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata = {
    title: "User Settings",
} satisfies Metadata;

export default async function UserSettingsPage() {
    const userId = await getCurrentUser();
    if (!userId) return redirect("/login?from=/settings");

    const mailboxes = await userMailboxes(userId);
    const mailboxess = await Promise.all(
        mailboxes.map(async (e) => ({
            ...e,
            icon: await gravatar(e.name || "no"),
        })),
    );

    return (
        <>
            <div className="flex">
                <div className="flex flex-col gap-1.5">
                    <CardTitle>Mailboxes</CardTitle>
                    <CardDescription>Leave and configure your mailboxes.</CardDescription>
                </div>
                <Button className="ms-auto flex gap-2" size="sm" variant="secondary" disabled>
                    <PlusIcon className="size-4" /> Create mailbox
                </Button>
            </div>
            <div className="rounded-md border border-muted-foreground/30 bg-secondary">
                <Table>
                    <TableHeader className="sr-only">
                        <TableRow>
                            <TableHead className="w-1" />
                            <TableHead>
                                <p>Name</p>
                            </TableHead>
                            <TableHead className="w-1" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mailboxess.map((p) => (
                            <TableRow key={p.id} className="border-muted-foreground/30">
                                <TableCell className="me-0 w-0">
                                    <Avatar className="size-8 rounded-full">
                                        <AvatarImage src={p.icon} alt={p.name || undefined} />
                                        <AvatarFallback className="bg-background transition-all dark:text-foreground">
                                            {(p.name || "AB")?.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </TableCell>

                                <TableCell className="flex flex-col">
                                    <span className="font-medium">{p.name}</span>
                                    <span className="text-muted-foreground">
                                        {p.role === "OWNER" ? "Owner" : "Admin"}
                                    </span>
                                </TableCell>

                                <TableCell className="w-0 gap-2 text-end">
                                    <SmartDrawer>
                                        <SmartDrawerTrigger
                                            className={buttonVariants({
                                                variant: "destructive",
                                                size: "icon-sm",
                                            })}
                                            disabled={p.role === "OWNER"}
                                        >
                                            <UserX2Icon className="size-4" />
                                        </SmartDrawerTrigger>

                                        <SmartDrawerContent className="sm:max-w-[425px]">
                                            <SmartDrawerHeader>
                                                <SmartDrawerTitle>Leave Mailbox</SmartDrawerTitle>
                                                <SmartDrawerDescription>
                                                    Are you sure you want to leave <strong>{p.name}</strong>
                                                    &lsquo;s mailbox. You will require an invite to join again.
                                                </SmartDrawerDescription>
                                            </SmartDrawerHeader>
                                            <SmartDrawerFooter className="flex pt-2">
                                                <SmartDrawerClose
                                                    className={buttonVariants({
                                                        variant: "secondary",
                                                    })}
                                                >
                                                    Cancel
                                                </SmartDrawerClose>
                                                <DeleteButton action={leaveMailbox.bind(null, p.id)} />
                                            </SmartDrawerFooter>
                                        </SmartDrawerContent>
                                    </SmartDrawer>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {/* <NewButton
                userId={userId}
            /> */}
        </>
    );
}
