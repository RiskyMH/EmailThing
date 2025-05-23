import { db } from "@/utils/data/db";
import { getMe } from "@/utils/data/queries/user";
import { useLiveQuery } from "dexie-react-hooks";
import { UserDropDown } from "./user-nav.client";
import { DemoLinkButton, UserNavFallback, UserNavLogin } from "./user-navbar.static";

export default function UserNav({ fallbackLogin }: { fallbackLogin?: boolean }) {
  const Fallback = fallbackLogin ? UserNavLogin : UserNavFallback;

  const user = useLiveQuery(async () => (await getMe()) || null, []);
  if (user === undefined) return <Fallback />;
  if (user === null) return <UserNavLogin />;

  return (
    <UserDropDown
      user={{
        name: user.username,
        secondary: user.email,
        email: user.email,
      }}
    />
  );
}

export function DemoLink() {
  const isLoggedIn = useLiveQuery(
    async () => {
      const users = await db.user.count();
      return users > 0;
    },
    [],
    null,
  );

  if (isLoggedIn === true || isLoggedIn === null) return null;
  return <DemoLinkButton />;
}
