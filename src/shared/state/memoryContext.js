import { createContext, useContext } from "react";
export const MemoryContext = createContext(null);
export function useMemoryState(key, initial) {
  const { values, set, remove } = useContext(MemoryContext);
  const value = Object.hasOwn(values, key) ? values[key] : initial;
  return [value, next => set(key, next, initial), () => remove(key)];
}
