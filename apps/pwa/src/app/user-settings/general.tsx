import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardForm, ClientInput, ClientSelect } from "./components";
import { toast } from "sonner";
import { useLiveQuery } from "dexie-react-hooks";
import { getMe } from "@/utils/data/queries/user";
import { getUserMailboxes } from "@/utils/data/queries/mailbox";


async function changeEmail() {
    toast.info("todo")
}

async function changeUsername() {
    toast.info("todo")
}

export default function UserSettingsPage() {
    const data = useLiveQuery(async () => {
        return Promise.all([
            getMe(),
            getUserMailboxes().then(mailboxes => mailboxes.filter(m => m.id !== "demo")),
        ])
    })

    const [user, mailboxes] = data ?? []

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
                        {(user && mailboxes) ? (
                            <ClientSelect name="email" required defaultValue={user?.email}>
                                <SelectTrigger className="w-full border-none bg-background sm:w-[300px]">
                                    <SelectValue placeholder="Select an email" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {/* <SelectLabel>Email</SelectLabel> */}
                                        {mailboxes?.map((m) => (
                                            <SelectItem key={m.id} value={m.name || m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </ClientSelect>
                        ) : (
                            // somehow the way its undefined means it needs a full remount with full correct data
                            <div>
                                <ClientSelect name="email" required>
                                    <SelectTrigger className="w-full border-none bg-background sm:w-[300px]">
                                        <SelectValue placeholder="" />
                                    </SelectTrigger>
                                </ClientSelect>
                            </div>
                        )}
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
                            defaultValue={user?.username}
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
