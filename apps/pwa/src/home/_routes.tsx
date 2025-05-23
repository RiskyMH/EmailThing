import { Outlet, type RouteObject } from "react-router-dom";
import Home from "./home";
import HomeLayout from "./layout";
import LoginPage from "./login";
import Pricing from "./pricing";
import RegisterPage from "./register";
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
    element: <RegisterPage />,
  },
] satisfies RouteObject[];

export default routes;
