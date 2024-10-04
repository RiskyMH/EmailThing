'use client';

import { type PropsWithChildren } from "react";
import { toast } from "sonner";

export default function CopyButton({ text, children, ...props }: PropsWithChildren<{ text: string }>) {
    const onClick = () => {
        navigator.clipboard.writeText(text);
        toast("Copied to clipboard");
    }

    return (
        <button onClick={onClick} {...props}>
            {children}
        </button>
    )
} 