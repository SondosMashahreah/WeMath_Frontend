import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../shared/api/client.js";
import { createCurriculumRepository } from "../infrastructure/apiCurriculumRepository.js";
import { CurriculumContext } from "./curriculumContext.js";
export default function CurriculumProvider({ children }) {
  const [result, setResult] = useState({ catalog: null, error: null }), [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/api/curriculum/catalog", { auth: false, signal: controller.signal }).then(catalog => {
      if (!catalog.books?.length) throw new Error("المنهاج غير متاح بعد.");
      if (!controller.signal.aborted) setResult({ catalog, error: null });
    }).catch(error => { if (!controller.signal.aborted) setResult({ catalog: null, error }); });
    return () => controller.abort();
  }, [version]);
  const repository = useMemo(() => result.catalog ? createCurriculumRepository(result.catalog.books) : null, [result.catalog]);
  const value = useMemo(() => ({ ...result, repository, retry: () => { setResult({ catalog: null, error: null }); setVersion(v => v + 1); } }), [result, repository]);
  return <CurriculumContext value={value}>{children}</CurriculumContext>;
}
