import { collectionSlice } from "./collectionSlice";
import { sharedActions } from "../thunks/sharedMailboxThunks";

export default collectionSlice("shared", sharedActions);
