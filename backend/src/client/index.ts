import { OpenAI } from "openai";
import { z } from "zod";
import {
  Agent,
  setDefaultOpenAIClient,
  setTracingDisabled,
} from "@openai/agents";
import {
  LLM_URL,
  OPENAI_API_KEY,
  OPEN_ROUTER_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY,
  ROUTER_MAINMODEL,
  ROUTER_TRACING_DISABLED,
} from "#config";

function getOlamaClientFromEnv() {
  if (LLM_URL && OPENAI_API_KEY) {
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

function getOpenRouterClientFromEnv(): OpenAI {
  if (OPEN_ROUTER_API_KEY) {
    // Using open Router
    console.log("Client as OpenRouter");
    const orclient = new OpenAI({
      apiKey: OPEN_ROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
    setDefaultOpenAIClient(orclient);
    setTracingDisabled(ROUTER_TRACING_DISABLED);
    return orclient;
  }
  throw new Error("No valid Open Router configuration found", {
    cause: { status: 404 },
  });
}

function getInterviewAgent() {
  return new Agent({
    name: "Interview Handler",
    model: ROUTER_MAINMODEL,
    outputType: z.object({
      transformed: z.string(),
      reason: z.string(),
    }),
    instructions: `You provide assistance with interview text by anonymize personal information in it and output the transformed text as "transformed" key in the final output. The reason for the transformation should be added as key "reason" to the output`,
  });
}

export const OlamaClient = getOlamaClientFromEnv();
export const OpenRouterClient = getOpenRouterClientFromEnv();
export const InterviewAgent = getInterviewAgent();
