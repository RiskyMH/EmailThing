import type { RouteObject } from "react-router-dom";
import Home from "./home";
import Pricing from "./pricing";
import { lazy, Suspense } from 'react';
import AuthPage from "./auth";


export const routes = [
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
    {
        path: "/login",
        element: <AuthPage />,
    },
    {
        path: "/register",
        element: <AuthPage />,
    },

] satisfies RouteObject[]


export default routes


function Reload() {
    const url = `${location.href}`
    history.back()
    location.href = url
    // location.reload()
    return null
}
