"use client";

import DisableFormReset from "@/components/disable-reset.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckIcon, Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { emailMeForm } from "./action";

export function Form({ publicEmail, username }: { className?: string; publicEmail?: string; username?: string }) {
    const [state, formAction] = useActionState(emailMeForm, {});

    useEffect(() => {
        if (state?.error) {
            (window as any)?.turnstile?.reset();

            if (!document.querySelector(".cf-turnstile > div")) {
                toast.error("Oh no, cloudflare is having issues displaying the verification to you :(", {
                    description: () => (
                        <p className="text-foreground! italic">May need to refresh page to reset and try again</p>
                    ),
                });
            }
        }
    }, [state]);

    return (
        <>
            <form
                action={formAction}
                className="flex w-full max-w-[35rem] flex-col gap-2 self-center"
                suppressHydrationWarning
                id="emailme-form"
            >
                <input name="username" value={username} hidden readOnly />
                <div className="flex flex-col gap-2 sm:flex-row">
                    <ClientInput
                        placeholder="Name *"
                        className="w-full border-none bg-secondary sm:w-1/2"
                        name="name"
                        autoComplete="name"
                        disabled={!!state?.success}
                        required
                        id="from-name"
                        suppressHydrationWarning
                    />
                    <ClientInput
                        placeholder="Email"
                        className="w-full border-none bg-secondary sm:w-1/2"
                        name="email"
                        type="email"
                        disabled={!!state?.success}
                        id="from"
                        suppressHydrationWarning
                    />
                </div>
                <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
                    <ClientInput
                        placeholder="Fax"
                        className="w-full border-none bg-secondary sm:w-1/2 hidden"
                        name="honeypot"
                        tabIndex={-1}
                        autoComplete="off"
                        id="honeypot"
                        suppressHydrationWarning
                    />
                </div>
                <ClientInput
                    placeholder="Subject"
                    className="w-full border-none bg-secondary"
                    name="subject"
                    disabled={!!state?.success}
                    id="subject"
                    suppressHydrationWarning
                />
                <ClientTextarea
                    placeholder="Message... *"
                    className="w-full border-none bg-secondary"
                    rows={7}
                    required
                    name="message"
                    disabled={!!state?.success}
                    id="body"
                    suppressHydrationWarning
                />

                <div
                    className="mt-2 flex flex-col-reverse gap-3 sm:mt-1 sm:min-h-10 sm:flex-row"
                    suppressHydrationWarning
                >
                    <div suppressHydrationWarning className="flex flex-col items-center sm:min-h-10">
                        <div
                            className="cf-turnstile"
                            data-appearance="interaction-only"
                            data-action="emailthing-me"
                            data-sitekey="0x4AAAAAAAb9U2XXs4z4cJUN"
                            // data-sitekey="3x00000000000000000000FF"
                            suppressHydrationWarning
                            hidden={!!state?.success}
                        />
                        {/* biome-ignore lint/style/noUnusedTemplateLiteral: <explanation> */}
                        <style>{`.cf-turnstile{line-height:0;height:0;z-index:10}`}</style>
                        <script defer src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=managed" />
                        {state?.error ? (
                            <p className="z-20 content-center justify-center -mt-0.5 py-0.5 text-red text-sm sm:min-h-10">
                                {state.error}
                            </p>
                        ) : (
                            <p className="content-center justify-center overflow-auto -mt-0.5 py-0.5 text-muted-foreground text-sm sm:min-h-10">
                                You can also email{" "}
                                <a
                                    href={`mailto:${publicEmail}`}
                                    id="mailto-link"
                                    className="font-bold hover:underline"
                                    suppressHydrationWarning
                                >
                                    {publicEmail}
                                </a>
                            </p>
                        )}
                    </div>
                    <SendButton success={!!state?.success} />
                </div>
                <DisableFormReset formId="emailme-form" />
            </form>
            <Toaster message={state?.success} />
            <script
                suppressHydrationWarning
                type="text/javascript"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                dangerouslySetInnerHTML={{
                    __html: `{
const fn = () => {
const urlParams = new URLSearchParams(window.location.search);

const mailtoLink = document.getElementById("mailto-link");
if (mailtoLink) mailtoLink.href += window.location.search;

const name = urlParams.get("from-name");
const email = urlParams.get("from");
const subject = urlParams.get("subject");
const message = urlParams.get("body");

const nameElem = document.getElementById("from-name");
const emailElem = document.getElementById("from");
const subjectElem = document.getElementById("subject");
const messageElem = document.getElementById("body");

if (name && nameElem) nameElem.value = name;
if (email && emailElem) emailElem.value = email;
if (subject && subjectElem) subjectElem.value = subject;
if (message && messageElem) messageElem.value = message;
};
document.addEventListener("DOMContentLoaded", fn);
document.addEventListener("load", fn);
}`.replaceAll("\n", " "),
                }}
            />
        </>
    );
}

function SendButton({ success }: { success?: boolean }) {
    const state = useFormStatus();
    return (
        <Button
            type="submit"
            className="flex w-full gap-2 sm:ms-auto sm:w-min"
            disabled={state.pending || success}
        >
            {state.pending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
            {success && <CheckIcon className="-ms-1 size-5 text-green-500" />}
            {success ? "Sent Message" : "Send Message"}
        </Button>
    );
}

function Toaster({ message }: { message?: string }) {
    const state = useFormStatus();
    // biome-ignore lint/correctness/useExhaustiveDependencies: uh
    useEffect(() => {
        if (!state.pending && message) {
            toast.success(message);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.pending]);
    return <></>;
}



export function ClientInput(props: React.ComponentProps<"input">) {
    const state = useFormStatus();

    return <Input {...props} disabled={props.disabled || state.pending} />;
}

export function ClientTextarea(props: React.ComponentProps<"textarea">) {
    const state = useFormStatus();

    return <Textarea {...props} disabled={props.disabled || state.pending} />;
}
