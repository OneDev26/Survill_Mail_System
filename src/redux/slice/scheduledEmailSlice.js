import { collectionSlice } from "./collectionSlice";
import { scheduledActions } from "../thunks/scheduledEmailThunks";

export default collectionSlice("scheduled", scheduledActions);
