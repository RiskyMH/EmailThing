import { useParams } from "react-router-dom"
import MailLayout from "./mail/root-layout"

export default function MailItem() {
    const params = useParams<"mailboxId" | "mailId">()

    return <div>
        {params.mailboxId}
        <br />
        {params.mailId}
    </div>
}
