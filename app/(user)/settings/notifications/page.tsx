import { getCurrentUser } from "@/utils/jwt";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { CardDescription, CardTitle } from "@/components/ui/card";
import NotificationsButton from "./notifications.client";

export const metadata = {
    title: "User Settings",
} satisfies Metadata


export default async function UserSettingsPage() {
    const userId = await getCurrentUser();
    if (!userId) return redirect("/login?from=/settings");

    return (
        <>
            <div className="flex flex-col gap-1.5">
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                    Enable and configure your notifications.
                </CardDescription>
            </div>

            <NotificationsButton />
        </>
    );
}
