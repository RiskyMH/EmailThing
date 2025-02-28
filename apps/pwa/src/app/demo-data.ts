import type { Category, Email } from "./email-list";

export const demoEmails = [
    {
        id: "1",
        subject: "Welcome to EmailThing!",
        snippet: "Thanks for trying out EmailThing. We're excited to have you onboard...",
        body: "Thanks for trying out EmailThing. We're excited to have you onboard and help you manage your emails better. Check out our quick start guide to get going!",
        createdAt: new Date("2024-01-15T09:00:00"),
        isRead: true,
        isStarred: true,
        from: {
            name: "EmailThing Team",
            address: "hello@emailthing.app"
        }
    },
    {
        id: "2", 
        subject: "Your Google Account: Security alert",
        snippet: "A new sign-in from Windows device in Mars, Universe",
        body: "If this wasn't you, please secure your account immediately.",
        createdAt: new Date("2024-01-14T15:23:00"),
        isRead: false,
        from: {
            name: "Google",
            address: "no-reply@google.com"
        }
    },
    {
        id: "3",
        subject: "New feature release: Email Categories",
        snippet: "We've just launched email categories to help you organize better...",
        body: "You can now categorize your emails with custom labels and colors. Try it out and let us know what you think!",
        createdAt: new Date("2024-01-13T11:30:00"),
        isRead: false,
        binnedAt: new Date("2024-01-13T11:30:00"),
        from: {
            name: "EmailThing Updates",
            address: "updates@emailthing.app"
        }
    },
    {
        id: "4",
        subject: "Your Netflix subscription",
        snippet: "We're having trouble with your payment method",
        body: "Please update your payment information to continue enjoying Netflix.",
        createdAt: new Date("2024-01-12T16:45:00"),
        isRead: false,
        from: {
            name: "Netflix",
            address: "info@netflix.com"
        }
    },
    {
        id: "5",
        subject: "Coffee next week?",
        snippet: "Hey! Was wondering if you'd like to catch up over coffee...",
        body: "It's been ages since we caught up. Are you free next Tuesday around 2pm?",
        createdAt: new Date("2024-01-11T20:15:00"),
        isRead: true,
        categoryId: "2",
        from: {
            name: "Sarah Johnson",
            address: "sarah.j@gmail.com"
        }
    },
    {
        id: "6",
        subject: "Your Amazon.com order #302-5839294-2940173",
        snippet: "Your package has been delivered!",
        body: "Your package was delivered at 2:30pm. How did we do?",
        createdAt: new Date("2024-01-10T14:30:00"),
        isRead: true,
        from: {
            name: "Amazon.com",
            address: "ship-confirm@amazon.com"
        }
    },
    {
        id: "7",
        subject: "Try EmailThing Pro free for 30 days",
        snippet: "Unlock premium features with our Pro plan...",
        body: "Get access to unlimited categories, advanced filters, and priority support with EmailThing Pro!",
        createdAt: new Date("2024-01-09T10:00:00"),
        isRead: false,
        from: {
            name: "EmailThing",
            address: "sales@emailthing.app"
        }
    },
    {
        id: "8",
        subject: "Team meeting notes - Jan 8",
        snippet: "Here are the key points from today's meeting...",
        body: "Action items:\n1. Update project timeline\n2. Schedule client review\n3. Prepare Q1 report",
        createdAt: new Date("2024-01-08T17:00:00"),
        isRead: true,
        categoryId: "1",
        from: {
            name: "Mark Wilson",
            address: "m.wilson@company.com"
        }
    },
    {
        id: "9",
        subject: "Password Reset Request - Twitter",
        snippet: "We received a request to reset your password",
        body: "Click the link below to reset your password. If you didn't request this, please ignore this email.",
        createdAt: new Date("2024-01-07T09:20:00"),
        isRead: true,
        from: {
            name: "Twitter",
            address: "no-reply@twitter.com"
        }
    },
    {
        id: "10",
        subject: "Birthday party this Saturday!",
        snippet: "Don't forget about Emma's birthday party...",
        body: "Just a reminder about Emma's birthday party this Saturday at 3pm. Don't forget to bring your swimming gear!",
        createdAt: new Date("2024-01-06T19:45:00"),
        isRead: true,
        from: {
            name: "Lisa Chen",
            address: "lisa.chen@gmail.com"
        }
    },
    {
        id: "11",
        subject: "Your flight confirmation",
        snippet: "Your upcoming flight to Paris (CDG)",
        body: "Thank you for choosing Air France. Your flight AF1234 departs at 10:30 AM.",
        createdAt: new Date("2024-01-05T12:00:00"),
        isRead: true,
        from: {
            name: "Air France",
            address: "noreply@airfrance.fr"
        }
    },
    {
        id: "12",
        subject: "LinkedIn: New connection request",
        snippet: "John Smith wants to connect with you on LinkedIn",
        body: "You have a new connection request waiting for you on LinkedIn.",
        createdAt: new Date("2024-01-04T08:15:00"),
        isRead: false,
        from: {
            name: "LinkedIn",
            address: "notifications@linkedin.com"
        }
    },
    {
        id: "13",
        subject: "Weekly team standup",
        snippet: "Reminder: standup meeting tomorrow at 9am",
        body: "Please prepare your updates for the weekly standup meeting tomorrow morning.",
        createdAt: new Date("2024-01-03T16:30:00"),
        isRead: true,
        from: {
            name: "Team Calendar",
            address: "calendar@company.com"
        }
    },
    {
        id: "14",
        subject: "Your Spotify Premium subscription",
        snippet: "Your next billing date is coming up",
        body: "Your next payment of $9.99 will be processed on January 15th.",
        createdAt: new Date("2024-01-02T13:20:00"),
        isRead: true,
        from: {
            name: "Spotify",
            address: "no-reply@spotify.com"
        }
    },
    {
        id: "15",
        subject: "Holiday photos",
        snippet: "Here are the photos from our trip!",
        body: "Finally got around to uploading all the photos from our holiday. Check them out in the shared Google Drive folder!",
        createdAt: new Date("2024-01-01T21:00:00"),
        isRead: false,
        from: {
            name: "David Thompson",
            address: "david.t@gmail.com"
        }
    }
] satisfies Email[]

export const sentEmails = [
    {
        id: "16",
        subject: "Sent email",
        body: "This is a sent email",
        createdAt: new Date("2024-01-01T21:00:00"),
        categoryId: "2",
        from: {
            name: "John Doe",
            address: "john.doe@emailthing.app"
        }
    }
] satisfies Email[]

export const tempEmails = [
    {
        id: "17",
        subject: "Lol stole ur email",
        body: "Lol stole ur email",
        createdAt: new Date("2024-01-01T21:00:00"),
        from: {
            name: "Suspicious sender",
            address: "totaly@google.com"
        }
    }
] satisfies Email[]

export const demoEmailsDraft = [
    {
        id: "16",
        subject: "Draft email",
        body: "This is a draft email",
        from: {
            name: "John Doe",
            address: "john.doe@emailthing.app"
        },
        createdAt: new Date("2021-01-01")
    }
] satisfies Email[]

export const demoCategories = [
    {
        id: "1",
        name: "Work",
        color: "#FFA500" // orange
    },
    {
        id: "2",
        name: "Personal",
        color: "#008000" // green
    },
    
] satisfies Category[]
