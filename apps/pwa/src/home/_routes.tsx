import { Outlet, type RouteObject } from "react-router-dom";
import Home from "./home";
import HomeLayout from "./layout";
import LoginPage from "./login";
import Pricing from "./pricing";
import RegisterPage from "./register";
import ResetPasswordPage from "./reset-password";
import { Title } from "@/components/title";
export const routes = [
  {
    path: "/",
    element: (
      <HomeLayout>
        <Outlet />
      </HomeLayout>
    ),
    children: [
      {
        path: "/",
        element: <><Home /><Title title="EmailThing: A new way to manage your email!" /></>,
        meta: {
          title: "EmailThing - A new way to manage your email!",
          ogTitle: "EmailThing",
          description: "A modern email client designed for simplicity and the web.",
          canonical: "https://emailthing.app/home",
        }
      },
      {
        path: "/home",
        element: <><Home /><Title title="EmailThing: A new way to manage your email!" /></>,
        meta: {
          title: "EmailThing - A new way to manage your email!",
          ogTitle: "EmailThing",
          description: "A modern email client designed for simplicity and the web.",
          canonical: "https://emailthing.app/home",
        }
      },
      {
        path: "/pricing",
        element: <><Pricing /><Title title="Pricing • EmailThing" /></>,
        meta: {
          title: "Pricing • EmailThing",
          description: "Whats included in FREE plan? Everything!",
          canonical: "https://emailthing.app/pricing",
        }
      },
    ],
  },
  {
    path: "/login",
    element: <><LoginPage /><Title title="Login • EmailThing" /></>,
    meta: {
      title: "Login • EmailThing",
      description: "A modern email client designed for simplicity and the web.",
      canonical: "https://emailthing.app/login",
    }
  },
  {
    path: "/register",
    element: <><RegisterPage /><Title title="Register • EmailThing" /></>,
    meta: {
      title: "Register • EmailThing",
      description: "A modern email client designed for simplicity and the web.",
      canonical: "https://emailthing.app/register",
    }
  },
  {
    path: "/login/reset",
    element: <><ResetPasswordPage /><Title title="Reset Password • EmailThing" /></>,
    meta: {
      title: "Reset Password • EmailThing",
      description: "Reset your password for your EmailThing account.",
      canonical: "https://emailthing.app/login/reset",
      noIndex: true,
    }
  },
] satisfies RouteObject[];

export default routes;
