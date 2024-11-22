import LocalTime from "@/components/localtime";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DraftEmail, Email, db } from "@/db";
import { and, eq } from "drizzle-orm";
import { EllipsisIcon } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Fragment, cache } from "react";
import { mailboxAliases, pageMailboxAccess } from "../../tools";
import { deleteDraftAction, saveDraftAction, saveDraftHeadersAction, sendEmailAction } from "./actions";
import {
    BodyEditor,
    DeleteButton,
    FromInput,
    HeaderModal,
    RecipientInput,
    SendButton,
    Subject,
    UploadAttachment,
} from "./editor.client";

export async function generateMetadata(props: {
    params: Promise<{ mailbox: string; draft: string }>;
}) {
    if (!(await pageMailboxAccess((await props.params).mailbox, false))) return {};

    const mail = await fetchDraft((await props.params).mailbox, (await props.params).draft);
    return {
        title: mail?.subject || "(Unnamed draft)",
    };
}

const fetchDraft = cache(async (mailboxId: string, draftId: string) => {
    return await db.query.DraftEmail.findFirst({
        where: and(eq(DraftEmail.id, draftId), eq(DraftEmail.mailboxId, mailboxId)),
        columns: {
            body: true,
            subject: true,
            from: true,
            to: true,
            updatedAt: true,
            headers: true,
        },
    });
});

export default async function DraftPage(
    props: {
        params: Promise<{
            mailbox: string;
            draft: string;
        }>;
    }
) {
    const params = await props.params;
    await pageMailboxAccess(params.mailbox);

    const { aliases, default: defaultAlias } = await mailboxAliases(params.mailbox);

    const mail = await fetchDraft(params.mailbox, params.draft);
    if (!mail) {
        // check if mail sent before 404ing
        const mail = await db.query.Email.findFirst({
            where: and(eq(Email.id, params.draft), eq(Email.mailboxId, params.mailbox)),
            columns: {
                id: true,
            },
        });
        if (mail) return redirect(`/mail/${params.mailbox}/${params.draft}`);
        return notFound();
    }

    return (
        <form
            action={saveDraftAction.bind(null, params.mailbox, params.draft)}
            id="draft-form"
            className="flex size-full flex-col gap-4 overflow-auto p-4 md:p-6"
            suppressHydrationWarning
        >
            <div className="flex max-w-full grow flex-col break-words rounded-md border-input border-none bg-secondary text-base">
                <FromInput savedAlias={mail.from || defaultAlias?.alias || undefined} aliases={aliases} />
                <span className="flex h-0 w-full shrink-0 grow-0 rounded-sm border-background/75 border-b-2" />
                <RecipientInput savedTo={mail.to || undefined} />
                <span className="flex h-0 w-full shrink-0 grow-0 rounded-sm border-background/75 border-b-2" />
                <Subject savedSubject={mail.subject || undefined} />
            </div>

            <BodyEditor savedBody={mail.body || undefined} />

            <div className="flex gap-4">
                <button type="submit" hidden />
                <div className="me-auto flex gap-2">
                    <DeleteButton delAction={deleteDraftAction.bind(null, params.mailbox, params.draft)} />
                    <UploadAttachment />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                                <EllipsisIcon className="size-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuRadioGroup value="normal" /*value={position} onValueChange={setPosition}*/>
                                <DropdownMenuRadioItem value="normal">Normal</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="text" disabled>
                                    Plain Text
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                            <DropdownMenuSeparator />

                            <HeaderModal
                                initialHeaders={[...(mail.headers || []), { key: "", value: "" }]}
                                action={saveDraftHeadersAction.bind(null, params.mailbox, params.draft)}
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {/* just easier access */}
                    {mail.headers?.map(({ key, value }, i) => (
                        <Fragment key={i}>
                            <input hidden name="header" value={i} readOnly />
                            <input hidden name={`header:${i}:name`} value={key} readOnly />
                            <input hidden name={`header:${i}:value`} value={value} readOnly />
                        </Fragment>
                    ))}
                </div>

                <p className="ms-auto self-center text-muted-foreground text-sm max-sm:hidden">
                    Saved at <LocalTime type="hour-min/date" time={mail.updatedAt} />
                </p>
                {/* <Button variant="ghost" size="icon" onClick={() => toast.warning("Not implemented yet")}> */}
                <SendButton sendAction={sendEmailAction.bind(null, params.mailbox, params.draft)} />
            </div>
        </form>
    );
}
