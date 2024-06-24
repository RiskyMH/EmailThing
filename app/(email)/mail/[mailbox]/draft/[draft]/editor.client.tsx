'use client'

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDebouncedCallback } from 'use-debounce';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import { Fragment, useEffect, useId, useState, useTransition, type MouseEvent } from 'react';
import { toast } from 'sonner';
import { ExternalLinkIcon, Loader2, SendIcon, Trash2Icon } from 'lucide-react';
import { cn } from '@/utils/tw';

export function BodyEditor({ savedBody }: { savedBody?: string }) {
    const debounced = useDebouncedCallback((() => (document.getElementById("draft-form") as any)?.requestSubmit()), 1000);

    return (
        <Textarea
            className="size-full bg-card block border-none min-h-28 text-base resize-none"
            id="body"
            name="body"
            defaultValue={savedBody}
            placeholder="Write your email body here..."
            // required
            maxLength={4000}
            onChange={debounced}
            onBlur={(e) => (e.currentTarget as any)?.form?.requestSubmit()}
        />
    );
}

export function Subject({ savedSubject }: { savedSubject?: string }) {
    const debounced = useDebouncedCallback((() => (document.getElementById("draft-form") as any)?.requestSubmit()), 1000);

    return (
        <Input
            className="w-full bg-card text-lg border-none shrink-0"
            placeholder="Subject..."
            id="subject"
            name="subject"
            defaultValue={savedSubject}
            maxLength={100}
            // required
            onChange={debounced}
            onBlur={(e) => (e.currentTarget as any)?.form?.requestSubmit()}
        />
    );
}

export function DeleteButton({ delAction }: { delAction: () => Promise<any> }) {
    const [isPending, startTransition] = useTransition();

    const onClick = (e: MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault?.()
        if (isPending) return;

        startTransition(async () => {
            const res = await delAction()

            if (res?.error) {
                return void toast.error(res.error)
            }
            toast.success("Deleted your draft!")
        })
    }

    return (
        <Button onClick={onClick as any} formAction={delAction} aria-disabled={isPending} disabled={isPending} variant="ghost" size="icon">
            {isPending ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : <Trash2Icon className='size-5' />}
        </Button>
    )
}


