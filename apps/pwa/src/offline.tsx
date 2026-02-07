import * as ReactDOM from "react-dom/client";
import { createBrowserRouter, type RouteObject, RouterProvider } from "react-router-dom";

import AppRoutes from "./(app)/_routes";
import DocsRoutes from "./(docs)/_routes";
import HomeRoutes from "./(home)/_routes";
import ErrorPage from "./error";
import RootLayout from "./root-layout";

// Right now its the same as `app.tsx`, but seperate here just because

function OfflineApp() {
  const routes = (
    [
      { path: "*", element: <ErrorPage notFound /> },
      ...AppRoutes,
      ...DocsRoutes,
      ...HomeRoutes,
    ] satisfies RouteObject[]
  ).map((e) => ({ errorElement: <ErrorPage />, ...e }));

  const router = createBrowserRouter(routes, {
    basename: (typeof window !== "undefined" && window.location.pathname.startsWith('/pwa') && '/pwa') || undefined
  });

  return (
    <RootLayout>
      <RouterProvider router={router} />
    </RootLayout>
  );
}

if (window.location.pathname === "/" && document.cookie.includes("mailboxId")) {
  window.location.pathname = "/mail"
}

// biome-ignore lint/style/noNonNullAssertion: <explanation>
ReactDOM.createRoot(document.getElementById("root")!).render(<OfflineApp />);
