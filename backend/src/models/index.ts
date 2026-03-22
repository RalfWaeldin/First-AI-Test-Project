import mongoose from "mongoose";
import { ChatSchema } from "#schemas";

// Mongoose-Modell für die "chats"-Collection in MongoDB
export const Chat = mongoose.model("chat", ChatSchema);
