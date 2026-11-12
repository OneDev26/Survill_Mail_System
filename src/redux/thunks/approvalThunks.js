import { approvalsApi } from "../../api/approvals";
import { createApiThunk } from "./createApiThunk";

export const approvalActions = {
  fetch: createApiThunk("approvals/fetch", (_, { signal }) =>
    approvalsApi.list({ signal }),
  ),

  create: createApiThunk("approvals/create", (body, { getState }) => {
    const email = getState().auth.session?.email;
    if (!email) throw new Error("Sign in to request approval.");
    return approvalsApi.create({
      title: body.title,
      requester: email,
      details: body.details,
      amount: body.amount,
    });
  }),

  update: createApiThunk("approvals/update", ({ id, body }, { getState }) => {
    if (getState().auth.session?.role !== "admin")
      throw new Error("Only administrators can review approvals.");
    return approvalsApi.decide(id, body?.status);
  }),
};
