"use client";

import MailUnreadIcon from "@/components/icons/mail-unread";
import TooltipText from "@/components/tooltip-text";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { db } from "@/utils/data/db";
import type { EmailListType } from "@/utils/data/queries/email-list";
import { getEmailListQuery, updateEmailProperties } from "@/utils/data/queries/email-list";
import { DBEmail, DBEmailDraft } from "@/utils/data/types";
import { useHoldingShift } from "@/utils/hooks";
import { Collection } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArchiveRestoreIcon,
  CheckIcon, Loader2, MailOpenIcon, StarIcon, TagIcon,
  Trash2Icon
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { SelectionFilter } from "./selection-context";

interface BulkActionsProps {
  mailboxId: string;
  type: EmailListType;
  selectedIds: Set<string> | "all";
  excludedIds: Set<string>;
  filter: SelectionFilter | null;
  categories?: { id: string; name: string; color?: string | 0 }[];
  defaultFilter?: { categoryId?: string | null; search?: string | null };
  onComplete: () => void;
}

async function bulkUpdateEmails(
  mailboxId: string,
  query: Collection<DBEmail, string, DBEmail>,
  updates: Parameters<typeof updateEmailProperties>[2],
) {
  if (mailboxId === "demo") {
    toast("This is a demo - changes won't actually do anything", {
      description: "But you can see how it would work in the real app!",
    });
  } else if (!navigator.onLine) {
    toast.info("You are offline - changes will be synced when you come back online");
  }

  if (updates.hardDelete) {
    if (mailboxId === "demo") {
      await query.delete();
    } else {
      await query.modify({ isDeleted: 1, needsSync: 1, updatedAt: new Date() });
    }
  } else {
    const modify: any = { needsSync: 1, updatedAt: new Date() };
    if (updates.isStarred !== undefined) modify.isStarred = updates.isStarred === true ? 1 : 0;
    if (updates.isRead !== undefined) modify.isRead = updates.isRead === true ? 1 : 0;
    if (updates.categoryId !== undefined) modify.categoryId = updates.categoryId || 0;
    if (updates.binnedAt !== undefined) modify.binnedAt = updates.binnedAt || 0;

    await query.modify(modify);
  }
}

async function bulkDeleteDrafts(mailboxId: string, query: Collection<DBEmail, string, DBEmail>) {
  if (mailboxId === "demo") {
    toast("This is a demo - changes won't actually do anything", {
      description: "But you can see how it would work in the real app!",
    });
  } else if (!navigator.onLine) {
    toast.info("You are offline - changes will be synced when you come back online");
  }

  if (mailboxId === "demo") {
    await query.delete();
  } else {
    await query.modify({ isDeleted: 1, needsSync: 1, updatedAt: new Date() });

  }
}


