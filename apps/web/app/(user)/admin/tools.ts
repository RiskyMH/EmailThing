import db, { User } from "@/db";
import { getCurrentUser } from "@/utils/jwt";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

export const userAdminCheck = cache(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return redirect("/login?from=/admin");

    const user = await db.query.User.findFirst({
        where: and(eq(User.id, currentUser), eq(User.admin, true)),
    });

    if (!user) return notFound();
    return user;
});
