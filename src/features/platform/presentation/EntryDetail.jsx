import { externalURL } from "../domain/navigation.js";
import PlatformDialog from "./PlatformDialog.jsx";
import PracticeActivity from "./PracticeActivity.jsx";
export default function EntryDetail({ entry, onClose }) {
  const source = externalURL(entry.source_url), details = entry.details || {};
  return <PlatformDialog title={entry.title} subtitle={entry.summary} onClose={onClose} wide>
    {entry.is_demo && <p className="platform-demo">محتوى تجريبي — ليس إعلانًا أو خبرًا موثّقًا.</p>}
    {entry.event_date && <p>التاريخ: <time dateTime={entry.event_date}>{entry.event_date}</time>{entry.is_demo && " (للتجربة)"}</p>}
    {entry.section === "competitions" && <dl className="competition-details">
      {details.organizer && <><dt>الجهة المنظمة</dt><dd>{details.organizer}</dd></>}
      {details.audience && <><dt>الفئة المستهدفة</dt><dd>{details.audience}</dd></>}
      {details.location && <><dt>المكان / النمط</dt><dd>{details.location}</dd></>}
      {details.registration_start && <><dt>بدء التسجيل</dt><dd>{details.registration_start}</dd></>}
      {details.registration_end && <><dt>نهاية التسجيل</dt><dd>{details.registration_end}</dd></>}
    </dl>}
    <p className="platform-prose">{entry.body}</p>
    {entry.section === "competitions" && details.examples?.length > 0 && <section><h3>أمثلة ومواد من دورات سابقة</h3><ul>{details.examples.map((example, index) => <li key={index}>{example}</li>)}</ul></section>}
    {entry.section === "competitions" && details.attachments?.length > 0 && <section><h3>المرفقات</h3><div className="platform-actions">{details.attachments.map((url, index) => <a key={url} className="student-secondary-button" href={externalURL(url) || undefined} target="_blank" rel="noopener noreferrer">مرفق {index + 1} ↗</a>)}</div></section>}
    {details.results && <p className="platform-prose"><strong>النتائج:</strong> {details.results}</p>}
    {source && <a className="student-secondary-button" href={source} target="_blank" rel="noopener noreferrer">فتح المصدر الخارجي ↗</a>}
    {entry.activity && <PracticeActivity activity={entry.activity} />}
  </PlatformDialog>;
}
