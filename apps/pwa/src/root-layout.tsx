import "@fontsource/inter/100.css";
import "@fontsource/inter/200.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
// import "";

import "./index.css";
import React, { type PropsWithChildren } from "react";

import { Toaster as Sonner } from "@/components/ui/sonner";

export default function RootLayout({ children }: PropsWithChildren) {
    return (
        <React.StrictMode>
            {children}
            <Sonner />
        </React.StrictMode>
    )
}
