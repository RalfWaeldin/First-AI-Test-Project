import mongoose from "mongoose";
import type { ChatDocument } from "#types";

// Mongoose-Schema: history wird als Array von beliebigen Objekten gespeichert
// der Einfachheit halber
export const ChatSchema = new mongoose.Schema<ChatDocument>({
  history: {
    type: [Object],
    default: [],
  },
});
