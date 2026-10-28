import { createContext, useContext } from "react";
export const CurriculumContext = createContext(null);
export const useCurriculum = () => useContext(CurriculumContext);
