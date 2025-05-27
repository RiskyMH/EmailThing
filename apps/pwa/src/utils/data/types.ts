import type {
  DraftEmail,
  Email,
  EmailAttachments,
  EmailRecipient,
  EmailSender,
  Mailbox,
  MailboxAlias,
  MailboxCategory,
  MailboxCustomDomain,
  MailboxForUser,
  TempAlias,
  User,
} from "@emailthing/db";
import type { InferSelectModel } from "drizzle-orm";

type T<Obj> = {
  [K in keyof Obj]: null extends Obj[K]
    ?
        | 0
        | (Obj[K] extends null | infer U
            ? U extends false
              ? 0
              : U extends true
                ? 1
                : U extends boolean
                  ? 1 | 0
                  : U
            : any)
    : Obj[K] extends false
      ? 0
      : Obj[K] extends true
        ? 1
        : Obj[K] extends boolean
          ? 1 | 0
          : Obj[K];
};

type Updatable<T> = T & {
  needsSync?: 1;
};

// Core types from DB schema
export type DBEmail = Updatable<
  T<InferSelectModel<typeof Email>> & {
    sender: Omit<T<InferSelectModel<typeof EmailSender>>, "emailId">;
    recipients: Omit<T<InferSelectModel<typeof EmailRecipient>>, "emailId">[];
    attachments: Omit<T<InferSelectModel<typeof EmailAttachments>>, "emailId">[];
  }
>;
export type DBEmailDraft = Updatable<T<InferSelectModel<typeof DraftEmail>>> & { isNew?: boolean };
export type DBMailbox =
  | T<InferSelectModel<typeof Mailbox>>
  | (T<InferSelectModel<typeof Mailbox>> & { plan: "DEMO" });
export type DBMailboxAlias = T<InferSelectModel<typeof MailboxAlias>>;
export type DBMailboxCategory = Updatable<T<InferSelectModel<typeof MailboxCategory>>> & {
  isNew?: boolean;
};
export type DBMailboxCustomDomain = T<InferSelectModel<typeof MailboxCustomDomain>>;
export type DBTempAlias = T<InferSelectModel<typeof TempAlias>>;
export type DBMailboxForUser = T<InferSelectModel<typeof MailboxForUser>> & { username: string };
export type DBUser = T<Omit<InferSelectModel<typeof User>, "password">>;

export type LocalSyncData = {
  lastSync: Date | 0;
  token: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  userId: string;
  isSyncing?: boolean;
  apiUrl?: string; // default is https://emailthing.app
};

export type ApiCustomisations = {
  apiUrl?: string; //pk
  notificationsPublicKey?: string;
}