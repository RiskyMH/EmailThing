import { Metadata } from "next"
import { pageMailboxAccess } from "../tools"
import prisma from "@/utils/prisma"
import { notFound } from "next/navigation"
import { customDomainLimit, storageLimit, aliasLimit } from "@/utils/limits"
import { AddAliasForm, AddCustomDomainForm } from "./components.client"
import { Button } from "@/components/ui/button"
import { SmartDrawer, SmartDrawerClose, SmartDrawerContent, SmartDrawerDescription, SmartDrawerFooter, SmartDrawerHeader, SmartDrawerTitle, SmartDrawerTrigger } from "@/components/ui/smart-drawer"


export const metadata: Metadata = {
    title: "Config",
}


export default async function Email({
    params,
}: {
    params: {
        mailbox: string,
        email: string
    }
}) {
    await pageMailboxAccess(params.mailbox)

    await prisma.mailbox.update({
        where: {
            id: params.mailbox
        },
        data: {
            plan: "UNLIMITED"
        }
    })

    const mailbox = await prisma.mailbox.findUnique({
        where: {
            id: params.mailbox
        },
        select: {
            storageUsed: true,
            aliases: true,
            plan: true,
            customDomains: true,
        }
    })

    if (!mailbox) return notFound()

    return (
        <div className="min-w-0 p-5 flex flex-col gap-5">
            <h1 className="text-2xl font-semibold">Mailbox Config</h1>

            <div>
                <h2 className="text-lg font-semibold">Storage</h2>
                <p>Used: {Math.ceil(mailbox.storageUsed / 1e+6)}MB / {(storageLimit as any)[mailbox.plan] / 1e+6}MB</p>
            </div>

            <div>
                <h2 className="text-lg font-semibold">Aliases</h2>
                {mailbox.aliases.map((alias, i) => (
                    <div key={i} className="flex items-center">
                        <p>{alias.alias} {alias.name && `(${alias.name})`} {alias.default && <span title="default">✅</span>}</p>
                    </div>
                ))}
                <SmartDrawer>
                    <SmartDrawerTrigger asChild>
                        <Button disabled={mailbox.aliases.length >= (aliasLimit as any)[mailbox.plan]}>
                            Add alias
                        </Button>
                    </SmartDrawerTrigger>
                    <SmartDrawerContent className="sm:max-w-[425px]">
                        <SmartDrawerHeader>
                            <SmartDrawerTitle>Add Alias</SmartDrawerTitle>
                            <SmartDrawerDescription>Enter your chosen email and name to create alias</SmartDrawerDescription>
                        </SmartDrawerHeader>

                        <AddAliasForm mailboxId={params.mailbox} />

                        <SmartDrawerFooter className="pt-2 flex sm:hidden">
                            <SmartDrawerClose asChild>
                                <Button variant="secondary">Cancel</Button>
                            </SmartDrawerClose>
                        </SmartDrawerFooter>
                    </SmartDrawerContent>
                </SmartDrawer>

            </div>

            <div>
                <h2 className="text-lg font-semibold">Custom domains</h2>
                {mailbox.customDomains.map((domain, i) => (
                    <div key={i} className="flex items-center">
                        <p>{domain.domain}</p>
                    </div>
                ))}
                <div>
                    <SmartDrawer>
                        <SmartDrawerTrigger asChild>
                            <Button disabled={mailbox.customDomains.length >= (customDomainLimit as any)[mailbox.plan]}>
                                Add custom domain
                            </Button>
                        </SmartDrawerTrigger>
                        <SmartDrawerContent className="sm:max-w-[425px]">

                            <AddCustomDomainForm mailboxId={params.mailbox} />

                            <SmartDrawerFooter className="pt-2 flex sm:hidden">
                                <SmartDrawerClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </SmartDrawerClose>
                            </SmartDrawerFooter>
                        </SmartDrawerContent>
                    </SmartDrawer>
                </div>

                <div>
                    <br />

                    {/* How to receive emails */}
                    <h2 className="text-lg font-semibold">How to receive emails</h2>
                    You need to setup Cloudflare Email Workers to receive emails. {" "}
                    You can use this example script and add fill in the env vars and zone to get started.
                    <br />
                    Make sure to enable catch all for the worker so all emails come to your inbox.
                    <br />
                    <a href="https://github.com/RiskyMH/Email/blob/master/cloudflare-workers/recieve-email.js" target="_blank" rel="noreferrer" className="font-bold hover:underline">Click here for example script.</a> {" "}
                    If you are confused, you can ask for help in the <a href="https://discord.gg/GT9Q2Yz4VS" className="font-bold hover:underline" target="_blank" rel="noreferrer">Discord</a> server.
                    <br />
                    {mailbox.customDomains.length && (
                        <div>
                            <br />
                            <p>The auth keys for your custom domains are:</p>
                            <pre className="overflow-auto">
                                {mailbox.customDomains.map((d) => (
                                    `${d.domain}: ${d.authKey}\n`
                                ))}
                            </pre>
                        </div>
                    )}
                    <br />

                    {/* how to send emails */}
                    <h2 className="text-lg font-semibold">How to send emails</h2>
                    {/* user needs to authorize mailchannels SPF and cf worker */}
                    You need to authorize MailChannels and Cloudflare Workers to send emails on your behalf. To do so, add these TXT records.
                    <pre className="overflow-auto">
                        {`_mailchannels.<domain> "v=mc1 cfid=riskymh.workers.dev"\n`}
                        {`<domain>               "v=spf1 include:_spf.mx.cloudflare.net include:relay.mailchannels.net -all"`}
                    </pre>

                </div>


            </div>

        </div>

    )
}
