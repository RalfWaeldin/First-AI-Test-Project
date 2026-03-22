import { OpenAI } from "openai/client.js";
import {
  LLM_URL,
  OPENAI_API_KEY,
  OPEN_ROUTER_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY,
} from "#config";

export function getClientByEnv() {
  if (OPEN_ROUTER_API_KEY) {
    // Using open Router
    console.log("Client as OpenRouter");
    return new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: OPEN_ROUTER_API_KEY,
      //defaultHeaders: {
      //  'HTTP-Referer': '<YOUR_SITE_URL>', // Optional. Site URL for rankings on openrouter.ai.
      //  'X-OpenRouter-Title': '<YOUR_SITE_NAME>', // Optional. Site title for rankings on openrouter.ai.
      //},
    });
  } else if (LLM_URL && OPENAI_API_KEY) {
    // Lokales Modell via Ollama – kein API-Key erforderlich
    // Lokales LLM über Ollama (läuft auf Port 11434)
    console.log("Client as local LLM");
    return new OpenAI({
      baseURL: LLM_URL,
    });
  } else if (OPENAI_API_KEY) {
    //Offizieller OpenAI-Dienst (Standard, kein baseURL nötig, sucht eigenständig nach einer OPENAI_API_KEY Umgebungsvariable)
    console.log("Client by OPENAI_API_KEY");
    return new OpenAI();
  } else if (GOOGLE_GENERATIVE_AI_API_KEY) {
    //Google Gemini über dessen OpenAI-kompatible API
    console.log("Client by Google Gemini OpenAI-compatible API");
    return new OpenAI({
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
  }
  throw new Error("No valid OpenAI configuration found", {
    cause: { status: 404 },
  });
}
