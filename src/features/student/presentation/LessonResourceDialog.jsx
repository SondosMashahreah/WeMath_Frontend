import { useState } from "react";
import HexDialog from "../../account/presentation/HexDialog.jsx";
import { useRemote } from "../../../shared/api/useRemote.js";
import { safeExternalUrl } from "../../../shared/api/client.js";
function PolygonExplorer() {
  const [sides, setSides] = useState(6);
  const points = Array.from({ length: sides }, (_, i) => { const angle = i * Math.PI * 2 / sides - Math.PI / 2; return `${100 + Math.cos(angle) * 75},${100 + Math.sin(angle) * 75}`; }).join(" ");
  return <div className="polygon-explorer"><svg viewBox="0 0 200 200" role="img" aria-label={`شكل من ${sides} أضلاع`}><polygon points={points} /></svg>
    <label htmlFor="polygon-sides">عدد الأضلاع: {sides}</label><input id="polygon-sides" type="range" min="3" max="8" value={sides} onChange={event => setSides(Number(event.target.value))} /></div>;
}
function Practice({ resource }) {
  const [answer, setAnswer] = useState(null);
  return <div className="lesson-practice"><p>{resource.question}</p><div className="practice-choices">{resource.choices.map(choice => <button className="practice-hex" key={choice} aria-pressed={answer === choice} onClick={() => setAnswer(choice)}>{choice}</button>)}</div>
    {answer !== null && <p role="status">{answer === resource.answer ? "أحسنت! إجابتك صحيحة." : "حاول مرة أخرى، يمكنك مراجعة الدرس ثم الإجابة."}</p>}</div>;
}
export default function LessonResourceDialog({ lessonId, activity, title, onClose, readOnlyChildId, onVideoPlay }) {
  const path = readOnlyChildId ? `/api/parents/children/${readOnlyChildId}/lessons/${lessonId}` : `/api/learning/lessons/${lessonId}`;
  const { data, error, loading, reload } = useRemote(path);
  const resource = data?.resources.find(item => item.id === activity), videoUrl = safeExternalUrl(resource?.url);
  return <HexDialog onClose={onClose} title={title} subtitle={resource?.label || "موارد الدرس"}>
    {loading && <p role="status">جاري تحميل النشاط…</p>}{error && <div role="alert"><p>{error.message}</p><button className="student-secondary-button" onClick={reload}>إعادة المحاولة</button></div>}
    {resource && <div className="lesson-resource">{resource.demo && <span className="demo-badge">محتوى تجريبي</span>}<p>{resource.text}</p>
      {activity === "practice" && <Practice resource={resource} />}{activity === "game" && <PolygonExplorer />}
      {activity === "video" && videoUrl && <><video controls preload="metadata" src={videoUrl} onPlay={onVideoPlay}>متصفحك لا يدعم عرض الفيديو.</video><a href={videoUrl} target="_blank" rel="noopener noreferrer">فتح الفيديو في نافذة جديدة ↗</a></>}
      {activity === "learn" && <a className="student-secondary-button" href={safeExternalUrl(data.book.source_url)} target="_blank" rel="noopener noreferrer">افتح الكتاب واقرأ الدرس ↗</a>}
    </div>}
  </HexDialog>;
}
