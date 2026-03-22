import { OpenAI } from "openai/client.js";
import mongoose from "mongoose";

// ChatMessage ist der offizielle OpenAI-Typ für eine einzelne Nachricht
// im Format { role: "user" | "assistant" | "system", content: "..." }
export type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessage;

// ChatDocument erweitert das Mongoose-Dokument um ein history-Array,
// das den gesamten Gesprächsverlauf eines Chats enthält.
export interface ChatDocument extends mongoose.Document {
  history: ChatMessage[];
}
