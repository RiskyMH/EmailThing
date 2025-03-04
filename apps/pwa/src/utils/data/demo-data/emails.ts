import { DBEmail, DBEmailDraft } from "../types";
import { demoMailboxId } from "./mailbox";

export const demoEmails: DBEmail[] = [
    {
        id: "1",
        mailboxId: demoMailboxId,
        subject: "Welcome to EmailThing!",
        snippet: "Thanks for trying out EmailThing. We're excited to have you onboard...",
        body: "Thanks for trying out EmailThing. We're excited to have you onboard and help you manage your emails better. Check out our quick start guide to get going!",
        createdAt: new Date("2024-01-15T09:00:00"),
        updatedAt: new Date("2024-01-15T09:00:00"),
        isRead: true,
        isStarred: true,
        isSender: false,
        html: "<p>Thanks for trying out EmailThing. We're excited to have you onboard!</p>",
        size: 1024,
        raw: "s3",
        replyTo: null,
        givenId: null,
        givenReferences: [],
        tempId: null,
        categoryId: null,
        binnedAt: null
    },
    {
        id: "2",
        mailboxId: demoMailboxId,
        subject: "Your Google Account: Security alert",
        snippet: "A new sign-in from Windows device in Mars, Universe",
        body: "If this wasn't you, please secure your account immediately.",
        createdAt: new Date("2024-01-14T15:23:00"),
        updatedAt: new Date("2024-01-14T15:23:00"),
        isRead: false,
        isStarred: false,
        isSender: false,
        html: "<p>If this wasn't you, please secure your account immediately.</p>",
        size: 512,
        raw: "s3",
        replyTo: null,
        givenId: null,
        givenReferences: [],
        tempId: null,
        categoryId: null,
        binnedAt: null
    },
    {
        id: "3",
        mailboxId: demoMailboxId,
        subject: "New feature release: Email Categories", 
        snippet: "We've just launched email categories to help you organize better...",
        body: "You can now categorize your emails with custom labels and colors. Try it out and let us know what you think!",
        createdAt: new Date("2024-01-13T11:30:00"),
        updatedAt: new Date("2024-01-13T11:30:00"),
        isRead: false,
        isStarred: false,
        isSender: false,
        binnedAt: new Date("2024-01-13T11:30:00"),
        html: "<p>You can now categorize your emails with custom labels and colors. Try it out and let us know what you think!</p>",
        size: 890,
        raw: "s3",
        replyTo: null,
        givenId: null,
        givenReferences: [],
        tempId: null,
        categoryId: null,
        binnedAt: new Date("2024-01-13T11:30:00")
    },
    {
        id: "4", 
        mailboxId: demoMailboxId,
        subject: "Your Netflix subscription",
        snippet: "We're having trouble with your payment method",
        body: "Please update your payment information to continue enjoying Netflix.",
        createdAt: new Date("2024-01-12T16:45:00"),
        updatedAt: new Date("2024-01-12T16:45:00"),
        isRead: false,
        isStarred: false,
        isSender: false,
        html: "<p>Please update your payment information to continue enjoying Netflix.</p>",
        size: 456,
        raw: "s3",
        replyTo: null,
        givenId: null,
        givenReferences: [],
        tempId: null,
        categoryId: null,
        binnedAt: null
    },
    {
        id: "5",
        mailboxId: demoMailboxId,
        subject: "Coffee next week?",
        snippet: "Hey! Was wondering if you'd like to catch up over coffee...",
        body: "It's been ages since we caught up. Are you free next Tuesday around 2pm?",
        createdAt: new Date("2024-01-11T20:15:00"),
        updatedAt: new Date("2024-01-11T20:15:00"),
        isRead: true,
        isStarred: false,
        isSender: false,
        categoryId: "2",
        html: "<p>It's been ages since we caught up. Are you free next Tuesday around 2pm?</p>",
        size: 678,
        raw: "s3",
        replyTo: null,
        givenId: null,
        givenReferences: [],
        tempId: null,
        binnedAt: null
    },
    {
        id: "6",
        mailboxId: demoMailboxId,
        subject: "Your Amazon.com order #302-5839294-2940173",
        snippet: "Your package has been delivered!",
        body: "Your package was delivered at 2:30pm. How did we do?",
        createdAt: new Date("2024-01-10T14:30:00"),
        updatedAt: new Date("2024-01-10T14:30:00"),
        isRead: true,
        isStarred: false,
        isSender: false,
        html: "<p>Your package was delivered at 2:30pm. How did we do?</p>",
        size: 567,
        raw: "s3",
        replyTo: null,
        givenId: null,
        givenReferences: [],
        tempId: null,
        binnedAt: null
    },
    {
        id: "7",
        mailboxId: demoMailboxId,
        subject: "Try EmailThing Pro free for 30 days",
        snippet: "Unlock premium features with our Pro plan...",
        body: "Get access to unlimited categories, advanced filters, and priority support with EmailThing Pro!",
        createdAt: new Date("2024-01-09T10:00:00"),
        updatedAt: new Date("2024-01-09T10:00:00"),
        isRead: false,
        isStarred: false,
        isSender: false,
        html: "<p>Get access to unlimited categories, advanced filters, and priority support with EmailThing Pro!</p>",
        size: 789,
        raw: "s3",
        replyTo: null,
        givenId: null,
        givenReferences: [],
        tempId: null,
        categoryId: null,
        binnedAt: null
    },
    {
        id: "8",
        mailboxId: demoMailboxId,
        subject: "Team meeting notes - Jan 8",
        snippet: "Here are the key points from today's meeting...",
        body: "Action items:\n1. Update project timeline\n2. Schedule client review\n3. Prepare Q1 report",
        createdAt: new Date("2024-01-08T17:00:00"),
        updatedAt: new Date("2024-01-08T17:00:00"),
        isRead: true,
        isStarred: false,
        isSender: false,
        categoryId: "1",
        html: "<p>Action items:</p><ol><li>Update project timeline</li><li>Schedule client review</li><li>Prepare Q1 report</li></ol>",
        size: 890,
        raw: "s3",
        replyTo: null,
        givenId: null,
        givenReferences: [],
        tempId: null,
        binnedAt: null
    }
];

