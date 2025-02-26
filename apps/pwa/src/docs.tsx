import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  type RouteObject,
} from "react-router-dom";
import "./index.css";
import DocsRoutes from "./docs/_routes"
import RootLayout from "./root-layout";
import ErrorPage from "./error";

const routes = ([
  { path: "*", element: <ErrorPage notFound /> },
  ...DocsRoutes,
] satisfies RouteObject[])
  .map(e => ({ errorElement: <ErrorPage />, ...e, }))


const router = createBrowserRouter(routes);

// biome-ignore lint/style/noNonNullAssertion: <explanation>
ReactDOM.createRoot(document.getElementById("root")!).render(
  <RootLayout>
    <RouterProvider router={router} />
  </RootLayout>
);
