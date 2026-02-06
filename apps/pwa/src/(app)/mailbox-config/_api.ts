import type {
  MappedPossibleData,
  MappedPossibleDataResponse
} from "@/../app/api/internal/mailbox/[mailbox]/settings/route";
import { db } from "@/utils/data/db";
import { getLogedInUserApi } from "@/utils/data/queries/user";
import { parseSync } from "@/utils/data/sync-user";

export default async function changeMailboxSettings<T extends keyof MappedPossibleData>(
  mailboxId: string,
  type: T,
  data: MappedPossibleData[T],
): Promise<MappedPossibleDataResponse["message"] | { error: string }> {
  if (!navigator.onLine) return { error: "No internet connection" };
  try {
    let sync = await getLogedInUserApi();
    if (sync?.tokenNeedsRefresh) {
      await db.refreshToken();
      sync = await getLogedInUserApi();
    }

    const response = await fetch(
      `${sync?.apiUrl}/api/internal/mailbox/${mailboxId}/settings?type=${type as string}`,
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          Authorization: `session ${sync?.token}`,
        },
      },
    );
    if (!response.ok) {
      const res = await response.json();
      return res?.message ?? res ?? { error: "Failed to fetch" };
    }

    const res = (await response.json()) as MappedPossibleDataResponse;
    if ("error" in res) return res.message;

    if ("sync" in res) {
      const { sync: data } = res;
      await parseSync(data, sync?.userId!);
    }

    return res?.message;
  } catch (e) {
    console.error(e);
    return { error: "Failed to fetch" };
  }
}
