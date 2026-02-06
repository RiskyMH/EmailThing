"use client";
import MailUnreadIcon from "@/components/icons/mail-unread";
import Link from "@/components/link";
import TooltipText from "@/components/tooltip-text";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import { SmartDrawer, SmartDrawerContent, SmartDrawerTrigger } from "@/components/ui/smart-drawer";
import { db } from "@/utils/data/db";
import {
  getEmailCategoriesList,
  getEmailCount,
  getEmailList
} from "@/utils/data/queries/email-list";
import { getCategories, getMailboxName, getTempAliases } from "@/utils/data/queries/mailbox";
import { formatTimeAgo } from "@/utils/tools";
import { cn } from "@/utils/tw";
import { TEMP_EMAIL_EXPIRES_IN } from "@emailthing/const/expiry";
import { tempEmailsLimit } from "@emailthing/const/limits";
import {
  format,
  isSameMonth,
  isSameWeek,
  isSameYear,
  isThisWeek,
  isToday,
  isYesterday,
  startOfToday,
  startOfWeek,
  startOfYesterday,
  subMonths,
  subWeeks,
  subYears
} from "date-fns";
import { liveQuery, type Observable } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDown, ArrowUp, ChevronDown, ListChecksIcon, Loader2, MailOpenIcon, StarIcon, StarOffIcon, XIcon } from "lucide-react";
import { Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useParams, useSearchParams } from "react-router-dom";
import MailItemSuspense from "../email-item/mail-item";
import OnboardingWelcome from "../user-settings/onboarding-welcome";
import { BulkActions } from "./bulk-actions";
import { EmailItem } from "./email-list-item";
import Loading, {
  EmailListCategoryLoadingSkeleton, EmailListLoadingSkeleton
} from "./email-list-loading";
import { CreateTempEmailForm } from "./email-list-temp-modal";
import RefreshButton from "./refresh-button";
import { SelectionProvider, useSelection } from "./selection-context";

export default function EmailListSuspenced({
  filter,
}: { filter: "inbox" | "drafts" | "sent" | "starred" | "trash" | "temp" }) {
  if (typeof window === "undefined") return <Loading />;
  return (
    <Suspense fallback={<Loading />}>
      <EmailList filter={filter} />
    </Suspense>
  );
}

export interface Email {
  id: string;
  subject: string;
  snippet?: string;
  body?: string;
  html?: string;
  createdAt: Date;
  isRead?: boolean;
  isStarred?: boolean;
  binnedAt?: Date | null;
  categoryId?: string | null;
  /** if draft, its actually the recipient */
  from: {
    name: string;
    address: string;
  };
}

export interface Category {
  id: string;
  name: string;
  /** hex color */
  color?: string;
}

declare global {
  interface Window {
    _tempData?: {
      emailList?: Record<string, any>;
      emailCategoriesList?: Record<string, any>;
      scrollY?: {
        emailList?: Record<string, number>;
      };
    };
  }
}

