import { collectionSlice } from "./collectionSlice";
import { snoozedActions } from "../thunks/snoozedEmailThunks";

export default collectionSlice("snoozed", snoozedActions);
