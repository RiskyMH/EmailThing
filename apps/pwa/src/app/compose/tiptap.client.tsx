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
import { Loader2 } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { BodyHeader } from "./tiptap-header";
import { parse as markedParse } from "marked"
import { use } from "react";

export default function EditorContent2({ savedBody }: { savedBody?: string }) {
    const debounced = useDebouncedCallback(() => (document.getElementById("draft-form") as any)?.requestSubmit(), 1000);
    
    if (savedBody && !(savedBody.startsWith("<") && savedBody.endsWith(">"))) {
        savedBody = markedParse(savedBody, { breaks: true, async: false })
    }

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
            <input hidden value={(editor?.getHTML() + "<!--tiptap-->") || savedBody} name="body" readOnly />
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
