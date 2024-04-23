'use client'

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { verifyDomain, addAlias, editAlias, makeToken, createCategory, editCategory } from "./actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, CopyIcon, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { SmartDrawerHeader, SmartDrawerTitle, SmartDrawerDescription, SmartDrawerClose, SmartDrawerFooter } from "@/components/ui/smart-drawer";
import CopyButton from "@/components/copy-button.client";


export function AddCustomDomainForm({ mailboxId, cfWorkerCode, initialDomain = "" }: { mailboxId: string, cfWorkerCode: ReactNode, initialDomain?: string }) {
    const [isPending, startTransition] = useTransition();
    const [page, setPage] = useState<"form" | "verify" | "spf" | "cf-worker-code" | "token" | "finish">(initialDomain ? "spf" : "form");
    const [domain, setDomain] = useState(initialDomain);
    const [token, setToken] = useState<string | null>(null);

    const verify = async () => {
        startTransition(async () => {
            const res = await verifyDomain(mailboxId, domain)
            if (res?.error) {
                toast.error(res.error)
            } else {
                setPage('spf')
                // document.getElementById("smart-drawer:close")?.click()
                toast("Domain verified!")
            }
        })
    }

    const cToken = async () => {
        if (token) return
        startTransition(async () => {
            const token = await makeToken(mailboxId, `Cloudflare Worker (${domain})`)
            setToken(token!.token!)
        })
    }

    // todo: add a way for user to add custom dkim config

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
                    <Button type="submit" disabled={isPending} className="gap-2" autoFocus>
                        {/* {isPending && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />} */}
                        Next <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                </form>
            </>
        ) : page === "verify" ? (
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
        ) : page === "spf" ? (
            <>
                <SmartDrawerHeader>
                    <SmartDrawerTitle>Add SPF Records <span className="text-muted-foreground">(1/4)</span></SmartDrawerTitle>
                    <SmartDrawerDescription>Please add the following TXT DNS records to allow sending</SmartDrawerDescription>
                </SmartDrawerHeader>

                <div className="grid items-start gap-4 px-4 sm:px-0">
                    <div className="grid gap-2">
                        <Label htmlFor="spf">
                            <code className="text-muted-foreground font-semibold">TXT</code> {domain}
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input className="bg-secondary border-none" value="v=spf1 include:_spf.mx.cloudflare.net include:relay.mailchannels.net -all" id="spf" readOnly />
                            <Button size="sm" className="px-3" asChild>
                                <CopyButton text="v=spf1 include:_spf.mx.cloudflare.net include:relay.mailchannels.net -all">
                                    <span className="sr-only">Copy</span>
                                    <CopyIcon className="h-4 w-4" />
                                </CopyButton>
                            </Button>
                        </div>

                        <Label htmlFor="_mailchannels">
                            <code className="text-muted-foreground font-semibold">TXT</code> <span className="text-muted-foreground">_mailchannels.</span>{domain}
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input className="bg-secondary border-none" value="v=mc1 cfid=riskymh.workers.dev" id="_mailchannels" readOnly />
                            <Button size="sm" className="px-3" asChild>
                                <CopyButton text="v=mc1 cfid=riskymh.workers.dev">
                                    <span className="sr-only">Copy</span>
                                    <CopyIcon className="h-4 w-4" />
                                </CopyButton>
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2 sm:gap-4">
                        <Button onClick={() => setPage("verify")} className="gap-2" variant="secondary" disabled>
                            <ChevronLeftIcon className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => setPage("cf-worker-code")} className="gap-2 w-full">
                            Continue
                        </Button>
                    </div>
                </div>
            </>

        ) : page === "cf-worker-code" ? (
            <>
                <SmartDrawerHeader>
                    <SmartDrawerTitle>Create Cloudflare Email Worker <span className="text-muted-foreground">(2/4)</span></SmartDrawerTitle>
                    <SmartDrawerDescription>
                        To receive emails create a catch-all {" "}
                        <a href="https://developers.cloudflare.com/email-routing/email-workers/enable-email-workers/" target="_blank" rel="noreferrer" className="font-bold hover:underline">
                            email worker
                        </a> for your domain with the following code:
                    </SmartDrawerDescription>
                </SmartDrawerHeader>

                <div className="grid items-start gap-4 px-4 sm:px-0">
                    {cfWorkerCode}

                    <div className="flex gap-2 sm:gap-4">
                        <Button onClick={() => setPage("spf")} className="gap-2" variant="secondary">
                            <ChevronLeftIcon className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => { setPage("token"); cToken() }} className="gap-2 w-full">
                            Continue
                        </Button>
                    </div>
                </div>

            </>
        ) : page === "token" ? (
            <>
                <SmartDrawerHeader>
                    <SmartDrawerTitle>Create API Token <span className="text-muted-foreground">(3/4)</span></SmartDrawerTitle>
                    <SmartDrawerDescription>Add the <code className="font-semibold">token</code> environment variable to your worker</SmartDrawerDescription>
                </SmartDrawerHeader>

                <div className="grid items-start gap-4 px-4 sm:px-0">
                    <Label htmlFor="alias">Your new token:</Label>
                    <div className="flex items-center gap-2">
                        {token ? (
                            <>
                                <Input className="bg-secondary border-none font-mono" name="token" value={token} id="token" readOnly />
                                <Button type="submit" size="sm" className="px-3" asChild>
                                    <CopyButton text={token}>
                                        <span className="sr-only">Copy</span>
                                        <CopyIcon className="h-4 w-4" />
                                    </CopyButton>
                                </Button>
                            </>
                        ) : (
                            <div className="h-10">
                                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 sm:gap-4">
                        <Button onClick={() => setPage("cf-worker-code")} className="gap-2" variant="secondary">
                            <ChevronLeftIcon className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => setPage("finish")} className="gap-2 w-full">
                            Continue
                        </Button>
                    </div>
                </div>
            </>

        ) : page === "finish" ? (
            <>
                <SmartDrawerHeader>
                    <SmartDrawerTitle>Custom Domain <span className="text-muted-foreground">(4/4)</span></SmartDrawerTitle>
                    <SmartDrawerDescription>You have successfully added <code className="font-semibold">{domain}</code> to your account.</SmartDrawerDescription>
                </SmartDrawerHeader>

                <div className="grid items-start gap-4 px-4 sm:px-0">
                    <p>
                        If you have any issues or questions, you can join our {" "}
                        <a href="https://discord.gg/GT9Q2Yz4VS" target="_blank" rel="noreferrer" className="font-bold hover:underline">
                            Discord server
                        </a>.
                    </p>

                    <div className="flex gap-2 sm:gap-4">
                        <Button onClick={() => setPage("token")} className="gap-2" variant="secondary">
                            <ChevronLeftIcon className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => document.getElementById("smart-drawer:close")?.click()} className="gap-2 w-full">
                            Close
                        </Button>
                    </div>
                </div>
            </>

        ) : (
            "uhh this isnt meant to happen"
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

export function CreateTokenForm({ mailboxId }: { mailboxId: string }) {
    const [isPending, startTransition] = useTransition();
    const [token, setToken] = useState<string | null>(null);

    const formSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isPending) return;

        startTransition(async () => {
            // @ts-expect-error
            const res = await makeToken(mailboxId, event.target.name.value)
            if (res?.error) {
                toast.error(res.error)
            } else {
                setToken(res!.token!)
            }
        })

    }

    return (
        token ? (
            <>
                <SmartDrawerHeader>
                    <SmartDrawerTitle>Create Token</SmartDrawerTitle>
                    <SmartDrawerDescription>A token to use with the API. This will only be shown once.</SmartDrawerDescription>
                </SmartDrawerHeader>

                <div className="grid items-start gap-4 px-4 sm:px-0">
                    <Label htmlFor="alias">Your new token:</Label>
                    <div className="flex items-center gap-2">
                        <Input className="bg-secondary border-none font-mono" name="token" value={token} id="token" readOnly disabled={isPending} />
                        <Button type="submit" size="sm" className="px-3" asChild>
                            <CopyButton text={token}>
                                <span className="sr-only">Copy</span>
                                <CopyIcon className="h-4 w-4" />
                            </CopyButton>
                        </Button>
                    </div>
                </div>
                <SmartDrawerFooter className="pt-2 flex">
                    <SmartDrawerClose asChild>
                        <Button variant="default" className="w-full">Close</Button>
                    </SmartDrawerClose>
                </SmartDrawerFooter>
            </>
        ) : (
            <>
                <SmartDrawerHeader>
                    <SmartDrawerTitle>Create Token</SmartDrawerTitle>
                    <SmartDrawerDescription>A token to use with the API.</SmartDrawerDescription>
                </SmartDrawerHeader >

                <form className="grid items-start gap-4 px-4 sm:px-0" onSubmit={formSubmit}>
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input className="bg-secondary border-none" autoFocus name="name" placeholder="Local dev" id="name" disabled={isPending} />
                    </div>
                    <Button type="submit" disabled={isPending} className="gap-2">
                        {isPending && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                        Create
                    </Button>
                </form>

                <SmartDrawerFooter className="pt-2 flex sm:hidden">
                    <SmartDrawerClose asChild>
                        <Button variant="secondary" className="w-full">Cancel</Button>
                    </SmartDrawerClose>
                </SmartDrawerFooter>
            </>
        )
    );
}


