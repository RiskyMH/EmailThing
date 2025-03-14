"use client";
import { useEffect } from "react";
import { loadDemoData } from "@/utils/data/demo-data";
import { initializeDB } from "@/utils/data/db";
import { registerServiceWorker } from "@/utils/service-worker";
import { getSha } from "./git.macro" with { type: "macro" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        async function init() {
            // Initialize DB and load demo data
            try {
                await initializeDB();
                if (sessionStorage.getItem('demo') !== 'v1') await loadDemoData();
                sessionStorage.setItem('demo', 'v1');
            } catch (error) {
                console.error('Failed to initialize:', error);
            }

            // Register service worker
            if (navigator.onLine) {
                const sha = await getSha();
                await new Promise(resolve => setTimeout(resolve, 500))
                
                if (sha) {
                    if (localStorage.getItem('sw:synced:sha') !== sha) {
                        localStorage.setItem('sw:synced:sha', sha);
                        await registerServiceWorker(sha);
                    }
                } else {
                    await registerServiceWorker();
                }


            };
        }

        init();
    }, []);

    return <>{children}</>;
} 