'use client'

import { Button } from "@/components/ui/button";
import { CheckIcon, Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { emailMeForm } from "./action";
import { ClientInput, ClientTextarea } from "@/(user)/components.client";

export function Form({ publicEmail, username }: { className?: string, publicEmail?: string, username?: string }) {
    const [state, formAction] = useFormState(emailMeForm, {})

    useEffect(() => {
        if (state?.error) {
            (window as any)?.turnstile?.reset()
        }
    }, [state])

    return (
        <>
            <form action={formAction} className="flex flex-col gap-2 max-w-[35rem] self-center w-full" suppressHydrationWarning>
                <input name="username" value={username} hidden />
                <div className="flex gap-2 sm:flex-row flex-col">
                    <ClientInput
                        placeholder="Name *"
                        className="w-full sm:w-1/2 border-none bg-secondary"
                        name="name"
                        autoComplete="name"
                        disabled={!!state?.success}
                        required
                        id="from-name"
                        suppressHydrationWarning
                    />
                    <ClientInput
                        placeholder="Email"
                        className="w-full sm:w-1/2 border-none bg-secondary"
                        name="email"
                        type="email"
                        disabled={!!state?.success}
                        id="from"
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

                <div className="flex mt-2 sm:mt-1 sm:min-h-10 flex-col-reverse sm:flex-row gap-3" suppressHydrationWarning>
                    <div suppressHydrationWarning className="flex flex-col sm:min-h-10 items-center">
                        <div
                            className={`cf-turnstile`}
                            data-appearance="interaction-only"
                            data-action="emailthing-me"
                            data-sitekey="0x4AAAAAAAb9U2XXs4z4cJUN"
                            // data-sitekey="3x00000000000000000000FF"
                            suppressHydrationWarning
                            hidden={!!state?.success}
                        />
                        <style>{`.cf-turnstile{line-height:0;height:0;z-index:10}`}</style>
                        <script defer src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=managed" />
                        {state?.error ? (
                            <p className="text-red justify-center content-center sm:min-h-10 text-sm py-0.5 z-20">{state.error}</p>
                        ) : (
                            <p className="text-muted-foreground justify-center content-center sm:min-h-10 text-sm overflow-auto py-0.5">
                                You can also email {" "}
                                    <a href={`mailto:${publicEmail}`} id="mailto-link" className="font-bold hover:underline" suppressHydrationWarning>
                                    {publicEmail}
                                </a>
                            </p>
                        )}
                    </div>
                    <SendButton success={!!state?.success} />
                </div>
            </form >
            <Toaster message={state?.success} />
            <script
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                    __html: `{
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
}`.replaceAll("\n", " ")}}
            />
        </>
    );
}

function SendButton({ success }: { success?: boolean }) {
    const state = useFormStatus()
    return (
        <Button type="submit" className="w-full sm:w-min sm:ms-auto px-7 flex gap-2" disabled={state.pending || success} >
            {state.pending && <Loader2 className="size-5 text-muted-foreground animate-spin" />}
            {success && <CheckIcon className="size-5 text-green-500 -ms-1" />}
            {success ? "Sent Message" : "Send Message"}
        </Button>
    )
}

function Toaster({ message }: { message?: string }) {
    const state = useFormStatus()
    useEffect(() => {
        if (!state.pending && message) {
            toast.success(message)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.pending])
    return <></>
}