export function CreateCategoryForm({ mailboxId }: { mailboxId: string }) {
    const [isPending, startTransition] = useTransition();

    const formSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isPending) return;

        startTransition(async () => {
            // @ts-expect-error
            const res = await createCategory(mailboxId, event.target.name.value, event.target.color?.value)
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
                <Label htmlFor="name">Name</Label>
                <Input className="bg-secondary border-none" name="name" placeholder="Work" id="name" autoFocus disabled={isPending} required />

                <Label htmlFor="name">Color</Label>
                <Input className="bg-secondary border-none" name="color" placeholder="#000000" id="color" disabled={isPending} />
            </div>
            <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                Create category
            </Button>
        </form>
    );
}

export function EditCategoryForm({ mailboxId, id, name, color }: { mailboxId: string, id: string, name: string, color: string | null }) {
    const [isPending, startTransition] = useTransition();

    const formSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isPending) return;

        startTransition(async () => {
            // @ts-expect-error
            const res = await editCategory(mailboxId, id, event.target.name.value, event.target.color?.value)
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
                <Label htmlFor="name">Name</Label>
                <Input className="bg-secondary border-none" name="name" placeholder="Work" id="name" defaultValue={name} autoFocus disabled={isPending} required />

                <Label htmlFor="name">Color</Label>
                <Input className="bg-secondary border-none" name="color" placeholder="#000000" id="color" defaultValue={color || ''} disabled={isPending} />
            </div>
            <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                Edit category
            </Button>
        </form>
    );
}
