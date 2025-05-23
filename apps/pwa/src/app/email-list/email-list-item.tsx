import MailUnreadIcon from "@/components/icons/mail-unread";
import LocalTime from "@/components/localtime.client";
import TooltipText from "@/components/tooltip-text";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { deleteDraftEmail, updateEmailProperties } from "@/utils/data/queries/email-list";
import { cn } from "@/utils/tw";
import {
  ArchiveRestoreIcon,
  ExternalLink,
  ForwardIcon,
  MailOpenIcon,
  PaperclipIcon,
  ReplyAllIcon,
  ReplyIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClientStar, ContextMenuAction } from "../components";

export interface EmailItemProps {
  email: {
    id: string;
    subject: string;
    snippet?: string;
    body?: string;
    html?: string;
    createdAt: Date;
    isRead?: boolean | 0 | 1;
    isStarred?: boolean | 0 | 1;
    binnedAt?: Date | 0;
    categoryId?: string | 0;
    from?: {
      name?: string;
      address: string;
    };
    to?: Array<{
      name?: string;
      address: string;
    }>;
    attachments?: any[];

    isDeleted?: boolean | 0 | 1;
  };
  mailboxId: string;
  type: "inbox" | "sent" | "drafts" | "trash" | "starred" | "temp";
  categories?: { id: string; name: string; color?: string | 0 }[] | 0;
}

function useInView() {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      },
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return [setRef, isInView] as const;
}

