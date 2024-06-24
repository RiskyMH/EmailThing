'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyIcon, Loader2 } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { makeTempEmail } from "./actions";
import { SmartDrawerHeader, SmartDrawerTitle, SmartDrawerDescription, SmartDrawerFooter, SmartDrawerClose } from "@/components/ui/smart-drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CopyButton from "@/components/copy-button.client";

export function CreateTempEmailForm({ mailboxId, domains = ["temp.emailthing.xyz"] }: { mailboxId: string, domains?: string[] }) {
    const [isPending, startTransition] = useTransition();
    const [tempEmail, setTempEmail] = useState<string | null>(null);

    const formSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isPending) return;

        startTransition(async () => {
            // @ts-expect-error
            const res = await makeTempEmail(mailboxId, event.target.domain.value, event.target.name.value)
            if (res?.error) {
                toast.error(res.error)
            } else {
                setTempEmail(res!.alias!)
            }
        })

    }

    return (
        tempEmail ? (
            <>
                <SmartDrawerHeader>
                    <SmartDrawerTitle>Create Temp Email</SmartDrawerTitle >
                    <SmartDrawerDescription>An expiring email. The emails received will also be deleted after a day.</SmartDrawerDescription>
                </SmartDrawerHeader>

                <div className="grid items-start gap-4 px-4 sm:px-0">
                    <Label htmlFor="alias">Your new email:</Label>
                    <div className="flex items-center gap-2">
                        <Input className="bg-secondary border-none" name="alias" value={tempEmail} id="alias" readOnly disabled={isPending} />
                        <Button type="submit" size="sm" className="px-3" asChild>
                            <CopyButton text={tempEmail}>
                                <span className="sr-only">Copy</span>
                                <CopyIcon className="size-4" />
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
                    <SmartDrawerTitle>Create Temp Email</SmartDrawerTitle >
                    <SmartDrawerDescription>An expiring email. The emails received will also be deleted after a day.</SmartDrawerDescription>
                </SmartDrawerHeader >

                <form className="grid items-start gap-4 px-4 sm:px-0" onSubmit={formSubmit}>
                    <div className="grid gap-2">
                        <Label htmlFor="domain">Domain</Label>
                        <Select name="domain" defaultValue="temp.emailthing.xyz">
                            <SelectTrigger className="bg-secondary border-none w-full">
                                <SelectValue placeholder="Select Domain" />
                            </SelectTrigger>
                            <SelectContent>
                                {domains.map((domain) => (
                                    <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Label htmlFor="name">Name</Label>
                        <Input className="bg-secondary border-none" autoFocus name="name" placeholder="John Doe" id="name" disabled={isPending} />
                    </div>
                    <Button type="submit" disabled={isPending} className="gap-2">
                        {isPending && <Loader2 className="size-5 text-muted-foreground animate-spin" />}
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
