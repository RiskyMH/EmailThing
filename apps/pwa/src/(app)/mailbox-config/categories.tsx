import TooltipText from "@/components/tooltip-text";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createCategory,
  deleteCategory,
  getMailbox,
  updateCategory,
} from "@/utils/data/queries/mailbox";
import { getCategories } from "@/utils/data/queries/mailbox";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ChevronDownIcon,
  Loader2,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { type FormEvent, useState, useTransition } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { DeleteButton } from "./components.client";

export default function Categories() {
  const { mailboxId } = useParams<{ mailboxId: string }>();

  const data = useLiveQuery(
    () => Promise.all([getMailbox(mailboxId!), getCategories(mailboxId!)]),
    [mailboxId],
  );

  const [mailbox, categories] = data ?? [];

  return (
    <div className="mb-3 max-w-[40rem]">
      <div className="flex pb-2">
        <h2 className="font-semibold text-lg">Categories</h2>
        <SmartDrawer>
          <SmartDrawerTrigger asChild>
            <Button className="ms-auto flex gap-2" size="sm" variant="secondary">
              <PlusIcon className="size-4" /> Create category
            </Button>
          </SmartDrawerTrigger>
          <SmartDrawerContent className="sm:max-w-[425px]">
            <SmartDrawerHeader>
              <SmartDrawerTitle>Create Category</SmartDrawerTitle>
              <SmartDrawerDescription>
                Enter the category name and a hex color
              </SmartDrawerDescription>
            </SmartDrawerHeader>

            <CreateCategoryForm mailboxId={mailboxId!} />

            <SmartDrawerFooter className="flex pt-2 sm:hidden">
              <SmartDrawerClose asChild>
                <Button variant="secondary">Cancel</Button>
              </SmartDrawerClose>
            </SmartDrawerFooter>
          </SmartDrawerContent>
        </SmartDrawer>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="rounded-ss-md bg-subcard">
                <p>Name</p>
              </TableHead>
              <TableHead className="w-1 rounded-se-md bg-subcard" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.length ? (
              categories.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="h-full gap-2 py-3 font-medium">
                    <span
                      className="mr-2 inline-block size-3 shrink-0 self-center rounded-full"
                      style={{
                        backgroundColor: row.color || "grey",
                      }}
                    />
                    {row.name}
                  </TableCell>
                  <TableCell className="//py-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="size-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <SmartDrawer>
                          <DropdownMenuItem asChild>
                            <SmartDrawerTrigger className="w-full gap-2">
                              <PencilIcon className="size-5 text-muted-foreground" />
                              Edit name
                            </SmartDrawerTrigger>
                          </DropdownMenuItem>
                          <SmartDrawerContent className="sm:max-w-[425px]">
                            <SmartDrawerHeader>
                              <SmartDrawerTitle>Edit Category</SmartDrawerTitle>
                              <SmartDrawerDescription>
                                Enter the new name and hex color
                              </SmartDrawerDescription>
                            </SmartDrawerHeader>

                            <CreateCategoryForm
                              mailboxId={mailboxId!}
                              name={row.name}
                              id={row.id}
                              color={row.color || null}
                            />

                            <SmartDrawerFooter className="flex pt-2 sm:hidden">
                              <SmartDrawerClose asChild>
                                <Button variant="secondary">Cancel</Button>
                              </SmartDrawerClose>
                            </SmartDrawerFooter>
                          </SmartDrawerContent>
                        </SmartDrawer>

                        <SmartDrawer>
                          <DropdownMenuItem className="flex w-full gap-2" asChild>
                            <SmartDrawerTrigger>
                              <Trash2Icon className="size-5 text-muted-foreground" />
                              Delete category
                            </SmartDrawerTrigger>
                          </DropdownMenuItem>

                          <SmartDrawerContent className="sm:max-w-[425px]">
                            <SmartDrawerHeader>
                              <SmartDrawerTitle>Delete Category</SmartDrawerTitle>
                              <SmartDrawerDescription>
                                Are you sure you want to delete <strong>{row.name}</strong>? This
                                will NOT delete any emails in this category.
                              </SmartDrawerDescription>
                            </SmartDrawerHeader>
                            <SmartDrawerFooter className="flex pt-2">
                              <SmartDrawerClose
                                className={buttonVariants({ variant: "secondary" })}
                              >
                                Cancel
                              </SmartDrawerClose>
                              <DeleteButton
                                action={() => deleteCategory(mailboxId!, row.id)}
                                instant={true}
                              />
                            </SmartDrawerFooter>
                          </SmartDrawerContent>
                        </SmartDrawer>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className={`h-24 text-center ${!data ? "fade-in" : ""}`} colSpan={2}>
                  {data ? (
                    "No categories yet."
                  ) : (
                    <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const defaultColors = [
  { name: "Grey", hex: "#6b7280" },
  { name: "Red", hex: "#ef4444" },
  { name: "Orange", hex: "#f97316" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Lime", hex: "#84cc16" },
  { name: "Green", hex: "#22c55e" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Fuchsia", hex: "#d946ef" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Rose", hex: "#f43f5e" },
];

export function CreateCategoryForm({
  mailboxId,
  id,
  name,
  color: c,
}:
  | { mailboxId: string; id?: undefined; name?: undefined; color?: undefined }
  | { mailboxId: string; id: string; name: string; color: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [color, setColor] = useState(c || "");

  const formSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      toast.error("Invalid hex color", {
        description: "Please enter a valid hex color (i.e. #000000)",
      });
      return;
    }

    document.getElementById("smart-drawer:close")?.click();
    if (isPending) return;

    if (mailboxId === "demo") {
      toast("This is a demo - changes won't actually do anything", {
        description: "But you can see how it would work in the real app!",
      });
    } else if (!navigator.onLine) {
      toast.info("You are offline - changes will be synced when you come back online");
    }

    startTransition(async () => {
      const target = event.target as HTMLFormElement;

      const name = target.elements.namedItem("name") as HTMLInputElement | null;
      const color = target.elements.namedItem("color") as HTMLInputElement | null;

      const res = id
        ? await updateCategory(mailboxId, id, name?.value ?? "name", color?.value ?? null)
        : await createCategory(mailboxId, name?.value ?? "name", color?.value ?? null);

      if (res?.error) {
        toast.error(res.error);
      } else {
        document.getElementById("smart-drawer:close")?.click();
      }
    });
  };

  return (
    <form className="grid items-start gap-4 px-4 sm:px-0" onSubmit={formSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          className="border-none bg-secondary"
          name="name"
          placeholder="Work"
          id="name"
          autoFocus
          disabled={isPending}
          required
          defaultValue={name}
        />

        <Label htmlFor="name">Color</Label>
        <div className="flex items-center gap-2">
          <Input
            className="border-none bg-secondary"
            name="color"
            placeholder="#000000"
            id="color"
            disabled={isPending}
            value={color}
            onChange={(e) => setColor(e.currentTarget.value)}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" className="px-3" type="button">
                <ChevronDownIcon className="size-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-wrap justify-evenly gap-4">
              {defaultColors.map((color) => (
                <TooltipText text={color.name} subtext={color.hex} key={color.hex}>
                  <button
                    style={{ backgroundColor: color.hex }}
                    className="size-6 shrink-0 grow-0 rounded-full transition-all hover:opacity-75"
                    onClick={() => setColor(color.hex)}
                    type="button"
                  />
                </TooltipText>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="gap-2">
        {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        {id ? "Edit category" : "Create category"}
      </Button>
    </form>
  );
}
