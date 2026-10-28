import { useCallback, useEffect, useState } from "react";
import { learningRepository } from "../infrastructure/learningRepository.js";
export function useStudentProgress(lessonId, activity, readOnly) {
  const [notice, setNotice] = useState(null), [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!lessonId || readOnly) return;
    const controller = new AbortController();
    learningRepository.record(lessonId, activity && activity !== "video" ? activity : "opened", controller.signal)
      .catch(error => { if (!controller.signal.aborted) setNotice({ title: "لم يُحفظ التقدّم", text: error.message }); });
    return () => controller.abort();
  }, [lessonId, activity, readOnly]);
  const save = useCallback(async kind => {
    if (!lessonId || readOnly || saving) return;
    setSaving(true);
    try {
      await learningRepository.record(lessonId, kind);
      if (kind === "completed") setNotice({ title: "أحسنت!", text: "حُفظ إنجازك لهذا الدرس. يمكنك الرجوع إليه في أي وقت." });
    } catch (error) { setNotice({ title: "لم يُحفظ التقدّم", text: error.message }); }
    finally { setSaving(false); }
  }, [lessonId, readOnly, saving]);
  return { notice, save, dismiss: () => setNotice(null) };
}
