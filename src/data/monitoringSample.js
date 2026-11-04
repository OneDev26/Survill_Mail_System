// Temporary, synthetic monitoring data. Replace through an admin API thunk when ready.
// Kept separate from real mail and authentication state; never sent to the backend.
const examples = [
  [
    "Quarterly planning meeting",
    "Please review the agenda before our planning meeting on Friday.",
    "Inbox",
    "Jordan Lee",
    "jordan@example.com",
  ],
  [
    "Project proposal approved",
    "The proposal is approved. Please share the next steps with the team.",
    "Sent",
    "Client Services",
    "client@example.com",
  ],
  [
    "November invoice",
    "Attached is the sample invoice for this month's services.",
    "Inbox",
    "Billing Team",
    "billing@example.com",
  ],
  [
    "Weekly progress update",
    "The first milestone is complete. We will review the remaining tasks tomorrow.",
    "Archive",
    "Project Team",
    "projects@example.com",
  ],
  [
    "New employee onboarding",
    "Welcome to the team. Your onboarding checklist is ready for review.",
    "Drafts",
    "People Team",
    "people@example.com",
  ],
  [
    "Unrecognized promotional offer",
    "This is a sample promotional message for the Spam folder preview.",
    "Spam",
    "Promotions",
    "offers@example.com",
  ],
  [
    "Meeting rescheduled",
    "The previous meeting invite has been replaced with an updated time.",
    "Trash",
    "Operations",
    "operations@example.com",
  ],
];
export const monitoringMailboxes = [
  { id: "sample-alex", name: "Alex Morgan", email: "alex@example.com" },
  { id: "sample-sophia", name: "Sophia Chen", email: "sophia@example.com" },
  { id: "sample-james", name: "James Wilson", email: "james@example.com" },
].map((box, mailboxIndex) => ({
  ...box,
  messages: examples.map(([subject, body, folder, sender, email], index) => ({
    id: `sample-${mailboxIndex}-${index}`,
    subject,
    body,
    folder,
    sender: folder === "Sent" || folder === "Drafts" ? box.name : sender,
    email: folder === "Sent" || folder === "Drafts" ? box.email : email,
    to: folder === "Sent" || folder === "Drafts" ? email : box.email,
    cc: "",
    bcc: "",
    unread: folder === "Inbox" && index === 0,
    starred: index === 0,
    date: new Date(
      Date.UTC(2026, 10, 3 - index, 10 - mailboxIndex, 30),
    ).toISOString(),
    attachments:
      index === 2
        ? [
            {
              name: "sample-invoice.txt",
              size: 128,
              content: "SAMPLE INVOICE\nFor interface demonstration only.",
            },
          ]
        : [],
  })),
}));
export const monitoringMessages = monitoringMailboxes.flatMap(
  (box) => box.messages,
);
