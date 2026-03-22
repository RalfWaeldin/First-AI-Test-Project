import { OpenAI } from "openai/client.js";
import {
  LLM_URL,
  OPENAI_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY,
  LLM_MODEL,
} from "#config";
/*
{
    // model: "gemini-3.1-flash-lite-preview",
    model: LLM_MODEL,
    // Bisherige History + neue Nutzernachricht
    messages: [...chat.history, { role: "user", content: prompt }],

    // temperature steuert die Kreativität/Zufälligkeit der Antworten.
    // 0 = deterministisch, 2 = sehr kreativ/chaotisch
    // temperature: 1.5,
    // max_completion_tokens: 200,  // Antwortlänge begrenzen, wird bei manchen Modellein abgeschnitten
    //reasoning_effort: "low", // Nur bei Reasoning-Modellen (z. B. o3)
    // nicht alle Properties sind auf allen Modellen verfügbar
  }
*/

// ChatMessage ist der offizielle OpenAI-Typ für eine einzelne Nachricht
// im Format { role: "user" | "assistant" | "system", content: "..." }
type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessage;

export function getChatCompletionOptions(
  chathistory: ChatMessage[],
  prompt: string,
) {
  if (LLM_URL && OPENAI_API_KEY) {
    // Lokales Modell via Ollama – kein API-Key erforderlich
    // Lokales LLM über Ollama (läuft auf Port 11434)
    console.log("Client as local LLM");
    const llmOptions = {
      model: LLM_MODEL,
      messages: [...chathistory, { role: "user", content: prompt }],
    };

    return llmOptions;
  } else if (OPENAI_API_KEY) {
    //Offizieller OpenAI-Dienst (Standard, kein baseURL nötig, sucht eigenständig nach einer OPENAI_API_KEY Umgebungsvariable)
    console.log("Client by OPENAI_API_KEY");
    const generalOptions = {
      //model: "gemini-3.1-flash-lite-preview",
      messages: [...chathistory, { role: "user", content: prompt }],
    };

    return generalOptions;
  } else if (GOOGLE_GENERATIVE_AI_API_KEY) {
    //Google Gemini über dessen OpenAI-kompatible API
    console.log("Client by Google Gemini OpenAI-compatible API");
    const geminiOptions = {
      model: "gemini-3.1-flash-lite-preview",
      messages: [...chathistory, { role: "user", content: prompt }],
    };

    return geminiOptions;
  }
  throw new Error("No valid OpenAI configuration found", {
    cause: { status: 404 },
  });
}
