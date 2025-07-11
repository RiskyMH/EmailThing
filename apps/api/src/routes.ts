import * as api_v0_whoami from "../../web/app/api/v0/whoami/route.ts";
import * as api_v0_send from "../../web/app/api/v0/send/route.ts";
import * as api_v0_receive_email from "../../web/app/api/v0/receive-email/route.ts";
import * as api_v0 from "./routes/v0/route.ts";
import * as api_internal_user_settings from "../../web/app/api/internal/user-settings/route.ts";
import * as api_internal_sync from "../../web/app/api/internal/sync/route.ts";
import * as api_internal_send_draft from "../../web/app/api/internal/send-draft/route.tsx";
import * as api_internal_revoke_token from "../../web/app/api/internal/revoke-token/route.ts";
import * as api_internal_register from "../../web/app/api/internal/register/route.ts";
import * as api_internal_refresh_token from "../../web/app/api/internal/refresh-token/route.ts";
import * as api_internal_mailbox_mailbox_temp_aliases from "../../web/app/api/internal/mailbox/[mailbox]/temp-aliases/route.ts";
import * as api_internal_mailbox_mailbox_settings from "../../web/app/api/internal/mailbox/[mailbox]/settings/route.ts";
import * as api_internal_mailbox_mailbox_mail_mail_raw from "../../web/app/api/internal/mailbox/[mailbox]/mail/[mail]/raw/route.ts";
import * as api_internal_mailbox_mailbox_mail_mail_attachment_attachment from "../../web/app/api/internal/mailbox/[mailbox]/mail/[mail]/attachment/[attachment]/route.ts";
import * as api_internal_login_reset_password from "../../web/app/api/internal/login/reset-password/route.ts";
import * as api_internal_login from "../../web/app/api/internal/login/route.ts";
import * as api_internal_auth_query from "../../web/app/api/internal/auth-query/route.ts";
import * as api_github_secret_alert from "../../web/app/api/github/secret-alert/route.ts";
import * as api_debug_runtime_info from "../../web/app/api/debug/runtime-info/route.ts";
import * as api_debug_info from "./routes/debug/info/route.ts";
import * as api_debug_build_info from "../../web/app/api/debug/build-info/route.ts";
import * as api_cron_clean_mail from "../../web/app/api/cron/clean-mail/route.ts";

export default {
    "/api/v0/whoami": api_v0_whoami,
    "/api/v0/send": api_v0_send,
    "/api/v0/receive-email": api_v0_receive_email,
    "/api/v0": api_v0,
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
    "/api/internal/auth-query": api_internal_auth_query,
    "/api/github/secret-alert": api_github_secret_alert,
    "/api/debug/runtime-info": api_debug_runtime_info,
    "/api/debug/info": api_debug_info,
    "/api/debug/build-info": api_debug_build_info,
    "/api/cron/clean-mail": api_cron_clean_mail,
};
