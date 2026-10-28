import { usePlatformData } from "../../application/usePlatformData.js";
import { hiveItem, PAGE_SIZE, pageControls } from "../../domain/navigation.js";
import { query } from "../../infrastructure/client.js";
import { documentPath, readListQuery } from "../../../../shared/routing/paths.js";
import { usePageNavigation, useQueryNavigation } from "../../../../shared/routing/usePageNavigation.js";
import HivePage from "../HivePage.jsx";
import LoadDialog from "../LoadDialog.jsx";
export default function TeacherDocumentsPage({ kind }) {
  const { go, location } = usePageNavigation(), { update } = useQueryNavigation(), { page, archived } = readListQuery(location.search);
  const offset = (page - 1) * PAGE_SIZE, base = documentPath(kind);
  const state = usePlatformData(`/api/platform/teachers/documents?${query({ kind, archived, offset, limit: PAGE_SIZE })}`, true);
  if (!state.data) return <LoadDialog state={state} onClose={() => go("/teachers")} />;
  const items = [...state.data.items.map(doc => hiveItem(doc.id, doc.title)), hiveItem("$new", kind === "plan" ? "تحضير جديد" : "اختبار جديد"), hiveItem("$archive", archived ? "الملفات الحالية" : "الأرشيف"), ...pageControls(state.data.total, offset)];
  function select(id) {
    if (id === "$new") go(`${base}/new`);
    else if (id === "$archive") update({ archived: !archived, page: 1 });
    else if (id === "$prev") update({ page: page - 1 });
    else if (id === "$next") update({ page: page + 1 });
    else go(documentPath(kind, id) + location.search);
  }
  return <HivePage title={`${kind === "plan" ? "تحضيراتي" : "اختباراتي"}${archived ? " — الأرشيف" : ""}`} items={items} onSelect={select} onBack={() => go("/teachers")}>
    {!state.data.total && <p className="platform-status" role="status">{archived ? "الأرشيف فارغ" : "ابدأ بإنشاء أول ملف لك"}</p>}
  </HivePage>;
}
