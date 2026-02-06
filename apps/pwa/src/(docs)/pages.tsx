
export const docsNav = [
    {
        title: "Getting Started",
        items: [
            { title: "Introduction", href: "/docs" },
            { title: "Custom Domain", href: "/docs/custom-domain" },
        ],
    },
    {
        title: "API",
        items: [
            { title: "API Introduction", href: "/docs/api" },
            { title: "Send Email", href: "/docs/api#email" },
            { title: "Receive Email", href: "/docs/api#email" },
        ],
    },
    {
        title: "Legal",
        items: [
            { title: "Privacy Policy", href: "#privacy", disabled: true },
            { title: "Terms and Conditions", href: "#terms", disabled: true },
        ],
    },
] satisfies DocsSidebarNavProps["items"];
