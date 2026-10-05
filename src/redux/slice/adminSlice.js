import { createSlice } from "@reduxjs/toolkit";
import {
  defaultAdmin,
  validateRecord,
  deletionError,
} from "../../api/adminData";
const slice = createSlice({
  name: "admin",
  initialState: defaultAdmin,
  reducers: {
    adminChanged: {
      prepare(change) {
        return {
          payload: {
            ...change,
            eventId: crypto.randomUUID(),
            at: new Date().toISOString(),
          },
        };
      },
      reducer(state, { payload }) {
        const { kind, section, record, ids, values, eventId, at } = payload;
        let detail;
        if (kind === "save") {
          if (validateRecord(state, section, record)) return;
          const index = state[section].findIndex(
            (item) => item.id === record.id,
          );
          if (index < 0) state[section].push(record);
          else state[section][index] = record;
          detail = `${index < 0 ? "Created" : "Updated"} ${section}: ${record.email || record.name}`;
        } else if (
          ["userStatus", "resetPassword", "forceLogout"].includes(kind)
        ) {
          const user = state.users.find((item) => item.id === payload.id);
          if (!user) return;
          if (kind === "userStatus") {
            if (
              !["Active", "Suspended"].includes(payload.status) ||
              user.id === "owner"
            )
              return;
            user.status = payload.status;
            detail = `Changed user status to ${payload.status}: ${user.email}`;
          } else if (kind === "resetPassword") {
            user.passwordResetAt = at;
            detail = `Reset demo password: ${user.email}`;
          } else {
            user.forcedLogoutAt = at;
            detail = `Forced demo logout: ${user.email}`;
          }
        } else if (kind === "groupTest") {
          const group = state.groups.find((item) => item.id === payload.id);
          if (!group) return;
          group.lastTestedAt = at;
          detail = `Ran demo delivery test: ${group.email}`;
        } else if (
          ["domainVerify", "domainPrimary", "domainDkim"].includes(kind)
        ) {
          const domain = state.domains.find((item) => item.id === payload.id);
          if (!domain) return;
          if (kind === "domainVerify") {
            domain.status = "Verified";
            domain.verifiedAt = at;
            detail = `Verified domain: ${domain.name}`;
          } else if (kind === "domainPrimary") {
            for (const item of state.domains) item.primary = item.id === domain.id;
            detail = `Set primary domain: ${domain.name}`;
          } else {
            domain.dkimVersion = (domain.dkimVersion || 1) + 1;
            domain.dkimRotatedAt = at;
            detail = `Rotated DKIM key: ${domain.name}`;
          }
        } else if (kind === "delete") {
          if (!Array.isArray(ids) || deletionError(state, section, ids)) return;
          state[section] = state[section].filter(
            (item) => !ids.includes(item.id),
          );
          detail = `Deleted ${ids.length} ${section} record(s)`;
        } else if (kind === "settings") {
          if (!["organization", "security"].includes(section)) return;
          if (
            !Object.entries(defaultAdmin[section]).every(
              ([key, value]) => typeof values[key] === typeof value,
            )
          )
            return;
          if (
            section === "security" &&
            (!Number.isInteger(values.sessionMinutes) ||
              values.sessionMinutes < 5 ||
              values.sessionMinutes > 1440 ||
              !Number.isInteger(values.passwordLength) ||
              values.passwordLength < 8 ||
              values.passwordLength > 128 ||
              !Number.isInteger(values.retentionDays) ||
              values.retentionDays < 1 ||
              values.retentionDays > 3650)
          )
            return;
          state[section] = values;
          detail = `Updated ${section} configuration`;
        } else if (kind === "monitor") {
          detail = `Viewed message ${payload.messageId} in ${payload.mailbox}`;
        } else if (kind === "quarantine") {
          const item = state.quarantine.find((row) => row.id === payload.id);
          if (
            !item ||
            item.status !== "Held" ||
            !["Released", "Deleted"].includes(payload.status)
          )
            return;
          item.status = payload.status;
          detail = `${payload.status} demo quarantine message: ${item.subject}`;
        } else return;
        state.audit.unshift({
          id: eventId,
          at,
          actor: payload.actor,
          action: kind,
          detail,
        });
        state.audit = state.audit.slice(0, 1000);
      },
    },
  },
});
export const { adminChanged } = slice.actions;
export default slice.reducer;
