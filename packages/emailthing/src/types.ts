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
    success: boolean;
    /** if you chose to save in sent */
    emailId?: string;
}

export interface ReceiveEmailPostOptions {
    /** The raw email */
    raw: string;
    from: string;
    to: string;
}

export interface WhoamiResponse {
    mailboxId: string;
}
