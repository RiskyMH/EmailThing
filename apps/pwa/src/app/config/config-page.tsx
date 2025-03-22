import { useParams } from "react-router-dom";
import StorageUsed from "./storage-used";
import Aliases from "./aliases";
import Categories from "./categories";
import Users from "./users";
import APITokens from "./tokens";
import CustomDomains from "./custom-domains";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function ConfigPage() {
    return (
        <div className="flex min-w-0 flex-col gap-5 p-5">
            <h1 className="font-semibold text-2xl">Mailbox Config</h1>
            <DemoWarning />

            <StorageUsed />
            <Aliases />
            <Categories />
            <CustomDomains />
            <APITokens />
            <Users />

            <br />
        </div>
    );
}


function DemoWarning() {
    const { mailboxId } = useParams<{ mailboxId: string }>();
    // if demo, warn in yellow that it's a demo
    if (mailboxId === "demo") return (
        <Alert variant="warning" className="max-w-[40rem]">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Demo Mailbox</AlertTitle>
            <AlertDescription className="text-balance">
                This is a demo and fake local mailbox. Some features may not actually work.
            </AlertDescription>
        </Alert>
    );
    return null;
}