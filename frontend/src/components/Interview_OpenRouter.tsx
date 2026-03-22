import { useState } from "react";
import Markdown from "marked-react";
import Lowlight from "react-lowlight";
import "../App.css";

import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import bash from "highlight.js/lib/languages/bash";
import "highlight.js/styles/night-owl.css";

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

export default function Interview_OpenRouter() {
  const [pending, setPending] = useState(false);
  const [prompt, setPrompt] = useState("");
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
      const res = await fetch("http://localhost:3000/openrouter/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      //// res.body ist ein ReadableStream.
      if (!res.body) throw new Error("Request failed");

      const { data: answer } = await res.json();

      const answerObject = JSON.parse(answer);
      const reasonsarray = answerObject.reasons;

      const output = `TRANSFORMATION:\n\n${answerObject.transformed}\n\nBEGRÜNDUNG:\n\n${JSON.stringify(reasonsarray)} `;

      setAiResponse(output);
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
      <div>Interview Agent (OpenRouter)</div>
      <form
        onSubmit={handleSubmit}
        className="flex w-full gap-2 items-end"
        inert={pending}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={"Insert the Interview summary..."}
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
