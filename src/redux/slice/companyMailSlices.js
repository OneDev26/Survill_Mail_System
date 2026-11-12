import { collectionSlice } from "./collectionSlice";
import { directoryActions } from "../thunks/companyMailThunks";

export const directory = collectionSlice("directory", directoryActions);
