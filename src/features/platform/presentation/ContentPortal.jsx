import { useState } from "react";
import { usePlatformData } from "../application/usePlatformData.js";
import { CATEGORIES, externalURL, hiveItem, PAGE_SIZE, pageControls, TITLES } from "../domain/navigation.js";
import { query } from "../infrastructure/client.js";
import HivePage from "./HivePage.jsx";
import LoadDialog from "./LoadDialog.jsx";
import PlatformDialog from "./PlatformDialog.jsx";
import PracticeActivity from "./PracticeActivity.jsx";

function EntryDetail({ entry, onClose }) {
  const source = externalURL(entry.source_url);
  return <PlatformDialog title={entry.title} subtitle={entry.summary} onClose={onClose} wide>
    {entry.is_demo && <p className="platform-demo">محتوى تجريبي — ليس إعلانًا أو خبرًا موثّقًا.</p>}
    {entry.event_date && <p>التاريخ: <time dateTime={entry.event_date}>{entry.event_date}</time>{entry.is_demo && " (للتجربة)"}</p>}
    <p className="platform-prose">{entry.body}</p>
    {source && <a className="student-secondary-button" href={source} target="_blank" rel="noopener noreferrer">فتح المصدر الخارجي ↗</a>}
    {entry.activity && <PracticeActivity activity={entry.activity} />}
  </PlatformDialog>;
}

function EntryList({ section, category, onBack }) {
  const [offset, setOffset] = useState(0), [archived, setArchived] = useState(false), [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null), [selected, setSelected] = useState(null);
  const [calendar, setCalendar] = useState(false), [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const privateArea = section === "teacher_resources";
  const path = privateArea ? "/api/platform/teachers/library" : "/api/platform/entries";
  const state = usePlatformData(`${path}?${query({ section, category, q: search, archived, offset, limit: PAGE_SIZE, month: calendar ? month : undefined })}`, privateArea);
  const title = calendar ? `تقويم ${month}` : `${CATEGORIES[section][category] || TITLES[section]}${archived ? " — الأرشيف" : ""}`;
  if (!state.data) return <LoadDialog state={state} onClose={onBack} />;
  const rows = state.data.items;
  const items = [...rows.map(row => hiveItem(row.id, row.title)), hiveItem("$search", search ? `بحث: ${search}` : "بحث"),
    ...(!privateArea ? [hiveItem("$archive", archived ? "المحتوى الحالي" : "الأرشيف")] : []),
    ...(section === "competitions" ? [hiveItem("$calendar", calendar ? "كل المواعيد" : "التقويم")] : []), ...pageControls(state.data.total, offset)];
  function select(id) {
    if (id === "$search") setDialog("search");
    else if (id === "$archive") { setArchived(v => !v); setOffset(0); }
    else if (id === "$calendar") { if (calendar) { setCalendar(false); setOffset(0); } else setDialog("calendar"); }
    else if (id === "$prev") setOffset(v => Math.max(0, v - PAGE_SIZE));
    else if (id === "$next") setOffset(v => v + PAGE_SIZE);
    else setSelected(rows.find(row => row.id === id));
  }
  return <HivePage title={title} hint={rows.length ? `${state.data.total} مادة؛ الوسط للرجوع` : "لا توجد نتائج. غيّر البحث أو ارجع من الوسط."} items={items} onSelect={select} onBack={onBack}>
    <p className="platform-status" role="status">{rows.length ? `${offset + 1}–${offset + rows.length} من ${state.data.total}` : "لا توجد نتائج لهذا الاختيار"}{calendar && <button onClick={() => setDialog("calendar")}>تغيير الشهر</button>}</p>
    {selected && <EntryDetail entry={selected} onClose={() => setSelected(null)} />}
    {dialog === "search" && <PlatformDialog title="البحث في المحتوى" onClose={() => setDialog(null)}><form className="platform-form" onSubmit={event => { event.preventDefault(); setSearch(new FormData(event.currentTarget).get("q").trim()); setOffset(0); setDialog(null); }}><label>كلمة البحث<input name="q" maxLength={100} defaultValue={search} autoFocus /></label><button className="student-primary-button">بحث</button><button className="student-secondary-button" type="button" onClick={() => { setSearch(""); setOffset(0); setDialog(null); }}>مسح البحث</button></form></PlatformDialog>}
    {dialog === "calendar" && <PlatformDialog title="تقويم المسابقات" subtitle="تواريخ النماذج الحالية تجريبية فقط." onClose={() => setDialog(null)}><form className="platform-form" onSubmit={event => { event.preventDefault(); setMonth(new FormData(event.currentTarget).get("month")); setCalendar(true); setOffset(0); setDialog(null); }}><label>الشهر<input type="month" name="month" min="1900-01" max="2199-12" required defaultValue={month} /></label><button className="student-primary-button">عرض المواعيد</button></form></PlatformDialog>}
  </HivePage>;
}

export default function ContentPortal({ section, onBack, initialCategory = null }) {
  const [category, setCategory] = useState(initialCategory);
  if (category) return <EntryList key={category} section={section} category={category} onBack={() => { if (initialCategory) onBack(); else setCategory(null); }} />;
  return <HivePage title={TITLES[section]} items={Object.entries(CATEGORIES[section]).map(([id, title]) => hiveItem(id, title))} onSelect={setCategory} onBack={onBack} />;
}
