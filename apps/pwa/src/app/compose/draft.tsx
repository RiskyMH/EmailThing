import LocalTime from "@/components/localtime.client";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSubContent,
    DropdownMenuSub,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, EllipsisIcon } from "lucide-react";
import { Fragment, useEffect, useRef } from "react";
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
import { useParams, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { deleteDraftEmail, getDraftEmail, getEmail, updateDraftEmail } from "@/utils/data/queries/email-list";
import { useLiveQuery } from "dexie-react-hooks";
import { getData } from "./tools";
import { toast } from "sonner";
import Loading from "./loading";
import { getMailboxAliases, getMailboxName } from "@/utils/data/queries/mailbox";
import DisableFormReset from "@/components/disable-reset.client";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { useDebouncedCallback } from "use-debounce";


export default function DraftPage() {
    const params = useParams<{ mailboxId: string, draftId: string }>()
    const navigate = useNavigate()
    const searchParams = useSearchParams()[0]
    const editor = (searchParams.get("editor") || "normal") as "normal" | "html" | "text" | "html-preview"

    const ref = useRef<HTMLFormElement>(null)

    const data = useLiveQuery(async () => {
        if (!params.mailboxId || !params.draftId) return
        const d = getDraftEmail(params.mailboxId, params.draftId).then(async d => {
            if (d) return { draft: d }
            const e = await getEmail(params.mailboxId!, params.draftId!)
            if (e) return { email: e }
            return null
        })
        const aliases = getMailboxAliases(params.mailboxId)
        return Promise.all([d, aliases])
    }, [params.mailboxId, params.draftId])


    async function saveDraftAction(data: FormData) {
        const draft = getData(data)
        if (!draft) return

        if (params.mailboxId === 'demo') {
            toast("This is a demo - changes won't actually do anything", { description: "But you can see how it would work in the real app!" });
        } else if (!navigator.onLine) {
            toast.info("You are offline - changes will be synced when you come back online")
        }

        await updateDraftEmail(params.mailboxId!, params.draftId!, {
            body: draft.body,
            subject: draft.subject,
            from: draft.from,
            to: draft.to,
            headers: draft.headers,
        })
    }

    async function deleteDraftAction() {
        if (params.mailboxId === 'demo') {
            toast("This is a demo - changes won't actually do anything", { description: "But you can see how it would work in the real app!" });
        } else if (!navigator.onLine) {
            toast.info("You are offline - changes will be synced when you come back online")
        }
        await deleteDraftEmail(params.mailboxId!, params.draftId!)
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
        if (params.mailboxId === 'demo') {
            toast("This is a demo - changes won't actually do anything", { description: "But you can see how it would work in the real app!" });
        } else if (!navigator.onLine) {
            toast.info("You are offline - changes will be synced when you come back online")
        }
    }

    const save = useDebouncedCallback((e?: any) => {
        e?.preventDefault()
        return saveDraftAction(new FormData(ref.current!))
    }, 250)
    const forceSave = () => saveDraftAction(new FormData(ref.current!))

    function setEditor(v: string) {
        navigate(`?editor=${v}`, { replace: true });
    }

    useTitle(params.mailboxId!, data?.[0]?.draft?.subject || undefined)

    if (!data || data[0] === undefined || !data[1]) return <Loading />
    if (data[0] === null) {
        return <div className="flex size-full items-center justify-center">404 - Draft not found</div>
    } else if (data[0]?.email) {
        return <Navigate to={`/mail/${params.mailboxId}/${params.draftId!}`} />
    }

    const [{ draft: mail }, aliases] = data

    return (
        <form
            action={saveDraftAction}
            ref={ref}
            id="draft-form"
            className="flex size-full flex-col gap-4 overflow-auto p-4 md:p-6"
            suppressHydrationWarning
        >
            <DisableFormReset formId="draft-form" />
            <div className="flex max-w-full grow flex-col break-words rounded-md border-input border-none bg-secondary text-base">
                <FromInput savedAlias={mail.from || aliases.find(a => a.default)?.alias || undefined} aliases={aliases} onSave={save} />
                <span className="flex h-0 w-full shrink-0 grow-0 rounded-sm border-background/75 border-b-2" />
                <RecipientInput savedTo={mail.to || undefined} onSave={save} forceSave={forceSave} />
                <span className="flex h-0 w-full shrink-0 grow-0 rounded-sm border-background/75 border-b-2" />
                <Subject savedSubject={mail.subject || undefined} onSave={save} />
            </div>

            <BodyEditor savedBody={mail.body || undefined} onSave={save} />

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
                            <DropdownMenuRadioGroup value={editor === "html-preview" ? "html-raw" : editor} onValueChange={setEditor}>
                                <DropdownMenuRadioItem value="normal">Normal</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="text">Plain Text</DropdownMenuRadioItem>
                                <DropdownMenuSub>
                                    <DropdownMenuPrimitive.SubTrigger asChild>
                                        <DropdownMenuRadioItem value="html">
                                            HTML
                                            <ChevronRight className="ms-auto size-4" />
                                        </DropdownMenuRadioItem>
                                    </DropdownMenuPrimitive.SubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                            <DropdownMenuRadioGroup value={editor} onValueChange={setEditor}>
                                                <DropdownMenuRadioItem value="html">HTML code</DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="html-preview">HTML (preview)</DropdownMenuRadioItem>
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                            </DropdownMenuRadioGroup>
                            <DropdownMenuSeparator />

                            <HeaderModal
                                initialHeaders={[...(mail.headers || []), { key: "", value: "" }]}
                                action={saveDraftHeadersAction}
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {/* just easier access */}
                    {(mail.headers || []).map(({ key, value }, i) => (
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

function useTitle(mailbox: string, draftSubject?: string) {
    const mailboxName = useLiveQuery(
        () => getMailboxName(mailbox),
        [mailbox]
    );

    useEffect(() => {
        if (mailboxName) {
            if (draftSubject) {
                document.title = `${draftSubject} (Draft) | ${mailboxName} | EmailThing`;
            } else {
                document.title = `New Draft | ${mailboxName} | EmailThing`;
            }
        } else {
            document.title = `Compose | EmailThing`;
        }
        return () => { document.title = "EmailThing"; }
    }, [mailboxName, draftSubject])
}