function EmailList({
  filter: type,
}: { filter: "inbox" | "drafts" | "sent" | "starred" | "trash" | "temp" }) {
  const [isLg, setIsLg] = useState(typeof window !== "undefined" ? window.innerWidth > 1280 : false);
  useEffect(() => {
    setIsLg(window.innerWidth > 1280);
    const fn = () => {
      setIsLg(window.innerWidth > 1280);
    }
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  return (
    <ResizablePanelGroup direction="horizontal" className="flex w-full min-w-0 flex-row h-full gap-2 2xl:gap-3 md:[.emailscolumn_&]:pb-2 md:[.emailscolumn_&]:pe-2 emailslist bg-sidebar">
      <ResizablePanel className="flex w-full flex-col //p-3 md:[.emailscolumn_&]:w-1/2 xl:[.emailscolumn_&]:w-2/5 h-full overflow-auto md:[.emailscolumn_&]:rounded-lg @container" defaultSize={isLg ? 40 : 50} minSize={isLg ? 30 : 35} collapsible={false}>
        <SelectionProvider>
          {/* <div className="flex flex-col h-full gap-2 pb-2 bg-card rounded-lg overflow-auto"> */}
          <div className="overflow z-10 flex h-10 w-full min-w-0 flex-row items-center justify-center gap-2 //overflow-y-hidden border-b-2 bg-background px-4 md:[.emailscolumn_&]:rounded-t-lg sm:rounded-tl-lg ">
            <Categories filter={type} />
          </div>

          <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden w-full bg-background pt-2 //px-2" id="email-list-content">
            <Emails filter={type} />
          </div>
          <Title type={type} />
          {/* </div> */}
        </SelectionProvider>
      </ResizablePanel>

      <ResizableHandle className="bg-transparent mx-[-0.25rem] 2xl:mx-[-0.375rem] w-0 max-sm:hidden" />

      <ResizablePanel className="min-w-0 flex-col h-full //p-3 md:[.emailscolumn_&]:flex hidden w-1/2 xl:w-3/5 rounded-lg overflow-auto @container" minSize={isLg ? 30 : 35} collapsible={false}>
        {/* <div className=" bg-card rounded-lg h-full overflow-auto">
          </div> */}
        <MailItemSuspense />
      </ResizablePanel>

    </ResizablePanelGroup>
  );
}

function Title({ type }: { type: "inbox" | "drafts" | "sent" | "starred" | "trash" | "temp" }) {
  const params = useParams<"mailboxId">();
  const mailboxId =
    params.mailboxId === "[mailboxId]" || !params.mailboxId ? "demo" : params.mailboxId;
  const searchParams = useSearchParams()[0];
  const search = searchParams.get("q") as string | null;
  const onboarding = searchParams.has("onboarding");
  const emailId = searchParams.get("mailId") as string | null;

  const key = JSON.stringify({ mailboxId, type });
  const _data = window?._tempData?.emailList?.[key];

  const data = useLiveQuery(async () => {
    const types = {
      inbox: "unread",
      drafts: "drafts",
      sent: "",
      starred: "",
      trash: "binned",
      temp: "temp",
    } as const;
    return Promise.all([getEmailCount(mailboxId, types[type]), getMailboxName(mailboxId)]);
  }, [mailboxId, type]);

  if (data && typeof window !== "undefined") {
    window._tempData ||= {};
    window._tempData.emailList ||= {};
    window._tempData.emailList[key] = data;
  }

  const [count, name] = (data || _data || [0, undefined]) as [number, string | undefined];

  const names = {
    inbox: "Inbox",
    drafts: "Drafts",
    sent: "Sent",
    starred: "Starred",
    trash: "Trash",
    temp: "Temporary Email",
  } as Record<string, string>;

  useEffect(() => {
    if (search) {
      if (count) {
        document.title = `Search results (${count}) • EmailThing`;
      } else {
        document.title = "Search results • EmailThing";
      }
    } else if (count || name) {
      document.title = `${names[type] || "Inbox"}${count ? ` (${count})` : ""}${name ? ` • ${name}` : ""} • EmailThing`;
    } else {
      document.title = `${names[type] || "Inbox"} • EmailThing`;
    }

    return () => {
      document.title = "EmailThing";
    };
  }, [count, name, search, type, emailId]);

  if (onboarding) {
    return <OnboardingWelcome />;
  }

  return null;
}

const pageSize = 25;

function Emails({
  filter: type,
}: { filter: "inbox" | "drafts" | "sent" | "starred" | "trash" | "temp" }) {
  const params = useParams<"mailboxId">();
  const searchParams = useSearchParams()[0];
  const categoryId = searchParams.get("category") as string | null;
  const search = searchParams.get("q") as string | null;
  const direction = (searchParams.get("direction") as "asc" | "desc" | null) || "desc";
  const getAll = searchParams.has("all");
  const mailboxId =
    params.mailboxId === "[mailboxId]" || !params.mailboxId ? "demo" : params.mailboxId;
  const emailId = searchParams.get("mailId") as string | null;

  const key = JSON.stringify({
    m: mailboxId,
    t: type,
    c: categoryId,
    q: search,
    d: direction,
    a: getAll,
  });

  const categories = useLiveQuery(() => type === "temp" ? getTempAliases(mailboxId) : getCategories(mailboxId), [mailboxId, type]);

  const createLiveQuery = useCallback(
    (pageNo: number) =>
      liveQuery(() =>
        getEmailList({
          mailboxId,
          type,
          categoryId: categoryId ?? undefined,
          search: search ?? undefined,
          take: getAll ? Number.POSITIVE_INFINITY : pageSize,
          skip: getAll ? 0 : pageSize * pageNo,
          direction: direction,
        }),
      ),
    [mailboxId, type, categoryId, search, direction, getAll],
  );

  const initialData = typeof window !== "undefined" ? window._tempData?.emailList?.[key] || [] : [];
  const queriesRef = useRef<Observable<Awaited<ReturnType<typeof getEmailList>>>[]>([
    createLiveQuery(0),
  ]);
  const [resultArrays, setResultArrays] =
    useState<Awaited<ReturnType<typeof getEmailList>>[]>(initialData);

  const initial = useRef(true);

  useEffect(() => {
    const initialScrollY =
      initial.current && key
        ? window._tempData?.scrollY?.emailList?.[key + window.history.state?.idx.toString()] || 0
        : 0;

    if (window._tempData?.emailList?.[key]) {
      // only do the whole data if back button is used, otherwise use first page
      if (initial.current && key) {
        const count = window._tempData.emailList[key].length;
        queriesRef.current = Array.from({ length: count }, (_, i) => createLiveQuery(i));
        setResultArrays(window._tempData.emailList[key]);
      } else {
        queriesRef.current = [createLiveQuery(0)];
        setResultArrays(window._tempData.emailList[key].slice(0, 1));
      }
      initial.current = false;
    } else {
      if (initial.current) {
        initial.current = false;
        document.getElementById("email-list-content")?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      queriesRef.current = [createLiveQuery(0)];
      setResultArrays([]);
    }

    document
      .getElementById("email-list-content")
      ?.scrollTo({ top: initialScrollY, behavior: "smooth" });
    setTimeout(() => {
      document
        .getElementById("email-list-content")
        ?.scrollTo({ top: initialScrollY, behavior: "smooth" });
    }, 0);
  }, [categoryId, search, type, mailboxId, key, createLiveQuery]);

  // bind pgup and pgdown to scroll
  useEffect(() => {
    const content = document.getElementById("email-list-content");
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PageUp") {
        content?.scrollTo({ top: content?.scrollTop - window.innerHeight, behavior: "smooth" });
      }
      if (e.key === "PageDown") {
        content?.scrollTo({ top: content?.scrollTop + window.innerHeight, behavior: "smooth" });
      }
      if (e.key === "End") {
        content?.scrollTo({ top: content?.scrollHeight, behavior: "smooth" });
      }
      if (e.key === "Home") {
        content?.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    window._tempData ||= {};
    window._tempData.emailList ||= {};
    window._tempData.emailList[key] = resultArrays;
  }, [resultArrays]);

  useEffect(() => {
    const subscriptions = queriesRef.current.map((q, i) =>
      q.subscribe((results) =>
        setResultArrays((prev) => {
          if (JSON.stringify(prev[i]) === JSON.stringify(results)) {
            return prev;
          }
          const arrayClone = [...prev];
          arrayClone[i] = results;
          return arrayClone;
        }),
      ),
    );

    return () => subscriptions.forEach((s) => s.unsubscribe());
  }, [queriesRef.current]);

  const fetchMoreData = useCallback(() => {
    const nextPageNo = queriesRef.current.length;
    const newQuery = createLiveQuery(nextPageNo);
    queriesRef.current = [...queriesRef.current, newQuery];

    // Force effect to run again with new query
    setResultArrays((prev) => [...prev]);
  }, [createLiveQuery]);

  const emails = useMemo(() => resultArrays.flat(1), [resultArrays]);

  const hasSynced = useLiveQuery(async () => {
    if (emails.length === 0) {
      const syncing = await db.localSyncData.toArray();
      return syncing?.every((s) => s.lastSync);
    }
    return true;
  }, [emails]);


  const today = new Date().getDate();

  const currentCategory = useMemo(() => categories?.find((c) => c.id === categoryId), [categories, categoryId]);

  return (
    <InfiniteScroll
      dataLength={emails.length}
      next={fetchMoreData}
      hasMore={resultArrays.at(-1)?.length === pageSize && !getAll}
      loader={
        <div
          className={buttonVariants({ variant: "outline", size: "lg", className: "flex gap-2" })}
        >
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      }
      className="flex w-full min-w-0 flex-col gap-2"
      scrollableTarget="email-list-content"
      scrollThreshold={0.75}
      // initialScrollY={initialScrollY || -10000}
      onScroll={(e) => {
        window._tempData ||= {};
        window._tempData.scrollY ||= {};
        window._tempData.scrollY.emailList ||= {};
        window._tempData.scrollY.emailList[key + window.history.state?.idx.toString()] =
          e.target?.scrollTop;
      }}
    >
      {((resultArrays.length > 0 || initialData.length > 0) && hasSynced) ? (
        <>
          {type === "trash" && (
            <div className="text-center font-bold text-muted-foreground px-4 text-balance">
              Messages that have been in the Bin for more than 30 days will be deleted automatically
            </div>
          )}
          {type === "temp" && (
            <div className="text-center font-bold text-muted-foreground px-4 text-balance">
              {categoryId
                ? // @ts-expect-error types are boring
                `This email address and emails will be automatically deleted ${formatTimeAgo(currentCategory?.expiresAt || new Date(Date.now() + TEMP_EMAIL_EXPIRES_IN))}`
                : "Email addresses will be automatically deleted in 24 hours after creation."}
              {categoryId && (
                <p className="pt-1 font-normal">
                  {/* @ts-expect-error types are boring */}
                  {currentCategory?.alias}
                </p>
              )}
            </div>
          )}
          {emails.length === 0 && (
            <div className="text-center text-muted-foreground px-4 text-balance">
              {search
                ? `Couldn't find any emails matching "${search}"`
                : type === "drafts"
                  ? "No drafts"
                  : "No emails"}
            </div>
          )}
        </>
      ) : (
        <EmailListLoadingSkeleton />
      )}

      {emails.map((email, i) => (
        <Fragment key={email.id}>
          <EmailDate
            dateA={email.createdAt.toISOString()}
            dateB={emails[i - 1]?.createdAt.toISOString()}
            today={today}
          />
          <EmailItem
            key={email.id}
            email={email}
            categories={categories || undefined}
            mailboxId={mailboxId}
            type={type}
            isSelected={emailId === email.id}
          />
        </Fragment>
      ))}
    </InfiniteScroll>
  );
}

const now = new Date();
const today = startOfToday();
const yesterday = startOfYesterday();
const thisWeekStart = startOfWeek(today);
const lastWeekStart = subWeeks(thisWeekStart, 1);
const lastMonthStart = subMonths(today, 1);
const lastYearStart = subYears(today, 1);

function getDateString(date: Date, _today: number) {
  let dateString;
  if (isToday(date)) {
    dateString = "Today";
  } else if (isYesterday(date)) {
    dateString = "Yesterday";
  } else if (isThisWeek(date)) {
    // If it's this week but before yesterday, show the day name
    dateString = format(date, "EEEE");
  } else if (isSameWeek(date, lastWeekStart)) {
    dateString = "Last week";
  } else if (isSameMonth(date, lastMonthStart)) {
    dateString = format(date, "MMMM");
  } else if (isSameYear(date, now)) {
    dateString = format(date, "MMMM");
  } else {
    dateString = format(date, "MMMM yyyy");
  }

  return dateString;
}

function EmailDate({
  dateA,
  dateB,
  today,
}: { dateA: string; dateB?: string | null; today: number }) {
  const dateString = getDateString(new Date(dateA), today);
  const dateStringB = dateB ? getDateString(new Date(dateB), today) : null;
  if (dateB && dateString === dateStringB) return null;

  return (
    <div className="flex h-5 px-4 font-medium text-muted-foreground text-xs">
      <p className="self-end">{dateString}</p>
    </div>
  );
}

function Categories({
  filter: type,
}: { filter: "inbox" | "drafts" | "sent" | "starred" | "trash" | "temp" }) {
  const params = useParams<"mailboxId">();
  const searchParams = useSearchParams()[0];
  const search = searchParams.get("q") as string | null;
  const categoryId = searchParams.get("category") as string | null;
  const mailboxId =
    params.mailboxId === "[mailboxId]" || !params.mailboxId ? "demo" : params.mailboxId;
  const baseUrl = `/mail/${mailboxId}${type === "inbox" ? "" : `/${type}`}`;

  const key = JSON.stringify({ mailboxId, type, search });
  const _data = window?._tempData?.emailCategoriesList?.[key];

  const data = useLiveQuery(async () => {
    const emails = await getEmailCategoriesList({
      mailboxId,
      type,
      search: search ?? undefined,
    });
    return [emails, key];
  }, [mailboxId, type, search, key]);

  const { selectionMode, selectAll, selectMultiple, clearSelection, getSelectedIds, getExcludedIds, getFilter } = useSelection();

  const isLoading = !(data || _data);
  if (isLoading) return <EmailListCategoryLoadingSkeleton />;

  const name = {
    inbox: "Inbox",
    drafts: "Drafts",
    sent: "Sent",
    starred: "Starred",
    trash: "Trash",
    temp: "Temporary Email",
  }[type];

  if (data?.[1] !== key && _data?.[1] !== key) {
    return (
      <>
        <Checkbox
          id="select"
          className="my-auto mr-2 size-4 shrink-0 self-start cursor-pointer border-muted-foreground"
        />
        <div className="flex h-10 w-full min-w-0 flex-row overflow-y-hidden text-nowrap">
          <CategoryItem
            circleColor={null}
            name={search ? "Search results" : name || "All"}
            count={null}
            link={baseUrl}
            category={null}
            main
          />
        </div>
      </>
    );
  }

  const __data = data?.[1] === key ? data : _data;

  if (data && typeof window !== "undefined" && data?.[1] === key) {
    window._tempData ||= {};
    window._tempData.emailCategoriesList ||= {};
    window._tempData.emailCategoriesList[key] = data;
  }

  const { categories, mailboxPlan, allCount } = __data?.[0] as Awaited<
    ReturnType<typeof getEmailCategoriesList>
  >;

  const isSelecting = selectionMode.type !== "none";
  const isAllSelected = selectionMode.type === "all";
  const isAllActuallySelected = isAllSelected && !selectionMode.filter.subFilter && selectionMode.excludedIds.size === 0;
  const isSomeSelected = selectionMode.type === "some";
  const checked = isSomeSelected ? "indeterminate" : isAllSelected ? isAllActuallySelected ? true : "indeterminate" : false

  const handleSelectAllToggle = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (isAllActuallySelected) {
      clearSelection();
    } else {
      selectAll({
        mailboxId,
        type,
        categoryId: categoryId ?? undefined,
        search: search ?? undefined,
      });
    }
  };

  const handleSelectFilter = async (filterType: 'all' | 'none' | 'empty' | 'read' | 'unread' | 'starred' | 'unstarred') => {
    if (filterType === 'none') {
      clearSelection();
      return;
    }

    if (filterType === 'empty') {
      selectMultiple([]);
      return;
    }

    if (filterType === 'all') {
      selectAll({
        mailboxId,
        type,
        categoryId: categoryId ?? undefined,
        search: search ?? undefined,
      });
      return;
    }

    // For read/unread/starred/unstarred, use "all" mode with subFilter
    // This way it stays lazy and updates as emails change
    selectAll({
      mailboxId,
      type,
      categoryId: categoryId ?? undefined,
      search: search ?? undefined,
      subFilter: filterType as 'read' | 'unread' | 'starred' | 'unstarred',
    });
  };

  return (
    <>
      {isSelecting ? (
        <>
          <div className="flex gap-2">
            <div className="flex gap-1 -ms-1 p-1 hover:bg-accent hover:text-accent-foreground rounded-md">
              <Checkbox
                checked={checked}
                onChange={handleSelectAllToggle}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAllToggle(e);
                }}
                id="select"
                className="my-auto mr-0 size-4 shrink-0 self-start cursor-pointer border-muted-foreground z-10"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <TooltipText text="Select filter">
                    <Button
                      variant="ghost"
                      size="auto"
                      className="h-auto z-0 p-0 cursor-pointer hover:bg-transparent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                  </TooltipText>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => handleSelectFilter('all')}>
                    <ListChecksIcon className="mr-2 size-4" /> All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSelectFilter('empty')}>
                    <XIcon className="mr-2 size-4" />
                    None
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSelectFilter('read')}>
                    <MailOpenIcon className="mr-2 size-4" />
                    Read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSelectFilter('unread')}>
                    <MailUnreadIcon className="mr-2 size-4" />
                    Unread
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSelectFilter('starred')}>
                    <StarIcon className="mr-2 size-4" />
                    Starred
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSelectFilter('unstarred')}>
                    <StarOffIcon className="mr-2 size-4" />
                    Unstarred
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <BulkActions
            mailboxId={mailboxId}
            type={type}
            selectedIds={getSelectedIds()}
            excludedIds={getExcludedIds()}
            filter={getFilter()}
            categories={categories}
            defaultFilter={{ categoryId, search }}
            // onComplete={clearSelection}
            onComplete={() => { }}
          />
          <div className="h-10" />
        </>
      ) : (
        <>
          <Checkbox
            onChange={handleSelectAllToggle}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAllToggle(e);
            }}
            id="select"
            className="my-auto mr-2 size-4 shrink-0 self-start cursor-pointer border-muted-foreground"
          />
          <div className="flex h-10 w-full min-w-0 flex-row gap-4 overflow-y-hidden text-nowrap">
            <CategoryItem
              circleColor={null}
              name={search ? "Search results" : name || "All"}
              count={allCount}
              link={baseUrl}
              category={null}
              main
            />
            {type !== "drafts" && !search && (categories || []).map((category) => (
              <CategoryItem
                key={category.id}
                circleColor={category.color || "grey"}
                name={category.name}
                count={category.count || 0}
                link={baseUrl}
                category={category.id}
              />
            ))}
          </div>
          {type === "temp" && (
            <SmartDrawer>
              <SmartDrawerTrigger asChild>
                <Button
                  size="sm"
                  className="-my-1 h-auto py-1"
                  disabled={
                    // biome-ignore lint/complexity/useOptionalChain: <explanation>
                    ((categories && categories?.length) || 0) >=
                    tempEmailsLimit[mailboxPlan as keyof typeof tempEmailsLimit]
                  }
                >
                  Create email
                </Button>
              </SmartDrawerTrigger>
              <SmartDrawerContent className="sm:max-w-[425px]">
                <CreateTempEmailForm mailboxId={mailboxId} />
              </SmartDrawerContent>
            </SmartDrawer>
          )}
        </>
      )}
      <div className="ms-auto flex h-6 shrink-0 items-center justify-center gap-2">
        {allCount > 25 && <DirectionButton />}
        <RefreshButton />
      </div>

    </>
  );
}

