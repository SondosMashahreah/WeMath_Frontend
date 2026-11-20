import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cmsRequest } from './api.js';
import { useCmsData } from './useCmsData.js';
import { Pager } from './Team.jsx';
export default function Legacy({ me }) {
  const [offset, setOffset] = useState(0), [q, setQ] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), navigate = useNavigate();
  const { data, loading, error: loadError } = useCmsData(`/api/cms/legacy?offset=${offset}&q=${encodeURIComponent(q)}`);
  async function adopt(e, entry) {
    e.preventDefault(); setBusy(true); setError('');
    try { const row = await cmsRequest('/api/cms/legacy/adopt', { method: 'POST', body: { entry_id: entry.id, workspace_id: Number(new FormData(e.currentTarget).get('workspace')) } }); navigate(`/admin/content/${row.id}`); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <><div className="cms-heading"><div><span className="cms-eyebrow">محتوى المنصة الحالي</span><h1>المحتوى السابق</h1><p>انقلي إدارة المواد الموجودة إلى إحدى اللوحات. روابطها الحالية تبقى كما هي.</p></div></div><section className="cms-panel"><input placeholder="ابحثي بعنوان المادة…" aria-label="بحث المحتوى السابق" value={q} onChange={e => { setQ(e.target.value); setOffset(0); }} />{(error || loadError) && <p role="alert" className="cms-error">{error || loadError}</p>}{loading && <p>جاري التحميل…</p>}{data?.items.map(row => <form className="cms-row cms-legacy-row" key={row.id} onSubmit={e => adopt(e, row)}><div><strong>{row.title}</strong><p className="cms-muted">{me.modules[row.module]?.label} · {row.published ? 'منشور' : 'غير منشور'}</p></div><select name="workspace" required aria-label={`لوحة ${row.title}`}><option value="">اختاري لوحة مناسبة</option>{me.workspaces.filter(w => w.modules.includes(row.module)).map(w => <option value={w.id} key={w.id}>{w.name}</option>)}</select><button disabled={busy}>إدارة المادة</button></form>)}{data && !data.total && <p className="cms-empty">لا توجد مواد سابقة غير مُدارة تطابق البحث.</p>}<Pager offset={offset} total={data?.total || 0} setOffset={setOffset} /></section></>;
}
