"use server";

import db, { DefaultDomain, TempAlias } from "@/db";
import { getCurrentUser } from "@/utils/jwt";
import { createId, init } from "@paralleldrive/cuid2";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { userMailboxAccess } from "../../tools";

const createSmallId = init({ length: 7 });

export async function makeTempEmail(mailboxId: string, aliasDomain: string, name: string | null) {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(mailboxId, userId)))) {
        throw new Error("No access to mailbox");
    }

    // check that aliasDomain is public and available
    const defaultDomain = await db.query.DefaultDomain.findFirst({
        where: and(
            eq(sql`lower(${DefaultDomain.domain})`, sql`lower(${aliasDomain})`),
            eq(DefaultDomain.available, true),
            eq(DefaultDomain.tempDomain, true),
            eq(DefaultDomain.isDeleted, false),
        ),
    });
    if (!defaultDomain) {
        return { error: "Domain not available" };
    }

    const tempId = createId();
    const alias = `${createSmallId()}@${aliasDomain}`;
    // a day lasting
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await db
        .insert(TempAlias)
        .values({
            id: tempId,
            mailboxId,
            name,
            expiresAt: expires,
            alias,
        })
        .execute();

    revalidatePath(`/mail/${mailboxId}/temp`);
    return {
        id: tempId,
        alias: alias,
        expiresAt: expires,
    };
}
