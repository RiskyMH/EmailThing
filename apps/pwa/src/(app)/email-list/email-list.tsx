"use client";
import Link from "@/components/link";
import TooltipText from "@/components/tooltip-text";
import { Button, buttonVariants } from "@/components/ui/button";
import { SmartDrawer, SmartDrawerContent, SmartDrawerTrigger } from "@/components/ui/smart-drawer";
import {
  getEmailCategoriesList,
  getEmailCount,
  getEmailList,
} from "@/utils/data/queries/email-list";
import { getCategories, getMailboxName } from "@/utils/data/queries/mailbox";
import { tempEmailsLimit } from "@emailthing/const/limits";
import { formatTimeAgo } from "@/utils/tools";
import { cn } from "@/utils/tw";
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
  subYears,
} from "date-fns";
import { type Observable, liveQuery } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useParams, useSearchParams } from "react-router-dom";
import { EmailItem } from "./email-list-item";
import Loading, {
  EmailListLoadingSkeleton,
  EmailListCategoryLoadingSkeleton,
} from "./email-list-loading";
import { CreateTempEmailForm } from "./email-list-temp-modal";
import RefreshButton from "./refresh-button";
import OnboardingWelcome from "../user-settings/onboarding-welcome";
import MailItemSuspense from "../email-item/mail-item";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"


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
  const [isLg, setIsLg] = useState(typeof window !== "undefined" ? window.innerWidth > 1024 : false);
  useEffect(() => {
    setIsLg(window.innerWidth > 1024);
    const fn = () => {
      setIsLg(window.innerWidth > 1024);
    }
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  return (
    <ResizablePanelGroup direction="horizontal" className="flex w-full min-w-0 flex-row h-full gap-2 md:[.emailscolumn_&]:pb-2 md:[.emailscolumn_&]:pe-2 emailslist">
      <ResizablePanel className="flex w-full flex-col //p-3 md:[.emailscolumn_&]:w-1/2 lg:[.emailscolumn_&]:w-2/5 h-full overflow-auto md:[.emailscolumn_&]:rounded-lg @container" defaultSize={isLg ? 40 : 50} minSize={isLg ? 30 : 35} collapsible={false}>
          {/* <div className="flex flex-col h-full gap-2 pb-2 bg-card rounded-lg overflow-auto"> */}
          <div className="overflow z-10 flex h-10 w-full min-w-0 flex-row items-center justify-center gap-2 //overflow-y-hidden border-b-2 bg-card px-4 md:[.emailscolumn_&]:rounded-t-lg sm:rounded-tl-lg ">
            <Categories filter={type} /> 
          </div>

          <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden w-full bg-card pt-2 px-2" id="email-list-content">
            <Emails filter={type} />
          </div>
          <Title type={type} />
          {/* </div> */}
        </ResizablePanel>

        <ResizableHandle className="bg-transparent mx-[-0.25rem] w-0 max-sm:hidden"/>

        <ResizablePanel className="min-w-0 flex-col h-full //p-3 md:[.emailscolumn_&]:flex hidden w-1/2 lg:w-3/5 rounded-lg overflow-auto @container" minSize={isLg ? 30 : 35} collapsible={false}>
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

  const key = JSON.stringify({
    m: mailboxId,
    t: type,
    c: categoryId,
    q: search,
    d: direction,
    a: getAll,
  });

  const categories = useLiveQuery(() => getCategories(mailboxId), [mailboxId]);

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

  const today = new Date().getDate();

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
      {resultArrays.length > 0 || initialData.length > 0 ? (
        <>
          {type === "trash" && (
            <div className="text-center font-bold text-muted-foreground">
              Messages that have been in the Bin for more than 30 days will be deleted automatically
            </div>
          )}
          {type === "temp" && (
            <div className="text-center font-bold text-muted-foreground">
              {categoryId
                ? // @ts-expect-error types are boring
                `This email address and emails will be automatically deleted ${formatTimeAgo(currentCategory?.expiresAt || new Date(Date.now() * 1000 * 60 * 60 * 24))}`
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
            <div className="text-center text-muted-foreground">
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
    <div className="flex h-5 px-2 font-medium text-muted-foreground text-xs">
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
        <input
          type="checkbox"
          disabled
          id="select"
          className="my-auto mr-2 size-4 shrink-0 self-start"
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

  return (
    <>
      <input
        type="checkbox"
        disabled
        id="select"
        className="my-auto mr-2 size-4 shrink-0 self-start"
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
        {type !== "drafts" &&
          type !== "temp" &&
          !search &&
          (categories || []).map((category) => (
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
                tempEmailsLimit[mailboxPlan?.plan as keyof typeof tempEmailsLimit]
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
