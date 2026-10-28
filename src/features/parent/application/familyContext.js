import { createContext, useContext } from "react";
export const FamilyContext = createContext(null);
export const useFamily = () => useContext(FamilyContext);
