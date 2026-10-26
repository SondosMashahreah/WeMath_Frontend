import HexDialog from "../../account/presentation/HexDialog.jsx";
import { useRemote } from "../../../shared/api/useRemote.js";
const activities = { opened: "فتح الدرس", book: "فتح الكتاب", learn: "تعلّم", video: "فتح الفيديو", practice: "تدريب تجريبي", game: "استكشاف تجريبي", completed: "أنجز الدرس" };
const formatDate = value => new Intl.DateTimeFormat("ar-PS", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
export default function ProgressDialog({ path, name, onClose }) {
  const { data, error, loading, reload } = useRemote(path);
  return <HexDialog wide title={`تقدّم ${name}`} subtitle="الإنجاز يُسجّل عند اختيار الطالب «أنهيت الدرس»." onClose={onClose}>
    {loading && <p role="status">جاري تحميل التقدّم…</p>}{error && <div role="alert"><p>{error.message}</p><button className="student-secondary-button" onClick={reload}>إعادة المحاولة</button></div>}
    {data && <><div className="progress-summary"><div><strong>{data.visited}</strong><span>دروس بدأها</span></div><div><strong>{data.completed}</strong><span>دروس أنجزها</span></div></div>
      {!data.lessons.length ? <p className="progress-empty">ستظهر هنا الدروس والأنشطة بعد أن يبدأ الطالب رحلته.</p> : <ol className="progress-lessons">{data.lessons.map(lesson => <li key={lesson.lesson_id}>
        <strong>{lesson.lesson_title}</strong><span>الصف {lesson.grade} · {lesson.period_label} · {lesson.unit_title}</span>
        <span>{lesson.status === "completed" ? "✓ مكتمل" : "قيد التعلّم"} · آخر نشاط: {activities[lesson.last_activity] || lesson.last_activity}</span><time dateTime={lesson.updated_at}>{formatDate(lesson.updated_at)}</time>
      </li>)}</ol>}</>}
  </HexDialog>;
}
