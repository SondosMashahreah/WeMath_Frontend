import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCmsData } from './useCmsData.js';
import { cmsRequest } from './api.js';
import QuestionPreview from '../../shared/exams/QuestionPreview.jsx';
import MathGenerator from './MathGenerator.jsx';
const names = { question: 'سؤال', template: 'قالب توليد', exam: 'امتحان' };
export function BankBrowser({ workspaceId, onChoose, manage = false }) {
  const [kind, setKind] = useState(''), [q, setQ] = useState(''), [grade, setGrade] = useState(''), [difficulty, setDifficulty] = useState(''), [archived, setArchived] = useState(false), [offset, setOffset] = useState(0), [revision, setRevision] = useState(0), [error, setError] = useState(''), [busy, setBusy] = useState(false), [expanded, setExpanded] = useState(null);
  const params = new URLSearchParams({ workspace_id: workspaceId, q, archived, offset });
  if (kind) params.set('kind', kind); if (grade) params.set('grade', grade); if (difficulty) params.set('difficulty', difficulty);
  const { data, loading, error: loadError } = useCmsData(`/api/cms/exams/bank?${params}`, revision);
  const filter = (setter, value) => { setter(value); setOffset(0); setExpanded(null); };
  async function archive(row) {
    setBusy(true); setError('');
    try { await cmsRequest(`/api/cms/exams/bank/${row.id}`, { method: 'PATCH', body: { version: row.version, archived: !row.archived } }); setRevision(v => v + 1); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <section aria-label="محتويات بنك الاختبارات"><div className="cms-grid two"><label>بحث بالعنوان أو الموضوع<input maxLength={100} value={q} onChange={e => filter(setQ, e.target.value)} /></label><label>نوع العنصر<select value={kind} onChange={e => filter(setKind, e.target.value)}><option value="">الكل</option>{Object.entries(names).map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></label><label>الصف<select value={grade} onChange={e => filter(setGrade, e.target.value)}><option value="">كل الصفوف</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label><label>الصعوبة<select value={difficulty} onChange={e => filter(setDifficulty, e.target.value)}><option value="">الكل</option><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select></label></div>{manage && <label className="cms-inline-check"><input type="checkbox" checked={archived} onChange={e => filter(setArchived, e.target.checked)} />عرض الأرشيف</label>}{loading && <p role="status">جاري تحميل البنك…</p>}{(error || loadError) && <p role="alert" className="cms-error">{error || loadError}</p>}{!loading && data?.items.length === 0 && <p>لا توجد عناصر مطابقة. احفظ سؤالًا أو قالبًا أو امتحانًا من محرّر الامتحان.</p>}{data?.items.map(row => <article className="cms-bank-item" key={row.id}><div className="cms-row"><div><strong>{row.title}</strong><p>{names[row.kind]} · {row.grade ? `الصف ${row.grade}` : 'دون صف'} · {({ easy: 'سهل', medium: 'متوسط', hard: 'صعب' })[row.difficulty]} {row.topic && `· ${row.topic}`}</p></div><div className="cms-actions"><button type="button" onClick={() => setExpanded(expanded === row.id ? null : row.id)}>{expanded === row.id ? 'إخفاء' : 'معاينة'}</button>{!row.archived && <button type="button" disabled={busy || loading} onClick={() => onChoose(structuredClone(row))}>{row.kind === 'template' ? 'فتح المولّد' : 'استخدام نسخة'}</button>}{manage && <button type="button" disabled={busy || loading} onClick={() => archive(row)}>{row.archived ? 'استعادة' : 'أرشفة'}</button>}</div></div>{expanded === row.id && (row.kind === 'template' ? <div><p>{row.payload.prompt}</p><p>الإجابة: <bdi>{row.payload.answer}</bdi></p><p>الشروط: <bdi>{row.payload.constraints.join(' , ') || 'لا يوجد'}</bdi></p></div> : <div>{row.kind === 'exam' && <p>{row.payload.instructions}</p>}{(row.kind === 'exam' ? row.payload.questions : [row.payload]).map((question, i) => <QuestionPreview key={i} question={question} />)}</div>)}</article>)}<div className="cms-actions"><button type="button" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - 20))}>السابق</button><span>{data?.total || 0} عنصر</span><button type="button" disabled={loading || offset + 20 >= (data?.total || 0)} onClick={() => setOffset(offset + 20)}>التالي</button></div></section>;
}
export default function ExamBank({ me }) {
  const workspaces = me.workspaces.filter(w => w.active && (me.is_admin || w.modules.includes('quiz')));
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id || 0), [template, setTemplate] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function createDraft(row) {
    if (row.kind === 'template') { setTemplate(row); return; }
    setBusy(true); setError('');
    try {
      const content = await cmsRequest('/api/cms/content', { method: 'POST', body: { workspace_id: workspaceId, module: 'quiz', title: row.title, payload: { body: row.kind === 'exam' ? row.payload.instructions : '', questions: row.kind === 'exam' ? row.payload.questions : [row.payload] } } });
      navigate(`/admin/content/${content.id}`);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  if (!workspaces.length) return <p>بنك الاختبارات يحتاج لوحة بصلاحية الامتحانات.</p>;
  return <><div className="cms-heading"><div><span className="cms-eyebrow">مكتبة قابلة لإعادة الاستخدام</span><h1>بنك الاختبارات</h1><p>أسئلة، قوالب توليد، وامتحانات كاملة. استخدام نسخة ينشئ مسودة مستقلة؛ النشر يتم من محرّر الامتحان.</p></div></div><div className="cms-panel cms-editor"><label>اللوحة<select disabled={busy} value={workspaceId} onChange={e => { setWorkspaceId(Number(e.target.value)); setTemplate(null); }} >{workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>{error && <p role="alert">{error}</p>}<fieldset disabled={busy}><legend>عناصر اللوحة</legend><BankBrowser key={workspaceId} workspaceId={workspaceId} manage onChoose={createDraft} /></fieldset>{template && <MathGenerator key={`${workspaceId}-${template.id}`} workspaceId={workspaceId} initialTemplate={template.payload} remaining={30} onAdd={questions => createDraft({ kind: 'exam', title: template.title, payload: { instructions: '', questions } })} />}</div></>;
}
