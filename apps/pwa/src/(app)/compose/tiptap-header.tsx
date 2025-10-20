import TooltipText from "@/components/tooltip-text";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/utils/tw";
import type { Editor } from "@tiptap/react";
import {
  BoldIcon,
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
  QuoteIcon,
  RemoveFormattingIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react";

export function BodyHeader({ editor }: { editor?: Editor | null }) {
  "use no memo"; // tiptap buttons need the events

  return (
    <div className="flex w-full gap-1">
      <span />
      <Select
        value={editor?.getAttributes("textStyle").fontFamily || "Arial, sans-serif"}
        disabled={editor ? !editor.can().setFontFamily("Arial, sans-serif") : false}
        onValueChange={(v) => editor?.chain().focus().setFontFamily(v).run()}
      >
        <TooltipText text="Change Font">
          <SelectTrigger
            className="!h-8 w-auto shrink-0 gap-2 border-none !bg-transparent shadow-none px-2.5 focus-within:z-20 hover:bg-input/70! focus:z-20 sm:w-[150px]"
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
              disabled={editor ? !editor.can().toggleHeading({ level: 1 }) : false}
              className="shrink-0 hover:bg-input/70 focus:z-20 data-[state=on]:bg-input"
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
                  level: Number.parseInt(v) as 1 | 2 | 3 | 4 | 5 | 6,
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
            disabled={editor ? !editor.can().toggleBold() : false}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className="shrink-0 hover:bg-input/70 focus:z-20 data-[state=on]:bg-input"
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
            disabled={editor ? !editor.can().toggleItalic() : false}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className="shrink-0 hover:bg-input/70 focus:z-20 data-[state=on]:bg-input"
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
            disabled={editor ? !editor.can().toggleUnderline() : false}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className="shrink-0 hover:bg-input/70 focus:z-20 data-[state=on]:bg-input"
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
            disabled={editor ? !editor.can().toggleStrike() : false}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            className="shrink-0 hover:bg-input/70 focus:z-20 data-[state=on]:bg-input"
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
            disabled={editor ? !editor.can().toggleBulletList() && !editor.can().toggleOrderedList() : false}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className="shrink-0 hover:bg-input/70 focus:z-20 data-[state=on]:bg-input"
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
            disabled={editor ? !editor.can().toggleOrderedList() && !editor.can().toggleBulletList() : false}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className="shrink-0 hover:bg-input/70 focus:z-20 data-[state=on]:bg-input"
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
            disabled={editor ? !editor.can().toggleBlockquote() : false}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className="shrink-0 hover:bg-input/70 focus:z-20 data-[state=on]:bg-input"
          >
            <QuoteIcon className="size-4" />
          </Toggle>
        </div>
      </TooltipText>

      <Dialog>
        <TooltipText text={editor?.getAttributes("link")?.href ? "Update Link" : "Insert Link"}>
          <DialogTrigger
            disabled={editor ? !editor.can().setLink({ href: "" }) : false}
            className={buttonVariants({
              variant: "ghost",
              size: "icon-sm",
              className: cn(
                "shrink-0 hover:bg-input/70 focus:z-20 data-[state=on]:bg-input",
                editor?.getAttributes("link")?.href && "bg-background",
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
          disabled={editor ? !editor.can().unsetAllMarks() : false}
          className="shrink-0 hover:bg-input/70 focus:z-20 data-[state=on]:bg-input"
          onClick={() => editor?.chain().focus().unsetAllMarks().run()}
        >
          <RemoveFormattingIcon className="size-4" />
        </Button>
      </TooltipText>

      <span className="w-1 shrink-0" />
    </div>
  );
}
