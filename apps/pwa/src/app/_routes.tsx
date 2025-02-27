import type { RouteObject } from "react-router-dom";
import EmailList from "./email-list";

export const routes = [
    {
        path: "/mail/:mailboxId",
        element: <EmailList />,
    },
] satisfies RouteObject[]


export default routes
