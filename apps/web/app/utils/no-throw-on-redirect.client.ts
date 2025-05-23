import { isRedirectError } from "next/dist/client/components/redirect-error";

export default function catchRedirectError(error: unknown) {
    if (isRedirectError(error)) return;
    throw error;
}
