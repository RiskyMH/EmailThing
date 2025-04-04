"use client";
import { useEffect } from "react";
import { loadDemoData } from "@/utils/data/demo-data";
import { initializeDB } from "@/utils/data/db";
import { registerServiceWorker } from "@/utils/service-worker";
import { getSha } from "./git.macro" with { type: "macro" };
import { proposeSync, syncUser } from "../utils/data/sync-user";

export const sha = await getSha();

export default function RootLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        async function init() {
            // Initialize DB and load demo data
            try {
                const v = localStorage.getItem("indexdb-test-version")
                if (v !== "v1.1a") {
                    // delete the indexdb
                    await asyncDeleteIndexDB("EmailDB");
                    localStorage.setItem("indexdb-test-version", "v1.1a");
                    localStorage.removeItem("last-sync");
                }

                await initializeDB();
                if (sessionStorage.getItem('demo') !== 'v1.1a') await loadDemoData();
                sessionStorage.setItem('demo', 'v1.1a');
            } catch (error) {
                console.error('Failed to initialize:', error);
            }

            // Register service worker
            if (navigator.onLine) {
                (async () => {
                    await new Promise(resolve => setTimeout(resolve, 500))

                    if (sha) {
                        if (localStorage.getItem('sw:synced:sha') !== sha) {
                            localStorage.setItem('sw:synced:sha', sha);
                            await registerServiceWorker(sha);
                        }
                    } else {
                        await registerServiceWorker();
                    }
                })();

                // Sync user
                // use localstorage to store last sync date
                const lastSync = localStorage.getItem('last-sync');
                const now = new Date();
                if (lastSync) {
                    const a = await syncUser(false, new Date(lastSync));
                    if (a) {
                        localStorage.setItem('last-sync', now.toISOString());
                        await proposeSync();
                    }
                } else {
                    const a = await syncUser(true);
                    if (a) {
                        const b = await syncUser(false);
                        if (b) {
                            localStorage.setItem('last-sync', now.toISOString());
                            await proposeSync();
                        }
                    }

                }
            };
        }

        init();
    }, []);

    return <>{children}</>;
} 


function asyncDeleteIndexDB(name: string) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onerror = reject;
        request.onsuccess = resolve;
    });
}
