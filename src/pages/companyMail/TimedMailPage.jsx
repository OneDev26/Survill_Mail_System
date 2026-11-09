import WorkspaceTabPage from "./WorkspaceTabPage";
export default function TimedMailPage({ kind }) {
  return <WorkspaceTabPage key={kind} kind={kind} />;
}
