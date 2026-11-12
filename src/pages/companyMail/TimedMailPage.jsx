import ScheduledMailPage from "./ScheduledMailPage";
import SnoozedMailPage from "./SnoozedMailPage";
export default function TimedMailPage({ kind }) {
  if (kind === "snoozed") return <SnoozedMailPage />;
  return <ScheduledMailPage />;
}
