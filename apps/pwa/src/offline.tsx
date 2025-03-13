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


// Right now its the same as `app.tsx`, but seperate here just because


function OfflineApp() {
  const routes = ([
    { path: "*", element: <ErrorPage notFound /> },
    ...AppRoutes,
    ...DocsRoutes,
    ...HomeRoutes,
  ] satisfies RouteObject[])
    .map(e => ({ errorElement: <ErrorPage />, ...e, }));

  const router = createBrowserRouter(routes);

  return (
    <RootLayout>
      <RouterProvider router={router} />
    </RootLayout>
  );
}

// biome-ignore lint/style/noNonNullAssertion: <explanation>
ReactDOM.createRoot(document.getElementById("root")!).render(<OfflineApp />);