// Sent emails
export const demoSentEmails: DBEmail[] = [
    {
        id: "16",
        mailboxId: demoMailboxId,
        subject: "Re: Project Timeline",
        snippet: "Here's the updated timeline as discussed...",
        body: "Here's the updated timeline as discussed in our meeting.",
        createdAt: new Date("2024-01-16T10:00:00"),
        updatedAt: new Date("2024-01-16T10:00:00"),
        isRead: true,
        isStarred: false,
        isSender: true,
        categoryId: "2",
        html: "<p>Here's the updated timeline as discussed in our meeting.</p>",
        size: 768,
        raw: "s3",
        replyTo: null,
        givenId: null,
        givenReferences: [],
        tempId: null,
        binnedAt: null
    }
];

// Temp emails
export const demoTempEmails: DBEmail[] = [
    {
        id: "17",
        mailboxId: demoMailboxId,
        subject: "Suspicious Activity",
        snippet: "Suspicious login attempt detected...",
        body: "Suspicious login attempt detected from unknown device.",
        createdAt: new Date("2024-01-17T08:30:00"),
        updatedAt: new Date("2024-01-17T08:30:00"),
        isRead: false,
        isStarred: false,
        isSender: false,
        tempId: "temp1",
        html: "<p>Suspicious login attempt detected from unknown device.</p>",
        size: 256,
        raw: "s3",
        replyTo: null,
        givenId: null,
        givenReferences: [],
        categoryId: null,
        binnedAt: null
    }
];


// drafts
export const demoDrafts: DBEmailDraft[] = [
    {
        id: "18",
        mailboxId: demoMailboxId,
        subject: "Draft email",
        body: "This is a draft email",
        createdAt: new Date("2024-01-18T08:30:00"),
        updatedAt: new Date("2024-01-18T08:30:00"),
        to: [{
            name: "Test",
            address: "test@test.com",
            cc: false
        }],
        from: "me@emailthing.com",
        headers: [],
        cc: [],
        bcc: []
    }
];
