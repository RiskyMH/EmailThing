import { MenuItem } from "../components.client"

interface DocsLayoutProps {
    children: React.ReactNode
}

export default function SettingsLayout({ children }: DocsLayoutProps) {
    return (
        <main className="flex min-h-[calc(100vh_-_theme(spacing.16)_-_1rem)] w-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
            <div className="mx-auto grid w-full max-w-6xl gap-2">
                <h1 className="text-3xl font-semibold">Account Settings</h1>
            </div>
            <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
                <nav className="flex flex-col gap-4 text-sm text-muted-foreground ps-6 sm:ps-0">
                    <MenuItem href="/settings">General</MenuItem>
                    <MenuItem href="/settings/authentication">Authentication</MenuItem>
                    <MenuItem href="/settings/notifications">Notifications</MenuItem>
                    <MenuItem href="/settings/mailboxes">Mailboxes</MenuItem>
                    <MenuItem href="/settings/#">Advanced</MenuItem>
                </nav>
                <div className="grid gap-6">
                    {children}
                </div>
            </div>
        </main>
    )
}
