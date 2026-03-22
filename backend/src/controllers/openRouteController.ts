import type { RequestHandler } from "express";
import { SYSTEMPROMPT, ROUTER_MAINMODEL } from "#config";
import { OpenRouterClient } from "#client";
import { InterviewAgent } from "#client";
import { run, setDefaultOpenAIClient } from "@openai/agents";
import type { ChatMessage } from "#types";
import type { ChatDocument } from "#types";
import { Chat } from "#models";
import type OpenAI from "openai";

// ─── System-Prompt ────────────────────────────────────────────────────────────
// Der System-Prompt definiert die Persönlichkeit und Regeln des Assistenten.
// Er wird beim Start jedes neuen Chats als erste Nachricht in die History eingefügt
const systemPrompt = {
  role: "system",
  content: SYSTEMPROMPT,
};

//setDefaultOpenAIClient(OpenRouterClient);

export const openRouterStreamingResponse: RequestHandler = async (
  req,
  res,
  next,
) => {
  const { prompt, chatId } = req.body;

  console.log(prompt);

  // Chat laden oder neu erstellen
  let chat: ChatDocument;
  if (!chatId) {
    chat = await Chat.create({ history: [systemPrompt] });
  } else {
    chat = (await Chat.findById(chatId)) as ChatDocument;
  }

  // stream: true aktiviert den Streaming-Modus im OpenAI-Client.
  // Das Modell liefert die Antwort dann als AsyncIterator von Chunks
  // statt als einzelnes vollständiges Objekt.
  const result = await OpenRouterClient.chat.completions.create({
    model: ROUTER_MAINMODEL,
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

export const openRouterInterviewInput: RequestHandler = async (req, res) => {
  const { prompt } = req.body;

  try {
    const result = await run(InterviewAgent, prompt);
    console.log("RESULT", result);

    console.log(result.finalOutput);
    res.json({ data: JSON.stringify(result.finalOutput) });
  } catch (err) {
    console.log(err);
  }
};
