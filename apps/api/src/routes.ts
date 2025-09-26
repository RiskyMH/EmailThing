import * as api_v0_whoami from "./routes/v0/whoami/route.ts";
import * as api_v0_send from "./routes/v0/send/route.ts";
import * as api_v0_receive_email from "./routes/v0/receive-email/route.ts";
import * as api_v0 from "./routes/v0/route.ts";
import * as api_invite from "./routes/invite/route.ts";
import * as api_internal_user_settings from "./routes/internal/user-settings/route.ts";
import * as api_internal_sync from "./routes/internal/sync/route.ts";
import * as api_internal_send_draft from "./routes/internal/send-draft/route.tsx";
import * as api_internal_revoke_token from "./routes/internal/revoke-token/route.ts";
import * as api_internal_register from "./routes/internal/register/route.ts";
import * as api_internal_refresh_token from "./routes/internal/refresh-token/route.ts";
import * as api_internal_mailbox_mailbox_temp_aliases from "./routes/internal/mailbox/[mailbox]/temp-aliases/route.ts";
import * as api_internal_mailbox_mailbox_settings from "./routes/internal/mailbox/[mailbox]/settings/route.ts";
import * as api_internal_mailbox_mailbox_mail_mail_raw from "./routes/internal/mailbox/[mailbox]/mail/[mail]/raw/route.ts";
import * as api_internal_mailbox_mailbox_mail_mail_attachment_attachment from "./routes/internal/mailbox/[mailbox]/mail/[mail]/attachment/[attachment]/route.ts";
import * as api_internal_login_reset_password from "./routes/internal/login/reset-password/route.ts";
import * as api_internal_login from "./routes/internal/login/route.ts";
import * as api_internal_emailthing_me from "./routes/internal/emailthing-me/route.ts";
import * as api_internal_auth_query from "./routes/internal/auth-query/route.ts";
import * as api_github_secret_alert from "./routes/github/secret-alert/route.ts";
import * as api_debug_info from "./routes/debug/info/route.ts";
import * as api_cron_clean_mail from "./routes/cron/clean-mail/route.ts";

export default {
    "/api/v0/whoami": api_v0_whoami,
    "/api/v0/send": api_v0_send,
    "/api/v0/receive-email": api_v0_receive_email,
    "/api/v0": api_v0,
    "/api/invite": api_invite,
    "/api/internal/user-settings": api_internal_user_settings,
    "/api/internal/sync": api_internal_sync,
    "/api/internal/send-draft": api_internal_send_draft,
    "/api/internal/revoke-token": api_internal_revoke_token,
    "/api/internal/register": api_internal_register,
    "/api/internal/refresh-token": api_internal_refresh_token,
    "/api/internal/mailbox/:mailbox/temp-aliases": api_internal_mailbox_mailbox_temp_aliases,
    "/api/internal/mailbox/:mailbox/settings": api_internal_mailbox_mailbox_settings,
    "/api/internal/mailbox/:mailbox/mail/:mail/raw": api_internal_mailbox_mailbox_mail_mail_raw,
    "/api/internal/mailbox/:mailbox/mail/:mail/attachment/:attachment": api_internal_mailbox_mailbox_mail_mail_attachment_attachment,
    "/api/internal/login/reset-password": api_internal_login_reset_password,
    "/api/internal/login": api_internal_login,
    "/api/internal/emailthing-me": api_internal_emailthing_me,
    "/api/internal/auth-query": api_internal_auth_query,
    "/api/github/secret-alert": api_github_secret_alert,
    "/api/debug/info": api_debug_info,
    "/api/cron/clean-mail": api_cron_clean_mail,
};
