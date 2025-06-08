import { StarIcon } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex w-full min-w-0 flex-row h-full gap-2 sm:[.emailscolumn_&]:pb-2 sm:[.emailscolumn_&]:pe-2 emailslist">
      <div className="flex w-full flex-col //p-3 sm:[.emailscolumn_&]:w-1/2 lg:[.emailscolumn_&]:w-2/5 h-full overflow-auto sm:[.emailscolumn_&]:rounded-lg">
        <div className="overflow z-10 flex h-10 w-full min-w-0 flex-row items-center justify-center gap-2 //overflow-y-hidden border-b-2 bg-card px-4 sm:[.emailscolumn_&]:rounded-t-lg sm:rounded-tl-lg">
          <EmailListCategoryLoadingSkeleton />
        </div>
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden w-full bg-card pt-2 px-2" id="email-list-content">
          <div className="infinite-scroll-component__outerdiv flex w-full min-w-0 flex-col gap-2">
            <EmailListLoadingSkeleton />
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-col h-full //p-3 sm:[.emailscolumn_&]:flex hidden w-1/2 lg:w-3/5 rounded-lg overflow-auto bg-card">
        <div className="flex size-full flex-col items-center justify-center [.emailslist_&]:bg-card rounded-lg bg-card">
          <div className="">
            <p className="text-muted-foreground">Select an email to view</p>
          </div>
        </div>
      </div>

    </div>
  );
}

export function EmailListLoadingSkeleton() {
  return (
    <>
      <div className="flex h-5 px-2 font-medium text-muted-foreground text-xs">
        <p className="self-end">Today</p>
      </div>

      {
        Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="//bg-card flex h-10 w-full animate-pulse gap-3 rounded-md px-2 py-1.5"
          >
            <span
              className="m-2 mx-auto inline-block size-4 shrink-0 self-center rounded-full"
              style={{ backgroundColor: "grey" }}
            />
            <StarIcon className="hidden size-4 shrink-0 self-center text-muted-foreground sm:inline-block" />
            <div className="h-4 w-1/4 shrink-0 self-center sm:w-32 md:w-56 sm:[.emailscolumn_&]:w-32">
              <span className="me-auto block h-4 w-full max-w-20 rounded bg-muted-foreground/50" />
            </div>
            <div className="h-4 w-full self-center">
              <span className="me-auto block h-4 w-full max-w-56 rounded bg-muted-foreground/50 md:max-w-72 lg:max-w-[30rem]" />
            </div>
            <span className="float-right h-4 w-10 shrink-0 self-center rounded bg-muted-foreground/25 text-right text-sm sm:w-16" />
          </div>
        ))
      }
    </>
  );
}

export function EmailListCategoryLoadingSkeleton() {
  return (
    <>
      <input type="checkbox" disabled id="select" className="my-auto mr-2 size-4 self-start" />
      <div className="inline-flex h-10 w-auto max-w-fit animate-pulse items-center justify-center gap-1 border-transparent border-b-3 px-1 font-bold">
        <span className="h-5 w-36 self-center rounded bg-muted-foreground/25" />
      </div>

      <div className="ms-auto me-2 flex h-6 shrink-0 animate-pulse items-center justify-center">
        <span className="-m-2 size-5 rounded-full bg-muted-foreground/25 p-2" />
      </div>
    </>
  );
}
