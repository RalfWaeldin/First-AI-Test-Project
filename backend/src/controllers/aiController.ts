import type { RequestHandler } from "express";
import { OpenAI } from "openai/client.js";
import mongoose from "mongoose";
import { LLM_URL, LLM_MODEL, SYSTEMPROMPT } from "#config";
import { OlamaClient } from "#client";
import type { ChatMessage } from "#types";
import type { ChatDocument } from "#types";
import { ChatSchema } from "#schemas";
import { Chat } from "#models";
//import { getClientByEnv, getChatCompletionOptions } from "#tools";

// ─── System-Prompt ────────────────────────────────────────────────────────────
// Der System-Prompt definiert die Persönlichkeit und Regeln des Assistenten.
// Er wird beim Start jedes neuen Chats als erste Nachricht in die History eingefügt
const systemPrompt = {
  role: "system",
  content: SYSTEMPROMPT,
};

// Hauptendpunkt für Chatnachrichten (ohne Streaming).
// Erwartet im Body: { prompt: string, chatId?: string }
//   - Ohne chatId: neuer Chat wird angelegt (inkl. System-Prompt)
//   - Mit chatId:  bestehender Chat wird aus der DB geladen
export const aiSimpleResonse: RequestHandler = async (req, res, next) => {
  const { prompt, chatId } = req.body;

  console.log("CHATID:", chatId);
  console.log("PROMPT:", prompt);

  // Chat laden oder neu erstellen
  let chat: ChatDocument;
  if (!chatId) {
    chat = await Chat.create({ history: [systemPrompt] });
  } else {
    chat = (await Chat.findById(chatId)) as ChatDocument;
  }

  console.log("CHAT:", chat);
  console.log("CHAT HISTORY", [
    ...chat.history,
    { role: "user", content: prompt },
  ]);

  // Anfrage an das LLM senden.
  // Die gesamte bisherige History wird mitgeschickt – so "erinnert" sich das
  // Modell an den Gesprächsverlauf (Kontext-Fenster-Prinzip).
  //const result = await client.chat.completions.create({
  // model: "gemini-3.1-flash-lite-preview",
  //  model: LLM_MODEL,
  // Bisherige History + neue Nutzernachricht
  //  messages: [...chat.history, { role: "user", content: prompt }],

  // temperature steuert die Kreativität/Zufälligkeit der Antworten.
  // 0 = deterministisch, 2 = sehr kreativ/chaotisch
  // temperature: 1.5,
  // max_completion_tokens: 200,  // Antwortlänge begrenzen, wird bei manchen Modellein abgeschnitten
  //reasoning_effort: "low", // Nur bei Reasoning-Modellen (z. B. o3)
  // nicht alle Properties sind auf allen Modellen verfügbar
  // });

  //const { model, messages } = getChatCompletionOptions(
  //  chat.history,
  //  prompt as string,
  //);
  //const result = await client.chat.completions.create({
  //  model: model,
  //  messages: messages,
  //});

  const result = await OlamaClient.chat.completions.create({
    model: LLM_MODEL,
    messages: [...chat.history, { role: "user", content: prompt }],
  });

  // Die Antwort des Modells aus dem Ergebnis extrahieren
  const answer = result.choices[0]?.message as ChatMessage;

  console.log("ANSWER", answer);

  // History aktualisieren: Nutzernachricht + Modellantwort anhängen
  chat.history = [
    ...chat.history,
    { role: "user", content: prompt } as unknown as ChatMessage,
    answer,
  ];
  // Aktualisierten Chat in der Datenbank speichern
  chat.save();

  // Antwort und chatId zurückschicken – die chatId wird vom Frontend
  // für Folgenachrichten im selben Gespräch benötigt.
  res.json({ answer, chatId: chat._id });
  next();
};

export const aiStreamingResponse: RequestHandler = async (req, res, next) => {
  const { prompt, chatId } = req.body;

  // Chat laden oder neu erstellen (identisch zu /messages)
  let chat: ChatDocument;
  if (!chatId) {
    chat = await Chat.create({ history: [systemPrompt] });
  } else {
    chat = (await Chat.findById(chatId)) as ChatDocument;
  }

  // stream: true aktiviert den Streaming-Modus im OpenAI-Client.
  // Das Modell liefert die Antwort dann als AsyncIterator von Chunks
  // statt als einzelnes vollständiges Objekt.
  const result = await OlamaClient.chat.completions.create({
    model: LLM_MODEL,
    messages: [...chat.history, { role: "user", content: prompt }],
    stream: true,
  });

  // SSE-Header setzen, bevor Daten gesendet werden.
  // - text/event-stream: Teilt dem Browser mit, dass es sich um einen SSE-Stream handelt
  // - keep-alive:        Hält die TCP-Verbindung offen, bis der Stream endet
  // - no-cache:          Verhindert, dass Proxies oder Browser die Antwort puffern
  res.writeHead(200, {
    "content-type": "text/event-stream",
    connection: "keep-alive",
    "cache-control": "no-cache",
  });

  // Sammelt die vollständige Antwort
  let answer = "";

  // Das LLM liefert die Antwort in kleinen Paketen (Chunks).
  // Jeder Chunk enthält ein oder wenige neue Token im delta.content-Feld.
  for await (const chunk of result) {
    const text = chunk.choices[0]?.delta.content;
    console.log(text);
    answer += text; // Token zur Gesamtantwort hinzufügen

    // Leere Chunks (z. B. das abschließende Stop-Signal) überspringen,
    // damit kein leeres Event an den Client geschickt wird.
    if (!text) continue;

    // SSE-Format: jede Nachricht beginnt mit "data: " und endet mit zwei Zeilenumbrüchen.
    // Das Frontend kann diese Events mit einem EventSource-Objekt empfangen.
    res.write(`data: ${JSON.stringify(text)}\n\n`);
  }

  // Nach dem Stream: vollständige History in der DB persistieren.
  // Erst jetzt ist die komplette Antwort bekannt.
  chat.history = [
    ...chat.history,
    { role: "user", content: prompt } as unknown as ChatMessage,
    { role: "assistant", content: answer } as unknown as ChatMessage,
  ];
  chat.save();

  // Die chatId wird als eigener SSE-Event-Typ ("chat:") am Ende geschickt,
  // damit das Frontend weiß, welche ID es für Folgenachrichten verwenden soll.
  res.write(`chat: ${JSON.stringify(chat._id)}\n\n`);

  // Stream serverseitig beenden
  res.end();

  // Sicherheitsnetz: falls der Client die Verbindung trennt bevor res.end()
  // aufgerufen wurde, wird der Stream trotzdem sauber geschlossen.
  res.on("close", () => {
    res.end();
  });
};

export const aiImageResponse: RequestHandler = async (req, res, next) => {};
