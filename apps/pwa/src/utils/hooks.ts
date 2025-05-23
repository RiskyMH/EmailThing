import { useEffect, useMemo } from "react";
import { useState } from "react";
import { useParams } from "react-router-dom";

export function useOnline() {
  const [online, setOnline] = useState<boolean | null>(navigator?.onLine ?? null);

  useEffect(() => {
    window.addEventListener("online", () => setOnline(navigator.onLine));
    window.addEventListener("offline", () => setOnline(navigator.onLine));

    return () => {
      window.removeEventListener("online", () => setOnline(navigator.onLine));
      window.removeEventListener("offline", () => setOnline(navigator.onLine));
    };
  }, []);

  return online;
}

export function useMailbox() {
  const params = useParams<"mailboxId">();
  return useMemo(() => params.mailboxId, [params.mailboxId]);
}
