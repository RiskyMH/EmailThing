import { type RouteObject, Navigate } from "react-router-dom";
import EmailList from "./email-list/email-list";
import MailItem from "./email-item/mail-item";
import MailLayout from "./mail/root-layout";
import EmailListLoading from "./email-list/email-list-loading";

export const routes = [
    { // TODO: make this redirect to the demo/mailboxId cookie value
        path: "/mail",
        element: <RedirectToMail />,
    },
    {
        path: "/mail/:mailboxId",
        element: <MailLayout><EmailList filter="inbox" /></MailLayout>,
    },
    {
        path: "/mail/:mailboxId/:mailId",
        element: <MailLayout><MailItem /></MailLayout>,
    },
    {
        path: "/mail/:mailboxId/drafts",
        element: <MailLayout><EmailList filter="drafts" /></MailLayout>,
    },
    {
        path: "/mail/:mailboxId/sent",
        element: <MailLayout><EmailList filter="sent" /></MailLayout>,
    },
    {
        path: "/mail/:mailboxId/starred",
        element: <MailLayout><EmailList filter="starred" /></MailLayout>,
    },
    {
        path: "/mail/:mailboxId/temp",
        element: <MailLayout><EmailList filter="temp" /></MailLayout>,
    },
    {
        path: "/mail/:mailboxId/trash",
        element: <MailLayout><EmailList filter="trash" /></MailLayout>,
    },
    {
        path: "/mail/:mailboxId/config",
        element: <MailLayout><h1>TODO: Mail config</h1></MailLayout>,
    },
    {
        path: "/mail/:mailboxId/draft/:draftId",
        element: <MailLayout><h1>TODO: Mail draft</h1></MailLayout>,
    },
    {
        path: "/mail/:mailboxId/draft/new",
        element: <MailLayout><h1>TODO: Mail draft (new)</h1></MailLayout>,
    },
    {
        path: "/mail/:mailboxId/config",
        element: <MailLayout><h1>TODO: Mail config</h1></MailLayout>,
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
    return <MailLayout><EmailListLoading /><Navigate to={`/mail/${mailboxId}`} replace /></MailLayout> 
}


export default routes
