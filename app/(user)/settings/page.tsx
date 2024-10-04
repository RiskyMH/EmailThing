import { getCurrentUser } from "@/utils/jwt";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CardForm, ClientInput, ClientSelect } from "../components.client";
import { changeUsername, changeEmail } from "../actions";
import { eq } from "drizzle-orm";
import { db, User } from "@/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { userMailboxes } from "@/(email)/mail/[mailbox]/tools";
import { SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        }
    })
    if (!user) return notFound();

    const mailboxes = await userMailboxes(userId);

    return (
        <>
            <Card>
                <CardForm action={changeEmail} subtitle="Please ensure you have access to the mailbox">
                    <CardHeader>
                        <CardTitle>Primary Email</CardTitle>
                        <CardDescription>
                            Your primary email will be used for account-related notifications and <a href="https://gravatar.com/profile/avatars" target="_blank" className="font-semibold hover:underline">Gravatar</a> profile picture.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ClientSelect name="email" required defaultValue={user.email}>
                            <SelectTrigger className="sm:w-[300px] w-full bg-background border-none">
                                <SelectValue placeholder="Select an email" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {/* <SelectLabel>Email</SelectLabel> */}
                                    {mailboxes.map(m => (
                                        <SelectItem key={m.id} value={m.name || m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </ClientSelect>
                    </CardContent>
                </CardForm>
            </Card>
            <Card>
                <CardForm action={changeUsername} subtitle="Please use 20 characters at maximum.">
                    <CardHeader>
                        <CardTitle>Username</CardTitle>
                        <CardDescription>
                            Used to login and access your mailboxes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ClientInput
                            name="new-name"
                            id="new-name"
                            className="border-none bg-background sm:w-[300px] w-full"
                            defaultValue={user.username}
                            maxLength={20}
                            minLength={4}
                            required
                            autoComplete="false"
                        />
                    </CardContent>
                </CardForm>
            </Card>

        </>
    );
}

