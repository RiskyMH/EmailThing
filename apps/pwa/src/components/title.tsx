import { useEffect } from "react";

export function Title({ title }: { title: string }) {
    useEffect(() => {
        document.title = title;
        return () => {
            document.title = "EmailThing";
        };
    }, [title]);
    return null;
}