import { useEffect, useState } from "react";
import { apiRequest } from "./client.js";
export function useRemote(path) {
  const [version, setVersion] = useState(0), [result, setResult] = useState(null);
  const key = `${path}:${version}`;
  useEffect(() => {
    const controller = new AbortController();
    if (path) apiRequest(path, { signal: controller.signal }).then(data => setResult({ key, data }))
      .catch(error => { if (error.name !== "AbortError") setResult({ key, error }); });
    return () => controller.abort();
  }, [path, key]);
  return { data: result?.key === key ? result.data : null, error: result?.key === key ? result.error : null,
    loading: Boolean(path) && result?.key !== key, reload: () => setVersion(v => v + 1) };
}
