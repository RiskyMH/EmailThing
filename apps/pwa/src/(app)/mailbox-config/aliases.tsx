import { Table } from "@/components/ui/table";

// import { changeDefaultAlias, deleteAlias } from "@/(email)/mail/[mailbox]/config/actions";
import { DeleteButton } from "@/(app)/mailbox-config/components.client";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SmartDrawer,
  SmartDrawerClose,
  SmartDrawerContent,
  SmartDrawerDescription,
  SmartDrawerFooter,
  SmartDrawerHeader,
  SmartDrawerTitle,
  SmartDrawerTrigger
} from "@/components/ui/smart-drawer";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/utils/data/db";
import { getMailbox, getMailboxAliases, getMailboxCustomDomains } from "@/utils/data/queries/mailbox";
import { getLogedInUserApi } from "@/utils/data/queries/user";
import { aliasLimit } from "@emailthing/const/limits";
import { useLiveQuery } from "dexie-react-hooks";
import {
  CheckIcon,
  Loader2,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon
} from "lucide-react";
import type { FormEvent } from "react";
import { useTransition } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { ContextMenuAction } from "../components";
import changeMailboxSettings from "./_api";

const addAlias = async (mailboxId: string, alias: string, name: string) => {
  return changeMailboxSettings(mailboxId, "add-alias", { alias, name });
};

const editAlias = async (mailboxId: string, id: string, name: string | null) => {
  return changeMailboxSettings(mailboxId, "edit-alias", { aliasId: id, name });
};

const changeDefaultAlias = async (mailboxId: string, aliasId: string) => {
  return changeMailboxSettings(mailboxId, "change-default-alias", { defaultAliasId: aliasId });
};

const deleteAlias = async (mailboxId: string, aliasId: string) => {
  return changeMailboxSettings(mailboxId, "delete-alias", { aliasId });
};

export function useDefaultDomains(mailboxId: string) {
  return useSWR<{ domains: string[], tempDomains: string[] }>(
    `/api/internal/mailbox/${mailboxId}/default-domains`,
    async () => {
      if (!mailboxId) return { domains: [], tempDomains: [] };
      if (mailboxId === "demo") return { domains: [], tempDomains: [] };

      let sync = await getLogedInUserApi();
      if (sync?.tokenNeedsRefresh) {
        await db.refreshToken();
        sync = await getLogedInUserApi();
      }

      const response = await fetch(
        `${sync?.apiUrl || ""}/api/internal/mailbox/${mailboxId}/default-domains`,
        {
          method: "GET",
          headers: {
            Authorization: `session ${sync?.token}`,
          },
        },
      );
      if (!response.ok) {
        return { domains: [], tempDomains: [] };
      }
      return response.json() as Promise<{ domains: string[], tempDomains: string[] }>;
    },
    {
      fallbackData: { domains: ["emailthing.xyz"], tempDomains: ["temp.emailthing.xyz"] },
    }
  );

}

export default function Aliases() {
  const { mailboxId } = useParams<{ mailboxId: string }>();

  const data = useLiveQuery(
    () => Promise.all([getMailbox(mailboxId!), getMailboxAliases(mailboxId!), getMailboxCustomDomains(mailboxId!)]),
    [mailboxId],
  );

  const [mailbox, aliases, customDomains] = data ?? [];
  const { data: defaultDomainss } = useDefaultDomains(mailboxId!);
  const defaultDomains = defaultDomainss?.domains;

  return (
    <div className="mb-3 max-w-[40rem]">
      <div className="flex pb-2 gap-2">
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

            <AddAliasForm mailboxId={mailboxId!} defaultDomains={defaultDomains} customDomains={customDomains?.map(domain => domain.domain)} />

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
              <TableHead className="rounded-ss-md bg-sidebar">
                <p>Alias</p>
              </TableHead>
              <TableHead className="bg-sidebar">
                <p>Name</p>
              </TableHead>
              <TableHead className="bg-sidebar text-center">
                <p>Default</p>
              </TableHead>
              <TableHead className="w-1 rounded-se-md bg-sidebar" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {aliases?.length ? (
              aliases.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="//py-1 font-medium">{row.alias}</TableCell>
                  <TableCell className="//py-1">{row.name || ""}</TableCell>
                  <TableCell className="//py-1">
                    {row.default ? <CheckIcon className="mx-auto size-4" /> : null}
                  </TableCell>
                  <TableCell className="//py-1">
                    <DropdownMenu modal={false}>
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
                            action={changeDefaultAlias.bind(null, mailboxId!, row.id)}
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
                              <DeleteButton action={deleteAlias.bind(null, mailboxId!, row.id)} />
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
    </div >
  );
}

export function AddAliasForm({ mailboxId, defaultDomains, customDomains }: { mailboxId: string; defaultDomains?: string[]; customDomains?: string[] }) {
  const [isPending, startTransition] = useTransition();

  const formSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      // @ts-expect-error
      const res = await addAlias(mailboxId, event.target.alias.value + "@" + event.target.domain.value, event.target.name.value);
      if (res?.error) {
        toast.error(res.error);
      } else {
        document.getElementById("smart-drawer:close")?.click();
      }
    });
  };
  const _domains = new Set<string>();
  defaultDomains?.forEach(domain => _domains.add(domain));
  customDomains?.forEach(domain => _domains.add(domain));
  const domains = [..._domains]

  return (
    <form className="grid items-start gap-4 px-4 sm:px-0" onSubmit={formSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="alias">Alias</Label>
        <div className="flex gap-2 w-full">
          <Input
            className="border-none bg-secondary w-4/7"
            name="alias"
            placeholder="Johnny"
            id="alias"
            autoFocus
            disabled={isPending}
            required
          />
          <Select name="domain" defaultValue={domains[0]}>
            <SelectTrigger className="w-3/7 overflow-auto border-none bg-secondary">
              <SelectValue placeholder="@domain" className="overflow-auto" />
            </SelectTrigger>
            <SelectContent>
              {domains?.map((domain, index) => (
                <SelectItem key={domain} value={domain} defaultChecked={index === 0}>
                  @{domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

        <Label htmlFor="name">Name</Label>
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
