export interface EmailSendOptions {
    /**
     * Sender email address.
     *
     * @example
     * - "Your Name <sender@domain.com>"
     * - "sender@domain.com"
     */
    from: string;

    /**
     * Recipient email address.
     *
     * @example
     * - ["Their Name <recipient@domain.com>"]
     * - ["recipient@domain.com", "Your Name <sender@domain.com"]
     */
    to: string[];

    /**
     * Email subject.
     */
    subject: string;

    /**
     * Bcc recipient email address.
     */
    bcc?: string[];

    /**
     * Cc recipient email address.
     */
    cc?: string[];

    /**
     * Reply-to email address
     */
    reply_to?: string;

    /**
     * The HTML version of the message.
     */
    html?: string;

    /**
     * The plain text version of the message.
     */
    text?: string;

    /** Some more options */
    config?: {
        // no config options right now
    } & Record<string, any>;

    /** Custom headers to add to the email. */
    headers?: Record<string, string>;
}

export interface EmailSendResponse {
    /** The inserted email id into sent folder. */
    email_id?: string;
}

export interface ReceiveEmailPostOptions {
    /** The raw email content. */
    raw: string;
    /** The email address the email was sent from. */
    from: string;
    /** The email address the email was sent to. */
    to: string;
    /** The category ID for the email. */
    category_id?: string;
}

export interface ReceiveEmailResponse {
    /** The inserted email id into inbox. */
    email_id?: string;
    /** If the email already exists in the inbox and was not added again. */
    already_exists?: boolean;
}

export interface WhoamiResponse {
    mailbox_id: string;
}
