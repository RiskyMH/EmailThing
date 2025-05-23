CREATE TABLE "invite_codes" (
	"code" varchar(25) PRIMARY KEY NOT NULL,
	"created_by" varchar(25) NOT NULL,
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp,
	"used_by" varchar(25),
	"used_at" timestamp,
	CONSTRAINT "invite_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "passkey_credentials" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"credential_id" varchar NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp,
	"name" varchar,
	"public_key" varchar NOT NULL,
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "passkey_credentials_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "reset_password_tokens" (
	"token" varchar(25) COLLATE "C" PRIMARY KEY NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "reset_password_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"username" text NOT NULL,
	"password" varchar(200) NOT NULL,
	"admin" boolean DEFAULT false,
	"email" varchar NOT NULL,
	"onboarding_status" json DEFAULT '{"initial":false}'::json,
	"backup_email" varchar,
	"public_email" varchar,
	"public_contact_page" boolean DEFAULT false,
	CONSTRAINT "users_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "user_notifications" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"endpoint" varchar(512) NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"p256dh" varchar NOT NULL,
	"auth" varchar NOT NULL,
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp,
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "user_notifications_id_unique" UNIQUE("id"),
	CONSTRAINT "user_notifications_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"created_at" timestamp NOT NULL,
	"last_used" json,
	"token" varchar(25) NOT NULL,
	"token_expires_at" timestamp NOT NULL,
	"refresh_token" varchar(25) NOT NULL,
	"refresh_token_expires_at" timestamp NOT NULL,
	"sudo_expires_at" timestamp,
	"method" varchar NOT NULL,
	CONSTRAINT "user_sessions_id_unique" UNIQUE("id"),
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token"),
	CONSTRAINT "user_sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "default_domains" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"domain" text NOT NULL,
	"auth_key" varchar(25) NOT NULL,
	"available" boolean DEFAULT false,
	"temp_domain" boolean DEFAULT false,
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "default_domains_id_unique" UNIQUE("id"),
	CONSTRAINT "default_domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "stats" (
	"time" varchar NOT NULL,
	"type" varchar NOT NULL,
	"value" integer NOT NULL,
	CONSTRAINT "stats_time_type_pk" PRIMARY KEY("time","type")
);
--> statement-breakpoint
CREATE TABLE "mailboxes" (
	"mailbox_id" varchar(25) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"storage_used" integer DEFAULT 0 NOT NULL,
	"plan" varchar DEFAULT 'FREE' NOT NULL,
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "mailboxes_mailbox_id_unique" UNIQUE("mailbox_id")
);
--> statement-breakpoint
CREATE TABLE "mailbox_aliases" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"mailbox_id" varchar(25) NOT NULL,
	"alias" text NOT NULL,
	"name" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"default" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "mailbox_aliases_id_unique" UNIQUE("id"),
	CONSTRAINT "mailbox_aliases_unique" UNIQUE("alias","mailbox_id"),
	CONSTRAINT "mailbox_aliases_alias" UNIQUE("alias")
);
--> statement-breakpoint
CREATE TABLE "mailbox_categories" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"mailbox_id" varchar(25) NOT NULL,
	"name" varchar NOT NULL,
	"color" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "mailbox_categories_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "mailbox_custom_domain" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"mailbox_id" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"domain" text NOT NULL,
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "mailbox_custom_domain_id_unique" UNIQUE("id"),
	CONSTRAINT "mailbox_custom_domain_unique" UNIQUE("domain","mailbox_id")
);
--> statement-breakpoint
CREATE TABLE "mailbox_for_user" (
	"mailbox_id" varchar(25) NOT NULL,
	"user_id" varchar(25) NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"role" varchar DEFAULT 'ADMIN' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "mailbox_for_user_mailbox_id_user_id_pk" PRIMARY KEY("mailbox_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "mailbox_token" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"token" varchar(50) COLLATE "C" NOT NULL,
	"mailbox_id" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"name" varchar,
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "mailbox_token_id_unique" UNIQUE("id"),
	CONSTRAINT "mailbox_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "temp_aliases" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"mailbox_id" varchar(25) NOT NULL,
	"alias" text NOT NULL,
	"name" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "temp_aliases_id_unique" UNIQUE("id"),
	CONSTRAINT "temp_aliases_unique" UNIQUE("alias","mailbox_id")
);
--> statement-breakpoint
CREATE TABLE "draft_emails" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"mailbox_id" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"subject" varchar(255),
	"text_body" varchar(65535),
	"from" varchar(255),
	"to" json,
	"headers" json,
	"is_deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "draft_emails_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"mailbox_id" varchar(25) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"subject" varchar(255),
	"snippet" varchar(255),
	"text_body" varchar(65535) NOT NULL,
	"html" varchar(10485760),
	"raw" varchar(10),
	"size" integer DEFAULT 0,
	"reply_to" varchar,
	"given_message_id" varchar,
	"given_references" json,
	"category_id" varchar(25),
	"temp_id" varchar(25),
	"is_sender" boolean DEFAULT false NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"binned_at" timestamp,
	"is_deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "emails_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "email_attachments" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"email_id" varchar(25) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"mime_type" varchar(25) NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"title" varchar(255),
	CONSTRAINT "email_attachments_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "email_recipients" (
	"id" varchar(25) PRIMARY KEY NOT NULL,
	"email_id" varchar(25) NOT NULL,
	"name" varchar(255),
	"address" varchar(255) NOT NULL,
	"cc" boolean DEFAULT false NOT NULL,
	CONSTRAINT "email_recipients_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "email_senders" (
	"email_id" varchar(25) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"address" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "passkey_credentials" ADD CONSTRAINT "passkey_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reset_password_tokens" ADD CONSTRAINT "reset_password_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailbox_aliases" ADD CONSTRAINT "mailbox_aliases_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes"("mailbox_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailbox_categories" ADD CONSTRAINT "mailbox_categories_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes"("mailbox_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailbox_custom_domain" ADD CONSTRAINT "mailbox_custom_domain_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes"("mailbox_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailbox_token" ADD CONSTRAINT "mailbox_token_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes"("mailbox_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temp_aliases" ADD CONSTRAINT "temp_aliases_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes"("mailbox_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_emails" ADD CONSTRAINT "draft_emails_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes"("mailbox_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_mailbox_id_mailboxes_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes"("mailbox_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_category_id_mailbox_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."mailbox_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_temp_id_temp_aliases_id_fk" FOREIGN KEY ("temp_id") REFERENCES "public"."temp_aliases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_senders" ADD CONSTRAINT "email_senders_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "passkey_user_created_idx" ON "passkey_credentials" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "passkey_user_updated_idx" ON "passkey_credentials" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "reset_password_user_id" ON "reset_password_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_username" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "user_updated_at_idx" ON "users" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "notification_user_id" ON "user_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_user_created_idx" ON "user_notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "token_idx" ON "user_sessions" USING btree ("token","token_expires_at");--> statement-breakpoint
CREATE INDEX "refresh_token_idx" ON "user_sessions" USING btree ("refresh_token","refresh_token_expires_at");--> statement-breakpoint
CREATE INDEX "default_domain_available" ON "default_domains" USING btree ("available");--> statement-breakpoint
CREATE INDEX "default_domains_idx" ON "default_domains" USING btree ("domain","auth_key");--> statement-breakpoint
CREATE INDEX "stats_type_idx" ON "stats" USING btree ("type");--> statement-breakpoint
CREATE INDEX "mailbox_aliases_idx" ON "mailbox_aliases" USING btree ("mailbox_id","default");--> statement-breakpoint
CREATE INDEX "mailbox_alias_updated_idx" ON "mailbox_aliases" USING btree ("updated_at","mailbox_id");--> statement-breakpoint
CREATE INDEX "mailbox_category_mailbox_idx" ON "mailbox_categories" USING btree ("mailbox_id");--> statement-breakpoint
CREATE INDEX "mailbox_category_updated_idx" ON "mailbox_categories" USING btree ("updated_at","mailbox_id");--> statement-breakpoint
CREATE INDEX "mailbox_domain_updated_idx" ON "mailbox_custom_domain" USING btree ("updated_at","mailbox_id");--> statement-breakpoint
CREATE INDEX "mailbox_user_joined_idx" ON "mailbox_for_user" USING btree ("user_id","joined_at");--> statement-breakpoint
CREATE INDEX "mailbox_user_updated_idx" ON "mailbox_for_user" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "mailbox_token_updated_idx" ON "mailbox_token" USING btree ("updated_at","mailbox_id");--> statement-breakpoint
CREATE INDEX "temp_aliases_idx" ON "temp_aliases" USING btree ("mailbox_id","alias");--> statement-breakpoint
CREATE INDEX "draft_mailbox_idx" ON "draft_emails" USING btree ("mailbox_id");--> statement-breakpoint
CREATE INDEX "draft_created_id_idx" ON "draft_emails" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "draft_updated_mailbox_idx" ON "draft_emails" USING btree ("updated_at","mailbox_id");--> statement-breakpoint
CREATE INDEX "email_mailbox_idx" ON "emails" USING btree ("mailbox_id");--> statement-breakpoint
CREATE INDEX "email_category_idx" ON "emails" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "email_sender_idx" ON "emails" USING btree ("is_sender");--> statement-breakpoint
CREATE INDEX "email_is_read_idx" ON "emails" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "email_is_starred_idx" ON "emails" USING btree ("is_starred");--> statement-breakpoint
CREATE INDEX "email_binned_at_idx" ON "emails" USING btree ("binned_at");--> statement-breakpoint
CREATE INDEX "email_temp_id_idx" ON "emails" USING btree ("temp_id");--> statement-breakpoint
CREATE INDEX "email_given_id_idx" ON "emails" USING btree ("given_message_id");--> statement-breakpoint
CREATE INDEX "email_all_idx" ON "emails" USING btree ("mailbox_id","binned_at","is_sender","category_id","is_starred","temp_id","created_at","id");--> statement-breakpoint
CREATE INDEX "email_all2_idx" ON "emails" USING btree ("mailbox_id","binned_at","is_sender","temp_id","created_at","id");--> statement-breakpoint
CREATE INDEX "email_created_id_idx" ON "emails" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "email_updated_at_idx" ON "emails" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "email_updated_mailbox_idx" ON "emails" USING btree ("updated_at","mailbox_id");--> statement-breakpoint
CREATE INDEX "email_attachment_email_idx" ON "email_attachments" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX "email_recipient_email_idx" ON "email_recipients" USING btree ("email_id");