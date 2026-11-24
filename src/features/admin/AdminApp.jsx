import WorkshopCalendarPage from "./WorkshopCalendarPage.jsx";
import ExamBank from './ExamBank.jsx';
import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { cmsRequest, getAdminToken, setAdminToken } from './api.js';
import { useCmsData } from './useCmsData.js';
import ContentList from './ContentList.jsx';
import ContentEditor from './ContentEditor.jsx';
import Team, { Pager } from './Team.jsx';
import Legacy from './Legacy.jsx';
import './admin.css';
function AuditLog() {
  const [offset, setOffset] = useState(0), { data, error, loading } = useCmsData(`/api/cms/audit?offset=${offset}`);
  return <><div className="cms-heading"><div><span className="cms-eyebrow">متابعة العمل</span><h1>سجل العمليات</h1><p>من أضاف المحتوى، ومن راجعه ونشره.</p></div></div><div className="cms-panel">{loading && <p>جاري التحميل…</p>}{error && <p role="alert">{error}</p>}<div className="cms-table-wrap"><table><thead><tr><th>الشخص</th><th>العملية</th><th>السجل</th><th>الوقت</th></tr></thead><tbody>{data?.items.map(row => <tr key={row.id}><td>{row.actor}</td><td>{({ 'exam_bank.create': 'حفظ في بنك الاختبارات', 'exam_bank.archive': 'أرشفة عنصر من البنك', 'exam_bank.restore': 'استعادة عنصر من البنك', 'content.create': 'إضافة مادة', 'content.edit': 'تعديل مادة', 'content.review': 'إرسال للمراجعة', 'content.published': 'نشر مادة', 'content.archived': 'أرشفة مادة', 'content.draft': 'استعادة مسودة', 'workspace.save': 'حفظ لوحة', 'staff.create': 'إنشاء حساب', 'staff.update': 'تحديث حساب', 'content.adopt': 'إدارة محتوى سابق' })[row.action] || row.action}</td><td>{row.target}</td><td>{new Date(row.created_at).toLocaleString('ar')}</td></tr>)}</tbody></table></div><Pager offset={offset} total={data?.total || 0} size={50} setOffset={setOffset} /></div></>;
}
function ContentRoute({ me }) { const location = useLocation(); return <ContentEditor key={location.pathname + location.search} me={me} />; }
export default function AdminApp() {
  const [me, setMe] = useState(null), [loading, setLoading] = useState(() => Boolean(getAdminToken())), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => { const profile = await cmsRequest('/api/cms/me'); setMe(profile); }, []);
  useEffect(() => {
    const controller = new AbortController();
    if (getAdminToken()) cmsRequest('/api/cms/me', { signal: controller.signal }).then(setMe).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    const expired = () => { setMe(null); setError('انتهت الجلسة. سجّلي الدخول من جديد.'); };
    window.addEventListener('cms-expired', expired); document.title = 'WE MATH · إدارة المحتوى';
    return () => { controller.abort(); window.removeEventListener('cms-expired', expired); };
  }, []);
  async function login(e) {
    e.preventDefault(); setBusy(true); setError('');
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try { const session = await cmsRequest('/api/auth/login', { method: 'POST', body, token: null }); const profile = await cmsRequest('/api/cms/me', { token: session.access_token }); setAdminToken(session.access_token); setMe(profile); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function logout() {
    const token = getAdminToken(); setAdminToken(null); setMe(null); setError('');
    try { await cmsRequest('/api/auth/logout', { method: 'POST', token, signal: AbortSignal.timeout(8000) }); } catch { /* The local dashboard session is already cleared. */ }
  }
  if (loading) return <main className="cms-root cms-login" dir="rtl"><p>جاري تحميل لوحة الإدارة…</p></main>;
  if (!me) return <main className="cms-root cms-login" dir="rtl"><div className="cms-login-art"><span className="cms-brand" dir="ltr">WE MATH<span>CONTENT STUDIO</span></span><h1>المعرفة تبدأ<br />بمشاركة.</h1><p>مساحة واحدة لتنظيم محتوى المنصة،<br />وفريق كامل ليصنع أثرًا أكبر.</p><div className="cms-art-hex">W</div></div><form onSubmit={login} className="cms-login-form"><span className="cms-eyebrow">إدارة المنصة</span><h2>أهلًا بعودتك</h2><p>سجّلي الدخول بحساب الأدمن أو فريق إدخال البيانات.</p>{error && <p role="alert" className="cms-error">{error}</p>}<label>اسم المستخدم<input name="username" required autoComplete="username" dir="ltr" /></label><label>كلمة المرور<input name="password" required type="password" autoComplete="current-password" dir="ltr" /></label><button className="cms-primary" disabled={busy}>{busy ? 'جاري الدخول…' : 'الدخول إلى لوحة العمل ←'}</button><Link to="/">العودة إلى المنصة</Link></form></main>;
  return <div className="cms-root cms-shell" dir="rtl"><aside className="cms-sidebar"><Link className="cms-brand" dir="ltr" to="/admin">WE MATH<span>CONTENT STUDIO</span></Link><div className="cms-side-label">مساحة الإدارة</div><nav>{me.workspaces.some(w => w.active && w.modules.includes("workshops")) && <NavLink to="/admin/workshops">◷ <span>تقويم الورشات</span></NavLink>}<NavLink to="/admin" end>▦ <span>محتوى المنصة</span></NavLink>{(me.is_admin || me.workspaces.some(w => w.active && w.modules.includes('quiz'))) && <NavLink to="/admin/exam-bank">▤ <span>بنك الاختبارات</span></NavLink>}{me.is_admin && <><NavLink to="/admin/workspaces">◈ <span>اللوحات الفرعية</span></NavLink><NavLink to="/admin/team">♧ <span>فريق إدخال البيانات</span></NavLink><NavLink to="/admin/legacy">▤ <span>المحتوى السابق</span></NavLink><NavLink to="/admin/audit">◷ <span>سجل العمليات</span></NavLink></>}</nav><div className="cms-sidebar-note"><span>مساحة منظّمة، أثر أكبر</span><p>{me.is_admin ? 'أنت تديرين الأقسام والفِرق وصلاحيات النشر.' : 'تظهر هنا فقط اللوحات والأقسام المسندة إليك.'}</p></div><Link className="cms-back" to="/">↗ فتح المنصة</Link></aside><div className="cms-work"><header className="cms-topbar"><span>لوحة إدارة المحتوى <small>/ WE MATH</small></span><div className="cms-row"><span className="cms-avatar">{me.name?.slice(0, 1)}</span><strong>{me.name}</strong><button className="cms-quiet" onClick={logout}>تسجيل الخروج</button></div></header><main className="cms-main"><Routes><Route index element={<ContentList me={me} />} /><Route path="workshops" element={<WorkshopCalendarPage me={me} />} /><Route path="exam-bank" element={<ExamBank me={me} />} /><Route path="content/new" element={<ContentRoute me={me} />} /><Route path="content/:id" element={<ContentRoute me={me} />} /><Route path="team" element={<Team key="team" me={me} refresh={refresh} />} /><Route path="workspaces" element={<Team key="workspaces" me={me} refresh={refresh} workspaces />} />{me.is_admin && <><Route path="audit" element={<AuditLog />} /><Route path="legacy" element={<Legacy me={me} />} /></>}<Route path="*" element={<p>الصفحة غير متاحة. <Link to="/admin">العودة للوحة</Link></p>} /></Routes></main></div></div>;
}
