import LocalTime from "@/components/localtime.client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
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
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import { CardForm, ClientInput } from "./components";
import { getMe, getPasskeys } from "@/utils/data/queries/user";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { DeleteButton } from "../compose/editor.client";
import changeUserSettings from "./api";

const changePassword =  (_: any, formData: FormData) => {
    return changeUserSettings("change-password", {
        oldPassword: formData.get("password") as string,
        newPassword: formData.get("new-password") as string,
    })
}

const changeBackupEmail =  (_: any, formData: FormData) => {
    return changeUserSettings("change-backup-email", {
        email: formData.get("email") as string,
    })
}

const deletePasskey = async (id: string) => {
    toast.info("todo")
}

const addPasskey = async (cred: any, name: string) => {
    toast.info("todo")
}


export default function UserSettingsAuthentication() {
    const data = useLiveQuery(async () => {
        return Promise.all([
            getMe(),
            getPasskeys(),
        ])
    })

    const [user, passkeys] = data ?? []

    return (
        <>
            <div className="flex flex-col gap-1.5">
                <CardTitle>Authentication</CardTitle>
                <CardDescription>Change your password or create a passkey.</CardDescription>
            </div>

            <Card>
                <CardForm action={changePassword} subtitle="Please set a secure password.">
                    <CardHeader>
                        <CardTitle>Password</CardTitle>
                        <CardDescription>Used to login and access your mailboxes.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Label htmlFor="password">Current password</Label>
                        <ClientInput
                            name="password"
                            id="password"
                            className="w-full border-none bg-background sm:w-[300px]"
                            required
                            type="password"
                            autoComplete="password"
                        />

                        <Label htmlFor="new-password">New password</Label>
                        <ClientInput
                            name="new-password"
                            id="new-password"
                            className="w-full border-none bg-background sm:w-[300px]"
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
                    <CardDescription>The new fancy way of signing in.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="rounded-md border border-muted-foreground/30 bg-background">
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
                                {passkeys?.map((p) => (
                                    <TableRow key={p.id} className="border-muted-foreground/30">
                                        <TableCell>{p.name}</TableCell>
                                        <TableCell className="float-end ms-auto flex gap-2 text-end">
                                            <LocalTime
                                                time={p.createdAt}
                                                className="self-center text-muted-foreground"
                                                type="ago"
                                            />

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
                                                            <SmartDrawerTrigger className="flex gap-2 text-red">
                                                                <Trash2Icon className="size-4" /> Delete Passkey
                                                            </SmartDrawerTrigger>
                                                        </DropdownMenuItem>

                                                        <SmartDrawerContent className="sm:max-w-[425px]">
                                                            <SmartDrawerHeader>
                                                                <SmartDrawerTitle>Delete Passkey</SmartDrawerTitle>
                                                                <SmartDrawerDescription>
                                                                    Are you sure you want to delete the passkey{" "}
                                                                    <strong>{p.name}</strong>.
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
                    <PasskeysSetup userId={user?.id || ''} username={user?.username || ''} />
                </CardContent>
                <CardFooter className="border-muted-foreground/30 border-t px-6 py-4">
                    <span className="text-muted-foreground text-sm">Something something passkeys!</span>

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
                            className="w-full border-none bg-background sm:w-[300px]"
                            defaultValue={user?.backupEmail || undefined}
                            maxLength={100}
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



"use client";

import { create, parseCreationOptionsFromJSON, supported } from "@github/webauthn-json/browser-ponyfill";
import { KeyRoundIcon, Loader2Icon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
// import { UAParser } from "ua-parser-js";

export function PasskeysSetup({ userId, username }: { userId: string; username: string }) {
    const [isPending, startTransition] = useTransition();

    const [support, setSupport] = useState(false);
    useEffect(() => {
        setSupport(supported());
    }, []);

    const handleCreate = () => {
        (async () => {
            const { UAParser } = await import("ua-parser-js")
            console.log(new UAParser(navigator.userAgent).getResult())
        })().catch(e => { console.error(e); toast.error("Failed to get user agent") })

        if (!userId || !username) return toast.error("No user ID or username...?");
        startTransition(async () => {
            try {
                const cred = await create(
                    parseCreationOptionsFromJSON({
                        publicKey: {
                            // challenge: Buffer.from(userId).toString("base64"),
                            challenge: btoa(userId),
                            rp: {
                                // These are seen by the authenticator when selecting which key to use
                                name: "EmailThing",
                                id: window.location.hostname,
                            },
                            user: {
                                // id: Buffer.from(userId).toString("base64"),
                                id: btoa(userId),
                                name: username,
                                displayName: username,
                            },
                            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                            timeout: 60000,
                            attestation: "direct",
                            authenticatorSelection: {
                                residentKey: "required",
                                userVerification: "required",
                            },
                        },
                    }),
                );

                if (!cred) {
                    return void toast.error("Failed to create Passkey");
                }
                // const ua = new (await import("ua-parser-js")).UAParser(navigator.userAgent).getResult();
                const ua = { browser: { name: "A Browser" }, os: { name: "An OS" } }
                const res = await addPasskey(cred.toJSON(), `${ua.browser.name} on ${ua.os.name}`);
                if (res?.error) {
                    return void toast.error(res.error);
                }
                toast("Successfully set up passkey!");
            } catch (err) {
                console.error(err);
                toast.error("Failed to create Passkey");
            }
        });
    };

    return (
        <Button
            type="button"
            variant="outline"
            onClick={handleCreate}
            disabled={isPending || !support}
            className="w-min border-0"
        >
            {isPending ? (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
            ) : (
                <KeyRoundIcon className="mr-2 size-4" />
            )}
            Create new
        </Button>
    );
}
