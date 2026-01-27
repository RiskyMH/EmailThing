"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  ArchiveRestoreIcon,
  CheckIcon,
  MailOpenIcon,
  MoreHorizontalIcon,
  TagIcon,
  Trash2Icon,
  StarIcon,
  Loader2
} from "lucide-react";
import MailUnreadIcon from "@/components/icons/mail-unread";
import { updateEmailProperties, getEmailList, getEmailListQuery } from "@/utils/data/queries/email-list";
import { db } from "@/utils/data/db";
import { toast } from "sonner";
import type { SelectionFilter } from "./selection-context";
import type { EmailListType } from "@/utils/data/queries/email-list";
import TooltipText from "@/components/tooltip-text";
import { useState, useEffect, useTransition } from "react";
import { VariantProps } from "class-variance-authority";

interface BulkActionsProps {
  mailboxId: string;
  type: EmailListType;
  selectedIds: Set<string> | "all";
  excludedIds: Set<string>;
  includedIds: Set<string>;
  filter: SelectionFilter | null;
  categories?: { id: string; name: string; color?: string | 0 }[];
  onComplete: () => void;
}

async function bulkUpdateEmails(
  mailboxId: string,
  emailIds: string[],
  updates: Parameters<typeof updateEmailProperties>[2],
  sync = true
) {
  if (mailboxId === "demo") {
    toast("This is a demo - changes won't actually do anything", {
      description: "But you can see how it would work in the real app!",
    });
    return;
  }

  if (!navigator.onLine) {
    toast.info("You are offline - changes will be synced when you come back online");
  }

  await db.transaction("rw", [db.emails], async () => {
    if (updates.hardDelete) {
      return db.emails.bulkUpdate(emailIds.map(id => ({
        key: id,
        changes: { isDeleted: 1, needsSync: 1, updatedAt: new Date() }
      })));
    } else {
      const modify: any = { needsSync: 1, updatedAt: new Date() };
      if (updates.isStarred !== undefined) modify.isStarred = updates.isStarred === true ? 1 : 0;
      if (updates.isRead !== undefined) modify.isRead = updates.isRead === true ? 1 : 0;
      if (updates.categoryId !== undefined) modify.categoryId = updates.categoryId || 0;
      if (updates.binnedAt !== undefined) modify.binnedAt = updates.binnedAt || 0;
      console.log("modify", modify, emailIds);

      return db.emails.bulkUpdate(emailIds.map(id => ({
        key: id,
        changes: modify
      })));
    }
  });

  if (mailboxId !== "demo" && sync) {
    await db.sync();
  }
}

async function bulkDeleteDrafts(mailboxId: string, emailIds: string[]) {
  if (mailboxId === "demo") {
    toast("This is a demo - changes won't actually do anything", {
      description: "But you can see how it would work in the real app!",
    });
    return;
  }

  if (!navigator.onLine) {
    toast.info("You are offline - changes will be synced when you come back online");
  }

  await db.transaction("rw", [db.draftEmails], async () => {
    for (const emailId of emailIds) {
      if (mailboxId === "demo") {
        await db.draftEmails.where("[id+mailboxId]").equals([emailId, mailboxId]).delete();
      } else {
        await db.draftEmails
          .where("[id+mailboxId]")
          .equals([emailId, mailboxId])
          .modify({ isDeleted: 1, needsSync: 1, updatedAt: new Date() });
      }
    }
  });

  if (mailboxId !== "demo") {
    await db.sync();
  }
}

function LoaderButton({ actionn, ...props }: (
  React.ComponentProps<"button">
  & VariantProps<typeof buttonVariants>
  & { asChild?: boolean }
  & { actionn: () => Promise<void> })
) {
  const [isPending, startTransition] = useTransition();
  if (isPending) {
    return (
      <Button
        disabled
        {...props}
      >
        <Loader2 className="size-5 animate-spin" />
      </Button>
    );
  }
  return <Button {...props} onClick={() => startTransition(actionn)} />;
}

