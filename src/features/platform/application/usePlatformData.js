import { useEffect, useState } from "react";
import { request } from "../infrastructure/client.js";

export function usePlatformData(path, teacher = false) {
  const [revision, setRevision] = useState(0);
  const key = `${path}:${teacher}:${revision}`;
  const [result, setResult] = useState({ key: "", data: null, error: null });
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    request(path, { teacher, signal: controller.signal })
      .then(data => setResult({ key, data, error: null }))
      .catch(error => { if (error.name !== "AbortError") setResult({ key, data: null, error }); });
    return () => controller.abort();
  }, [path, teacher, key]);
  return { data: result.key === key ? result.data : null, error: result.key === key ? result.error : null, retry: () => setRevision(v => v + 1) };
}