export function BulkActions({
  mailboxId,
  type,
  selectedIds,
  excludedIds,
  filter,
  categories = [],
  defaultFilter,
  onComplete
}: BulkActionsProps) {
  const [isPending, startTransition_] = useTransition();
  const [pendingType, setPendingType] = useState<string | null>(null);
  const isHoldingShift = useHoldingShift();

  const startTransition = async (callback: () => Promise<void>, type?: string) => {
    setPendingType(type || null);
    startTransition_(async () => {
      await callback();
      setPendingType(null);
    });
    if (mailboxId !== "demo") {
      await db.sync();
    }
  }

  // Get the state of the first selected email to determine toggle behavior
  const firstEmailState = useLiveQuery(async () => {
    try {
      let firstId: string | undefined;

      if (selectedIds === "all" && filter) {
        let allIdsQuery = getEmailListQuery({ mailboxId, type, take: 1, categoryId: filter?.categoryId || undefined, search: filter?.search });
        const hasSubfilter = type !== "drafts" && filter.subFilter
        const hasExcluded = excludedIds.size > 0;
        if (hasSubfilter || hasExcluded) {
          allIdsQuery = allIdsQuery.filter((item) => {
            const matchesSubfilter = filter.subFilter ? {
              read: item.isRead === 1,
              unread: item.isRead === 0,
              starred: item.isStarred === 1,
              unstarred: item.isStarred === 0,
            }[filter.subFilter] : true;
            const notExcluded = !excludedIds.has(item.id);
            return matchesSubfilter && notExcluded;
          });
        }
        firstId = (await allIdsQuery.first())?.id;
      } else if (selectedIds instanceof Set) {
        const table = type !== "drafts" ? db.emails : db.draftEmails;
        let query = table.where("[id+mailboxId]").anyOf(Array.from(selectedIds).map(id => [id, mailboxId]));
        query = query.filter(item => {
          if (!selectedIds.has(item.id)) return false;
          if (type === "sent" && !item.isSender) return false;
          if (type === "trash" && !item.binnedAt) return false;
          if (type === "starred" && !item.isStarred) return false;
          if (type === "temp" && !item.tempId) return false;
          if (type === "inbox" && !!item.isSender) return false;
          if (defaultFilter?.categoryId && type !== "drafts") {
            if ((type === "temp" ? item.tempId : item.categoryId) !== defaultFilter.categoryId) return false;
          }
          if (defaultFilter?.search) {
            const searchLower = defaultFilter.search.toLowerCase();
            const searchableFields = (type === "drafts")
              ? [item.subject, item.body].filter(Boolean)
              : [
                item.subject,
                item.body,
                item.snippet,
                item.sender.name,
                item.sender.address,
                item.recipients.map((r) => r.name).join(", "),
                item.recipients.map((r) => r.address).join(", "),
              ].filter(Boolean);

            const matchesSearch = searchableFields.some((field) => (field || "")?.toLowerCase().includes(searchLower));
            if (!matchesSearch) {
              return false;
            }
          }
          return true;
        });
        // firstId = Array.from(selectedIds)[0];
        firstId = (await query.first())?.id;
      } else {
        return null;
      }

      if (!firstId) {
        return null;
      }

      const email = await (type !== "drafts" ? db.emails : db.draftEmails).where("[id+mailboxId]").equals([firstId, mailboxId]).first();
      if (email) {
        return {
          isRead: 'isRead' in email ? email.isRead === 1 : true,
          isStarred: 'isStarred' in email ? email.isStarred === 1 : false,
        };
      }
    } catch (error) {
      console.error("Error getting first email state:", error);
    }
  }, [selectedIds, excludedIds, filter, mailboxId, type, defaultFilter]);

  const handleBulkAction = async (
    action: (query: Collection<DBEmail, string, DBEmail>) => Promise<void>,
    successMessage: string
  ) => {
    try {
      let query = null as null | Collection<DBEmail, string, DBEmail> | Collection<DBEmailDraft, string, DBEmailDraft>;

      if (selectedIds === "all" && filter) {
        let allIdsQuery = getEmailListQuery({ mailboxId, type, take: Infinity, categoryId: filter?.categoryId, search: filter?.search });
        const hasSubfilter = type !== "drafts" && filter.subFilter
        const hasExcluded = excludedIds.size > 0;
        if (hasSubfilter || hasExcluded) {
          allIdsQuery = allIdsQuery.filter((item) => {
            const matchesSubfilter = filter.subFilter ? {
              read: item.isRead === 1,
              unread: item.isRead === 0,
              starred: item.isStarred === 1,
              unstarred: item.isStarred === 0,
            }[filter.subFilter] : true;
            const notExcluded = !excludedIds.has(item.id);
            return matchesSubfilter && notExcluded;
          });
        }
        query = allIdsQuery;
      } else if (selectedIds instanceof Set) {
        const table = type !== "drafts" ? db.emails : db.draftEmails;
        query = table.where("[id+mailboxId]").anyOf(Array.from(selectedIds).map(id => [id, mailboxId]));
        query = query.filter(item => {
          if (!selectedIds.has(item.id)) return false;
          if (type === "sent" && !item.isSender) return false;
          if (type === "trash" && !item.binnedAt) return false;
          if (type === "starred" && !item.isStarred) return false;
          if (type === "temp" && !item.tempId) return false;
          if (type === "inbox" && !!item.isSender) return false;
          if (defaultFilter?.categoryId && type !== "drafts") {
            if (item.categoryId !== defaultFilter.categoryId) return false;
          }
          if (defaultFilter?.search) {
            const searchLower = defaultFilter.search.toLowerCase();
            const searchableFields = (type === "drafts")
              ? [item.subject, item.body].filter(Boolean)
              : [
                item.subject,
                item.body,
                item.snippet,
                item.sender.name,
                item.sender.address,
                item.recipients.map((r) => r.name).join(", "),
                item.recipients.map((r) => r.address).join(", "),
              ].filter(Boolean);

            const matchesSearch = searchableFields.some((field) => (field || "")?.toLowerCase().includes(searchLower));
            if (!matchesSearch) {
              return false;
            }
          }
          return true;
        });
      } else {
        return;
      }

      if (!await query.clone().first()) {
        toast.error("No emails selected");
        return;
      }
      await action(query);
      toast.success(successMessage);
      onComplete();
    } catch (error) {
      toast.error("Failed to perform bulk action");
      console.error(error);
    }
  };

  const markAsRead = () => handleBulkAction(
    (query) => bulkUpdateEmails(mailboxId, query, { isRead: true }),
    "Marked as read"
  );

  const markAsUnread = () => handleBulkAction(
    (query) => bulkUpdateEmails(mailboxId, query, { isRead: false }),
    "Marked as unread"
  );

  const moveToTrash = () => handleBulkAction(
    (query) => bulkUpdateEmails(mailboxId, query, { binnedAt: new Date() }),
    "Moved to trash"
  );

  const restoreFromTrash = () => handleBulkAction(
    (query) => bulkUpdateEmails(mailboxId, query, { binnedAt: null }),
    "Restored from trash"
  );

  const deleteForever = () => handleBulkAction(
    (query) => (type === "drafts")
      ? bulkDeleteDrafts(mailboxId, query)
      : bulkUpdateEmails(mailboxId, query, { hardDelete: true }),
    "Deleted forever"
  );

  const categorize = (categoryId: string | null) => handleBulkAction(
    (query) => bulkUpdateEmails(mailboxId, query, { categoryId }),
    categoryId ? "Categorized" : "Removed category"
  );

  const readDefaultEnabled = (firstEmailState?.isRead && !isHoldingShift) || (!firstEmailState?.isRead && isHoldingShift);
  const toggleRead = readDefaultEnabled ? markAsUnread : markAsRead

  const starDefaultEnabled = (firstEmailState?.isStarred && !isHoldingShift) || (!firstEmailState?.isStarred && isHoldingShift);
  const toggleStar = () => handleBulkAction(
    (query) => bulkUpdateEmails(mailboxId, query, { isStarred: !starDefaultEnabled }),
    starDefaultEnabled ? "Unstarred" : "Starred"
  );

  return (
    <div className="flex items-center gap-2">
      {type !== "drafts" && (
        <>
          <TooltipText text={readDefaultEnabled ? "Mark as unread" : "Mark as read"}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => startTransition(toggleRead, "toggleRead")}
              className="text-muted-foreground hover:text-foreground rounded-full"
              disabled={isPending}
            >
              {pendingType === "toggleRead" && isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : readDefaultEnabled ? (
                <MailUnreadIcon className="size-5" />
              ) : (
                <MailOpenIcon className="size-5" />
              )}
            </Button>
          </TooltipText>
          <TooltipText text={starDefaultEnabled ? "Unstar" : "Star"}>
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
                  fill={starDefaultEnabled ? "currentColor" : "none"}
                />
              )}
            </Button>
          </TooltipText>
        </>
      )}

      {!["drafts", "temp"].includes(type) ? (
        type !== "trash" ? (
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
        )
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
