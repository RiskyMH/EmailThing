import TooltipText from "@/components/tooltip-text";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
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
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { Heading1Icon, Heading2Icon, Heading3Icon, Heading4Icon, Heading5Icon, Heading6Icon, HeadingIcon, BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, ListIcon, ListOrderedIcon, QuoteIcon, LinkIcon, RemoveFormattingIcon, Loader2 } from "lucide-react";

import { useDebouncedCallback } from "use-debounce";


export default function EditorContent2({ savedBody }: { savedBody?: string }) {
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
                <BodyHeader editor={editor} />
                <span className="flex h-0 w-full shrink-0 grow-0 rounded-sm border-background/75 border-b-2" />
            </div>

            {!editor && (
                <div className="flex h-[calc(100%-2.75rem)] w-full items-center justify-center overflow-auto fade-in">
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


function getJSON(data?: string) {
    if (!data) return;

    try {
        return JSON.parse(data);
    } catch {
        return data;
    }
}


export function BodyHeader({ editor }: { editor?: Editor | null }) {
    return (
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
    )
}
