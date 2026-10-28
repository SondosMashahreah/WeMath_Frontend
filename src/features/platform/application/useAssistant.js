import { useEffect, useRef, useState } from "react";
import { request } from "../infrastructure/client.js";
import { useMemoryState } from "../../../shared/state/memoryContext.js";
export function useAssistant(mode) {
  const [turns, setTurns] = useMemoryState(`assistant:${mode}`, []);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function send(message, grade) {
    if (!message.trim() || busy) return false;
    const abort = new AbortController(); controller.current = abort; setBusy(true); setError("");
    try {
      const answer = await request("/api/platform/assistant", { method: "POST", body: { message: message.trim(), grade: grade ? Number(grade) : null }, signal: abort.signal });
      setTurns(previous => [...previous, { message, ...answer }].slice(-6)); return true;
    } catch (failure) { if (failure.name !== "AbortError") setError(failure.message); return false; }
    finally { if (!abort.signal.aborted) setBusy(false); }
  }
  return { turns, busy, error, send };
}
