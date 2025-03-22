import { Table } from "@/components/ui/table";
// import type { hideToken } from "@/(email)/mail/[mailbox]/config/page";
import CopyButton from "@/components/copy-button.client";
import LocalTime from "@/components/localtime.client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SmartDrawer, SmartDrawerTrigger, SmartDrawerContent, SmartDrawerHeader, SmartDrawerTitle, SmartDrawerDescription, SmartDrawerFooter, SmartDrawerClose } from "@/components/ui/smart-drawer";
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { PlusIcon, Trash2Icon, CopyIcon, Loader2 } from "lucide-react";
import { useTransition, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { DeleteButton } from "./components.client";
import { useParams } from "react-router-dom";
import { getMailboxTokens, getMailbox } from "@/utils/data/queries/mailbox";
import { useLiveQuery } from "dexie-react-hooks";

const deleteToken = async (mailboxId: string, token: string) => {
    toast.info("Not implemented");
}

const makeToken = async (mailboxId: string, name: string) => {
    toast.info("Not implemented");
}

export default function APITokens() {
    const { mailboxId } = useParams<{ mailboxId: string }>();

    const data = useLiveQuery(
        () => Promise.all([getMailbox(mailboxId!), getMailboxTokens(mailboxId!)]),
        [mailboxId]
    );

    const [mailbox, tokens] = data ?? [];


    return (
        <div className="max-w-[40rem]">
            <div className="flex pb-2">
                <h2 className="font-semibold text-lg">API Tokens</h2>
                <SmartDrawer>
                    <SmartDrawerTrigger asChild>
                        <Button className="ms-auto flex gap-2" size="sm" variant="secondary" disabled={mailbox?.plan === "DEMO"}>
                            <PlusIcon className="size-4" /> Create new token
                        </Button>
                    </SmartDrawerTrigger>
                    <SmartDrawerContent className="sm:max-w-[425px]">
                        <CreateTokenForm mailboxId={mailboxId!} />
                    </SmartDrawerContent>
                </SmartDrawer>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="rounded-t-lg">
                            <TableHead className="rounded-ss-md bg-tertiary">
                                <p>Name</p>
                                {/* also includes somewhat token */}
                            </TableHead>
                            <TableHead className="bg-tertiary">
                                <p>Created</p>
                            </TableHead>
                            <TableHead className="bg-tertiary">
                                <p>Expires</p>
                            </TableHead>
                            <TableHead className="w-1 rounded-se-md bg-tertiary" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tokens?.length ? (
                            tokens.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="py-3 font-medium">
                                        {row.name ? (
                                            <div className="flex flex-col">
                                                <span>{row.name}</span>
                                                <code className="text-muted-foreground">
                                                    {/* {hideToken(row.token)} */}
                                                    {/* its hidden via api now */}
                                                    {row.token}
                                                </code>
                                            </div>
                                        ) : (
                                            <code className="justify-center">{row.token}</code>
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
                                            <SmartDrawerTrigger
                                                className={buttonVariants({
                                                    variant: "outline",
                                                    size: "icon-sm",
                                                    className:
                                                        "text-muted-foreground hover:border-destructive hover:text-destructive",
                                                })}
                                            >
                                                <Trash2Icon className="size-5" />
                                            </SmartDrawerTrigger>

                                            <SmartDrawerContent className="sm:max-w-[425px]">
                                                <SmartDrawerHeader>
                                                    <SmartDrawerTitle>Delete Token</SmartDrawerTitle>
                                                    <SmartDrawerDescription>
                                                        Are you sure you want to delete this token. This cannot be
                                                        undone.
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
                                                    <DeleteButton
                                                        action={deleteToken.bind(null, mailboxId!, row.token)}
                                                    />
                                                </SmartDrawerFooter>
                                            </SmartDrawerContent>
                                        </SmartDrawer>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell className={`h-24 text-center ${!data ? "fade-in" : ""}`} colSpan={4}>
                                    {data ? "No tokens yet." : <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto" />}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <br />
            If you would like to send emails via the API, see the documentation here:{" "}
            <a href="/docs/api" target="_blank" className="font-bold hover:underline" rel="noreferrer">
                API Documentation
            </a>
            <br />
        </div>

    )
}

export function CreateTokenForm({ mailboxId }: { mailboxId: string }) {
    const [isPending, startTransition] = useTransition();
    const [token, setToken] = useState<string | null>(null);

    const formSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isPending) return;

        startTransition(async () => {
            // @ts-expect-error
            const res = await makeToken(mailboxId, event.target.name.value);
            if (res?.error) {
                toast.error(res.error);
            } else {
                setToken(res?.token!);
            }
        });
    };

    return token ? (
        <>
            <SmartDrawerHeader>
                <SmartDrawerTitle>Create Token</SmartDrawerTitle>
                <SmartDrawerDescription>
                    A token to use with the API. This will only be shown once.
                </SmartDrawerDescription>
            </SmartDrawerHeader>

            <div className="grid items-start gap-4 px-4 sm:px-0">
                <Label htmlFor="alias">Your new token:</Label>
                <div className="flex items-center gap-2">
                    <Input
                        className="border-none bg-secondary font-mono"
                        name="token"
                        value={token}
                        id="token"
                        readOnly
                        disabled={isPending}
                    />
                    <Button type="submit" size="sm" className="px-3" asChild>
                        <CopyButton text={token}>
                            <span className="sr-only">Copy</span>
                            <CopyIcon className="size-4" />
                        </CopyButton>
                    </Button>
                </div>
            </div>
            <SmartDrawerFooter className="flex pt-2">
                <SmartDrawerClose asChild>
                    <Button variant="default" className="w-full">
                        Close
                    </Button>
                </SmartDrawerClose>
            </SmartDrawerFooter>
        </>
    ) : (
        <>
            <SmartDrawerHeader>
                <SmartDrawerTitle>Create Token</SmartDrawerTitle>
                <SmartDrawerDescription>A token to use with the API.</SmartDrawerDescription>
            </SmartDrawerHeader>

            <form className="grid items-start gap-4 px-4 sm:px-0" onSubmit={formSubmit}>
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        className="border-none bg-secondary"
                        autoFocus
                        name="name"
                        placeholder="Local dev"
                        id="name"
                        disabled={isPending}
                    />
                </div>
                <Button type="submit" disabled={isPending} className="gap-2">
                    {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
                    Create
                </Button>
            </form>

            <SmartDrawerFooter className="flex pt-2 sm:hidden">
                <SmartDrawerClose asChild>
                    <Button variant="secondary" className="w-full">
                        Cancel
                    </Button>
                </SmartDrawerClose>
            </SmartDrawerFooter>
        </>
    );
}

