import { Outlet } from "react-router-dom";
import { useRemote } from "../../../shared/api/useRemote.js";
import RouteFeedback from "../../../shared/presentation/RouteFeedback.jsx";
import { FamilyContext } from "../application/familyContext.js";
export default function ParentLayout() {
  const result = useRemote("/api/parents/children");
  if (!result.data) return <RouteFeedback title="أطفالي" message={result.error?.message || "جاري تحميل حسابات الأطفال…"} retry={result.error ? result.reload : undefined} />;
  return <FamilyContext value={result}><Outlet /></FamilyContext>;
}
