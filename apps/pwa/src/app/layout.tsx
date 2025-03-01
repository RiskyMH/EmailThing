"use client";
import { useEffect } from "react";
import { loadDemoData } from "@/utils/data/demo-data";
import { initializeDB } from "@/utils/data/db";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Initialize DB and load demo data
        async function init() {
            try {
                await initializeDB();
                if (sessionStorage.getItem('demo') !== 'v1') await loadDemoData();
                sessionStorage.setItem('demo', 'v1');
            } catch (error) {
                console.error('Failed to initialize:', error);
            }
        }
        
        init();
    }, []);

    return <>{children}</>;
} 