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
export default function LessonResourceDialog({ lessonId, activity, title, onClose, readOnlyChildId, onVideoPlay }) {
  const path = readOnlyChildId ? `/api/parents/children/${readOnlyChildId}/lessons/${lessonId}` : `/api/learning/lessons/${lessonId}`;
  const { data, error, loading, reload } = useRemote(path);
  const resource = data?.resources.find(item => item.id === activity), mediaUrl = safeExternalUrl(resource?.url);
  const mediaActivity = activity === "film" || activity === "story_video";
  return <HexDialog onClose={onClose} title={title} subtitle={resource?.label || "موارد الدرس"}>
    {loading && <p role="status">جاري تحميل المورد…</p>}{error && <div role="alert"><p>{error.message}</p><button className="student-secondary-button" onClick={reload}>إعادة المحاولة</button></div>}
    {resource && <div className="lesson-resource">{resource.demo && <span className="demo-badge">محتوى تجريبي</span>}<p>{resource.text}</p>
      {activity === "game" && <PolygonExplorer />}
      {mediaActivity && mediaUrl && <><video controls preload="metadata" src={mediaUrl} onPlay={onVideoPlay}>متصفحك لا يدعم عرض الفيديو.</video><a href={mediaUrl} target="_blank" rel="noopener noreferrer">فتح المحتوى في نافذة جديدة ↗</a></>}
    </div>}
  </HexDialog>;
}
