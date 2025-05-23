// import { leaveMailbox, removeUserFromMailbox } from "@/(email)/mail/[mailbox]/config/actions";
import LocalTime from "@/components/localtime.client";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getCurrentUserMailbox, getMailbox, getMailboxUsers } from "@/utils/data/queries/mailbox";
import { useLiveQuery } from "dexie-react-hooks";
import { Loader2, MoreHorizontalIcon, PlusIcon, UserRoundXIcon } from "lucide-react";
import { type FormEvent, useTransition } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { DeleteButton } from "./components.client";

const leaveMailbox = async (mailboxId: string) => {
  toast.info("Not implemented");
};

const removeUserFromMailbox = async (mailboxId: string, userId: string) => {
  toast.info("Not implemented");
};

const addUserToMailbox = async (mailboxId: string, username: string, role: string) => {
  toast.info("Not implemented");
};

export default function Users() {
  const { mailboxId } = useParams<{ mailboxId: string }>();

  const data = useLiveQuery(
    () =>
      Promise.all([
        getMailbox(mailboxId!),
        getMailboxUsers(mailboxId!),
        getCurrentUserMailbox(mailboxId!),
      ]),
    [mailboxId],
  );

  const [mailbox, users, mailboxUser] = data ?? [];

  return (
    <div className="max-w-[40rem]">
      <div className="flex pb-2">
        <h2 className="font-semibold text-lg">
          Users <span className="text-muted-foreground text-sm">({users?.length ?? 0}/5)</span>
        </h2>
        <SmartDrawer>
          <SmartDrawerTrigger asChild>
            <Button
              className="ms-auto flex gap-2"
              size="sm"
              variant="secondary"
              disabled={mailboxUser?.role !== "OWNER"}
            >
              <PlusIcon className="size-4" /> Invite user
            </Button>
          </SmartDrawerTrigger>
          <SmartDrawerContent className="sm:max-w-[425px]">
            <SmartDrawerHeader>
              <SmartDrawerTitle>Invite user</SmartDrawerTitle>
              <SmartDrawerDescription>
                Enter their username and the chosen role type
              </SmartDrawerDescription>
            </SmartDrawerHeader>

            <InviteUserForm mailboxId={mailboxId!} />

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
            <TableRow className="rounded-t-lg">
              <TableHead className="rounded-ss-md bg-tertiary">
                <p>Username</p>
              </TableHead>
              <TableHead className="bg-tertiary">
                <p>Added</p>
              </TableHead>
              <TableHead className="w-1 bg-tertiary">
                <p>Role</p>
              </TableHead>
              <TableHead className="w-1 rounded-se-md bg-tertiary" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.length ? (
              users.map((row) => (
                <TableRow key={row.userId}>
                  <TableCell className="py-3 font-medium">{row.username}</TableCell>
                  <TableCell className="py-3">
                    <LocalTime time={row.joinedAt} />
                  </TableCell>
                  <TableCell className="py-3">
                    <Select
                      defaultValue={row.role || "ADMIN"}
                      disabled={mailboxUser?.role !== "OWNER" || row.role === "OWNER"}
                    >
                      <SelectTrigger className="w-[125px]">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OWNER" disabled>
                          Owner
                        </SelectItem>
                        <SelectItem value="ADMIN" disabled={row.userId === mailboxUser?.userId}>
                          Admin
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
                        {row.userId === mailboxUser?.userId ? (
                          <SmartDrawer>
                            <DropdownMenuItem asChild disabled={row.role === "OWNER"}>
                              <SmartDrawerTrigger className="w-full gap-2">
                                <UserRoundXIcon className="size-5" />
                                Leave mailbox
                              </SmartDrawerTrigger>
                            </DropdownMenuItem>

                            <SmartDrawerContent className="sm:max-w-[425px]">
                              <SmartDrawerHeader>
                                <SmartDrawerTitle>Leave Mailbox</SmartDrawerTitle>
                                <SmartDrawerDescription>
                                  Are you sure you want to leave this mailbox? You will require an
                                  invite to join again.
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
                                <DeleteButton
                                  action={leaveMailbox.bind(null, mailboxId!)}
                                  text="Leave"
                                />
                              </SmartDrawerFooter>
                            </SmartDrawerContent>
                          </SmartDrawer>
                        ) : (
                          <SmartDrawer>
                            <DropdownMenuItem
                              asChild
                              disabled={row.role === "OWNER" || mailboxUser?.role !== "OWNER"}
                            >
                              <SmartDrawerTrigger className="w-full gap-2">
                                <UserRoundXIcon className="size-5" />
                                Remove user
                              </SmartDrawerTrigger>
                            </DropdownMenuItem>

                            <SmartDrawerContent className="sm:max-w-[425px]">
                              <SmartDrawerHeader>
                                <SmartDrawerTitle>Remove User</SmartDrawerTitle>
                                <SmartDrawerDescription>
                                  Are you sure you want to remove <strong>{row.username}</strong>{" "}
                                  &apos;s access to this mailbox?
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
                                <DeleteButton
                                  action={removeUserFromMailbox.bind(null, mailboxId!, row.userId)}
                                  text="Remove User"
                                />
                              </SmartDrawerFooter>
                            </SmartDrawerContent>
                          </SmartDrawer>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className={`h-24 text-center ${!data ? "fade-in" : ""}`} colSpan={4}>
                  {data ? (
                    "No users yet????"
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

export function InviteUserForm({ mailboxId }: { mailboxId: string }) {
  const [isPending, startTransition] = useTransition();

  const formSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      // @ts-expect-error
      const res = await addUserToMailbox(
        mailboxId,
        event.target.username.value,
        event.target.role.value,
      );
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
        <Label htmlFor="role">Role</Label>
        <Select defaultValue="ADMIN" name="role">
          <SelectTrigger className="border-none bg-secondary">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Label htmlFor="password">Username</Label>
        <Input
          className="border-none bg-secondary"
          name="username"
          placeholder="RiskyMH"
          id="username"
          autoFocus
          disabled={isPending}
          required
        />
      </div>

      <Button type="submit" disabled={isPending} className="gap-2">
        {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        Invite user
      </Button>
    </form>
  );
}
