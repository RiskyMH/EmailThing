import { Navigate, Outlet, type RouteObject } from "react-router-dom";
import DraftPage from "./compose/draft";
import NewDraft from "./compose/new-draft";
import MailItem from "./email-item/mail-item";
import EmailList from "./email-list/email-list";
import EmailListLoading from "./email-list/email-list-loading";
import MailLayout from "./mail/root-layout";
import ConfigPage from "./mailbox-config/config-page";
import UserSettingsAuthentication from "./user-settings/authentication";
import UserSettingsEmailthingMe from "./user-settings/emailthing-me";
import UserSettingsGeneral from "./user-settings/general";
import UserSettingsLayout from "./user-settings/layout";
import SettingsLayout from "./user-settings/layout2";
import UserSettingsMailboxes from "./user-settings/mailboxes";
import UserSettingsNotifications from "./user-settings/notifications";

export const routes = [
  {
    path: "/mail",
    element: (
      <MailLayout>
        <Outlet />
      </MailLayout>
    ),
    children: [
      {
        path: "/mail",
        element: <RedirectToMail />,
        meta: {
          title: "Inbox • EmailThing",
          noIndex: true,
        }
      },
      {
        path: "/mail/:mailboxId",
        element: <EmailList filter="inbox" />,
        meta: {
          title: "Inbox • EmailThing",
          noIndex: true,
        }
      },
      {
        path: "/mail/:mailboxId/:mailId",
        element: <MailItem />,
        meta: {
          title: "Email • EmailThing",
          noIndex: true,
        }
      },
      {
        path: "/mail/:mailboxId/drafts",
        element: <EmailList filter="drafts" />,
        meta: {
          title: "Drafts • EmailThing",
          noIndex: true,
        }
      },
      {
        path: "/mail/:mailboxId/sent",
        element: <EmailList filter="sent" />,
        meta: {
          title: "Sent • EmailThing",
          noIndex: true,
        }
      },
      {
        path: "/mail/:mailboxId/starred",
        element: <EmailList filter="starred" />,
        meta: {
          title: "Starred • EmailThing",
          noIndex: true,
        }
      },
      {
        path: "/mail/:mailboxId/temp",
        element: <EmailList filter="temp" />,
        meta: {
          title: "Temporary Emails • EmailThing",
          noIndex: true,
        }
      },
      {
        path: "/mail/:mailboxId/trash",
        element: <EmailList filter="trash" />,
        meta: {
          title: "Trash • EmailThing",
          noIndex: true,
        }
      },
      {
        path: "/mail/:mailboxId/draft/:draftId",
        element: <DraftPage />,
        meta: {
          title: "Draft • EmailThing",
          noIndex: true,
        }
      },
      {
        path: "/mail/:mailboxId/draft/new",
        element: <NewDraft />,
        meta: {
          title: "New Draft • EmailThing",
          noIndex: true,
        }
      },
      {
        path: "/mail/:mailboxId/config",
        element: <ConfigPage />,
        meta: {
          title: "Mailbox Config • EmailThing",
          noIndex: true,
        }
      },
    ],
  },
  {
    path: "/settings",
    element: (
      <UserSettingsLayout>
        <SettingsLayout>
          <Outlet />
        </SettingsLayout>
      </UserSettingsLayout>
    ),
    children: [
      {
        path: "/settings",
        element: <UserSettingsGeneral />,
        meta: {
          title: "User Settings • EmailThing",
        }
      },
      {
        path: "/settings/authentication",
        element: <UserSettingsAuthentication />,
        meta: {
          title: "Authentication • User Settings • EmailThing",
        }
      },
      {
        path: "/settings/notifications",
        element: <UserSettingsNotifications />,
        meta: {
          title: "Notifications • User Settings • EmailThing",
        }
      },
      {
        path: "/settings/mailboxes",
        element: <UserSettingsMailboxes />,
        meta: {
          title: "Mailboxes • User Settings • EmailThing",
        }
      },
      {
        path: "/settings/emailthing-me",
        element: <UserSettingsEmailthingMe />,
        meta: {
          title: "EmailThing.Me • User Settings • EmailThing",
        }
      },
    ],
  },
  {
    path: "/admin",
    element: <h1>TODO: Admin</h1>,
    meta: {
      title: "Admin • EmailThing",
    }
  },
] satisfies RouteObject[];

function RedirectToMail() {
  if (typeof window === "undefined") return <EmailListLoading />;
  const mailboxId =
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("mailboxId="))
      ?.split("=")[1] || "demo";
  return (
    <>
      <EmailListLoading />
      <Navigate to={`/mail/${mailboxId}`} replace />
    </>
  );
}

export default routes;
