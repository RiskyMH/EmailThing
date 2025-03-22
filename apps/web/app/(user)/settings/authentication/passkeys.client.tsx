"use client";

import { Button } from "@/components/ui/button";
import { create, parseCreationOptionsFromJSON, supported } from "@github/webauthn-json/browser-ponyfill";
import { KeyRoundIcon, Loader2Icon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { UAParser } from "ua-parser-js";
import { addPasskey } from "../../actions";

export default function PasskeysSetup({ userId, username }: { userId: string; username: string }) {
    const [isPending, startTransition] = useTransition();

    const [support, setSupport] = useState(false);
    useEffect(() => {
        setSupport(supported());
    }, []);

    const handleCreate = () => {
        startTransition(async () => {
            try {
                const cred = await create(
                    parseCreationOptionsFromJSON({
                        publicKey: {
                            challenge: Buffer.from(userId).toString("base64"),
                            rp: {
                                // These are seen by the authenticator when selecting which key to use
                                name: "EmailThing",
                                id: window.location.hostname,
                            },
                            user: {
                                id: Buffer.from(userId).toString("base64"),
                                name: username,
                                displayName: username,
                            },
                            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                            timeout: 60000,
                            attestation: "direct",
                            authenticatorSelection: {
                                residentKey: "required",
                                userVerification: "required",
                            },
                        },
                    }),
                );

                if (!cred) {
                    return void toast.error("Failed to create Passkey");
                }
                const ua = new UAParser(navigator.userAgent).getResult();
                const res = await addPasskey(cred.toJSON(), `${ua.browser.name} on ${ua.os.name}`);
                if (res?.error) {
                    return void toast.error(res.error);
                }
                toast("Successfully set up passkey!");
            } catch (err) {
                console.error(err);
                toast.error("Failed to create Passkey");
            }
        });
    };

    return (
        <Button
            type="button"
            variant="outline"
            onClick={handleCreate}
            disabled={isPending || !support}
            className="w-min border-0"
        >
            {isPending ? (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
            ) : (
                <KeyRoundIcon className="mr-2 size-4" />
            )}
            Create new
        </Button>
    );
}
