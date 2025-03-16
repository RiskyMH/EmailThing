"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useMX from "@/requests/dns.client";
import { cn } from "@/utils/tw";
import {
    CircleAlertIcon,
    ExternalLinkIcon,
    Loader2,
    PaperclipIcon,
    Trash2Icon,
} from "lucide-react";
import { type FormEvent, Fragment, type MouseEvent, Suspense, useEffect, useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import "./tiptap.css";
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
// import catchRedirectError from "@/utils/no-throw-on-redirect.client";
import { lazy } from "react"
import { BodyHeader } from "./tiptap-header"
import { useParams, useSearchParams } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { parseHTML } from "../email-item/parse-html";
import useSWR from "swr";
import { makeHtml } from "./tools";
import Turndown from "turndown";

const catchRedirectError = () => {
    // console.log("catchRedirectError")
}

const EditorContent2 = lazy(() => import("./tiptap.client"))


export function BodyEditor({ savedBody }: { savedBody?: string }) {
    const searchParams = useSearchParams()[0]
    const mode = (searchParams.get("editor") || "normal") as "normal" | "html" | "text" | "html-preview"

    return (
        mode === "normal" ? (
            <Suspense fallback={
                // SUSPENCE FALLBACK BELOW
                // see ./tiptap.tsx for the real component
                <div className="tiptap-editor group flex h-full w-full max-w-full grow resize-none flex-col overflow-auto break-words rounded-md border border-input border-none bg-secondary text-base ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ fontFamily: "Arial, sans-serif" }}
                >
                    <div className="sticky top-0 z-10 flex h-11 shrink-0 flex-col gap-1 overflow-x-auto overflow-y-hidden py-1 outline-none">
                        <BodyHeader />
                        <span className="flex h-0 w-full shrink-0 grow-0 rounded-sm border-background/75 border-b-2" />
                    </div>
                    <div className="flex h-[calc(100%-2.75rem)] w-full items-center justify-center overflow-auto fade-in">
                        <Loader2 className="size-12 animate-spin text-muted-foreground" />
                    </div>
                </div>
            }>
                <EditorContent2 savedBody={savedBody} />
            </Suspense >
        ) : (
            mode === "html" ? (
                <HTMLEditor savedHTML={savedBody} />
            ) : mode === "html-preview" ? (
                <HTMLPreviewEditor savedHTML={savedBody} />
            ) : (
                <TextEditor savedText={savedBody} />
            )
        )
    );
}

function formatHtml(html: string) {
    var tab = '\t';
    var result = '';
    var indent = '';

    html.split(/>\s*</).forEach(function (element) {
        if (element.match(/^\/\w/)) {
            indent = indent.substring(tab.length);
        }

        result += indent + '<' + element + '>\r\n';

        if (element.match(/^<?\w[^>]*[^\/]$/) && !element.startsWith("input")) {
            indent += tab;
        }
    });

    return result.substring(1, result.length - 3);
}

export function HTMLEditor({ savedHTML }: { savedHTML?: string }) {
    const debounced = useDebouncedCallback(() => (document.getElementById("draft-form") as any)?.requestSubmit(), 1000);

    if (savedHTML?.endsWith("<!--tiptap-->")) {
        savedHTML = formatHtml(makeHtml(savedHTML))
    }

    return (
        <>
            <Textarea
                className="w-full h-[calc(100%-2.75rem)] shrink border-none font-mono overflow-x-auto h-full rounded-lg bg-tertiary p-3 whitespace-pre border overflow-auto border-primary border-2 resize-none"
                id="html-editor"
                name="html"
                defaultValue={savedHTML}
                onChange={debounced}
                onBlur={(e) => (e.currentTarget as any)?.form?.requestSubmit()}
            />
        </>
    );
}

export function TextEditor({ savedText }: { savedText?: string }) {
    const debounced = useDebouncedCallback(() => (document.getElementById("draft-form") as any)?.requestSubmit(), 1000);

    if (savedText && (savedText.startsWith("<") && savedText.endsWith(">"))) {
        savedText = new Turndown().turndown(savedText
            .replaceAll(/\[(https?:\/\/[^\]]+)\]\(\1\)/g, "$1")
            .replaceAll(/<style(.*?)>([\s\S]*?)<\/style>/g, "")
        );
    }

    return (
        <Textarea
            className="w-full shrink border-none font-mono h-full w-full max-w-full grow rounded-lg bg-secondary p-3 whitespace-pre-wrap resize-none"
            id="text-editor"
            name="body"
            defaultValue={savedText}
            onChange={debounced}
            onBlur={(e) => (e.currentTarget as any)?.form?.requestSubmit()}
        />
    );
}