export function EmailItem({ email: _email, mailboxId, type, categories }: EmailItemProps) {
  const emailId = _email.id;
  const [email, setEmail] = useState(_email);
  useEffect(() => {
    if (JSON.stringify(email) !== JSON.stringify(_email)) {
      setEmail(_email);
    }
  }, [_email]);

  const updateEmail = async (updates: any) => {
    if (mailboxId === "demo") {
      toast("This is a demo - changes won't actually do anything", {
        description: "But you can see how it would work in the real app!",
      });
    } else if (!navigator.onLine) {
      toast.info("You are offline - changes will be synced when you come back online");
    }
    setEmail({ ...email, ...updates });
    await updateEmailProperties(mailboxId, emailId, updates);
  };

  const deleteEmail = async () => {
    if (type === "drafts") {
      if (mailboxId === "demo") {
        toast("This is a demo - changes won't actually do anything", {
          description: "But you can see how it would work in the real app!",
        });
      } else if (!navigator.onLine) {
        toast.info("You are offline - changes will be synced when you come back online");
      }
      await deleteDraftEmail(mailboxId, emailId);
    } else {
      await updateEmail({ hardDelete: true, isDeleted: 1 });
    }
  };

  const category = (categories || [])?.find((c) => c.id === email.categoryId);
  const link = `/mail/${mailboxId}/${type === "drafts" ? "draft/" : ""}${email.id}`;

  const [ref, isInView] = useInView();

  if (type !== "trash" && email.isDeleted === 1) return null;

  const main = (
    <Link
      ref={ref}
      href={link}
      className={cn(
        "group inline-flex h-10 gap-3 rounded-md px-2 py-1.5 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-4",
        email.isRead
          ? "hover:bg-card/60"
          : "bg-card text-card-foreground shadow-sm hover:bg-card/60",
      )}
    >
      {/* Category indicator */}
      {isInView ? (
        <TooltipText text={category?.name ?? "No category"}>
          <span
            className="inline-block size-4 shrink-0 self-center rounded-full"
            style={{
              backgroundColor: category?.color || "grey",
            }}
          />
        </TooltipText>
      ) : (
        <span
          className="inline-block size-4 shrink-0 self-center rounded-full"
          style={{
            backgroundColor: category?.color || "grey",
          }}
        />
      )}

      {/* Star button */}
      <ClientStar
        enabled={!!email.isStarred}
        action={
          type !== "drafts" ? () => updateEmail({ isStarred: !email.isStarred }) : async () => {}
        }
        className="hidden shrink-0 self-center text-muted-foreground hover:text-foreground sm:inline-block"
      />

      {/* <TooltipText
                        text={email.from?.name || email.from?.address || "There should be an email here"}
                        subtext={email.from?.name && email.from?.address ? `(${email.from?.address})` : ""}
                    > */}
      <span
        className={cn(
          "w-1/4 shrink-0 self-center truncate text-sm max-sm:block sm:w-32 md:w-56",
          !email.isRead ? "font-bold" : "text-foreground/80",
        )}
        title={email.from?.address ?? "uh?"}
      >
        {email.from?.name || email.from?.address}
      </span>
      {/* </TooltipText> */}

      {/* <TooltipText text={email.subject || "No subject was provided"}> */}
      <span
        className={cn(
          "self-center truncate text-sm",
          !email.subject && "italic",
          !email.isRead ? "font-bold" : "text-foreground/80",
        )}
        title={email.subject || "No subject was provided"}
      >
        {email.subject || "(no subject)"}
      </span>
      {/* </TooltipText> */}

      {/* <span className="hidden w-full shrink-[2] gap-4 self-center sm:inline-flex">
                        {!email.isRead && (
                            <span className="inline h-6 select-none self-center rounded bg-red px-3 py-1 font-bold text-white text-xs">
                                NEW
                            </span>
                        )}
                        <span className="line-clamp-2 break-all text-muted-foreground text-sm">{email.snippet}</span>
                    </span> */}

      <div className="float-right ms-auto flex shrink-0 gap-1 self-center text-right text-muted-foreground sm:gap-2 group-hover:sm:hidden ">
        {(email.attachments?.length ?? 0) > 0 && <PaperclipIcon className="size-4 self-center" />}
        <LocalTime
          type="smart"
          time={email.createdAt}
          tooltip={false}
          className="w-auto self-center text-xs"
        />
      </div>
      <div className="float-right ms-auto hidden w-auto shrink-0 gap-4 self-center text-right text-muted-foreground text-xs group-hover:sm:flex">
        {isInView ? (
          <>
            {type !== "drafts" && (
              <ContextMenuAction
                icon={email.isRead ? "MailUnreadIcon" : "MailOpenIcon"}
                action={() => updateEmail({ isRead: !email.isRead })}
                size="small"
                tooltip={email.isRead ? "Mark as unread" : "Mark as read"}
              />
            )}
            {/* <ContextMenuAction
                            icon="Trash2Icon"
                            action={deleteEmail}
                            size="small"
                            tooltip="Delete forever"
                        /> */}
            {!["drafts", "temp"].includes(type) ? (
              <ContextMenuAction
                icon={!email.binnedAt ? "Trash2Icon" : "ArchiveRestoreIcon"}
                action={() => updateEmail({ binnedAt: email.binnedAt ? null : new Date() })}
                tooltip={!email.binnedAt ? "Delete" : "Restore to inbox"}
                size="small"
              />
            ) : (
              <ContextMenuAction
                icon="Trash2Icon"
                action={deleteEmail}
                tooltip="Delete forever"
                size="small"
              />
            )}
          </>
        ) : (
          <>
            {type !== "drafts" &&
              (email.isRead ? (
                <MailUnreadIcon className="size-4 text-muted-foreground" />
              ) : (
                <MailOpenIcon className="size-4 text-muted-foreground" />
              ))}
            {!email.binnedAt ? (
              <Trash2Icon className="size-4 text-muted-foreground" />
            ) : (
              <ArchiveRestoreIcon className="size-4 text-muted-foreground" />
            )}
          </>
        )}
      </div>
    </Link>
  );

  if (!isInView) return main;
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{main}</ContextMenuTrigger>
      <ContextMenuContent>
        {!["drafts", "temp"].includes(type) ? (
          <>
            <ContextMenuItem className="flex gap-2" asChild>
              <Link href={`/mail/${mailboxId}/draft/new?reply=${emailId}`}>
                <ReplyIcon className="size-5 text-muted-foreground" />
                Reply
              </Link>
            </ContextMenuItem>
            <ContextMenuItem className="flex gap-2" asChild>
              <Link href={`/mail/${mailboxId}/draft/new?replyAll=${emailId}`}>
                <ReplyAllIcon className="size-5 text-muted-foreground" />
                Reply to all
              </Link>
            </ContextMenuItem>
            <ContextMenuItem className="flex gap-2" asChild>
              <Link href={`/mail/${mailboxId}/draft/new?forward=${emailId}`}>
                <ForwardIcon className="size-5 text-muted-foreground" />
                Forward
              </Link>
            </ContextMenuItem>
            <ContextMenuSeparator />

            <ContextMenuItem className="flex w-full cursor-pointer gap-2" asChild>
              <ContextMenuAction
                icon="StarIcon"
                fillIcon={!!email.isStarred}
                action={() => updateEmail({ isStarred: !email.isStarred })}
              >
                {email.isStarred ? "Unstar" : "Star"}
              </ContextMenuAction>
            </ContextMenuItem>
            <ContextMenuItem className="flex w-full cursor-pointer gap-2" asChild>
              <ContextMenuAction
                icon={!email.binnedAt ? "Trash2Icon" : "ArchiveRestoreIcon"}
                action={() => updateEmail({ binnedAt: email.binnedAt ? null : new Date() })}
              >
                {!email.binnedAt ? "Delete" : "Restore to inbox"}
              </ContextMenuAction>
            </ContextMenuItem>
            {!!email.binnedAt && (
              <ContextMenuItem className="flex w-full cursor-pointer gap-2" asChild>
                <ContextMenuAction icon="Trash2Icon" action={deleteEmail}>
                  Delete forever
                </ContextMenuAction>
              </ContextMenuItem>
            )}
            <ContextMenuItem className="flex w-full cursor-pointer gap-2" asChild>
              <ContextMenuAction
                icon={email.isRead ? "MailUnreadIcon" : "MailOpenIcon"}
                action={() => updateEmail({ isRead: !email.isRead })}
              >
                {email.isRead ? "Mark as unread" : "Mark as read"}
              </ContextMenuAction>
            </ContextMenuItem>
            <ContextMenuSeparator />

            {type !== "temp" && (
              <ContextMenuSub>
                <ContextMenuSubTrigger className="flex w-full cursor-pointer gap-2">
                  <TagIcon className="size-5 text-muted-foreground" />
                  Categorize as
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem asChild className="flex w-full cursor-pointer gap-2">
                    <ContextMenuAction
                      icon={!email.categoryId ? "CheckIcon" : "EmptyIcon"}
                      action={() => updateEmail({ categoryId: null })}
                    >
                      None
                    </ContextMenuAction>
                  </ContextMenuItem>

                  {(categories || [])?.map((category) => (
                    <ContextMenuItem
                      key={category.id}
                      asChild
                      className="flex w-full cursor-pointer gap-2"
                    >
                      <ContextMenuAction
                        icon={email.categoryId === category.id ? "CheckIcon" : "EmptyIcon"}
                        action={() => updateEmail({ categoryId: category.id })}
                      >
                        {category.name}
                      </ContextMenuAction>
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}
          </>
        ) : (
          <ContextMenuItem className="flex w-full cursor-pointer gap-2" asChild>
            <ContextMenuAction icon="Trash2Icon" action={deleteEmail}>
              Delete forever
            </ContextMenuAction>
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />

        <ContextMenuItem className="flex cursor-pointer gap-2" asChild>
          <Link href={link} target="_blank">
            <ExternalLink className="size-5 text-muted-foreground" />
            Open in new tab
          </Link>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