export function BulkActions({
  mailboxId,
  type,
  selectedIds,
  excludedIds,
  includedIds,
  filter,
  categories = [],
  onComplete
}: BulkActionsProps) {
  const [firstEmailState, setFirstEmailState] = useState<{ isRead?: boolean; isStarred?: boolean } | null>(null);

  // Get the state of the first selected email to determine toggle behavior
  useEffect(() => {
    const getFirstEmailState = async () => {
      try {
        let firstId: string | undefined;

        if (selectedIds === "all" && filter) {
          let allIdsQuery = getEmailListQuery({ mailboxId, type, take: 1, categoryId: filter.categoryId, search: filter.search });
          if (type !== "drafts" && filter.subFilter) {
            allIdsQuery = allIdsQuery.filter((item) => {
              switch (filter.subFilter) {
                case 'read':
                  return item.isRead === 1;
                case 'unread':
                  return item.isRead === 0;
                case 'starred':
                  return item.isStarred === 1;
                case 'unstarred':
                  return item.isStarred === 0;
                default:
                  return true;
              }
            });
          }
          allIdsQuery = allIdsQuery.filter(({ id }) => !excludedIds.has(id));
          firstId = (await allIdsQuery.first())?.id;
        } else if (selectedIds instanceof Set) {
          firstId = Array.from(selectedIds)[0];
        }

        if (!firstId) {
          setFirstEmailState(null);
          return;
        }

        const email = await db.emails.where("[id+mailboxId]").equals([firstId, mailboxId]).first();
        if (email) {
          setFirstEmailState({
            isRead: email.isRead === 1,
            isStarred: email.isStarred === 1,
          });
        }
      } catch (error) {
        console.error("Error getting first email state:", error);
      }
    };

    getFirstEmailState();
  }, [selectedIds, excludedIds, filter, mailboxId]);

  const handleBulkAction = async (
    action: (emailIds: string[]) => Promise<void>,
    successMessage: string
  ) => {
    try {
      let emailIds: string[];
      console.log("selectedIds", selectedIds, { filter, excludedIds, includedIds });

      if (selectedIds === "all" && filter) {
        let allIdsQuery = getEmailListQuery({ mailboxId, type, take: Infinity, categoryId: filter.categoryId, search: filter.search });
        if (type !== "drafts" && filter.subFilter) {
          allIdsQuery = allIdsQuery.filter((item) => {
            switch (filter.subFilter) {
              case 'read':
                return item.isRead === 1;
              case 'unread':
                return item.isRead === 0;
              case 'starred':
                return item.isStarred === 1;
              case 'unstarred':
                return item.isStarred === 0;
              default:
                return true;
            }
          });
        }
        allIdsQuery = allIdsQuery.filter(({ id }) => !excludedIds.has(id));
        emailIds = (await allIdsQuery.primaryKeys()).map(id => id.toString());
      } else if (selectedIds instanceof Set) {
        emailIds = Array.from(selectedIds);
      } else {
        return;
      }

      if (emailIds.length === 0) {
        toast.error("No emails selected");
        return;
      }
      console.log("Performing bulk action on email IDs:", emailIds);
      await action(emailIds);
      toast.success(successMessage);
      onComplete();
      db.sync();
    } catch (error) {
      toast.error("Failed to perform bulk action");
      console.error(error);
    }
  };

  const markAsRead = () => handleBulkAction(
    (ids) => bulkUpdateEmails(mailboxId, ids, { isRead: true }, false),
    "Marked as read"
  );

  const markAsUnread = () => handleBulkAction(
    (ids) => bulkUpdateEmails(mailboxId, ids, { isRead: false }, false),
    "Marked as unread"
  );

  const moveToTrash = () => handleBulkAction(
    (ids) => bulkUpdateEmails(mailboxId, ids, { binnedAt: new Date() }, false),
    "Moved to trash"
  );

  const restoreFromTrash = () => handleBulkAction(
    (ids) => bulkUpdateEmails(mailboxId, ids, { binnedAt: null }, false),
    "Restored from trash"
  );

  const deleteForever = () => handleBulkAction(
    async (ids) => {
      if (type === "drafts") {
        await bulkDeleteDrafts(mailboxId, ids);
      } else {
        await bulkUpdateEmails(mailboxId, ids, { hardDelete: true }, false);
      }
    },
    "Deleted forever"
  );

  const categorize = (categoryId: string | null) => handleBulkAction(
    (ids) => bulkUpdateEmails(mailboxId, ids, { categoryId }, false),
    categoryId ? "Categorized" : "Removed category"
  );

  const toggleRead = () => {
    if (firstEmailState?.isRead) {
      return markAsUnread();
    } else {
      return markAsRead();
    }
  };

  const toggleStar = () => handleBulkAction(
    (ids) => bulkUpdateEmails(mailboxId, ids, { isStarred: !firstEmailState?.isStarred }, false),
    firstEmailState?.isStarred ? "Unstarred" : "Starred"
  );

  return (
    <div className="flex items-center gap-2">
      {type !== "drafts" && (
        <>
          <TooltipText text={firstEmailState?.isRead ? "Mark as unread" : "Mark as read"}>
            <LoaderButton
              variant="ghost"
              size="icon-sm"
              actionn={toggleRead}
              className="text-muted-foreground hover:text-foreground rounded-full"
            >
              {firstEmailState?.isRead ? (
                <MailUnreadIcon className="size-5" />
              ) : (
                <MailOpenIcon className="size-5" />
              )}
            </LoaderButton>
          </TooltipText>
          <TooltipText text={firstEmailState?.isStarred ? "Unstar" : "Star"}>
            <LoaderButton
              variant="ghost"
              size="icon-sm"
              actionn={toggleStar}
              className="text-muted-foreground hover:text-foreground rounded-full"
            >
              <StarIcon
                className="size-5"
                fill={firstEmailState?.isStarred ? "currentColor" : "none"}
              />
            </LoaderButton>
          </TooltipText>
        </>
      )}

      {!["drafts", "temp"].includes(type) ? (
        <>
          {type !== "trash" ? (
            <TooltipText text="Move to trash">
              <LoaderButton
                variant="ghost"
                size="icon-sm"
                actionn={moveToTrash}
                className="text-muted-foreground hover:text-foreground rounded-full"
              >
                <Trash2Icon className="size-5" />
              </LoaderButton>
            </TooltipText>
          ) : (
            <>
              <TooltipText text="Restore from trash">
                <LoaderButton
                  variant="ghost"
                  size="icon-sm"
                  actionn={restoreFromTrash}
                  className="text-muted-foreground hover:text-foreground rounded-full"
                >
                  <ArchiveRestoreIcon className="size-5" />
                </LoaderButton>
              </TooltipText>
              <TooltipText text="Delete forever">
                <LoaderButton
                  variant="ghost"
                  size="icon-sm"
                  actionn={deleteForever}
                  className="text-muted-foreground hover:text-foreground rounded-full"
                >
                  <Trash2Icon className="size-5" />
                </LoaderButton>
              </TooltipText>
            </>
          )}
        </>
      ) : (
        <TooltipText text="Delete forever">
          <LoaderButton
            variant="ghost"
            size="icon-sm"
            actionn={deleteForever}
            className="text-muted-foreground hover:text-foreground rounded-full"
          >
            <Trash2Icon className="size-5" />
          </LoaderButton>
        </TooltipText>
      )}

      {type !== "temp" && type !== "drafts" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TooltipText text="Categorize">
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground rounded-full">
                <TagIcon className="size-5" />
              </Button>
            </TooltipText>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => categorize(null)}>
              <CheckIcon className="mr-2 size-5 opacity-0" />
              None
            </DropdownMenuItem>
            {categories.map((category) => (
              <DropdownMenuItem
                key={category.id}
                onClick={() => categorize(category.id)}
              >
                <div
                  className="mr-2 size-4 rounded-full"
                  style={{ backgroundColor: category.color || "grey" }}
                />
                {category.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
