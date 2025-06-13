import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { PaintbrushIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function Preferences() {
    const [emailView, setEmailView] = useState(typeof window !== "undefined" ? localStorage.getItem("email-view") ?? "column" : "column");

    useEffect(() => {
        const fn = () => {
            setEmailView(localStorage.getItem("email-view") ?? "column");
        }
        fn();
        window.addEventListener("storage", fn);
        return () => {
            window.removeEventListener("storage", fn);
        }
    }, []);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="auto" className="self-center p-1.5 rounded-full hidden sm:flex">
                    <PaintbrushIcon className="size-5 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="text-sm w-full">
                {/* switch between column and row view using <Switch> */}
                {/* and other preferences */}
                <div className="flex gap-2 w-32 items-center">
                    <Switch name="email-view" id="email-view" defaultChecked={emailView === "column"} onCheckedChange={(checked) => {
                        localStorage.setItem("email-view", checked ? "column" : "row");
                        setEmailView(checked ? "column" : "row");
                        if (checked) {
                            document.getElementById("app:root-layout")?.classList.add("emailscolumn");
                        } else {
                            document.getElementById("app:root-layout")?.classList.remove("emailscolumn");
                        }
                    }} />
                    <Label htmlFor="email-view">{emailView === "column" ? "Column" : "Row"} view</Label>

                </div>
            </PopoverContent>
        </Popover>
    );
}