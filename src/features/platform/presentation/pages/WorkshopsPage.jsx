import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CATEGORIES, hiveItem } from '../../domain/navigation.js';
import { usePlatformData } from '../../application/usePlatformData.js';
import WorkshopCalendar from '../../../../shared/calendar/WorkshopCalendar.jsx';
import HivePage from '../HivePage.jsx';
import EntryDetail from '../EntryDetail.jsx';
import LoadDialog from '../LoadDialog.jsx';
import RouteFeedback from '../../../../shared/presentation/RouteFeedback.jsx';
export default function WorkshopsPage({ base = '/workshops', home = '/' }) {
  const { category, entryId } = useParams(), navigate = useNavigate(), location = useLocation();
  const valid = !category || Object.hasOwn(CATEGORIES.workshops, category);
  const detail = usePlatformData(valid && entryId ? `/api/platform/entries/${encodeURIComponent(entryId)}` : null);
  if (!valid) return <RouteFeedback back={base} />;
  if (!category) return <HivePage title="الورشات" hint="اختر الجهة لاستعراض تقويم ورشاتها" items={Object.entries(CATEGORIES.workshops).map(([id, title]) => hiveItem(id, title))} onSelect={id => navigate(`${base}/${id}`)} onBack={() => navigate(home)} />;
  const listURL = `${base}/${category}${location.search}`;
  return <main className="wm-workshops-page" dir="rtl"><div className="wm-workshops-container"><nav className="wm-breadcrumb" aria-label="مسار الورشات"><Link to={home}>الرئيسية</Link><span>/</span><Link to={base}>الورشات</Link><span>/</span><span>{CATEGORIES.workshops[category]}</span></nav><nav className="wm-category-tabs" aria-label="تصنيفات الورشات">{Object.entries(CATEGORIES.workshops).map(([key, label]) => <Link key={key} aria-current={category === key ? 'page' : undefined} to={`${base}/${key}`}>{label}</Link>)}</nav><WorkshopCalendar category={category} title={CATEGORIES.workshops[category]} onOpen={row => navigate(`${base}/${category}/${encodeURIComponent(row.id)}${location.search}`)} />
    {entryId && (!detail.data ? <LoadDialog state={detail} onClose={() => navigate(listURL)} /> : detail.data.section !== 'workshops' || detail.data.category !== category ? <RouteFeedback back={listURL} /> : <EntryDetail entry={detail.data} onClose={() => navigate(listURL)} />)}
  </div></main>;
}
