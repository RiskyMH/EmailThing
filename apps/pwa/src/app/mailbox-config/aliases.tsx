import { Table } from "@/components/ui/table";

// import { changeDefaultAlias, deleteAlias } from "@/(email)/mail/[mailbox]/config/actions";
import { DeleteButton } from "@/app/mailbox-config/components.client";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMailbox, getMailboxAliases } from "@/utils/data/queries/mailbox";
import { aliasLimit } from "@/utils/limits";
import { useLiveQuery } from "dexie-react-hooks";
import {
  CheckIcon,
  Loader2,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useTransition } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { ContextMenuAction } from "../components";

const addAlias = async (mailboxId: string, alias: string, name: string) => {
  toast.info("Not implemented");
};

const editAlias = async (mailboxId: string, id: string, name: string | null) => {
  toast.info("Not implemented");
};

export default function Aliases() {
  const { mailboxId } = useParams<{ mailboxId: string }>();

  const data = useLiveQuery(
    () => Promise.all([getMailbox(mailboxId!), getMailboxAliases(mailboxId!)]),
    [mailboxId],
  );

  const [mailbox, aliases] = data ?? [];

  const changeDefaultAlias = async (aliasId: string) => {
    toast.info("Not implemented");
  };

  const deleteAlias = async (aliasId: string) => {
    toast.info("Not implemented");
  };

  return (
    <div className="mb-3 max-w-[40rem]">
      <div className="flex pb-2">
        <h2 className="font-semibold text-lg">
          Aliases <span className="text-muted-foreground text-sm">({aliases?.length ?? 0}/5)</span>
        </h2>
        <SmartDrawer>
          <SmartDrawerTrigger asChild>
            <Button
              disabled={aliases ? aliases?.length >= aliasLimit[mailbox?.plan ?? "FREE"] : false}
              className="ms-auto flex gap-2"
              size="sm"
              variant="secondary"
            >
              <PlusIcon className="size-4" /> Create alias
            </Button>
          </SmartDrawerTrigger>
          <SmartDrawerContent className="sm:max-w-[425px]">
            <SmartDrawerHeader>
              <SmartDrawerTitle>Add Alias</SmartDrawerTitle>
              <SmartDrawerDescription>
                Enter your chosen email and name to create alias
              </SmartDrawerDescription>
            </SmartDrawerHeader>

            <AddAliasForm mailboxId={mailboxId!} />

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
              <TableHead className="rounded-ss-md bg-tertiary">
                <p>Alias</p>
              </TableHead>
              <TableHead className="bg-tertiary">
                <p>Name</p>
              </TableHead>
              <TableHead className="bg-tertiary text-center">
                <p>Default</p>
              </TableHead>
              <TableHead className="w-1 rounded-se-md bg-tertiary" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {aliases?.length ? (
              aliases.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="py-3 font-medium">{row.alias}</TableCell>
                  <TableCell className="py-3">{row.name || ""}</TableCell>
                  <TableCell className="py-3">
                    {row.default ? <CheckIcon className="mx-auto size-4" /> : null}
                  </TableCell>
                  <TableCell className="py-3">
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
                              <SmartDrawerTitle>Edit Alias</SmartDrawerTitle>
                              <SmartDrawerDescription>
                                Enter your chosen name to update alias
                              </SmartDrawerDescription>
                            </SmartDrawerHeader>

                            <EditAliasForm
                              mailboxId={mailboxId!}
                              alias={row.alias}
                              id={row.id}
                              name={row.name || null}
                            />

                            <SmartDrawerFooter className="flex pt-2 sm:hidden">
                              <SmartDrawerClose asChild>
                                <Button variant="secondary">Cancel</Button>
                              </SmartDrawerClose>
                            </SmartDrawerFooter>
                          </SmartDrawerContent>
                        </SmartDrawer>

                        <DropdownMenuItem disabled={!!row.default} className="flex gap-2" asChild>
                          <ContextMenuAction
                            icon="CheckIcon"
                            action={changeDefaultAlias.bind(null, row.id)}
                          >
                            Make default
                          </ContextMenuAction>
                        </DropdownMenuItem>

                        <SmartDrawer>
                          <DropdownMenuItem
                            className="flex w-full gap-2"
                            disabled={!!row.default || aliases?.length <= 1}
                            asChild
                          >
                            <SmartDrawerTrigger>
                              <Trash2Icon className="size-5 text-muted-foreground" />
                              Delete alias
                            </SmartDrawerTrigger>
                          </DropdownMenuItem>

                          <SmartDrawerContent className="sm:max-w-[425px]">
                            <SmartDrawerHeader>
                              <SmartDrawerTitle>Delete Alias</SmartDrawerTitle>
                              <SmartDrawerDescription>
                                Are you sure you want to delete <strong>{row.alias}</strong>?
                              </SmartDrawerDescription>
                            </SmartDrawerHeader>
                            <SmartDrawerFooter className="flex pt-2">
                              <SmartDrawerClose
                                className={buttonVariants({
                                  variant: "secondary",
                                })}
                              >
                                Cancel
                              </SmartDrawerClose>
                              <DeleteButton action={deleteAlias.bind(null, row.id)} />
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
                <TableCell className={`h-24 text-center ${!data ? "fade-in" : ""}`} colSpan={4}>
                  {data ? (
                    "No aliases yet??"
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

export function AddAliasForm({ mailboxId }: { mailboxId: string }) {
  const [isPending, startTransition] = useTransition();

  const formSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      // @ts-expect-error
      const res = await addAlias(mailboxId, event.target.alias.value, event.target.name.value);
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
        <Label htmlFor="alias">Alias</Label>
        <Input
          className="border-none bg-secondary"
          name="alias"
          placeholder="me@example.com"
          id="alias"
          autoFocus
          disabled={isPending}
          required
        />

        <Label htmlFor="name">Name</Label>
        <Input
          className="border-none bg-secondary"
          name="name"
          placeholder="John Doe"
          id="name"
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending} className="gap-2">
        {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        Add alias
      </Button>
    </form>
  );
}

export function EditAliasForm({
  mailboxId,
  alias,
  name,
  id,
}: { mailboxId: string; alias: string; name: string | null; id: string }) {
  const [isPending, startTransition] = useTransition();

  const formSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      // @ts-expect-error
      const res = await editAlias(mailboxId, id, event.target.name.value || null);
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
        <Label htmlFor="password">Alias</Label>
        <Input
          className="border-none bg-secondary"
          name="alias"
          placeholder="me@example.com"
          id="alias"
          value={alias}
          readOnly
          disabled={true}
        />

        <Label htmlFor="password">Name</Label>
        <Input
          className="border-none bg-secondary"
          name="name"
          placeholder="John Doe"
          id="name"
          defaultValue={name || ""}
          disabled={isPending}
          autoFocus
        />
      </div>
      <Button type="submit" disabled={isPending} className="gap-2">
        {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        Edit alias
      </Button>
    </form>
  );
}
