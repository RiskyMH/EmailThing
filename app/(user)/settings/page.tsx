import { userMailboxes } from "@/(email)/mail/[mailbox]/tools";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, db } from "@/db";
import { getCurrentUser } from "@/utils/jwt";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { changeEmail, changeUsername } from "../actions";
import { CardForm, ClientInput, ClientSelect } from "../components.client";

export const metadata = {
    title: "User Settings",
} satisfies Metadata;

export default async function UserSettingsPage() {
    const userId = await getCurrentUser();
    if (!userId) return redirect("/login?from=/settings");

    const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            id: true,
            username: true,
            email: true,
        },
    });
    if (!user) return notFound();

    const mailboxes = await userMailboxes(userId);

    return (
        <>
            <Card>
                <CardForm action={changeEmail} subtitle="Please ensure you have access to the mailbox">
                    <CardHeader>
                        <CardTitle>Primary Email</CardTitle>
                        <CardDescription>
                            Your primary email will be used for account-related notifications and{" "}
                            <a
                                href="https://gravatar.com/profile/avatars"
                                target="_blank"
                                className="font-semibold hover:underline"
                                rel="noreferrer"
                            >
                                Gravatar
                            </a>{" "}
                            profile picture.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ClientSelect name="email" required defaultValue={user.email}>
                            <SelectTrigger className="w-full border-none bg-background sm:w-[300px]">
                                <SelectValue placeholder="Select an email" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {/* <SelectLabel>Email</SelectLabel> */}
                                    {mailboxes.map((m) => (
                                        <SelectItem key={m.id} value={m.name || m.id}>
                                            {m.name}
                                        </SelectItem>
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
                        <CardDescription>Used to login and access your mailboxes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ClientInput
                            name="new-name"
                            id="new-name"
                            className="w-full border-none bg-background sm:w-[300px]"
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
