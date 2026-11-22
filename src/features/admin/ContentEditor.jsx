import ExamBuilder from './ExamBuilder.jsx';
import { flushSync } from "react-dom";
import { useEffect, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { cmsRequest } from './api.js';
import { useCmsData } from './useCmsData.js';
import { STATUS } from './constants.js';
const initial = { summary: '', body: '', source_url: '', lesson_id: '', category: '', event_date: '', organizer: '', audience: '', location: '', registration_start: '', registration_end: '', attachments: [], questions: [], results: '', examples: [] };
export default function ContentEditor({ me }) {
  const { id } = useParams(), [params] = useSearchParams(), navigate = useNavigate();
  const [form, setForm] = useState(() => id ? null : { title: '', workspace_id: Number(params.get('workspace')), module: params.get('module') || '', payload: { ...initial }, status: 'draft' }), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  const catalog = useCmsData('/api/curriculum/catalog');
  useEffect(() => {
    const controller = new AbortController();
    if (id) cmsRequest(`/api/cms/content/${id}`, { signal: controller.signal }).then(setForm).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [id, params]);
  useEffect(() => { const warn = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  const patch = values => { setForm(old => ({ ...old, ...values })); setDirty(true); setNotice(''); };
  const field = (name, value) => patch({ payload: { ...form.payload, [name]: value } });
  async function save(event) {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    try {
      const { title, workspace_id, module, payload, version } = form;
      const saved = await cmsRequest(id ? `/api/cms/content/${id}` : '/api/cms/content', { method: id ? 'PUT' : 'POST', body: { title, workspace_id, module, payload, ...(version ? { version } : {}) } });
      flushSync(() => { setForm(saved); setDirty(false); }); setNotice('تم حفظ المسودة. يمكنك إرسالها للمراجعة أو نشرها حسب صلاحيتك.');
      if (!id) navigate(`/admin/content/${saved.id}`, { replace: true });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function transition(status) {
    setBusy(true); setError('');
    try { setForm(await cmsRequest(`/api/cms/content/${id}/status`, { method: 'POST', body: { status, version: form.version } })); setNotice(`تم تغيير الحالة إلى: ${STATUS[status]}`); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  if (!form) return <div className="cms-panel">{error || 'جاري فتح النموذج…'}</div>;
  const config = me.modules[form.module], workspace = me.workspaces.find(w => w.id === form.workspace_id);
  if (!config || !workspace || (!me.is_admin && !workspace.modules.includes(form.module))) return <div role="alert" className="cms-panel">اختاري لوحة وقسمًا مسموحًا من <Link to="/admin">الرئيسية</Link>.</div>;
  const canPublish = me.is_admin || workspace.can_publish;
  const books = catalog.data?.books || [], chosenBook = books.find(b => b.units?.some(u => u.lessons?.some(l => l.id === form.payload.lesson_id)));
  return <>
    {blocker.state === "blocked" && <div role="alertdialog" aria-label="تغييرات غير محفوظة" className="cms-panel"><p>لديك تغييرات غير محفوظة. هل تريدين مغادرة النموذج؟</p><button onClick={() => blocker.reset()}>البقاء ومتابعة التحرير</button><button onClick={() => blocker.proceed()}>مغادرة دون حفظ</button></div>}
    <div className="cms-heading"><div><span className="cms-eyebrow">{workspace.name} / {config.label}</span><h1>{id ? 'تحرير المادة' : 'إضافة مادة جديدة'}</h1><p>ابدئي بنموذج فارغ. احفظي المسودة ثم أرسليها للمراجعة.</p></div><span className={`cms-badge ${form.status}`}>{STATUS[form.status]}</span></div>
    <form className="cms-panel cms-editor" onSubmit={save}>
      {error && <p role="alert" className="cms-error">{error}</p>}{notice && <p role="status" className="cms-success">{notice}</p>}
      <label>عنوان المادة *<input required minLength={2} maxLength={180} value={form.title} onChange={e => patch({ title: e.target.value })} placeholder="اكتبي عنوانًا واضحًا للمادة" /></label>
      {config.resource ? <div className="cms-grid two"><label>الكتاب والصف<select value={chosenBook?.id || ''} onChange={e => { const book = books.find(b => b.id === e.target.value); field('lesson_id', book?.units?.[0]?.lessons?.[0]?.id || ''); }}><option value="">اختاري الكتاب</option>{books.map(b => <option key={b.id} value={b.id}>الصف {b.grade} · {b.classification_label || ''} · {b.title}</option>)}</select></label><label>الدرس<select value={form.payload.lesson_id} onChange={e => field('lesson_id', e.target.value)}><option value="">اختاري الدرس</option>{chosenBook?.units?.map(u => <optgroup key={u.id} label={u.title}>{u.lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</optgroup>)}</select></label>{catalog.error && <p role="alert">تعذّر تحميل المنهاج: {catalog.error}</p>}</div> : <label>التصنيف<select value={form.payload.category} onChange={e => field('category', e.target.value)}><option value="">اختاري التصنيف</option>{Object.entries(config.categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
      <label>وصف مختصر<textarea rows={2} maxLength={500} value={form.payload.summary} onChange={e => field('summary', e.target.value)} placeholder="عن ماذا تتحدث هذه المادة؟" /></label>
      <label>التفاصيل / التعليمات<textarea rows={7} maxLength={30000} value={form.payload.body} onChange={e => field('body', e.target.value)} placeholder="أضيفي المحتوى والتعليمات هنا" /></label>
      <label>رابط المورد أو التسجيل (HTTPS)<input type="url" dir="ltr" value={form.payload.source_url} onChange={e => field('source_url', e.target.value)} placeholder="https://" /></label>
      <label>روابط المرفقات — رابط في كل سطر<textarea rows={3} dir="ltr" value={form.payload.attachments.join('\n')} onChange={e => field('attachments', e.target.value.split('\n'))} onBlur={() => field('attachments', form.payload.attachments.filter(Boolean))} placeholder="روابط PDF، مستندات أو ملفات منشورة" /></label>
      {['workshops', 'competitions'].includes(form.module) && <fieldset><legend>تفاصيل الموعد والتسجيل</legend><div className="cms-grid two">{[['event_date', 'تاريخ الفعالية', 'date'], ['registration_start', 'بداية التسجيل', 'date'], ['registration_end', 'نهاية التسجيل', 'date'], ['organizer', 'الجهة المنظمة'], ['audience', 'الفئة المستهدفة'], ['location', 'المكان']].map(([key, label, type]) => <label key={key}>{label}<input type={type || 'text'} value={form.payload[key] || ''} onChange={e => field(key, e.target.value)} /></label>)}</div>{form.module === 'competitions' && <label>رابط النتائج<input type="url" dir="ltr" value={form.payload.results} onChange={e => field('results', e.target.value)} /></label>}</fieldset>}
      {(form.module === 'quiz' || form.module === 'teacher_resources' && form.payload.category === 'questions') && <ExamBuilder questions={form.payload.questions} onChange={value => field('questions', value)} workspaceId={form.workspace_id} bankAllowed={me.is_admin || workspace.modules.includes('quiz')} title={form.title} instructions={form.payload.body} />}

      <div className="cms-actions"><button className="cms-primary" disabled={busy || form.status === 'archived'}>{busy ? 'جاري الحفظ…' : 'حفظ المسودة'}</button>{id && <><button type="button" disabled={busy || dirty || form.status === 'archived'} onClick={() => transition('review')}>إرسال للمراجعة</button>{canPublish && <><button type="button" disabled={busy || dirty} onClick={() => transition('published')}>نشر على المنصة</button><button type="button" disabled={busy || dirty} onClick={() => transition('archived')}>أرشفة وسحب من المنصة</button></>}{form.status === 'archived' && <button type="button" disabled={busy || dirty} onClick={() => transition('draft')}>استعادة كمسودة</button>}</>}</div>
      <p className="cms-muted">{dirty ? 'لديك تغييرات غير محفوظة. احفظي قبل مغادرة الصفحة.' : 'أي تعديل على مادة منشورة يبقى مسودة؛ النسخة المنشورة لا تتغير حتى تعيدي نشرها أو تسحبيها بالأرشفة.'}</p>
    </form>
  </>;
}
