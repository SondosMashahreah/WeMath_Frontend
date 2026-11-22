import { useState } from 'react';
import { cmsRequest } from './api.js';
export default function BankSave({ workspaceId, kind, payload, defaultTitle = '', onClose }) {
  const [title, setTitle] = useState(defaultTitle.slice(0, 180)), [grade, setGrade] = useState(''), [topic, setTopic] = useState(''), [difficulty, setDifficulty] = useState('medium'), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [saved, setSaved] = useState(false);
  async function save() {
    if (busy || saved) return;
    if (title.trim().length < 2) { setMessage('أدخل عنوانًا من حرفين على الأقل'); return; }
    setBusy(true); setMessage('');
    try { await cmsRequest('/api/cms/exams/bank', { method: 'POST', body: { workspace_id: workspaceId, kind, title, grade: grade ? Number(grade) : null, topic, difficulty, payload } }); setSaved(true); setMessage('تم الحفظ في البنك. تبقى هذه النسخة مستقلة عن تعديلات الامتحان.'); }
    catch (e) { setMessage(e.message); } finally { setBusy(false); }
  }
  return <section className="cms-bank-save" aria-label="حفظ في البنك"><h3>حفظ {({ question: 'السؤال', template: 'قالب التوليد', exam: 'الامتحان' })[kind]} في البنك</h3><label>عنوان في البنك<input value={title} maxLength={180} onChange={e => setTitle(e.target.value)} disabled={saved} /></label><div className="cms-grid two"><label>الصف<select value={grade} onChange={e => setGrade(e.target.value)} disabled={saved}><option value="">غير محدد</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label><label>الصعوبة<select value={difficulty} onChange={e => setDifficulty(e.target.value)} disabled={saved}><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select></label></div><label>الموضوع<input maxLength={150} value={topic} onChange={e => setTopic(e.target.value)} disabled={saved} placeholder="مثال: الكسور" /></label>{message && <p role={saved ? 'status' : 'alert'}>{message}</p>}<div className="cms-actions"><button type="button" disabled={busy || saved} onClick={save}>{busy ? 'جاري الحفظ…' : 'حفظ في البنك'}</button><button type="button" disabled={busy} onClick={onClose}>إغلاق</button></div></section>;
}
