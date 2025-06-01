import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllAliases, getMe } from "@/utils/data/queries/user";
import { useLiveQuery } from "dexie-react-hooks";
import changeUserSettings from "./_api";
import { CardForm, ClientSelect, ClientSwitch } from "./components";
import { Title } from "@/components/title";

const changePublicEmailStatus = (formData: FormData) => {
  return changeUserSettings("change-public-email-status", {
    enabled: formData.get("enabled") === "true",
  });
};

const changePublicEmail = async (_: any, formData: FormData) => {
  return changeUserSettings("change-public-email", {
    email: formData.get("email") as string,
  });
};

export default function UserSettingsEmailthingMe() {
  const data = useLiveQuery(async () => {
    return Promise.all([getMe(), getAllAliases()]);
  });

  const [user, aliases] = data ?? [];

  return (
    <>
      <Title title="EmailThing.me • User Settings • EmailThing" />
      <div className="flex flex-col gap-1.5">
        <CardTitle>EmailThing.me</CardTitle>
        <CardDescription>
          A optional contact form you can make. This can be useful to make it easier to get messages
          from people.
        </CardDescription>
      </div>

      <div className="flex flex-row items-center justify-between gap-2 rounded-lg bg-secondary p-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="enabled" className="font-semibold text-xl leading-none tracking-tight">
            Enable public page
          </Label>
          <p className="text-muted-foreground text-sm">
            If you enable this, anyone will be able to send you email easier.
          </p>
          {user?.publicContactPage && (
            <a
              href={`https://emailthing.me/@${user.username}`}
              className="text-sm underline transition-colors hover:text-blue"
              target="_blank"
              rel="noreferrer"
            >
              https://emailthing.me/@{user.username}
            </a>
          )}
        </div>
        {/* <Switch id="enabled" defaultChecked={emailmeEnabled} /> */}
        <form action={changePublicEmailStatus as any}>
          <input name="enabled" value={user?.publicContactPage ? "false" : "true"} hidden />
          <ClientSwitch id="enabled" checked={!!user?.publicContactPage} type="submit" />
        </form>
      </div>

      <Card className={!user?.publicContactPage ? "cursor-not-allowed opacity-50" : undefined}>
        <CardForm
          action={changePublicEmail}
          subtitle="This email is public, so choose wisely."
          disabled={!user?.publicContactPage}
        >
          <CardHeader>
            <CardTitle>Public Email</CardTitle>
            <CardDescription>
              The email shown in contact page and the mailbox that will receive the emails.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {aliases && user ? (
              <ClientSelect
                name="email"
                required
                defaultValue={user?.publicEmail || undefined}
                disabled={!user?.publicContactPage}
              >
                <SelectTrigger className="w-full border-none bg-background sm:w-[300px]">
                  <SelectValue placeholder="Select an email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {/* <SelectLabel>Email</SelectLabel> */}
                    {aliases?.map((m) => (
                      <SelectItem key={m.alias} value={m.alias}>
                        {m.alias}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </ClientSelect>
            ) : (
              // somehow the way its undefined means it needs a full remount with full correct data
              <div>
                <ClientSelect name="email" required>
                  <SelectTrigger className="w-full border-none bg-background sm:w-[300px]">
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                </ClientSelect>
              </div>
            )}
          </CardContent>
        </CardForm>
      </Card>
    </>
  );
}