export function HTMLPreviewEditor({ savedHTML }: { savedHTML?: string }) {

    if (savedHTML?.includes("<!--tiptap-->")) {
        savedHTML = makeHtml(savedHTML)
    }
    savedHTML = parseHTML(savedHTML || "", true)

    return (
        <>
            <input hidden readOnly value={savedHTML} name="html" />
            <input hidden readOnly value={savedHTML} name="body" />
            <iframe
                className="h-full w-full rounded-lg bg-card"
                sandbox="allow-popups"
                srcDoc={savedHTML}
                title="The Email"
            />
        </>
    );
}



export function Subject({ savedSubject }: { savedSubject?: string }) {
    const debounced = useDebouncedCallback(() => (document.getElementById("draft-form") as any)?.requestSubmit(), 1000);

    return (
        <Input
            className="w-full shrink-0 border-none bg-card text-lg focus:z-10"
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
        e.preventDefault?.();
        if (isPending) return;

        startTransition(async () => {
            const res = await delAction();

            if (res?.error) {
                return void toast.error(res.error);
            }
            toast.success("Deleted your draft!");
        });
    };

    return (
        <Button
            onClick={onClick as any}
            formAction={delAction}
            aria-disabled={isPending}
            disabled={isPending}
            variant="ghost"
            size="icon"
            type="button"
        >
            {isPending ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
                <Trash2Icon className="size-5" />
            )}
        </Button>
    );
}

