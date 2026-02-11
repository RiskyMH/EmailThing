import { API_URL } from "@emailthing/const/urls";

interface LoginResponse {
  token: string;
  refreshToken: string;
  tokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  mailboxes: string[];
  userId: string;
  userOnboarding: boolean;
}

interface RefreshResponse {
  token: string;
  refreshToken: string;
  tokenExpiresAt: string;
}

interface SyncResponse {
  emails: any[];
  mailboxes: any[];
  mailboxCategories: any[];
  mailboxAliases: any[];
  tempAliases: any[];
  draftEmails: any[];
  mailboxCustomDomains: any[];
  mailboxesForUser: any[];
  user: any;
  apiCustomisations: any;
  time: string;
}

export class EmailThingCLI {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private baseURL: string;

  constructor(baseURL = API_URL) {
    this.baseURL = baseURL;
  }

  setAuth(token: string, refreshToken: string, tokenExpiresAt: string) {
    this.token = token;
    this.refreshToken = refreshToken;
    this.tokenExpiresAt = new Date(tokenExpiresAt);
  }

  private async internalFetch(
    pathname: string,
    method: "GET" | "POST" | "DELETE" = "GET",
    body?: any,
    extraHeaders?: Record<string, string>
  ): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Origin": "https://emailthing.app",
      ...extraHeaders,
    };

    if (this.token) {
      headers.Authorization = `session ${this.token}`;
    }

    return fetch(`${this.baseURL}/api/internal${pathname}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await this.internalFetch("/login?type=password", "POST", {
      username,
      password,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Login failed");
    }

    const data = await res.json() as LoginResponse;
    
    if (!data || !data.token) {
      throw new Error("Invalid login response: " + JSON.stringify(data));
    }
    
    this.setAuth(data.token, data.refreshToken, data.tokenExpiresAt);
    return data;
  }

  async refreshTokenIfNeeded() {
    if (!this.token || !this.refreshToken || !this.tokenExpiresAt) {
      throw new Error("Not authenticated");
    }

    const ONE_MINUTE_MS = 60000;
    
    if (this.tokenExpiresAt.getTime() > Date.now() + ONE_MINUTE_MS) {
      return;
    }

    const res = await fetch(`${this.baseURL}/api/internal/refresh-token`, {
      method: "POST",
      headers: {
        Authorization: `refresh ${this.refreshToken}`,
        Origin: "https://emailthing.app",
      },
    });

    if (!res.ok) {
      throw new Error("Token refresh failed");
    }

    const data = await res.json() as RefreshResponse;
    this.setAuth(data.token, data.refreshToken, data.tokenExpiresAt);
  }

  async sync(lastSync?: string, minimal = false): Promise<SyncResponse> {
    await this.refreshTokenIfNeeded();

    const params = new URLSearchParams();
    if (minimal) params.set("minimal", "true");

    const extraHeaders: Record<string, string> = {};
    if (lastSync) {
      const lastSyncTime = new Date(lastSync).getTime();
      extraHeaders["x-last-sync"] = (lastSyncTime + 1).toString();
    }

    const res = await this.internalFetch(`/sync?${params}`, "GET", undefined, extraHeaders);

    if (!res.ok) {
      throw new Error(`Sync failed: ${await res.text()}`);
    }

    return res.json() as Promise<SyncResponse>;
  }

  async sendDraft(draft: {
    draftId?: string;
    mailboxId: string;
    body?: string;
    subject: string;
    from: string;
    to: Array<{ address: string; name?: string; cc?: boolean }>;
    html?: string;
    headers?: Array<{ key: string; value: string }>;
  }) {
    await this.refreshTokenIfNeeded();
    draft.draftId ||= "new";

    const res = await this.internalFetch("/send-draft", "POST", draft);

    if (!res.ok) {
      throw new Error(`Send failed: ${await res.text()}`);
    }

    return res.json();
  }

  async getRawEmail(mailboxId: string, mailId: string): Promise<string> {
    await this.refreshTokenIfNeeded();

    const res = await this.internalFetch(`/mailbox/${mailboxId}/mail/${mailId}/raw`);

    if (!res.ok) {
      throw new Error(`Failed to fetch raw email: ${await res.text()}`);
    }

    return res.text();
  }

  async modifyEmail(updates: {
    id: string;
    mailboxId: string;
    isRead?: boolean;
    isStarred?: boolean;
    categoryId?: string | null;
  }) {
    await this.refreshTokenIfNeeded();

    const payload = {
      emails: [{
        id: updates.id,
        mailboxId: updates.mailboxId,
        isRead: updates.isRead,
        isStarred: updates.isStarred,
        categoryId: updates.categoryId,
        lastUpdated: new Date().toISOString(),
      }]
    };

    const res = await this.internalFetch("/sync", "POST", payload);

    if (!res.ok) {
      throw new Error(`Modify email failed: ${await res.text()}`);
    }

    return res.json();
  }

  async logout() {
    if (!this.refreshToken) return;

    await this.internalFetch("/revoke-token", "DELETE");

    this.token = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
  }
}
