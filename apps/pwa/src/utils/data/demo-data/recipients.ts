import { DBEmailRecipient } from "../types";

export const demoEmailRecipients: DBEmailRecipient[] = [
    {
        id: "rec1", 
        emailId: "1",
        name: "You",
        address: "demo@emailthing.app",
        cc: 0,
    },
    {
        id: "rec2",
        emailId: "2", 
        name: "Google Security",
        address: "security@google.com",
        cc: 0,
    },
    {
        id: "rec3",
        emailId: "3",
        name: "EmailThing Updates",
        address: "updates@emailthing.app", 
        cc: 0,
    },
    {
        id: "rec4",
        emailId: "4",
        name: "Microsoft",
        address: "windows@microsoft.com",
        cc: 0,
    },
    {
        id: "rec5", 
        emailId: "5",
        name: "Sarah Wilson",
        address: "sarah.w@example.com",
        cc: 0,
    },
    {
        id: "rec6",
        emailId: "6",
        name: "Amazon.com",
        address: "auto-confirm@amazon.com",
        cc: 0,
    },
    {
        id: "rec7",
        emailId: "7", 
        name: "EmailThing Pro",
        address: "pro@emailthing.com",
        cc: 0,
    },
    {
        id: "rec8",
        emailId: "8",
        name: "Team Lead",
        address: "lead@company.com",
        cc: 0,
    },
    {
        id: "rec9",
        emailId: "9",
        name: "RiskyMH",
        address: "risky@emailthing.app",
        cc: 0,
    },
    {
        id: "rec10",
        emailId: "16",
        name: "Project Team",
        address: "team@company.com", 
        cc: 0,
    },
    {
        id: "rec11",
        emailId: "16",
        name: "Manager",
        address: "manager@company.com",
        cc: 1,
    },
    {
        id: "rec12",
        emailId: "17",
        name: "Security Alert",
        address: "security@emailthing.xyz",
        cc: 0,
    }
];