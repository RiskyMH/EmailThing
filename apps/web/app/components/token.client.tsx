"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

export default function ToggleVisibilityToken({ code }: { code: string }) {
    const [visible, setVisible] = useState(false);
    const Icon = visible ? EyeIcon : EyeOffIcon;
    return (
        <div className="flex gap-2">
            <pre>{visible ? code : "•".repeat(code.length)}</pre>
            <button onClick={() => setVisible(!visible)} type="button">
                <Icon className="size-4 text-muted-foreground hover:text-foreground" />
            </button>
        </div>
    );
}
