'use client'

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDebouncedCallback } from 'use-debounce';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, SendIcon } from 'lucide-react';

export function BodyEditor({ saveAction, savedBody }: { saveAction: ({ body }: { body: string }) => Promise<any>, savedBody?: string }) {
    const debounced = useDebouncedCallback(saveAction, 1000);

    return (
        <Textarea
            className="h-full w-full bg-card block border-none min-h-64 text-base"
            id="body"
            defaultValue={savedBody}
            placeholder="Write your email body here..."
            required
            maxLength={4000}
            onChange={(e) => debounced({ body: e.target.value })}
        />
    );
}

export function Subject({ saveAction, savedSubject }: { saveAction: ({ subject }: { subject: string }) => Promise<any>, savedSubject?: string }) {
    const debounced = useDebouncedCallback(saveAction, 1000);

    return (
        <Input
            className="w-full bg-card text-lg border-none"
            placeholder="Subject..."
            id="subject"
            defaultValue={savedSubject}
            maxLength={100}
            required
            onChange={(e) => debounced({ subject: e.target.value })}
        />
    );
}


export function SendButton({ sendAction, isValid }: { sendAction: () => Promise<any>, isValid: string | null }) {
    const [isPending, startTransition] = useTransition();

    const onClick = (e: any) => {
        if (isPending) return;

        if (typeof isValid === "string") {
            toast.error(isValid);
            return;
        }

        startTransition(async () => {
            toast.promise(sendAction(), {
                loading: "Sending your email...",
                success: "Sent your email!",
                error: "Failed to send your email",
            })
        })
    }

    return (
        <Button onClick={onClick as any} aria-disabled={isPending} disabled={isPending} className="flex gap-2" type='submit'>
            {isPending ?
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                : <SendIcon className="h-5 w-5" />
            }
            Send
        </Button>
    )
}

interface FromInputProps {
    saveAction: ({ from }: { from: string }) => Promise<any>,
    savedAlias?: string,
    aliases: { name: string | null, alias: string }[],
}


export function FromInput({ saveAction, savedAlias, aliases }: FromInputProps) {
    // on left of input, show send button and on right show dropdown
    return (
        <Select defaultValue={savedAlias} onValueChange={(v) => saveAction({ from: v })}>
            <SelectTrigger className='bg-card border-none'>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">From:</span>
                    <SelectValue className="text-sm font-semibold">{savedAlias}</SelectValue>
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {/* <SelectLabel>From:</SelectLabel> */}
                    {aliases.map(({ name, alias }) => (
                        <SelectItem key={alias} value={alias}>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{name ?? alias}</span>
                                {name && <span className="text-sm text-muted-foreground">{alias}</span>}
                            </div>
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}

interface Recipient {
    name: string | null,
    address: string,
    cc?: "cc" | "bcc" | null,
}
interface RecipientInputProps {
    saveAction: ({ to }: { to?: Recipient[] }) => Promise<any>,
    savedTo?: Recipient[],
}

export function RecipientInput({ saveAction, savedTo }: RecipientInputProps) {

    // 3 "inputs"... they are an input but on space or enter, they become a pill
    // on backspace, they become an input again
    // to get bcc/cc use toggle button on right
    // there can be many to/cc/bcc values

    const [to, setTo] = useState<Recipient[]>(savedTo ?? []);
    const [showCC, setShowCC] = useState(savedTo?.some(r => r.cc === "cc") ?? false);
    const [showBCC, setShowBCC] = useState(false);

    const types = ["to", ...(showCC ? ["cc"] : []), ...(showBCC ? ["bcc"] : [])] as const;

    function addRecipient(type: typeof types[number], value: string) {
        const newTo = [...to, { name: null, address: value, cc: type === "to" ? null : type as any }]
        setTo(newTo);
        saveAction({ to: newTo });
    }

    function removeRecipient(type: typeof types[number], address: string) {
        const newTo = to.filter(r => r.address !== address && r.cc === (type === "to" ? null : type as any))
        setTo(newTo);
        saveAction({ to: newTo });
    }

    function validate(element: HTMLInputElement, type: typeof types[number], toastOnError = true) {
        const emailRegex = /\S+@\S+\.\S+/;

        if (emailRegex.test(element.value)) {
            addRecipient(type, element.value)
            element.value = ""
        } else if (toastOnError) {
            toast.error("Invalid email address")
        }
    }

    return (
        types.map((type) => (
            <div className="flex gap-3" key={type}>
                <span className="text-sm text-muted-foreground self-center w-7">
                    {type.toUpperCase()}:
                </span>

                <div
                    id={type}
                    className="group w-full px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-card rounded-md flex self-center gap-2 flex-wrap"
                >
                    {to.filter(r => r.cc == (type === "to" ? null : type)).map(({ name, address }) => (
                        <RecipientPill key={address} name={name} address={address} onRemove={() => removeRecipient(type, address)} />
                    ))}
                    <input
                        className="text-sm flex-grow sm:min-w-48 focus-visible:outline-none bg-transparent py-1"
                        placeholder="Add recipients..."
                        type="email"
                        onBlur={e => {
                            validate(e.currentTarget, type, false);
                            e.currentTarget.value = "";
                        }}
                        onKeyDown={e => {
                            if (e.key === "Enter" || e.key === " ") {
                                validate(e.currentTarget, type);
                            }
                        }}
                    />
                    <div className="self-centre flex">
                        {
                            !showCC && type === "to" && (
                                <Button variant="ghost" size="auto" className="self-centre rounded text-muted-foreground hover:text-white px-2" onClick={() => setShowCC(true)}>
                                    Cc
                                </Button>
                            )
                        }
                        {
                            !showBCC && type === "to" && (
                                <Button variant="ghost" size="auto" className="self-centre rounded text-muted-foreground hover:text-white px-2" onClick={() => setShowBCC(true)}>
                                    Bcc
                                </Button>
                            )
                        }
                    </div>

                </div>
            </div>
        ))


    )

}

function RecipientPill({ name, address, onRemove }: { name: string | null, address: string, onRemove: () => Promise<void> | void }) {
    return (
        <div className="bg-tertiary text-sm px-2 py-1 rounded flex items-center gap-1 break-all">
            <span>{name || address}</span>
            {name && <span className="text-muted-foreground">{`<${address}>`}</span>}

            <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full text-muted-foreground bg-tertiary hover:bg-tertiary hover:text-black dark:hover:text-white flex-shrink-0" onClick={onRemove}>
                {/* <XIcon  /> */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM6.707 6.707a1 1 0 011.414 0L10 8.586l1.879-1.88a1 1 0 011.414 1.414L11.414 10l1.88 1.879a1 1 0 01-1.414 1.414L10 11.414l-1.879 1.88a1 1 0 01-1.414-1.414L8.586 10 6.707 8.121a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </Button>
        </div>
    )
}
