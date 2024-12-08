/** Lucide inspired icon combining "mail" and "monitor-dot" (its dot) */

import { createLucideIcon } from "lucide-react";

export const MailUnreadIcon = createLucideIcon("MailUnread", [
    [
        "path",
        {
            d: "M10.97 12.7 2 7",
        },
    ],
    [
        "path",
        {
            d: "M13 12.713a1.94 1.94 0 0 1-2.06 0",
        },
    ],
    [
        "path",
        {
            d: "m15.5 11-2.47 1.7",
        },
    ],
    [
        "path",
        {
            d: "M22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9.5",
        },
    ],
    [
        "circle",
        {
            cx: "20",
            cy: "6",
            r: "3",
            // fill="currentColor"
        },
    ],
]);

export { MailUnreadIcon as default };

// export default function MailUnreadIcon(props: any) {
//     return (
//         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" className={cn("lucide lucide-mail-dot", props.className)}>
//             <title>Mail Unread</title>
//             <path d="M10.97 12.7 2 7" />
//             <path d="M13 12.713a1.94 1.94 0 0 1-2.06 0" />
//             <path d="m15.5 11-2.47 1.7" />
//             <path d="M22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9.5" />
//             {/* <circle cx="20" cy="5.5" r="3" fill="currentColor" /> */}
//             <circle cx="20" cy="5.5" r="3" />
//         </svg>
//     );
// }
