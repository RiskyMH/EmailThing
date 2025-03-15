import { type RouteObject, Navigate, Outlet } from "react-router-dom";
import EmailList from "./email-list/email-list";
import MailItem from "./email-item/mail-item";
import MailLayout from "./mail/root-layout";
import EmailListLoading from "./email-list/email-list-loading";

export const routes = [
    {
        path: "/mail",
        element: <MailLayout><Outlet /></MailLayout>,
        children: [
            {
                path: "/mail",
                element: <RedirectToMail />,
            },
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
        ]
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


function RedirectToMail() {
    if (typeof window === "undefined") return <MailLayout><EmailListLoading /></MailLayout>;
    // const mailboxId = document.cookie.split("; ").find(row => row.startsWith("mailboxId="))?.split("=")[1];
    const mailboxId = "demo";
    return <><EmailListLoading /><Navigate to={`/mail/${mailboxId}`} replace /></>
}


export default routes
