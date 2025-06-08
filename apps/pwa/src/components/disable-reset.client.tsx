import { useEffect } from "react";

export default function DisableFormReset({ formId }: { formId: string }) {
    useEffect(() => {
        const form = document.getElementById(formId);
        const preventDefault = (event: Event) => event.preventDefault();

        form?.addEventListener("reset", preventDefault, true);
        return () => form?.removeEventListener("reset", preventDefault, true);
    }, [formId]);

    return null;
}
