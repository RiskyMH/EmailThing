"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import useMX from "@/requests/dns.client";
import { cn } from "@/utils/tw";
import { Blockquote } from "@tiptap/extension-blockquote";
import { Bold } from "@tiptap/extension-bold";
import { BulletList } from "@tiptap/extension-bullet-list";
import { Code } from "@tiptap/extension-code";
import { CodeBlock } from "@tiptap/extension-code-block";
import { Document } from "@tiptap/extension-document";
import { Dropcursor } from "@tiptap/extension-dropcursor";
import FontFamily from "@tiptap/extension-font-family";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { HardBreak } from "@tiptap/extension-hard-break";
import { Heading } from "@tiptap/extension-heading";
import { History } from "@tiptap/extension-history";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Italic } from "@tiptap/extension-italic";
import TipTapLink from "@tiptap/extension-link";
import { ListItem } from "@tiptap/extension-list-item";
import { ListKeymap } from "@tiptap/extension-list-keymap";
import { OrderedList } from "@tiptap/extension-ordered-list";
import { Paragraph } from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import { Strike } from "@tiptap/extension-strike";
import { Text } from "@tiptap/extension-text";
import TextStyle from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import {
    BoldIcon,
    CircleAlertIcon,
    ExternalLinkIcon,
    Heading1Icon,
    Heading2Icon,
    Heading3Icon,
    Heading4Icon,
    Heading5Icon,
    Heading6Icon,
    HeadingIcon,
    ItalicIcon,
    LinkIcon,
    ListIcon,
    ListOrderedIcon,
    Loader2,
    PaperclipIcon,
    QuoteIcon,
    RemoveFormattingIcon,
    StrikethroughIcon,
    Trash2Icon,
    UnderlineIcon,
} from "lucide-react";
import { type FormEvent, Fragment, type MouseEvent, useEffect, useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import "./tiptap.css";
import TooltipText from "@/components/tooltip-text";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

function getJSON(data?: string) {
    if (!data) return;

    try {
        return JSON.parse(data);
    } catch {
        return data;
    }
}

export function BodyEditor({ savedBody }: { savedBody?: string }) {
    const debounced = useDebouncedCallback(() => (document.getElementById("draft-form") as any)?.requestSubmit(), 1000);

    const editor = useEditor({
        extensions: [
            // StarterKit,
            Blockquote.configure(),
            Bold.configure(),
            BulletList.configure(),
            Code.configure(),
            CodeBlock.configure(),
            Document.configure(),
            Dropcursor.configure(),
            Gapcursor.configure(),
            HardBreak.configure(),
            Heading.configure(),
            History.configure(),
            HorizontalRule.configure(),
            Italic.configure(),
            ListItem.configure(),
            OrderedList.configure(),
            Paragraph.configure(),
            Strike.configure(),
            Text.configure(),
            Underline.configure(),
            Placeholder.configure({
                placeholder: "Write your email body here …",
            }),
            TextStyle.configure(),
            FontFamily.configure(),
            TipTapLink.configure({
                // openOnClick: 'whenNotEditable'
                openOnClick: false,
                defaultProtocol: "https",
            }),
            ListKeymap.configure(),
        ],
        // content: '<p>Hello World! 🌎️</p>',
        content: getJSON(savedBody),
        editorProps: {
            attributes: {
                class: "prose dark:prose-invert prose-md prose-sm=sm:prose=lg:prose-lg=xl:prose-2xl focus:outline-none overflow-auto px-3 pb-2 size-full max-w-full  min-h-28 focus-visible:outline-none bg-transparent border-none",
            },
        },
        onUpdate: (e) => setTimeout(debounced, 0),
        onBlur: (e) => setTimeout(debounced, 0),
    });

    return (
        <EditorContent
            editor={editor}
            data-placeholder="Write your email body here..."
            className="tiptap-editor group flex h-full w-full max-w-full grow resize-none flex-col overflow-auto break-words rounded-md border border-input border-none bg-secondary text-base ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ fontFamily: "Arial, sans-serif" }}
        >
            <div className="sticky top-0 z-10 flex h-11 shrink-0 flex-col gap-1 overflow-x-auto overflow-y-hidden py-1 outline-none">
                <div className="flex w-full gap-1">
                    <span />
                    <Select
                        value={editor?.getAttributes("textStyle").fontFamily || "Arial, sans-serif"}
                        onValueChange={(v) => editor?.chain().focus().setFontFamily(v).run()}
                    >
                        <TooltipText text="Change Font">
                            <SelectTrigger
                                className="h-8 w-auto shrink-0 gap-2 border-none bg-transparent px-2.5 focus-within:z-20 hover:bg-background focus:z-20 sm:w-[150px]"
                                style={{
                                    fontFamily: editor?.getAttributes("textStyle").fontFamily || "Arial, sans-serif",
                                }}
                            >
                                <SelectValue placeholder="Select a font" />
                            </SelectTrigger>
                        </TooltipText>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="Georgia" style={{ fontFamily: "Georgia, serif" }}>
                                    Georgia
                                </SelectItem>
                                <SelectItem value="Arial, sans-serif" style={{ fontFamily: "Arial, sans-serif" }}>
                                    Arial
                                </SelectItem>
                                <SelectItem
                                    value="Helvetica, sans-serif"
                                    style={{
                                        fontFamily: "Helvetica, sans-serif",
                                    }}
                                >
                                    Helvetica
                                </SelectItem>
                                <SelectItem
                                    value="Menlo, Consolas, Courier New, monospace"
                                    style={{
                                        fontFamily: "Menlo, Consolas, Courier New, monospace",
                                    }}
                                >
                                    Monospace
                                </SelectItem>
                                <SelectItem value="Tahoma, sans-serif" style={{ fontFamily: "Tahoma, sans-serif" }}>
                                    Tahoma
                                </SelectItem>
                                <SelectItem value="Verdana" style={{ fontFamily: "Verdana" }}>
                                    Verdana
                                </SelectItem>
                                <SelectItem
                                    value="Times New Roman, serif"
                                    style={{
                                        fontFamily: "Times New Roman, serif",
                                    }}
                                >
                                    Times New Roman
                                </SelectItem>
                                <SelectItem
                                    value="Trebuchet MS, sans-serif"
                                    style={{
                                        fontFamily: "Trebuchet MS, sans-serif",
                                    }}
                                >
                                    Trebuchet MS
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <span className="my-1 h-auto w-0 shrink-0 grow-0 rounded-sm border-background/75 border-e-2" />

                    <DropdownMenu>
                        <TooltipText text="Change Heading Size">
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 hover:bg-background focus:z-20 data-[state=on]:bg-tertiary"
                                >
                                    {
                                        {
                                            1: <Heading1Icon className="size-4" />,
                                            2: <Heading2Icon className="size-4" />,
                                            3: <Heading3Icon className="size-4" />,
                                            4: <Heading4Icon className="size-4" />,
                                            5: <Heading5Icon className="size-4" />,
                                            6: <Heading6Icon className="size-4" />,
                                            default: <HeadingIcon className="size-4" />,
                                        }[(editor?.getAttributes("heading")?.level as number | undefined) || "default"]
                                    }
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipText>
                        <DropdownMenuContent className="">
                            <DropdownMenuRadioGroup
                                value={editor?.getAttributes("heading")?.level?.toString()}
                                onValueChange={(v) =>
                                    editor
                                        ?.chain()
                                        .focus()
                                        .toggleHeading({
                                            level: Number.parseInt(v) as any,
                                        })
                                        .run()
                                }
                            >
                                <DropdownMenuRadioItem value="1" className="text-2xl">
                                    H1
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="2" className="text-xl">
                                    H2
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="3" className="text-lg">
                                    H3
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="4" className="text-md">
                                    H4
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="5" className="text-base">
                                    H5
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="6" className="text-sm">
                                    H6
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <span className="my-1 h-auto w-0 shrink-0 grow-0 rounded-sm border-background/75 border-e-2" />

                    <TooltipText text="Toggle Bold">
                        <div>
                            <Toggle
                                size="icon-sm"
                                aria-label="Toggle bold"
                                pressed={editor?.isActive("bold")}
                                onClick={() => editor?.chain().focus().toggleBold().run()}
                                className="shrink-0 hover:bg-background focus:z-20 data-[state=on]:bg-tertiary"
                            >
                                <BoldIcon className="size-4" />
                            </Toggle>
                        </div>
                    </TooltipText>

                    <TooltipText text="Toggle Italic">
                        <div>
                            <Toggle
                                size="icon-sm"
                                aria-label="Toggle italic"
                                pressed={editor?.isActive("italic")}
                                onClick={() => editor?.chain().focus().toggleItalic().run()}
                                className="shrink-0 hover:bg-background focus:z-20 data-[state=on]:bg-tertiary"
                            >
                                <ItalicIcon className="size-4" />
                            </Toggle>
                        </div>
                    </TooltipText>

                    <TooltipText text="Toggle Underline">
                        <div>
                            <Toggle
                                size="icon-sm"
                                aria-label="Toggle underline"
                                pressed={editor?.isActive("underline")}
                                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                                className="shrink-0 hover:bg-background focus:z-20 data-[state=on]:bg-tertiary"
                            >
                                <UnderlineIcon className="size-4" />
                            </Toggle>
                        </div>
                    </TooltipText>

                    <TooltipText text="Toggle Strikethrough">
                        <div>
                            <Toggle
                                size="icon-sm"
                                aria-label="Toggle strikethrough"
                                pressed={editor?.isActive("strike")}
                                onClick={() => editor?.chain().focus().toggleStrike().run()}
                                className="shrink-0 hover:bg-background focus:z-20 data-[state=on]:bg-tertiary"
                            >
                                <StrikethroughIcon className="size-4" />
                            </Toggle>
                        </div>
                    </TooltipText>

                    <span className="my-1 h-auto w-0 shrink-0 grow-0 rounded-sm border-background/75 border-e-2" />

                    <TooltipText text="Toggle Unordered List">
                        <div>
                            <Toggle
                                size="icon-sm"
                                aria-label="Toggle unordered list"
                                pressed={editor?.isActive("bulletList")}
                                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                className="shrink-0 hover:bg-background focus:z-20 data-[state=on]:bg-tertiary"
                            >
                                <ListIcon className="size-4" />
                            </Toggle>
                        </div>
                    </TooltipText>

                    <TooltipText text="Toggle Ordered List">
                        <div>
                            <Toggle
                                size="icon-sm"
                                aria-label="Toggle ordered list"
                                pressed={editor?.isActive("orderedList")}
                                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                                className="shrink-0 hover:bg-background focus:z-20 data-[state=on]:bg-tertiary"
                            >
                                <ListOrderedIcon className="size-4" />
                            </Toggle>
                        </div>
                    </TooltipText>

                    <span className="my-1 h-auto w-0 shrink-0 grow-0 rounded-sm border-background/75 border-e-2" />

                    <TooltipText text="Toggle Blockquote">
                        <div>
                            <Toggle
                                size="icon-sm"
                                aria-label="Toggle blockquote list"
                                pressed={editor?.isActive("blockquote")}
                                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                                className="shrink-0 hover:bg-background focus:z-20 data-[state=on]:bg-tertiary"
                            >
                                <QuoteIcon className="size-4" />
                            </Toggle>
                        </div>
                    </TooltipText>

                    <Dialog>
                        <TooltipText text={editor?.getAttributes("link")?.href ? "Update Link" : "Insert Link"}>
                            <DialogTrigger
                                className={buttonVariants({
                                    variant: "ghost",
                                    size: "icon-sm",
                                    className: cn(
                                        "shrink-0 hover:bg-background focus:z-20 data-[state=on]:bg-tertiary",
                                        editor?.getAttributes("link")?.href && "bg-tertiary",
                                    ),
                                })}
                            >
                                <LinkIcon className="size-4" />
                            </DialogTrigger>
                        </TooltipText>
                        <DialogContent className="sm:max-w-[425px]">
                            <form
                                action={(form) => {
                                    const url = form.get("link") as string | null;
                                    const text = form.get("link") as string | null;
                                    if (!url || url === "") {
                                        return void editor?.chain().focus().extendMarkRange("link").unsetLink().run();
                                    }
                                    editor?.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
                                    // if (editor?.getText() !== text) {
                                    //     editor?.chain().focus().setContent({ href: url }).run()
                                    // }
                                }}
                            >
                                <DialogHeader>
                                    <DialogTitle>Insert link</DialogTitle>
                                    <DialogDescription>
                                        Please select the type of link you want to insert and fill in all the fields.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="type" className="text-right">
                                            Link type
                                        </Label>
                                        <Select name="type" defaultValue="web" disabled>
                                            <SelectTrigger id="type" className="col-span-3 border-0 bg-secondary">
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="web">Web URL</SelectItem>
                                                <SelectItem value="email">Email address</SelectItem>
                                                <SelectItem value="tel">Phone number</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="link" className="text-right">
                                            URL link
                                        </Label>
                                        <Input
                                            id="link"
                                            name="link"
                                            placeholder="Link"
                                            className="col-span-3 border-0 bg-secondary"
                                            defaultValue={editor?.getAttributes("link").href}
                                            type="url"
                                        />
                                    </div>
                                    {/* <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="text" className="text-right">
                                        Text to display
                                    </Label> */}
                                    {/* // TODO: actually get this linking */}
                                    {/* <Input
                                        id="text"
                                        name="text"
                                        placeholder='Text'
                                        className="col-span-3 border-0 bg-secondary"
                                        defaultValue={"// TODO"}
                                        disabled
                                    />
                                </div> */}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="submit">Save changes</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <TooltipText text="Remove Formatting">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 hover:bg-background focus:z-20 data-[state=on]:bg-tertiary"
                            onClick={() => editor?.chain().focus().unsetAllMarks().run()}
                        >
                            <RemoveFormattingIcon className="size-4" />
                        </Button>
                    </TooltipText>

                    <span className="w-1 shrink-0" />
                </div>
                <span className="flex h-0 w-full shrink-0 grow-0 rounded-sm border-background/75 border-b-2" />
            </div>

            {!editor && (
                <div className="flex h-[calc(100%-2.75rem)] w-full items-center justify-center overflow-auto">
                    <Loader2 className="size-12 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* //todo: maybe use json instead of html */}
            {/* <input hidden value={JSON.stringify(editor?.getJSON()) || savedBody} name="body" /> */}
            <input hidden value={editor?.getHTML() || savedBody} name="body" readOnly />
            <input
                hidden
                value={editor?.getHTML()?.replaceAll(/<li><p>(.*?)<\/p><(\/?)(ol|li|ul)>/gi, "<li>$1<$2$3>")}
                name="html"
                readOnly
            />
            <input hidden value={editor?.getText()?.slice(0, 250)} name="preview" readOnly />
            {/* </div > */}
        </EditorContent>
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
            const res = await sendAction(data);

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
        <Select value={value} onValueChange={setValue} name="from">
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
        if (to.find((r) => r.cc === (type === "to" ? null : type) && r.address === value)) {
            setTo((r) => r.filter((r) => !(r.cc === (type === "to" ? null : type) && r.address === value)));
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
            update();
            element.value = "";
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
                <span className="flex w-full gap-2 overflow-y-hidden text-ellipsis">
                    {types.map((type) => (
                        <Fragment key={type}>
                            <span className="shrink-0 self-center text-muted-foreground text-sm">
                                {{ to: "To", cc: "CC", bcc: "BCC" }[type]}
                            </span>
                            <span className="shrink-0 self-center">
                                {to
                                    .filter((r) => r.cc === (type === "to" ? null : type))
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
                                {type.toUpperCase()}:
                            </span>
                            {to
                                .filter((r) => r.cc === (type === "to" ? null : type))
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
                                                            r.cc === (type === "to" ? null : type)
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
                                        if (!e.currentTarget.value) return toast.warning("Please add an email first");
                                        validate(e.currentTarget, type);
                                    } else if (e.key === "Backspace" && e.currentTarget.value === "") {
                                        setTo((to) => {
                                            const last = to.findLast((r) => r.cc === (type === "to" ? null : type));
                                            if (!last) return to;
                                            return to.filter(
                                                (r) =>
                                                    !(
                                                        r.address === last.address &&
                                                        r.cc === (type === "to" ? null : (type as any))
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
                mx === null && "outline outline-2 outline-destructive",
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