export function SendButton({ sendAction }: { sendAction: (data: FormData) => Promise<any> }) {
    const [isPending, startTransition] = useTransition();

    const onClick = (e: MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault?.()
        if (isPending) return;

        startTransition(async () => {
            const t = toast.loading("Sending your email...")
            const data = new FormData(e.currentTarget?.parentElement?.parentElement as HTMLFormElement)
            const res = await sendAction(data)

            if (res?.error) {
                // if (res.link) return void toast.error(res.error + "nooo", { id: t, action: { label: "Learn More 🔗", onClick: () => window.open(res.link, "_blank") } });
                if (res.link) return void toast.error(res.error, {
                    id: t,
                    action: (
                        <a href={res.link} target="blank" className='inline-flex items-center justify-center gap-2 shrink-0 bg-secondary rounded-lg p-2 hover:bg-secondary/80'>Learn More <ExternalLinkIcon className='size-4 text-muted-foreground' /></a>
                    )
                });
                return void toast.error(res.error, { id: t })
            }
            toast.success("Sent your email!", { id: t })
        })
    }

    return (
        <Button onClick={onClick as any} type="submit" formAction={sendAction} aria-disabled={isPending} disabled={isPending} className="flex gap-2 px-7">
            {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
            Send
        </Button>
    )
}

interface FromInputProps {
    // saveAction: ({ from }: { from: string }) => Promise<any>,
    savedAlias?: string,
    aliases: { name: string | null, alias: string }[],
}


export function FromInput({ savedAlias, aliases }: FromInputProps) {
    const [value, setValue] = useState(savedAlias)
    return (
        <Select value={value} onValueChange={setValue} name="from">
            <SelectTrigger className='bg-card border-none shrink-0'>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">From</span>
                    <SelectValue className="text-sm font-semibold">{value}</SelectValue>
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {/* <SelectLabel>From:</SelectLabel> */}
                    {aliases.map(({ name, alias }) => (
                        <SelectItem key={alias} value={alias} onSelect={e => (e.currentTarget as any).form?.requestSubmit()}>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{name || alias}</span>
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
    // saveAction: ({ to }: { to?: Recipient[] }) => Promise<any>,
    savedTo?: Recipient[],
}

function ToFormData(data: Recipient) {
    const id = useId()
    return (
        <>
            <input name="to" value={id} hidden readOnly />
            <input name={`to:${id}:name`} value={data.name || undefined} hidden readOnly />
            <input name={`to:${id}:address`} value={data.address || undefined} hidden readOnly />
            <input name={`to:${id}:cc`} value={data.cc || undefined} hidden readOnly />
        </>
    )
}


export function RecipientInput({ savedTo }: RecipientInputProps) {
    const [to, setTo] = useState<Recipient[]>(savedTo ?? []);
    const [showCC, setShowCC] = useState(savedTo?.some(r => r.cc === "cc") ?? false);
    const [showBCC, setShowBCC] = useState(savedTo?.some(r => r.cc === "bcc") ?? false);
    const [showFull, setShowFull] = useState(false)

    const types = ["to", ...(showCC ? ["cc"] : []), ...(showBCC ? ["bcc"] : [])] as const;
    const allTypes = ["to", "cc", "bcc"] as const;

    const update = useDebouncedCallback((() => (document.getElementById("draft-form") as any)?.requestSubmit()), 150);

    function validate(element: HTMLInputElement, type: typeof types[number], toastOnError = true) {
        const value = `${element.value}`
        if (to.find(r => (r.cc === (type === "to" ? null : type)) && r.address === value)) {
            setTo(r => r.filter(r => !((r.cc === (type === "to" ? null : type)) && r.address === value)));
            toast.info("Removed duplicate email")
            element.value = ""
            return
        }
        const emailRegex = /\S+@\S+\.\S+/;

        if (emailRegex.test(value)) {
            setTo(to => [...to, { name: null, address: value, cc: type === "to" ? null : type as any }]);
            update()
            element.value = ""
        } else if (toastOnError) {
            toast.error("Invalid email address")
        }
        element.value = element.value.replaceAll(" ", '')
    }

    useEffect(() => {
        const elem = document.getElementById("recipients-full")
        const fn = (() => {
            if (elem?.contains(document.activeElement)) {
                // do nothing
            } else {
                setShowFull(false)
                // setShowCC(to?.some(r => r.cc === "cc") ?? false);
                // setShowBCC(to?.some(r => r.cc === "bcc") ?? false);
            }
        })

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                toast.info("Saving...", { duration: 500 });
                (document.getElementById("draft-form") as any)?.requestSubmit()
            }
        }

        addEventListener("keydown", onKeyDown)
        addEventListener("focusin", fn);
        return () => {
            removeEventListener("focusin", fn)
            addEventListener("keydown", onKeyDown)
        }
    }, [])

    useEffect(() => {
        if (showFull === false) {
            setShowCC(to?.some(r => r.cc === "cc") ?? false);
            setShowBCC(to?.some(r => r.cc === "bcc") ?? false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showFull])

    return (
        <>
            <button
                onClick={() => { setShowFull(true); setTimeout(() => document.getElementById("to:to")?.focus(), 0) }}
                className={cn('shrink-0 w-full px-3 py-2 h-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-card rounded-md flex self-center gap-2 overflow-y-hidden text-ellipsis', showFull && "hidden")}
            >
                <span className='flex gap-2 w-full overflow-y-hidden text-ellipsis'>
                    {types.map((type) => (
                        <Fragment key={type}>
                            <span className="text-sm text-muted-foreground self-center shrink-0">
                                {{ to: "To", cc: "CC", bcc: "BCC" }[type]}
                            </span>
                            <span className="self-center shrink-0">
                                {to.filter(r => r.cc == (type === "to" ? null : type)).map(({ name, address }) => name || address).join(", ")}
                            </span>
                        </Fragment>
                    ))}
                </span>
                <span className="self-centre flex">
                    <Button variant="ghost" size="auto" className="self-centre rounded text-muted-foreground hover:text-white px-2" onClick={() => { setShowCC(true); setTimeout(() => document.getElementById("to:cc")?.focus(), 10) }} asChild>
                        <span>
                            Cc
                        </span>
                    </Button>
                    <Button variant="ghost" size="auto" className="self-centre rounded text-muted-foreground hover:text-white px-2" onClick={() => { setShowBCC(true); setTimeout(() => document.getElementById("to:bcc")?.focus(), 10) }} asChild>
                        <span>
                            Bcc
                        </span>
                    </Button>
                </span>

            </button>
            <div className='hidden'>
                {to.map(v => <ToFormData key={v.address} address={v.address} name={v.name} cc={v.cc} />)}
            </div>

            <div className={cn("flex flex-col gap-4", !showFull && "hidden")} id="recipients-full">
                {allTypes.map((type, i) => (
                    <div className={cn("flex gap-3", !types.includes(type) && "hidden")} key={type}>
                        <span className="text-sm text-muted-foreground self-center w-7 shrink-0">
                            {type.toUpperCase()}: {showFull}
                        </span>

                        <div className="group w-full px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-card rounded-md flex self-center gap-2 flex-wrap">
                            {to.filter(r => r.cc == (type === "to" ? null : type)).map(({ name, address }) => (
                                <RecipientPill
                                    key={address}
                                    name={name}
                                    address={address}
                                    onRemove={() => setTo(to => to.filter(r => !(r.address === address && r.cc === (type === "to" ? null : type))))}
                                />
                            ))}
                            <input
                                id={`to:${type}`}
                                className="text-sm grow sm:min-w-48 focus-visible:outline-none bg-transparent py-1"
                                placeholder="Add recipients..."
                                type="email"
                                autoFocus={type === "to"}
                                onBlur={e => {
                                    validate(e.currentTarget, type, false);
                                    if (document.hasFocus()) {
                                        e.currentTarget.value = "";
                                    }
                                }}
                                onKeyDown={e => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        if (!e.currentTarget.value) return toast.warning("Please add an email first")
                                        validate(e.currentTarget, type);
                                    } else if (e.key === "Backspace" && e.currentTarget.value === "") {
                                        setTo(to => {
                                            const last = to.findLast(r => r.cc == (type === "to" ? null : type))
                                            if (!last) return to
                                            return to.filter(r => !(r.address === last.address && r.cc === (type === "to" ? null : type as any)));
                                        })
                                        update()
                                    }
                                }}
                            />
                            <div className="self-centre flex">
                                {!showCC && type === "to" && (
                                    <Button variant="ghost" size="auto" className="self-centre rounded text-muted-foreground hover:text-white px-2" onClick={() => { setShowCC(true); setTimeout(() => document.getElementById("to:cc")?.focus(), 10) }}>
                                        Cc
                                    </Button>
                                )}
                                {!showBCC && type === "to" && (
                                    <Button variant="ghost" size="auto" className="self-centre rounded text-muted-foreground hover:text-white px-2" onClick={() => { setShowBCC(true); setTimeout(() => document.getElementById("to:bcc")?.focus(), 10) }}>
                                        Bcc
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

function RecipientPill({ name, address, onRemove }: { name: string | null, address: string, onRemove: (e: any) => Promise<void> | void }) {
    return (
        <div className="bg-tertiary text-sm px-2 py-1 rounded flex items-center gap-1 break-all">
            <span>{name || address}</span>
            {name && <span className="text-muted-foreground">{`<${address}>`}</span>}

            <Button variant="ghost" size="icon" className="size-4 rounded-full text-muted-foreground bg-tertiary hover:bg-tertiary hover:text-black dark:hover:text-white shrink-0" onClick={onRemove}>
                {/* <XIcon  /> */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM6.707 6.707a1 1 0 011.414 0L10 8.586l1.879-1.88a1 1 0 011.414 1.414L11.414 10l1.88 1.879a1 1 0 01-1.414 1.414L10 11.414l-1.879 1.88a1 1 0 01-1.414-1.414L8.586 10 6.707 8.121a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </Button>
        </div>
    )
}
