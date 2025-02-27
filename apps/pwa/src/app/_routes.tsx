import type { RouteObject } from "react-router-dom";
import EmailList from "./email-list";
import MailItem from "./mail-item";

export const routes = [
    {
        path: "/mail/:mailboxId",
        element: <EmailList filter="inbox" />,
    },
    {
        path: "/mail/:mailboxId/:mailId",
        element: <MailItem />,
    },
    {
        path: "/mail/:mailboxId/drafts",
        element: <EmailList filter="drafts" />,
    },
    {
        path: "/mail/:mailboxId/sent",
        element: <EmailList filter="sent" />,
    },
    {
        path: "/mail/:mailboxId/starred",
        element: <EmailList filter="starred" />,
    },
    {
        path: "/mail/:mailboxId/temp",
        element: <EmailList filter="temp" />,
    },
    {
        path: "/mail/:mailboxId/trash",
        element: <EmailList filter="trash" />,
    },
    {
        path: "/mail/:mailboxId/config",
        element: <h1>TODO: Mail config</h1>,
    },
    {
        path: "/mail/:mailboxId/draft/:draftId",
        element: <h1>TODO: Mail draft</h1>,
    },
    {
        path: "/mail/:mailboxId/draft/new",
        element: <h1>TODO: Mail draft (new)</h1>,
    },
    {
        path: "/mail/:mailboxId/config",
        element: <h1>TODO: Mail config</h1>,
    },
    {
        path: "/settings",
        element: <h1>TODO: Settings</h1>,
    },
    {
        path: "/admin",
        element: <h1>TODO: Admin</h1>,
    },
] satisfies RouteObject[]


export default routes
