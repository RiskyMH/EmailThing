"use client";
import { db, initializeDB } from "@/utils/data/db";
import { loadDemoData } from "@/utils/data/demo-data";
import { getLogedInUserApi, getMe } from "@/utils/data/queries/user";
import { registerServiceWorker } from "@/utils/service-worker";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getSha } from "./git.macro" with { type: "macro" };

export const sha = await getSha();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const toastRef = useRef<string | number | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    async function init() {
      // Initialize DB and load demo data
      try {
        await initializeDB();
        if (sessionStorage.getItem("demo") !== "v1") await loadDemoData();
        sessionStorage.setItem("demo", "v1");
      } catch (error) {
        console.error("Failed to initialize:", error);
      }

      // Register service worker
      if (navigator.onLine) {
        (async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));

          if (sha) {
            if (localStorage.getItem("sw:synced:sha") !== sha) {
              localStorage.setItem("sw:synced:sha", sha);
              await registerServiceWorker(sha);
            }
          } else {
            await registerServiceWorker();
          }
        })();

        const res = await db.fetchSync();
        if (res?.error) {
          if (res.error === "Token expired") {
            const user = await getLogedInUserApi();
            const apiUrl = (!user || user?.apiUrl === "https://emailthing.app") ? "" : `&api=${user?.apiUrl}`;
            const t = toast("Session expired, please login again.", {
              description: "Please login again to get latest data.",
              duration: Number.POSITIVE_INFINITY,
              action: {
                label: "Login",
                onClick: () => navigate(`/login?username=${user?.username}${apiUrl}`),
              },
              id: toastRef.current ?? undefined,
            });
            toastRef.current = t;
          }
        } else {
          await db.sync();
        }
      }
    }
    init();
  }, []);

  return <>{children}</>;
}
