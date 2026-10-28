import { createContext, useContext } from "react";
export const TeacherContext = createContext(null);
export const useTeacher = () => useContext(TeacherContext);
