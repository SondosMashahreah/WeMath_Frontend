import GamePlayer from "../../../shared/games/GamePlayer.jsx";
import MediaGallery from "../../../shared/media/MediaGallery.jsx";
import MathText from "../../../shared/exams/MathText.jsx";
import QuestionImage from "../../../shared/exams/QuestionImage.jsx";
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
function PublishedItem({ item, media, onVideoPlay }) {
  const [answers, setAnswers] = useState({}), [checked, setChecked] = useState(false);
  const url = safeExternalUrl(item.url);
  return <article className="cms-published-resource"><h3>{item.title}</h3><p style={{ whiteSpace: 'pre-wrap' }}>{item.text}</p>
    {url && <a href={url} target="_blank" rel="noopener noreferrer">فتح المورد ↗</a>}
    {media && url && <video controls preload="metadata" src={url} onPlay={onVideoPlay} />}
    {(item.attachments || []).map((link, i) => safeExternalUrl(link) && <p key={i}><a href={safeExternalUrl(link)} target="_blank" rel="noopener noreferrer">المرفق {i + 1} ↗</a></p>)}
    <MediaGallery items={item.media || []} />
    {item.game && <GamePlayer game={item.game} title={item.title} />}
    {item.questions?.length > 0 && <div><p>تدريب ذاتي — النتيجة هنا لا تُسجل كعلامة رسمية.</p>{item.questions.map((q, i) => <fieldset key={i}><legend>{i + 1}. <MathText>{q.prompt}</MathText> <small>({q.points || 1} علامة)</small></legend><QuestionImage question={q} />{q.options.map((option, j) => <label key={j} style={{ display: 'block' }}><input type="radio" name={`cms-${item.content_id}-${i}`} checked={answers[i] === j} onChange={() => { setAnswers({ ...answers, [i]: j }); setChecked(false); }} /> <MathText>{option}</MathText></label>)}{checked && <p role="status">{answers[i] === q.correct ? 'إجابة صحيحة' : `الإجابة الصحيحة: $<MathText>{q.options[q.correct]}</MathText>`} <MathText>{q.explanation}</MathText></p>}</fieldset>)}<span>{checked && <p role="status">العلامة: {item.questions.reduce((sum, q, i) => sum + (answers[i] === q.correct ? q.points || 1 : 0), 0)} / {item.questions.reduce((sum, q) => sum + (q.points || 1), 0)}</p>}</span><button className="student-primary-button" disabled={Object.keys(answers).length !== item.questions.length} onClick={() => setChecked(true)}>تحقق من الإجابات</button></div>}
  </article>;
}
export default function LessonResourceDialog({ lessonId, activity, title, onClose, readOnlyChildId, onVideoPlay }) {
  const path = readOnlyChildId ? `/api/parents/children/${readOnlyChildId}/lessons/${lessonId}` : `/api/learning/lessons/${lessonId}`;
  const { data, error, loading, reload } = useRemote(path);
  const resource = data?.resources.find(item => item.id === activity), mediaUrl = safeExternalUrl(resource?.url);
  const mediaActivity = activity === "film" || activity === "story_video";
  return <HexDialog onClose={onClose} title={title} subtitle={resource?.label || "موارد الدرس"}>
    {loading && <p role="status">جاري تحميل المورد…</p>}{error && <div role="alert"><p>{error.message}</p><button className="student-secondary-button" onClick={reload}>إعادة المحاولة</button></div>}
    {resource && <div className="lesson-resource">{resource.demo && <span className="demo-badge">محتوى تجريبي</span>}<p>{resource.text}</p>
      {resource.items?.map(item => <PublishedItem key={item.content_id} item={item} media={mediaActivity} onVideoPlay={onVideoPlay} />)}
      {activity === "game" && resource.demo && <PolygonExplorer />}
      {mediaActivity && mediaUrl && <><video controls preload="metadata" src={mediaUrl} onPlay={onVideoPlay}>متصفحك لا يدعم عرض الفيديو.</video><a href={mediaUrl} target="_blank" rel="noopener noreferrer">فتح المحتوى في نافذة جديدة ↗</a></>}
    </div>}
  </HexDialog>;
}
