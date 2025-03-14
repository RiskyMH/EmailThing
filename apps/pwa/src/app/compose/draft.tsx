import LocalTime from "@/components/localtime.client";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisIcon } from "lucide-react";
import { Fragment, cache } from "react";
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
import { useParams, useNavigate } from "react-router-dom";
import { deleteDraftEmail, getDraftEmail, updateDraftEmail } from "@/utils/data/queries/email-list";
import { useLiveQuery } from "dexie-react-hooks";
import { getData } from "./tools";
import { toast } from "sonner";
import Loading from "./loading";
import { getMailboxAliases, getMailboxDefaultAlias } from "@/utils/data/queries/mailbox";
import DisableFormReset from "@/components/disable-reset.client";

export default function DraftPage() {
    const params = useParams<{ mailboxId: string, draftId: string }>()
    const navigate = useNavigate()

    const data = useLiveQuery(async () => {
        if (!params.mailboxId || !params.draftId) return
        const d = getDraftEmail(params.mailboxId, params.draftId).then(d => d || null)
        const aliases = getMailboxAliases(params.mailboxId)
        return Promise.all([d, aliases])
    }, [params.mailboxId, params.draftId])

    async function saveDraftAction(data: FormData) {
        const draft = getData(data)
        if (!draft) return

        await updateDraftEmail(params.mailboxId!, params.draftId!, {
            body: draft.body,
            subject: draft.subject,
            from: draft.from,
            to: draft.to,
            headers: draft.headers,
        })
        toast("Updates aren't available in demo", { description: "This would sync with the server in the real app" })
    }

    async function deleteDraftAction() {
        await deleteDraftEmail(params.mailboxId!, params.draftId!)
        toast("Updates aren't available in demo", { description: "This would sync with the server in the real app (this is a demo though)" })
        navigate(`/mail/${params.mailboxId}`)
    }

    async function sendEmailAction(data: FormData) {
        toast.warning("Not implemented yet")
    }

    async function saveDraftHeadersAction(data: FormData) {
        await new Promise(resolve => setTimeout(resolve, 250))
        const headers = data
            .getAll("header")
            .map((id) => {
                const key = (data.get(`header:${id}:name`) || "") as string;
                const value = (data.get(`header:${id}:value`) || "") as string;

                if (!key) return;
                return { key, value };
            })
            .filter((e) => !!e);

        // temporary measure because mimetext only supports one value per key, so just force that
        const seenKeys = new Set<string>();
        const uniqueHeaders = headers.filter((header) => {
            if (seenKeys.has(header.key)) {
                return false;
            }
            seenKeys.add(header.key);
            return true;
        });

        await updateDraftEmail(params.mailboxId!, params.draftId!, { headers: uniqueHeaders })
        toast("Updates aren't available in demo", { description: "This would sync with the server in the real app (headers)" })
    }

    if (!data || data[0] === undefined || !data[1]) return <Loading />
    if (data[0] === null) return <>404 - Draft not found</>

    const [mail, aliases] = data

    return (
        <form
            action={saveDraftAction}
            id="draft-form"
            className="flex size-full flex-col gap-4 overflow-auto p-4 md:p-6"
            suppressHydrationWarning
        >
            <DisableFormReset formId="draft-form" />
            <div className="flex max-w-full grow flex-col break-words rounded-md border-input border-none bg-secondary text-base">
                <FromInput savedAlias={mail.from || aliases.find(a => a.default)?.alias || undefined} aliases={aliases} />
                <span className="flex h-0 w-full shrink-0 grow-0 rounded-sm border-background/75 border-b-2" />
                <RecipientInput savedTo={mail.to || undefined} />
                <span className="flex h-0 w-full shrink-0 grow-0 rounded-sm border-background/75 border-b-2" />
                <Subject savedSubject={mail.subject || undefined} />
            </div>

            <BodyEditor savedBody={mail.body || undefined} />

            <div className="flex gap-4">
                <button type="submit" hidden />
                <div className="me-auto flex gap-2">
                    <DeleteButton delAction={deleteDraftAction} />
                    <UploadAttachment />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0" type="button">
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
                                action={saveDraftHeadersAction}
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
                <SendButton sendAction={sendEmailAction} />
            </div>
        </form>
    );
}
