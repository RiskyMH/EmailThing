import type { RouteObject } from "react-router-dom";
import EmailList from "./email-list";
import AuthPage from "./auth";

export const routes = [
    {
        path: "/mail/:mailboxId",
        element: <EmailList />,
    },
    {
        path: "/register",
        element: <AuthPage />,
    },
    {
        path: "/login",
        element: <AuthPage />,
    },
] satisfies RouteObject[]


export default routes
