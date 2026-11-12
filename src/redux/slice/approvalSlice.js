import { collectionSlice } from "./collectionSlice";
import { approvalActions } from "../thunks/approvalThunks";

export default collectionSlice("approvals", approvalActions);
