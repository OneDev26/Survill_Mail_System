import { directoryActions } from "../../redux/thunks/companyMailThunks";

export const workspaceTabConfig = {
  directory: {
    title: "Company Directory",
    description: "Find colleagues by name, department, and office.",
    actions: directoryActions,
    adminWrites: true,
    fields: [
      ["name", "Name"],
      ["title", "Job title"],
      ["department", "Department"],
      ["office", "Office"],
      ["email", "Email", "email"],
    ],
    editFields: [["office", "Office"]],
    columns: [
      ["name", "Name"],
      ["title", "Job title"],
      ["department", "Department"],
      ["office", "Office"],
      ["email", "Email"],
    ],
    filters: [
      ["department", "Department filter"],
      ["office", "Office filter"],
    ],
  },
};
