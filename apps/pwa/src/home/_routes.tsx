import { type RouteObject, Outlet } from "react-router-dom";
import Home from "./home";
import Pricing from "./pricing";
import { lazy, Suspense } from 'react';
import AuthPage from "./auth";
import HomeLayout from "./layout";
import LoginPage from "./login";
export const routes = [
    {
        path: "/",
        element: <HomeLayout><Outlet /></HomeLayout>,
        children: [
            {
                path: "/",
                element: <Home />,
            },
            {
                path: "/home",
                element: <Home />,
            },
            {
                path: "/pricing",
                element: <Pricing />,
            },
        ],
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/register",
        element: <AuthPage />,
    },

] satisfies RouteObject[]


export default routes
