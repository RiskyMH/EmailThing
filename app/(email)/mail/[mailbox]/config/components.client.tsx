'use client'

import { useState, useTransition, type FormEvent } from "react";
import { verifyDomain, addAlias, editAlias } from "./actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { SmartDrawerHeader, SmartDrawerTitle, SmartDrawerDescription } from "@/components/ui/smart-drawer";


export function AddCustomDomainForm({ mailboxId }: { mailboxId: string }) {
    const [isPending, startTransition] = useTransition();
    const [page, setPage] = useState<"form" | "verify">("form");
    const [domain, setDomain] = useState("");

    const verify = async () => {
        startTransition(async () => {
            const res = await verifyDomain(mailboxId, domain)
            if (res?.error) {
                toast.error(res.error)
            } else {
                document.getElementById("smart-drawer:close")?.click()
                toast("Domain verified!")
            }
        })
    }

    return (
        page === "form" ? (
            <>
                <SmartDrawerHeader>
                    <SmartDrawerTitle>Add Custom Domain</SmartDrawerTitle>
                    <SmartDrawerDescription>Enter your domain to begin</SmartDrawerDescription>
                </SmartDrawerHeader>

                <form
                    className="grid items-start gap-4 px-4 sm:px-0"
                    onSubmit={(event: any) => { setDomain(event.target.domain.value); setPage("verify") }}
                    autoComplete="off"
                >
                    <Input className="bg-secondary border-none" name="domain" placeholder="example.com" defaultValue={domain} id="domain" autoFocus disabled={isPending} required />
                    <Button type="submit" disabled={isPending} className="gap-2">
                        {/* {isPending && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />} */}
                        Next <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                </form>
            </>
        ) : (
            <>
                <SmartDrawerHeader>
                    <SmartDrawerTitle>Add Custom Domain</SmartDrawerTitle>
                    <SmartDrawerDescription>Now create a new DNS record</SmartDrawerDescription>
                </SmartDrawerHeader>

                <div className="grid items-start gap-4 px-4 sm:px-0">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input className="bg-secondary border-none" value={`_emailthing.${domain}`} id="name" readOnly />

                        <Label htmlFor="type">Type</Label>
                        <Input className="bg-secondary border-none" value="TXT" id="type" readOnly />

                        <Label htmlFor="value">Value</Label>
                        <Input className="bg-secondary border-none" value={`mailbox=${mailboxId}`} id="value" readOnly />
                    </div>

                    <div className="flex gap-2 sm:gap-4">
                        {/* <Button onClick={() => setPage("form")} className="gap-2" variant="secondary">
                            Back
                        </Button> */}
                        <Button onClick={verify} disabled={isPending} className="gap-2 w-full">
                            {isPending && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                            Verify domain
                        </Button>
                    </div>
                </div>
            </>
        )
    );
}

export function AddAliasForm({ mailboxId }: { mailboxId: string }) {
    const [isPending, startTransition] = useTransition();

    const formSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isPending) return;

        startTransition(async () => {
            // @ts-expect-error
            const res = await addAlias(mailboxId, event.target.alias.value, event.target.name.value)
            if (res?.error) {
                toast.error(res.error)
            } else {
                document.getElementById("smart-drawer:close")?.click()
            }
        })

    }

    return (
        <form className="grid items-start gap-4 px-4 sm:px-0" onSubmit={formSubmit}>
            <div className="grid gap-2">
                <Label htmlFor="password">Alias</Label>
                <Input className="bg-secondary border-none" name="alias" placeholder="me@example.com" id="alias" autoFocus disabled={isPending} required />

                <Label htmlFor="password">Name</Label>
                <Input className="bg-secondary border-none" name="name" placeholder="John Doe" id="name" disabled={isPending} />
            </div>
            <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                Add alias
            </Button>
        </form>
    );
}
export function EditAliasForm({ mailboxId, alias, name, id }: { mailboxId: string, alias: string, name: string | null, id: string }) {
    const [isPending, startTransition] = useTransition();

    const formSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isPending) return;

        startTransition(async () => {
            // @ts-expect-error
            const res = await editAlias(mailboxId, id, event.target.name.value || null)
            if (res?.error) {
                toast.error(res.error)
            } else {
                document.getElementById("smart-drawer:close")?.click()
            }
        })

    }

    return (
        <form className="grid items-start gap-4 px-4 sm:px-0" onSubmit={formSubmit}>
            <div className="grid gap-2">
                <Label htmlFor="password">Alias</Label>
                <Input className="bg-secondary border-none" name="alias" placeholder="me@example.com" id="alias" value={alias} readOnly disabled={true} />

                <Label htmlFor="password">Name</Label>
                <Input className="bg-secondary border-none" name="name" placeholder="John Doe" id="name" defaultValue={name || ''} disabled={isPending} autoFocus />
            </div>
            <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                Edit alias
            </Button>
        </form>
    );
}


export function DeleteButton({ action }: { action: () => Promise<any> }) {
    const [isPending, startTransition] = useTransition();

    const onClick = (event: any) => {
        event.preventDefault();
        if (isPending) return;

        startTransition(async () => {
            const res = await action()
            if (res?.error) {
                toast.error(res.error)
            } else {
                document.getElementById("smart-drawer:close")?.click()
            }
        })

    }

    return (
        <Button type="submit" disabled={isPending} className="gap-2" variant="destructive" onClick={onClick} autoFocus>
            {isPending && <Loader2 className="w-5 h-5  animate-spin" />}
            Delete
        </Button>
    );
}
