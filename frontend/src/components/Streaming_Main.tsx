import { useState } from "react";
import Markdown from "marked-react";
import Lowlight from "react-lowlight";
import "../App.css";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import bash from "highlight.js/lib/languages/bash";

Lowlight.registerLanguage("js", javascript);
Lowlight.registerLanguage("javascript", javascript);
Lowlight.registerLanguage("ts", typescript);
Lowlight.registerLanguage("typescript", typescript);
Lowlight.registerLanguage("bash", bash);

const renderer = {
  code(snippet, lang) {
    const usedLang = Lowlight.hasLanguage() ? lang : "bash";
    return (
      <Lowlight key={this.elementId} language={usedLang} value={snippet} />
    );
  },
};

export default function Streaming_Main() {
  const [pending, setPending] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [chatId, setChatId] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const handleSubmit = async (e) => {
    // Verhindert das Standard-Formularverhalten (Seite neu laden)
    e.preventDefault();
    // Vorherige Antwort zurücksetzen, damit die UI sofort leer wirkt
    setAiResponse("");

    try {
      setPending(true);

      // ── Streaming-Request ────────────────────────────────────────────────────
      // fetch() gibt die Response zurück, sobald die Header ankommen –
      // der Body ist zu diesem Zeitpunkt noch nicht vollständig übertragen.
      const res = await fetch("http://localhost:3000/ai/messages/streaming", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, chatId }),
      });

      //// res.body ist ein ReadableStream.
      if (!res.body) throw new Error("Request failed");

      // getReader() lässt uns den Stream auslesen
      const reader = res.body.getReader();

      //// TextDecoder wandelt die rohen Bytes (Uint8Array) aus dem Stream
      //// zurück in lesbaren UTF-8-Text.
      const decoder = new TextDecoder();

      //// ── Stream-Leseschleife ──────────────────────────────────────────────────
      //// Chunks kommen asynchron an – die Schleife wartet jeweils auf den nächsten.
      //// { done: true } signalisiert, dass der Server den Stream geschlossen hat.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        //  // Ein einzelner Chunk kann mehrere SSE-Nachrichten enthalten,
        //  // da das Netzwerk mehrere Events zusammenpuffern kann.
        //  // SSE-Events werden durch doppelte Zeilenumbrüche (\n\n) getrennt.
        const lines = chunk.split("\n\n");

        for (let line of lines) {
          if (line.startsWith("data: ")) {
            //      // "data: " (6 Zeichen) abschneiden, dann JSON parsen.
            //      // Der Server schickt jeden Token als JSON-String, z. B.: data: "Hallo"
            line = line.slice(6);
            const parsedText = JSON.parse(line);
            setAiResponse((p) => p + parsedText);
          } else if (line.startsWith("chat: ")) {
            line = line.slice(6);
            const parsedText = JSON.parse(line);
            setChatId(parsedText);
          }
        }
      }
    } catch (error) {
      console.error("Error ", error);
    } finally {
      setPending(false);
    }
  };

  const reset = () => {
    setAiResponse("");
    setPrompt("");
  };
  return (
    <main className="h-screen p-2 mx-auto w-5xl flex flex-col items-center">
      <div>Streaming Request</div>
      <form
        onSubmit={handleSubmit}
        className="flex w-full gap-2 items-end"
        inert={pending}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={"State your question..."}
          className="textarea textarea-primary flex-10/12 h-40 resize-none"
        />
        <div className="flex-2/12 flex flex-col gap-2">
          <button type="submit" className="btn btn-primary " disabled={pending}>
            {pending ? (
              <span className="loading loading-spinner" />
            ) : (
              <span>Send</span>
            )}
          </button>
          <button className="btn btn-secondary" type="reset" onClick={reset}>
            Clear
          </button>
        </div>
      </form>
      <div className="mockup-window border w-full my-4 flex-1 overflow-y-auto text-start px-4">
        <Markdown value={aiResponse} renderer={renderer} />
      </div>
    </main>
  );
}
