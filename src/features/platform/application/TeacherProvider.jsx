import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { request, teacherLogout, teacherToken } from "../infrastructure/client.js";
import { TeacherContext } from "./teacherContext.js";
export default function TeacherProvider({ children }) {
  const [session, setSession] = useState({ user: null, loading: true, error: null });
  const pending = useRef(null), generation = useRef(0);
  const restore = useCallback(() => {
    pending.current?.abort(); const controller = new AbortController(); pending.current = controller;
    const result = teacherToken() ? request("/api/platform/teachers/me", { teacher: true, signal: controller.signal }) : Promise.resolve(null);
    result.then(user => { if (!controller.signal.aborted) setSession({ user, loading: false, error: null }); })
      .catch(error => { if (!controller.signal.aborted) setSession({ user: null, loading: false, error: teacherToken() ? error : null }); });
  }, []);
  const accept = useCallback(user => { generation.current += 1; pending.current?.abort(); setSession({ user, loading: false, error: null }); }, []);
  const clear = useCallback(() => { generation.current += 1; pending.current?.abort(); setSession({ user: null, loading: false, error: null }); window.dispatchEvent(new Event("wemath:teacher-signed-out")); }, []);
  const logout = useCallback(async () => { const started = generation.current; try { await teacherLogout(); } finally { if (started === generation.current) clear(); } }, [clear]);
  useEffect(() => { restore(); return () => pending.current?.abort(); }, [restore]);
  useEffect(() => { window.addEventListener("wemath:teacher-expired", clear); return () => window.removeEventListener("wemath:teacher-expired", clear); }, [clear]);
  const value = useMemo(() => ({ ...session, accept, logout, restore }), [session, accept, logout, restore]);
  return <TeacherContext value={value}>{children}</TeacherContext>;
}
