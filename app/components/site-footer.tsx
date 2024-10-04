import { MailIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SiteFooter({ className, children }: { className?: string, children?: ReactNode }) {
    return (
        <footer className={className}>
            <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <MailIcon />
                    <p className="text-center text-sm leading-loose md:text-left">
                        Built by{" "}
                        <a
                            href="https://riskymh.dev"
                            target="_blank"
                            className="font-medium underline underline-offset-4"
                        >
                            RiskyMH
                        </a>
                        {children}
                        . The source code is available on{" "}
                        <a
                            href="https://github.com/RiskyMH/EmailThing"
                            target="_blank"
                            className="font-medium underline underline-offset-4"
                        >
                            GitHub
                        </a>
                        .
                    </p>
                </div>
            </div>
        </footer>
    )
}