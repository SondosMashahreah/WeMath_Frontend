import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../../shared/api/client.js';
import { getAdminToken } from './api.js';
function Preview({ item }) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    const abort = new AbortController(); let url;
    fetch(`${API_BASE_URL}/api/cms/media/${encodeURIComponent(item.asset_id)}`, { signal: abort.signal, headers: { Authorization: `Bearer ${getAdminToken()}` } }).then(async response => {
      if (!response.ok) throw new Error('تعذر تحميل المعاينة');
      const blob = await response.blob(); if (abort.signal.aborted) return;
      url = URL.createObjectURL(blob); setResult({ id: item.asset_id, url });
    }).catch(e => { if (!abort.signal.aborted) setResult({ id: item.asset_id, error: e.message }); });
    return () => { abort.abort(); if (url) URL.revokeObjectURL(url); };
  }, [item.asset_id]);
  if (result?.id !== item.asset_id) return <p>تحميل المعاينة…</p>;
  if (result.error) return <p role="alert">{result.error}</p>;
  return item.kind === 'video' ? <video src={result.url} controls preload="metadata" /> : <img src={result.url} alt={item.alt || 'معاينة الصورة'} />;
}
export default function MediaEditor({ value = [], onChange, workspaceId, module, onBusy }) {
  const [busy, setBusy] = useState(false), [dragging, setDragging] = useState(false), [progress, setProgress] = useState(0), [error, setError] = useState(''), [localPreview, setLocalPreview] = useState(null);
  const uploading = useRef(false), active = useRef(null), mounted = useRef(true), input = useRef(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; active.current?.abort(); }; }, []);
  useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview.url); }, [localPreview]);
  const types = module === 'film' ? ['video/mp4', 'video/webm'] : module === 'worksheet' ? ['image/jpeg', 'image/png', 'image/webp'] : ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
  function upload(file) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest(); active.current = xhr;
      xhr.open('POST', `${API_BASE_URL}/api/cms/media?${new URLSearchParams({ workspace_id: workspaceId, module, filename: file.name })}`);
      xhr.setRequestHeader('Authorization', `Bearer ${getAdminToken()}`); xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.onprogress = e => { if (e.lengthComputable && mounted.current) setProgress(Math.round(e.loaded / e.total * 100)); };
      xhr.onload = () => { let body; try { body = JSON.parse(xhr.responseText); } catch { reject(new Error('تعذر قراءة نتيجة الرفع')); return; } if (xhr.status >= 200 && xhr.status < 300) resolve(body); else reject(new Error(typeof body.detail === 'string' ? body.detail : 'تعذر الرفع؛ تحقق من الجلسة والملف')); };
      xhr.onerror = () => reject(new Error('انقطع الاتصال أثناء الرفع. حاول مجددًا.'));
      xhr.onabort = () => reject(new Error('تم إلغاء الرفع.'));
      xhr.send(file);
    });
  }
  async function select(files) {
    if (uploading.current || !files.length) return;
    setError(''); setDragging(false);
    if (value.length + files.length > 20) { setError('الحد الأقصى 20 ملفًا في المادة'); return; }
    if (files.some(file => !types.includes(file.type) || file.size > (file.type.startsWith('video/') ? 64 : 8) * 1024 * 1024 || file.size === 0)) { setError('اختر النوع المدعوم: الصورة حتى 8 ميغابايت والفيديو حتى 64 ميغابايت، دون ملفات فارغة.'); return; }
    uploading.current = true; setBusy(true); onBusy(true); const added = [];
    try {
      for (const file of files) {
        setProgress(0); setLocalPreview({ url: URL.createObjectURL(file), kind: file.type.startsWith('video/') ? 'video' : 'image', name: file.name });
        const saved = await upload(file);
        added.push({ asset_id: saved.asset_id, kind: saved.kind, alt: '', caption: '' });
        if (!mounted.current) return;
      }
    } catch (e) { if (mounted.current) setError(e.message); }
    finally { uploading.current = false; if (mounted.current) { if (added.length) onChange([...value, ...added]); setBusy(false); onBusy(false); setLocalPreview(null); } }
  }
  const edit = (index, fields) => onChange(value.map((item, i) => i === index ? { ...item, ...fields } : item));
  function move(index, by) { const items = [...value]; [items[index], items[index + by]] = [items[index + by], items[index]]; onChange(items); }
  return <fieldset><legend>{module === 'film' ? 'رفع الفيلم ومعاينته' : 'الصور والوسائط'}</legend><p>اسحب الملفات هنا أو اخترها من جهازك. تظل خاصة بلوحتك حتى نشر المادة؛ احفظ المسودة بعد الرفع.</p><div className={`cms-media-drop ${dragging ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); select(Array.from(e.dataTransfer.files)); }}><strong>اسحب وأفلت {module === 'film' ? 'الفيديو' : module === 'worksheet' ? 'الصور' : 'الصور أو الفيديو'}</strong><small>{types.join('، ')} · الصور 8MB · الفيديو 64MB</small><input ref={input} type="file" multiple accept={types.join(',')} disabled={busy} aria-label="اختيار ملفات الوسائط" onChange={e => { select(Array.from(e.target.files)); e.target.value = ''; }} />{busy && <><progress max={100} value={progress} aria-label="تقدم الرفع" /><span role="status">جاري رفع {localPreview?.name} — {progress}%</span><button type="button" onClick={() => active.current?.abort()}>إلغاء الرفع</button></>}</div>{error && <p role="alert" className="cms-error">{error}</p>}{localPreview && <div className="cms-media-item"><p>معاينة الملف قبل اكتمال الرفع</p>{localPreview.kind === 'video' ? <video src={localPreview.url} controls /> : <img src={localPreview.url} alt="الملف المحدد" />}</div>}<fieldset disabled={busy}><legend>{value.length} ملف مرفق</legend>{value.map((item, i) => <section className="cms-media-item" key={item.asset_id}><div className="cms-actions"><strong>{item.kind === 'video' ? 'فيديو' : 'صورة'} {i + 1}</strong><button type="button" disabled={i === 0} onClick={() => move(i, -1)}>رفع الترتيب</button><button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)}>خفض الترتيب</button><button type="button" onClick={() => onChange(value.filter((_, at) => at !== i))}>إزالة من المادة</button></div><Preview item={item} />{item.kind === 'image' && <label>وصف الصورة (مطلوب للنشر)<input maxLength={300} value={item.alt} onChange={e => edit(i, { alt: e.target.value })} /></label>}<label>النص المصاحب<textarea maxLength={1000} value={item.caption} onChange={e => edit(i, { caption: e.target.value })} /></label></section>)}</fieldset></fieldset>;
}
