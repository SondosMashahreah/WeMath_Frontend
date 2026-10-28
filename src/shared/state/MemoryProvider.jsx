import { useCallback, useEffect, useMemo, useState } from "react";
import { MemoryContext } from "./memoryContext.js";
export default function MemoryProvider({ children }) {
  const [values, setValues] = useState({});
  useEffect(() => {
    const clearTeacher = () => setValues(previous => Object.fromEntries(Object.entries(previous).filter(([key]) => !key.startsWith("teacher:"))));
    window.addEventListener("wemath:teacher-signed-out", clearTeacher);
    return () => window.removeEventListener("wemath:teacher-signed-out", clearTeacher);
  }, []);
  const set = useCallback((key, next, initial) => setValues(previous => ({ ...previous, [key]: typeof next === "function" ? next(Object.hasOwn(previous, key) ? previous[key] : initial) : next })), []);
  const remove = useCallback(key => setValues(previous => Object.fromEntries(Object.entries(previous).filter(([name]) => name !== key))), []);
  const value = useMemo(() => ({ values, set, remove }), [values, set, remove]);
  return <MemoryContext value={value}>{children}</MemoryContext>;
}
