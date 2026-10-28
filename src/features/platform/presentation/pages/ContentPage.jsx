import { CATEGORIES, hiveItem, pageControls, TITLES } from "../../domain/navigation.js";
import { useContentRoute } from "../../application/useContentRoute.js";
import { usePageNavigation } from "../../../../shared/routing/usePageNavigation.js";
import { contentPath } from "../../../../shared/routing/paths.js";
import RouteFeedback from "../../../../shared/presentation/RouteFeedback.jsx";
import HivePage from "../HivePage.jsx";
import LoadDialog from "../LoadDialog.jsx";
import PlatformDialog from "../PlatformDialog.jsx";
import EntryDetail from "../EntryDetail.jsx";
export default function ContentPage({ section, base = `/${section}`, home = "/" }) {
  const { category, entryId, filters, offset, valid, list, detail, privateArea, update } = useContentRoute(section);
  const { go, close, location } = usePageNavigation();
  if (!valid) return <RouteFeedback back={base} />;
  if (!category) return <HivePage title={TITLES[section]} items={Object.entries(CATEGORIES[section]).map(([id, title]) => hiveItem(id, title))} onSelect={id => go(contentPath(base, id))} onBack={() => go(home)} />;
  const listURL = contentPath(base, category) + location.search;
  if (!list.data) return <LoadDialog state={list} onClose={() => go(base)} />;
  if (entryId && !detail.data) return <LoadDialog state={detail} onClose={() => close(listURL)} />;
  if (entryId && (detail.data.section !== section || detail.data.category !== category)) return <RouteFeedback back={contentPath(base, category)} />;
  const rows = list.data.items, title = filters.month ? `تقويم ${filters.month}` : `${CATEGORIES[section][category]}${filters.archived ? " — الأرشيف" : ""}`;
  const items = [...rows.map(row => hiveItem(row.id, row.title)), hiveItem("$search", filters.q ? `بحث: ${filters.q}` : "بحث"), ...(!privateArea ? [hiveItem("$archive", filters.archived ? "المحتوى الحالي" : "الأرشيف")] : []), ...(section === "competitions" ? [hiveItem("$calendar", filters.month ? "كل المواعيد" : "التقويم")] : []), ...pageControls(list.data.total, offset)];
  function select(id) {
    if (id === "$search") update({ panel: "search" });
    else if (id === "$archive") update({ archived: !filters.archived, page: 1 });
    else if (id === "$calendar") update(filters.month ? { month: null, page: 1 } : { panel: "calendar" });
    else if (id === "$prev") update({ page: Math.max(1, filters.page - 1) });
    else if (id === "$next") update({ page: filters.page + 1 });
    else go(contentPath(base, category, id) + location.search);
  }
  return <HivePage title={title} hint={rows.length ? `${list.data.total} مادة؛ الوسط للرجوع` : "لا توجد نتائج. غيّر البحث أو ارجع من الوسط."} items={items} onSelect={select} onBack={() => go(base)}>
    <p className="platform-status" role="status">{rows.length ? `${offset + 1}–${offset + rows.length} من ${list.data.total}` : "لا توجد نتائج لهذا الاختيار"}{filters.month && <button onClick={() => update({ panel: "calendar" })}>تغيير الشهر</button>}</p>
    {entryId && <EntryDetail key={entryId} entry={detail.data} onClose={() => close(listURL)} />}
    {filters.panel === "search" && <PlatformDialog title="البحث في المحتوى" onClose={() => update({ panel: null }, true)}><form className="platform-form" onSubmit={event => { event.preventDefault(); update({ q: new FormData(event.currentTarget).get("q").trim(), page: 1, panel: null }, true); }}><label>كلمة البحث<input name="q" maxLength={100} defaultValue={filters.q} autoFocus /></label><button className="student-primary-button">بحث</button><button className="student-secondary-button" type="button" onClick={() => update({ q: null, page: 1, panel: null }, true)}>مسح البحث</button></form></PlatformDialog>}
    {filters.panel === "calendar" && section === "competitions" && <PlatformDialog title="تقويم المسابقات" subtitle="تواريخ النماذج الحالية تجريبية فقط." onClose={() => update({ panel: null }, true)}><form className="platform-form" onSubmit={event => { event.preventDefault(); update({ month: new FormData(event.currentTarget).get("month"), page: 1, panel: null }, true); }}><label>الشهر<input type="month" name="month" min="1900-01" max="2199-12" required defaultValue={filters.month || new Date().toISOString().slice(0, 7)} /></label><button className="student-primary-button">عرض المواعيد</button></form></PlatformDialog>}
  </HivePage>;
}
