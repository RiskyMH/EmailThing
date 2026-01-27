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

export const useHoldingShift = () => {
  const [isHoldingShift, setIsHoldingShift] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsHoldingShift(true)
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsHoldingShift(false)
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return isHoldingShift;
}
