import { externalURL } from "../domain/navigation.js";
import PlatformDialog from "./PlatformDialog.jsx";
import PracticeActivity from "./PracticeActivity.jsx";
export default function EntryDetail({ entry, onClose }) {
  const source = externalURL(entry.source_url);
  return <PlatformDialog title={entry.title} subtitle={entry.summary} onClose={onClose} wide>
    {entry.is_demo && <p className="platform-demo">محتوى تجريبي — ليس إعلانًا أو خبرًا موثّقًا.</p>}
    {entry.event_date && <p>التاريخ: <time dateTime={entry.event_date}>{entry.event_date}</time>{entry.is_demo && " (للتجربة)"}</p>}
    <p className="platform-prose">{entry.body}</p>
    {source && <a className="student-secondary-button" href={source} target="_blank" rel="noopener noreferrer">فتح المصدر الخارجي ↗</a>}
    {entry.activity && <PracticeActivity activity={entry.activity} />}
  </PlatformDialog>;
}
