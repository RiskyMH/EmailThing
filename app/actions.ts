"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { removeToken } from "./utils/jwt";

export async function logout() {
    removeToken();
    cookies().delete("mailboxId");

    redirect("/login");
}