export function CategoryItem({
  circleColor,
  name,
  count,
  link,
  category,
  main = false,
}: {
  circleColor: string | null;
  name: string;
  count: number | null;
  link: string;
  category: string | null;
  main?: boolean;
}) {
  const searchParams = useSearchParams()[0];
  const categoryId = searchParams.get("category") as string | null;

  const isCurrent = main ? !categoryId : categoryId === category;

  return (
    <Link
      href={link + (category ? `?category=${category}` : "")}
      className={cn(
        "group relative inline-flex w-auto max-w-fit shrink-0 items-center gap-2 border-transparent border-b-3 px-1",
        // isCurrent && "border-blue",
      )}
      onClick={() => {
        if (window._tempData?.scrollY?.emailList) {
          window._tempData.scrollY.emailList = {};
        }
        setTimeout(() => {
          document.getElementById("mail-layout-content")?.scrollTo({ top: 0, behavior: "smooth" });
        }, 0);
      }}
    >
      {/* absolute blue border for the width of the current category */}
      {isCurrent && (
        <div className="absolute right-0 bottom-1 left-0 z-10 h-[2.5px] rounded bg-blue" />
      )}
      {circleColor && (
        <div className="size-2.5 rounded-full" style={{ backgroundColor: circleColor }} />
      )}
      <span className="font-medium text-sm group-hover:text-muted-foreground">{name}</span>
      {count !== null && (
        <span className="font-medium text-muted-foreground text-xs group-hover:text-muted-foreground/50">
          {count}
        </span>
      )}
    </Link>
  );
}

function DirectionButton() {
  const searchParams = useSearchParams()[0];
  const direction = searchParams.get("direction") as "asc" | "desc" | null;
  const hrefInverted = new URLSearchParams(searchParams.toString());
  hrefInverted.set("direction", direction === "asc" ? "desc" : "asc");

  return (
    <TooltipText text={direction === "asc" ? "Oldest first" : "Newest first"}>
      <Button
        variant="ghost"
        size="auto"
        asChild
        className="-m-2 me-0 shrink-0 rounded-full p-2 text-muted-foreground hover:text-foreground"
      >
        <Link href={`?${hrefInverted.toString()}`}>
          {direction === "asc" ? <ArrowUp className="size-5" /> : <ArrowDown className="size-5" />}
        </Link>
      </Button>
    </TooltipText>
  );
}
