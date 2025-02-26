import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import type { RouteObject } from "react-router-dom";

import RootLayout from "./root-layout";
import AppRoutes from "./app/_routes"
import DocsRoutes from "./docs/_routes"
import HomeRoutes from "./home/_routes"
import ErrorPage from "./error";

const routes = ([
  { path: "*", element: <ErrorPage notFound /> },
  ...AppRoutes,
  ...DocsRoutes,
  ...HomeRoutes,
] satisfies RouteObject[])
  .map(e => ({ errorElement: <ErrorPage />, ...e, }))

const router = createBrowserRouter(routes);

// biome-ignore lint/style/noNonNullAssertion: <explanation>
ReactDOM.createRoot(document.getElementById("root")!).render(
  <RootLayout>
    <RouterProvider router={router} />
  </RootLayout>
);
