import HexDialog from "../../account/presentation/HexDialog.jsx";
import { useRemote } from "../../../shared/api/useRemote.js";
const formatDate = value => new Intl.DateTimeFormat("ar-PS", { dateStyle: "medium" }).format(new Date(value));
export default function ResultsDialog({ child, onClose }) {
  const { data, error, loading, reload } = useRemote(`/api/parents/children/${child.id}/results`);
  return <HexDialog wide title={`نتائج ${child.full_name}`} subtitle="النتائج منفصلة عن تقدّم الدروس، وستظهر هنا عند تفعيل الاختبارات الرسمية." onClose={onClose}>
    {loading && <p role="status">جاري تحميل النتائج…</p>}
    {error && <div role="alert"><p>{error.message}</p><button className="student-secondary-button" onClick={reload}>إعادة المحاولة</button></div>}
    {data && (!data.results.length ? <p className="progress-empty">لا توجد نتائج مسجّلة بعد.</p> : <ol className="progress-lessons">{data.results.map(result => <li key={result.id}><strong>{result.title}</strong><span>{result.score} / {result.max_score}</span><time dateTime={result.recorded_at}>{formatDate(result.recorded_at)}</time></li>)}</ol>)}
  </HexDialog>;
}
