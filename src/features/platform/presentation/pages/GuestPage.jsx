import { useParams } from "react-router-dom";
import { usePlatformData } from "../../application/usePlatformData.js";
import { bookLabel, externalURL, hiveItem } from "../../domain/navigation.js";
import { usePageNavigation } from "../../../../shared/routing/usePageNavigation.js";
import RouteFeedback from "../../../../shared/presentation/RouteFeedback.jsx";
import HivePage from "../HivePage.jsx";
import LoadDialog from "../LoadDialog.jsx";
import PlatformDialog from "../PlatformDialog.jsx";
export default function GuestPage() {
  const state = usePlatformData("/api/platform/guest/catalog"), { grade: gradeId, bookId } = useParams(), { go, close } = usePageNavigation();
  const grade = Number(gradeId);
  if (!state.data) return <LoadDialog state={state} onClose={() => go("/")} />;
  const books = state.data.books.filter(book => book.grade === grade), selected = books.find(book => book.id === bookId), base = `/guest/grades/${grade}`;
  if (gradeId && (!Number.isInteger(grade) || !books.length) || bookId && !selected) return <RouteFeedback back="/guest" />;
  const items = gradeId ? books.map(book => hiveItem(book.id, bookLabel(book))) : [...new Set(state.data.books.map(book => book.grade))].map(value => hiveItem(value, `الصف ${value}`, { kind: "grade", number: value, lines: [String(value)] }));
  return <HivePage title={grade ? `معاينة الصف ${grade}` : "الزائر"} hint="معاينة للكتاب ودرس نموذجي دون حساب" items={items} onSelect={id => go(gradeId ? `${base}/books/${encodeURIComponent(id)}` : `/guest/grades/${id}`)} onBack={() => go(gradeId ? "/guest" : "/")}>
    {selected && <PlatformDialog title={selected.title} subtitle={bookLabel(selected)} onClose={() => close(base)}>
      <p className="platform-demo">معاينة فقط؛ لا يحفظ تقدم أو تنشأ حسابات هنا.</p>
      {selected.sample ? <><h3>{selected.sample.unit}</h3><p>درس نموذجي: {selected.sample.lesson}</p><p>افتح الكتاب واقرأ مثال الدرس، ثم حاول شرحه بطريقتك.</p></> : <p>لا يوجد درس نموذجي لهذا الكتاب.</p>}
      {externalURL(selected.source_url) && <a className="student-primary-button" href={externalURL(selected.source_url)} target="_blank" rel="noopener noreferrer">فتح الكتاب ↗</a>}
    </PlatformDialog>}
  </HivePage>;
}
