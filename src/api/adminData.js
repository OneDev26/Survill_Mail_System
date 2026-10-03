export const adminSections = {
  users: {
    title: "Users",
    description: "Manage directory accounts, roles, and mailbox allocations.",
    singular: "user",
    fields: [
      ["name", "Full name"],
      ["email", "Email address", "email"],
      ["role", "Role", ["Member", "Administrator", "Super administrator"]],
      ["department", "Department"],
      ["quota", "Mailbox quota (GB)", "number"],
      ["status", "Status", ["Active", "Suspended"]],
    ],
  },
  domains: {
    title: "Domains",
    description: "Register domains and track the DNS setup checklist.",
    singular: "domain",
    fields: [["name", "Domain name"]],
  },
  groups: {
    title: "Groups",
    description: "Manage distribution lists and sender permissions.",
    singular: "group",
    fields: [
      ["name", "Group name"],
      ["email", "Group email", "email"],
      ["members", "Member emails (comma-separated)", "textarea"],
      [
        "access",
        "Who can send",
        ["Organization only", "Members only", "Anyone"],
      ],
    ],
  },
  aliases: {
    title: "Aliases",
    description: "Map alternate addresses to active directory mailboxes.",
    singular: "alias",
    fields: [
      ["email", "Alias address", "email"],
      ["target", "Mailbox address", "email"],
    ],
  },
  routing: {
    title: "Mail routing",
    description: "Design ordered rules. Delivery requires a mail backend.",
    singular: "rule",
    fields: [
      ["name", "Rule name"],
      [
        "match",
        "Match field",
        ["Sender domain", "Recipient", "Subject contains"],
      ],
      ["value", "Match value"],
      ["action", "Action", ["Quarantine", "Reject", "Forward"]],
      ["target", "Forward to (required for Forward)", "optional-email"],
      ["priority", "Priority", "number"],
      ["status", "Status", ["Enabled", "Disabled"]],
    ],
  },
  blocked: {
    title: "Sender controls",
    description: "Maintain organization-wide sender allow and block rules.",
    singular: "sender rule",
    fields: [
      ["name", "Email address or domain"],
      ["action", "Action", ["Block", "Allow"]],
      ["reason", "Reason"],
    ],
  },
};
export const defaultAdmin = {
  users: [
    {
      id: "owner",
      name: "Alex Morgan",
      email: "alex.morgan@studio.co",
      role: "Super administrator",
      department: "Operations",
      quota: 50,
      status: "Active",
    },
    {
      id: "sophia",
      name: "Sophia Chen",
      email: "sophia@studio.co",
      role: "Member",
      department: "Design",
      quota: 25,
      status: "Active",
    },
    {
      id: "james",
      name: "James Wilson",
      email: "james@studio.co",
      role: "Administrator",
      department: "Engineering",
      quota: 25,
      status: "Active",
    },
  ],
  domains: [
    { id: "studio", name: "studio.co", status: "Pending verification" },
  ],
  groups: [
    {
      id: "team",
      name: "Studio team",
      email: "team@studio.co",
      members: "alex.morgan@studio.co, sophia@studio.co",
      access: "Organization only",
    },
  ],
  aliases: [],
  routing: [],
  blocked: [],
  quarantine: [
    {
      id: "example",
      sender: "offer@example.net",
      recipient: "alex.morgan@studio.co",
      subject: "Example suspicious message",
      reason: "Demo spam classification",
      status: "Held",
    },
  ],
  organization: {
    name: "Studio",
    contact: "alex.morgan@studio.co",
    timezone: "Asia/Kolkata",
  },
  security: {
    requireMfa: true,
    externalForwarding: false,
    allowImap: true,
    allowPop: false,
    sessionMinutes: 60,
    passwordLength: 12,
    retentionDays: 365,
  },
  audit: [],
};
const emailPattern = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;
const domainPattern =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
export function validateRecord(state, section, record) {
  const config = adminSections[section];
  if (!config) return "Unknown directory section.";
  for (const [key, label, type] of config.fields) {
    const value = String(record[key] ?? "").trim();
    if (!value && type !== "optional-email") return `${label} is required.`;
    if (value.length > 2000) return `${label} is too long.`;
    if (
      (type === "email" || (type === "optional-email" && value)) &&
      !emailPattern.test(value)
    )
      return `${label} must be a valid email address.`;
    if (
      type === "number" &&
      (!Number.isInteger(Number(value)) ||
        Number(value) < 1 ||
        Number(value) > 10000)
    )
      return `${label} must be a whole number between 1 and 10000.`;
    if (Array.isArray(type) && !type.includes(value))
      return `${label} is invalid.`;
  }
  if (section === "domains" && !domainPattern.test(record.name))
    return "Enter a domain such as company.com, without https:// or a path.";
  const uniqueKey = ["users", "groups", "aliases"].includes(section)
    ? "email"
    : "name";
  if (
    state[section].some(
      (item) =>
        item.id !== record.id &&
        item[uniqueKey].toLowerCase() === record[uniqueKey].toLowerCase(),
    )
  )
    return "This entry already exists.";
  if (["users", "groups", "aliases"].includes(section)) {
    if (
      !state.domains.some(
        (domain) => domain.name === record.email.split("@")[1],
      )
    )
      return "Add the email domain to Domains first.";
    if (
      ["users", "groups", "aliases"].some((key) =>
        state[key].some(
          (item) =>
            !(key === section && item.id === record.id) &&
            item.email === record.email,
        ),
      )
    )
      return "This email address is already in use.";
  }
  if (
    section === "users" &&
    record.id === "owner" &&
    (record.status !== "Active" ||
      record.role !== "Super administrator" ||
      record.email !== "alex.morgan@studio.co")
  )
    return "The signed-in demo owner must remain active with the original address and super administrator role.";
  if (section === "users") {
    const original = state.users.find((item) => item.id === record.id);
    if (
      original &&
      original.email !== record.email &&
      (state.aliases.some((item) => item.target === original.email) ||
        state.groups.some((item) =>
          item.members
            .split(",")
            .map((email) => email.trim())
            .includes(original.email),
        ))
    )
      return "Remove group memberships and aliases before changing this address.";
  }
  if (
    section === "groups" &&
    record.members
      .split(",")
      .some(
        (email) =>
          !state.users.some(
            (user) => user.email === email.trim() && user.status === "Active",
          ),
      )
  )
    return "Each member must be an active user in the directory.";
  if (
    section === "aliases" &&
    !state.users.some(
      (user) => user.email === record.target && user.status === "Active",
    )
  )
    return "The target must be an active user in the directory.";
  if (
    section === "routing" &&
    record.action === "Forward" &&
    !emailPattern.test(record.target)
  )
    return "Enter a valid forwarding address.";
  if (
    section === "blocked" &&
    !emailPattern.test(record.name) &&
    !domainPattern.test(record.name)
  )
    return "Enter a valid sender email address or domain.";
  if (section === "domains") {
    const original = state.domains.find((item) => item.id === record.id);
    if (
      original &&
      original.name !== record.name &&
      [...state.users, ...state.groups, ...state.aliases].some(
        (item) => item.email.split("@")[1] === original.name,
      )
    )
      return "Remove this domain�s directory dependencies before renaming it.";
  }
  return "";
}
export function deletionError(state, section, ids) {
  if (!adminSections[section]) return "Unknown section.";
  if (section === "users" && ids.includes("owner"))
    return "The signed-in owner cannot be deleted.";
  if (section === "users") {
    const addresses = state.users
      .filter((user) => ids.includes(user.id))
      .map((user) => user.email);
    if (
      state.aliases.some((alias) => addresses.includes(alias.target)) ||
      state.groups.some((group) =>
        group.members
          .split(",")
          .some((email) => addresses.includes(email.trim())),
      )
    )
      return "Remove the selected users from groups and aliases before deleting them.";
  }
  if (section === "domains") {
    const names = state.domains
      .filter((domain) => ids.includes(domain.id))
      .map((domain) => domain.name);
    if (
      [...state.users, ...state.groups, ...state.aliases].some((item) =>
        names.includes(item.email.split("@")[1]),
      )
    )
      return "This domain is used by users, groups, or aliases. Remove those dependencies first.";
  }
  return "";
}
export function validAdmin(value) {
  if (!value || typeof value !== "object") return false;
  for (const [section, config] of Object.entries(adminSections)) {
    if (
      !Array.isArray(value[section]) ||
      !value[section].every(
        (row) =>
          row &&
          typeof row.id === "string" &&
          config.fields.every(([key, , type]) =>
            type === "number"
              ? Number.isInteger(row[key]) && row[key] >= 1 && row[key] <= 10000
              : typeof row[key] === "string" &&
                (!Array.isArray(type) || type.includes(row[key])),
          ),
      )
    )
      return false;
    if (
      new Set(value[section].map((row) => row.id)).size !==
      value[section].length
    )
      return false;
  }
  if (
    !value.users.some(
      (user) =>
        user.id === "owner" &&
        user.email === "alex.morgan@studio.co" &&
        user.role === "Super administrator" &&
        user.status === "Active",
    )
  )
    return false;
  return (
    Object.entries(defaultAdmin.security).every(
      ([key, item]) => typeof value.security?.[key] === typeof item,
    ) &&
    Object.keys(defaultAdmin.organization).every(
      (key) => typeof value.organization?.[key] === "string",
    ) &&
    Array.isArray(value.audit) &&
    value.audit.every((item) =>
      ["id", "at", "actor", "action", "detail"].every(
        (key) => typeof item[key] === "string",
      ),
    ) &&
    Array.isArray(value.quarantine) &&
    value.quarantine.every((item) =>
      ["id", "sender", "recipient", "subject", "reason", "status"].every(
        (key) => typeof item[key] === "string",
      ),
    )
  );
}
