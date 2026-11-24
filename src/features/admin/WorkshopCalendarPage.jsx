import { useNavigate, useSearchParams } from 'react-router-dom';
import WorkshopCalendar from '../../shared/calendar/WorkshopCalendar.jsx';
import { CATEGORIES } from '../platform/domain/navigation.js';
export default function WorkshopCalendarPage({ me }) {
  const [params, setParams] = useSearchParams(), navigate = useNavigate();
  const workspaces = me.workspaces.filter(w => w.active && w.modules.includes('workshops'));
  const workspace = workspaces.find(w => String(w.id) === params.get('workspace')) || workspaces[0];
  const category = Object.hasOwn(CATEGORIES.workshops, params.get('category')) ? params.get('category') : 'directorates';
  const scope = (key, value) => { const next = new URLSearchParams(); next.set('workspace', workspace.id); next.set('category', category); next.set(key, value); setParams(next); };
  if (!workspace) return <div className="cms-panel">لا توجد لوحة متاحة بقسم الورشات. أضف القسم إلى لوحة أو اطلب الوصول من الأدمن.</div>;
  return <div className="cms-panel"><div className="wm-admin-scope"><label>اللوحة<select value={workspace.id} onChange={e => scope('workspace', e.target.value)}>{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label><label>تصنيف الورشات<select value={category} onChange={e => scope('category', e.target.value)}>{Object.entries(CATEGORIES.workshops).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div><WorkshopCalendar workspaceId={workspace.id} category={category} title={`تقويم ${CATEGORIES.workshops[category]}`} onOpen={row => navigate(`/admin/content/${row.id}`)} onCreate={day => navigate(`/admin/content/new?${new URLSearchParams({ workspace: workspace.id, module: 'workshops', category, event_date: day })}`)} /></div>;
}
