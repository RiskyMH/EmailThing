"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  ArchiveRestoreIcon,
  CheckIcon,
  MailOpenIcon,
  TagIcon,
  Trash2Icon,
  StarIcon,
  Loader2
} from "lucide-react";
import MailUnreadIcon from "@/components/icons/mail-unread";
import { updateEmailProperties, getEmailListQuery } from "@/utils/data/queries/email-list";
import { db } from "@/utils/data/db";
import { toast } from "sonner";
import type { SelectionFilter } from "./selection-context";
import type { EmailListType } from "@/utils/data/queries/email-list";
import TooltipText from "@/components/tooltip-text";
import { useState, useEffect, useTransition } from "react";

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
  const [isPending, startTransition_] = useTransition();
  const [pendingType, setPendingType] = useState<string | null>(null);

  const startTransition = async (callback: () => Promise<void>, type?: string) => {
    setPendingType(type || null);
    startTransition_(async () => {
      await callback();
      setPendingType(null);
    });
  }

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
  }, [selectedIds, excludedIds, filter, mailboxId, pendingType === null]);

  const handleBulkAction = async (
    action: (emailIds: string[]) => Promise<void>,
    successMessage: string
  ) => {
    try {
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
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
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => startTransition(toggleRead, "toggleRead")}
              className="text-muted-foreground hover:text-foreground rounded-full"
              disabled={isPending}
            >
              {pendingType === "toggleRead" && isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : firstEmailState?.isRead ? (
                <MailUnreadIcon className="size-5" />
              ) : (
                <MailOpenIcon className="size-5" />
              )}
            </Button>
          </TooltipText>
          <TooltipText text={firstEmailState?.isStarred ? "Unstar" : "Star"}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => startTransition(toggleStar, "toggleStar")}
              className="text-muted-foreground hover:text-foreground rounded-full"
              disabled={isPending}
            >
              {pendingType === "toggleStar" && isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <StarIcon
                  className="size-5"
                  fill={firstEmailState?.isStarred ? "currentColor" : "none"}
                />
              )}
            </Button>
          </TooltipText>
        </>
      )}

      {!["drafts", "temp"].includes(type) ? (
        <>
          {type !== "trash" ? (
            <TooltipText text="Move to trash">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => startTransition(moveToTrash, "moveToTrash")}
                className="text-muted-foreground hover:text-foreground rounded-full"
                disabled={isPending}
              >
                {pendingType === "moveToTrash" && isPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Trash2Icon className="size-5" />
                )}
              </Button>
            </TooltipText>
          ) : (
            <>
              <TooltipText text="Restore from trash">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => startTransition(restoreFromTrash, "restoreFromTrash")}
                  className="text-muted-foreground hover:text-foreground rounded-full"
                  disabled={isPending}
                >
                  {pendingType === "restoreFromTrash" && isPending ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <ArchiveRestoreIcon className="size-5" />
                  )}
                </Button>
              </TooltipText>
              <TooltipText text="Delete forever">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => startTransition(deleteForever, "deleteForever")}
                  className="text-muted-foreground hover:text-foreground rounded-full"
                  disabled={isPending}
                >
                  {pendingType === "deleteForever" && isPending ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Trash2Icon className="size-5" />
                  )}
                </Button>
              </TooltipText>
            </>
          )}
        </>
      ) : (
        <TooltipText text="Delete forever">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => startTransition(deleteForever, "deleteForever")}
            className="text-muted-foreground hover:text-foreground rounded-full"
            disabled={isPending}
          >
            {pendingType === "deleteForever" && isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Trash2Icon className="size-5" />
            )}
          </Button>
        </TooltipText>
      )}

      {type !== "temp" && type !== "drafts" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TooltipText text="Categorize">
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground rounded-full" disabled={isPending}>
                {pendingType === "categorize" && isPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <TagIcon className="size-5" />
                )}
              </Button>
            </TooltipText>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => startTransition(categorize.bind(null, null), "categorize")}
              className="gap-2"
            >
              <CheckIcon className="size-5 opacity-0" />
              None
            </DropdownMenuItem>
            {categories.map((category) => (
              <DropdownMenuItem
                key={category.id}
                onClick={() => startTransition(categorize.bind(null, category.id), "categorize")}
                className="gap-3"
              >
                <div
                  className="size-4 rounded-full"
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