export function SendButton({ sendAction }: { sendAction: (data: FormData) => Promise<any> }) {
    const [isPending, startTransition] = useTransition();

    const onClick = (e: MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault?.();
        if (isPending) return;

        startTransition(async () => {
            const t = toast.loading("Sending your email...");
            const data = new FormData(e.currentTarget?.parentElement?.parentElement as HTMLFormElement);
            const res = await sendAction(data).catch(catchRedirectError);

            if (res?.error) {
                // if (res.link) return void toast.error(res.error + "nooo", { id: t, action: { label: "Learn More 🔗", onClick: () => window.open(res.link, "_blank") } });
                if (res.link)
                    return void toast.error(res.error, {
                        id: t,
                        action: (
                            <a
                                href={res.link}
                                target="blank"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-secondary p-2 hover:bg-secondary/80"
                            >
                                Learn More <ExternalLinkIcon className="size-4 text-muted-foreground" />
                            </a>
                        ),
                    });
                return void toast.error(res.error, { id: t });
            }
            toast.success("Sent your email!", { id: t });
        });
    };

    return (
        <Button
            onClick={onClick as any}
            type="submit"
            id="send-button"
            formAction={sendAction}
            aria-disabled={isPending}
            disabled={isPending}
            className="flex gap-2 px-7"
        >
            {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
            Send
        </Button>
    );
}

interface FromInputProps {
    // saveAction: ({ from }: { from: string }) => Promise<any>,
    savedAlias?: string;
    aliases: { name: string | null; alias: string }[];
}

export function FromInput({ savedAlias, aliases }: FromInputProps) {
    const [value, setValue] = useState(savedAlias);
    return (
        <>
            <input name="from" value={value} hidden readOnly />
            <Select value={value} onValueChange={setValue}>
                <SelectTrigger className="shrink-0 border-none bg-card focus:z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">From</span>
                        <SelectValue className="font-semibold text-sm">{value}</SelectValue>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {/* <SelectLabel>From:</SelectLabel> */}
                        {aliases.map(({ name, alias }) => (
                            <SelectItem
                                key={alias}
                                value={alias}
                                onSelect={(e) => (e.currentTarget as any).form?.requestSubmit()}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{name || alias}</span>
                                    {name && <span className="text-muted-foreground text-sm">{alias}</span>}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </>
    );
}

interface Recipient {
    name: string | null;
    address: string;
    cc?: "cc" | "bcc" | null;
}
interface RecipientInputProps {
    // saveAction: ({ to }: { to?: Recipient[] }) => Promise<any>,
    savedTo?: Recipient[];
}

function ToFormData(data: Recipient) {
    const id = useId();
    return (
        <>
            <input name="to" value={id} hidden readOnly />
            <input name={`to:${id}:name`} value={data.name || undefined} hidden readOnly />
            <input name={`to:${id}:address`} value={data.address || undefined} hidden readOnly />
            <input name={`to:${id}:cc`} value={data.cc || undefined} hidden readOnly />
        </>
    );
}

export function RecipientInput({ savedTo }: RecipientInputProps) {
    const [to, setTo] = useState<Recipient[]>(savedTo ?? []);
    const [showCC, setShowCC] = useState(savedTo?.some((r) => r.cc === "cc") ?? false);
    const [showBCC, setShowBCC] = useState(savedTo?.some((r) => r.cc === "bcc") ?? false);
    const [showFull, setShowFull] = useState(false);

    const types = ["to", ...(showCC ? ["cc"] : []), ...(showBCC ? ["bcc"] : [])] as const;
    const allTypes = ["to", "cc", "bcc"] as const;

    const update = useDebouncedCallback(() => (document.getElementById("draft-form") as any)?.requestSubmit(), 150);

    function validate(element: HTMLInputElement, type: (typeof types)[number], toastOnError = true) {
        const value = `${element.value}`;
        if (to.find((r) => r.cc == (type === "to" ? null : type) && r.address === value)) {
            setTo((r) => r.filter((r) => !(r.cc == (type === "to" ? null : type) && r.address === value)));
            toast.info("Removed duplicate email");
            element.value = "";
            return;
        }
        const emailRegex = /\S+@\S+\.\S+/;

        if (emailRegex.test(value)) {
            setTo((to) => [
                ...to,
                {
                    name: null,
                    address: value,
                    cc: type === "to" ? null : (type as any),
                },
            ]);
            element.value = "";
            update();
        } else if (toastOnError) {
            toast.error("Invalid email address");
        }
        element.value = element.value.replaceAll(" ", "");
        (document.getElementById("draft-form") as any)?.requestSubmit();
    }

    useEffect(() => {
        const elem = document.getElementById("recipients-full");
        const onFocusin = () => {
            if (elem?.contains(document.activeElement)) {
                // do nothing
            } else {
                setShowFull(false);
                // setShowCC(to?.some(r => r.cc === "cc") ?? false);
                // setShowBCC(to?.some(r => r.cc === "bcc") ?? false);
            }
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toast.info("Saving...", { duration: 500 });
                (document.getElementById("draft-form") as any)?.requestSubmit();
            } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                (document.getElementById("send-button") as any)?.click();
            }
        };

        addEventListener("focusin", onFocusin);
        addEventListener("keydown", onKeyDown);
        return () => {
            removeEventListener("focusin", onFocusin);
            removeEventListener("keydown", onKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (showFull === false) {
            setShowCC(to?.some((r) => r.cc === "cc") ?? false);
            setShowBCC(to?.some((r) => r.cc === "bcc") ?? false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showFull]);

    return (
        <>
            <button
                onClick={() => {
                    setShowFull(true);
                    setTimeout(() => document.getElementById("to:to")?.focus(), 0);
                }}
                className={cn(
                    "flex h-10 w-full shrink-0 gap-2 self-center overflow-y-hidden text-ellipsis rounded-md bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:z-10 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    showFull && "hidden",
                )}
                type="button"
            >
                <span className="flex w-full gap-2 overflow-y-hidden text-ellipsis self-center">
                    {types.map((type) => (
                        <Fragment key={type}>
                            <span className="shrink-0 self-center text-muted-foreground text-sm">
                                {{ to: "To", cc: "CC", bcc: "BCC" }[type]}
                            </span>
                            <span className="shrink-0 self-center">
                                {to
                                    .filter((r) => r.cc == (type === "to" ? null : type))
                                    .map(({ name, address }) => name || address)
                                    .join(", ")}
                            </span>
                        </Fragment>
                    ))}
                </span>
                <span className="self-centre flex">
                    <Button
                        variant="ghost"
                        size="auto"
                        className="self-centre rounded px-2 text-muted-foreground hover:text-white"
                        onClick={() => {
                            setShowCC(true);
                            setTimeout(() => document.getElementById("to:cc")?.focus(), 10);
                        }}
                        asChild
                    >
                        <span>Cc</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="auto"
                        className="self-centre rounded px-2 text-muted-foreground hover:text-white"
                        onClick={() => {
                            setShowBCC(true);
                            setTimeout(() => document.getElementById("to:bcc")?.focus(), 10);
                        }}
                        asChild
                    >
                        <span>Bcc</span>
                    </Button>
                </span>
            </button>
            <div className="hidden">
                {to.map((v) => (
                    <ToFormData key={v.address} address={v.address} name={v.name} cc={v.cc} />
                ))}
            </div>

            <div className={cn("flex flex-col divide-y-2", !showFull && "hidden")} id="recipients-full">
                {allTypes.map((type, i) => (
                    <Fragment key={type}>
                        <div
                            className={cn(
                                "group flex w-full flex-wrap gap-2 self-center rounded-md border-none bg-card px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:z-10 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                !types.includes(type) && "hidden",
                            )}
                        >
                            <span className="flex w-8 shrink-0 self-center text-muted-foreground text-sm">
                                {{ to: "To", cc: "CC", bcc: "BCC" }[type]}
                            </span>
                            {to
                                .filter((r) => r.cc == (type === "to" ? null : type))
                                .map(({ name, address }) => (
                                    <RecipientPill
                                        key={address}
                                        name={name}
                                        address={address}
                                        onRemove={() =>
                                            setTo((to) =>
                                                to.filter(
                                                    (r) =>
                                                        !(
                                                            r.address === address &&
                                                            r.cc == (type === "to" ? null : type)
                                                        ),
                                                ),
                                            )
                                        }
                                    />
                                ))}
                            <input
                                id={`to:${type}`}
                                className="grow bg-transparent py-1 text-sm focus-visible:outline-none sm:min-w-48"
                                placeholder="Add recipients..."
                                type="email"
                                onBlur={(e) => {
                                    validate(e.currentTarget, type, false);
                                    if (document.hasFocus()) {
                                        e.currentTarget.value = "";
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        if (!e.currentTarget.value) return toast.warning("Please add an email first");
                                        validate(e.currentTarget, type);
                                    } else if (e.key === "Backspace" && e.currentTarget.value === "") {
                                        setTo((to) => {
                                            const last = to.findLast((r) => r.cc == (type === "to" ? null : type));
                                            if (!last) return to;
                                            return to.filter(
                                                (r) =>
                                                    !(
                                                        r.address === last.address &&
                                                        r.cc == (type === "to" ? null : (type as any))
                                                    ),
                                            );
                                        });
                                        update();
                                    }
                                }}
                            />
                            <div className="self-centre flex">
                                {!showCC && type === "to" && (
                                    <Button
                                        variant="ghost"
                                        size="auto"
                                        className="self-centre rounded px-2 text-muted-foreground hover:text-white"
                                        onClick={() => {
                                            setShowCC(true);
                                            setTimeout(() => document.getElementById("to:cc")?.focus(), 10);
                                        }}
                                    >
                                        Cc
                                    </Button>
                                )}
                                {!showBCC && type === "to" && (
                                    <Button
                                        variant="ghost"
                                        size="auto"
                                        className="self-centre rounded px-2 text-muted-foreground hover:text-white"
                                        onClick={() => {
                                            setShowBCC(true);
                                            setTimeout(() => document.getElementById("to:bcc")?.focus(), 10);
                                        }}
                                    >
                                        Bcc
                                    </Button>
                                )}
                            </div>
                        </div>
                        <span
                            className={cn(
                                "flex h-0 w-full shrink-0 grow-0 rounded-sm border-background/75 border-b-2",
                                (!types.includes(type) || i + 1 === types.length) && "hidden",
                            )}
                        />
                    </Fragment>
                ))}
            </div>
        </>
    );
}

function RecipientPill({
    name,
    address,
    onRemove,
}: {
    name: string | null;
    address: string;
    onRemove: (e: any) => Promise<void> | void;
}) {
    const { data: mx } = useMX(address.split("@")[1]);

    return (
        <div
            className={cn(
                "flex items-center gap-1 break-all rounded bg-tertiary px-2 py-1 text-sm",
                mx === null && "outline-2 outline-destructive",
            )}
        >
            {/* {mx === null && <span className='bg-destructive rounded-full size-4 flex items-center justify-center text-center text-xs' title="Cant't find email record for domain from DNS">!</span>} */}
            {mx === null && <CircleAlertIcon className="size-4 text-destructive" />}
            <span>{name || address}</span>
            {name && <span className="text-muted-foreground">{`<${address}>`}</span>}

            <Button
                variant="ghost"
                size="icon"
                className="size-4 shrink-0 rounded-full bg-tertiary text-muted-foreground hover:bg-tertiary hover:text-black dark:hover:text-white"
                onClick={onRemove}
            >
                {/* <XIcon  /> */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <title>X</title>
                    <path
                        fillRule="evenodd"
                        d="M10 2a8 8 0 100 16 8 8 0 000-16zM6.707 6.707a1 1 0 011.414 0L10 8.586l1.879-1.88a1 1 0 011.414 1.414L11.414 10l1.88 1.879a1 1 0 01-1.414 1.414L10 11.414l-1.879 1.88a1 1 0 01-1.414-1.414L8.586 10 6.707 8.121a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </Button>
        </div>
    );
}

export function UploadAttachment() {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => toast.warning("Attachments not implemented yet")}
            type="button"
        >
            <PaperclipIcon className="size-5" />
        </Button>
    );
}

export function HeaderModal({
    initialHeaders,
    action,
}: {
    initialHeaders: { key: string; value: string }[];
    action: (data: FormData) => Promise<unknown>;
}) {
    const [headers, setHeaders] = useState(initialHeaders);

    const [isPending, startTransition] = useTransition();
    useEffect(() => setHeaders(initialHeaders), [initialHeaders]);

    const formSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isPending) return;

        startTransition(async () => {
            const formData = new FormData(event.target as HTMLFormElement);

            await action(formData);
            document.getElementById("smart-drawer:close")?.click();
        });
    };

    return (
        <SmartDrawer>
            <DropdownMenuItem asChild>
                <SmartDrawerTrigger className="w-full gap-2">Change Headers</SmartDrawerTrigger>
            </DropdownMenuItem>
            <SmartDrawerContent className="h-min max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-3rem)] sm:max-w-[425px] sm:overflow-auto">
                <SmartDrawerHeader>
                    <SmartDrawerTitle>Edit Headers</SmartDrawerTitle>
                    <SmartDrawerDescription>
                        Not that important but if you want to do more custom things!
                    </SmartDrawerDescription>
                </SmartDrawerHeader>

                <form
                    className="flex flex-col items-start gap-4 px-4 max-sm:max-h-[calc(100vh-10rem)] max-sm:overflow-auto sm:px-0"
                    onSubmit={formSubmit}
                >
                    <div className="flex flex-col gap-2">
                        {headers.map(({ key, value }, i) => (
                            <div key={i} className="flex gap-2">
                                <input hidden name="header" value={i} readOnly />
                                <div className="flex">
                                    <Input
                                        className="border-none bg-secondary"
                                        name={`header:${i}:name`}
                                        placeholder={i === 0 ? "In-Reply-To" : "Key"}
                                        defaultValue={key}
                                        disabled={isPending}
                                        onChange={(e) => {
                                            setHeaders((h) => {
                                                h[i].key = e.target.value;
                                                if (h.at(-1)?.key !== "") {
                                                    h.push({
                                                        key: "",
                                                        value: "",
                                                    });
                                                }
                                                return [...h];
                                            });
                                        }}
                                    />
                                    <code className="-mt-0.5 flex self-center font-bold text-lg">:</code>
                                </div>
                                <Input
                                    className="border-none bg-secondary"
                                    name={`header:${i}:value`}
                                    placeholder={i === 0 ? "<abcdef@emailthing.xyz>" : "value"}
                                    defaultValue={value}
                                    disabled={isPending}
                                    onChange={(e) => {
                                        setHeaders((h) => {
                                            h[i].value = e.target.value;
                                            return [...h];
                                        });
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <Button type="submit" disabled={isPending} className="w-full gap-2">
                        {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
                        Save Headers
                    </Button>
                </form>

                <SmartDrawerFooter className="flex pt-2 sm:hidden">
                    <SmartDrawerClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </SmartDrawerClose>
                </SmartDrawerFooter>
            </SmartDrawerContent>
        </SmartDrawer>
    );
}
