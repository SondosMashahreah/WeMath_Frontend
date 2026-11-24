import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { cmsRequest } from '../../features/admin/api.js';
import { calendarFilters, dateLabel, MIN_MONTH, MAX_MONTH, monthDays, shiftMonth, todayInJerusalem } from './dates.js';
import './calendar.css';
const modes = { month: 'هذا الشهر', upcoming: 'اليوم والقادمة', past: 'السابقة', undated: 'دون موعد' };
const statuses = { draft: 'مسودة', review: 'قيد المراجعة', published: 'منشورة', archived: 'مسحوبة من النشر' };
export default function WorkshopCalendar({ category, title, workspaceId, onOpen, onCreate }) {
  const admin = workspaceId !== undefined;
  const [params, setParams] = useSearchParams(), filters = calendarFilters(params);
  const { month, day, mode, page, q, status } = filters;
  const [picker, setPicker] = useState(false), [revision, setRevision] = useState(0), [result, setResult] = useState(null);
  const request = new URLSearchParams({ category, month, mode, offset: (page - 1) * 20, q });
  if (day && mode === 'day') request.set('day', day);
  if (admin) { request.set('workspace_id', workspaceId); if (status) request.set('status', status); }
  const path = `${admin ? '/api/cms' : '/api/platform'}/workshops/calendar?${request}`;
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = admin ? cmsRequest : (url, opts) => apiRequest(url, { ...opts, auth: false });
    fetchData(path, { signal: controller.signal }).then(data => { if (!controller.signal.aborted) setResult({ path, revision, data }); }).catch(error => { if (!controller.signal.aborted) setResult({ path, revision, error: error.message }); });
    return () => controller.abort();
  }, [path, revision, admin]);
  const current = result?.path === path && result?.revision === revision ? result : null;
  const data = current?.data, today = data?.today || todayInJerusalem();
  const update = values => setParams(previous => { const next = new URLSearchParams(previous); for (const [key, value] of Object.entries(values)) value === '' || value == null ? next.delete(key) : next.set(key, value); return next; });
  const changeMonth = value => update({ month: value, day: '', view: 'month', page: 1 });
  const selectDay = value => update({ month: value.slice(0, 7), day: value, view: 'day', page: 1 });
  function keyboard(event, date) {
    const deltas = { ArrowLeft: 1, ArrowRight: -1, ArrowDown: 7, ArrowUp: -7 };
    if (!(event.key in deltas)) return;
    event.preventDefault();
    const cells = [...event.currentTarget.closest('.wm-calendar-days').querySelectorAll('button')];
    const next = cells[cells.findIndex(cell => cell.dataset.date === date) + deltas[event.key]];
    next?.focus();
  }
  return <section className="wm-workshops" dir="rtl" aria-label={`تقويم ${title}`}>
    <header className="wm-calendar-heading"><div><span className="wm-eyebrow">WE MATH / مساحة التعلّم</span><h1>{title}</h1><p>مواعيد تجمعنا، ومعرفة تكبر معنا.</p></div>{onCreate && <button type="button" className="wm-primary" onClick={() => onCreate(day || `${month}-01`)}>＋ إضافة ورشة</button>}</header>
    <form className="wm-calendar-search" key={q} onSubmit={event => { event.preventDefault(); update({ q: new FormData(event.currentTarget).get('search').trim(), page: 1 }); }}><label>ابحث عن ورشة<input name="search" defaultValue={q} maxLength={100} placeholder="عنوان الورشة…" /></label><button>بحث</button>{q && <button type="button" onClick={() => update({ q: '', page: 1 })}>مسح</button>}</form>
    {admin && <label className="wm-status-filter">حالة المحتوى<select value={status} onChange={e => update({ status: e.target.value, page: 1 })}><option value="">كل الحالات النشطة</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
    <div className="wm-calendar-layout"><div className="wm-calendar-card"><div className="wm-calendar-nav"><button type="button" aria-label="السنة السابقة" disabled={month.slice(0, 4) === '1900'} onClick={() => changeMonth(shiftMonth(month, -12))}>«</button><button type="button" aria-label="الشهر السابق" disabled={month === MIN_MONTH} onClick={() => changeMonth(shiftMonth(month, -1))}>‹</button><button type="button" className="wm-month-title" aria-expanded={picker} onClick={() => setPicker(v => !v)}>{dateLabel(`${month}-01`, { month: 'long', year: 'numeric' })} ▾</button><button type="button" aria-label="الشهر التالي" disabled={month === MAX_MONTH} onClick={() => changeMonth(shiftMonth(month, 1))}>›</button><button type="button" aria-label="السنة التالية" disabled={month.slice(0, 4) === '2199'} onClick={() => changeMonth(shiftMonth(month, 12))}>»</button></div>
      {picker && <div className="wm-date-picker"><label>السنة<select value={month.slice(0, 4)} onChange={e => changeMonth(`${e.target.value}-${month.slice(5)}`)}>{Array.from({ length: 300 }, (_, i) => <option key={i} value={1900 + i}>{1900 + i}</option>)}</select></label><div>{Array.from({ length: 12 }, (_, i) => { const m = `${month.slice(0, 4)}-${String(i + 1).padStart(2, '0')}`; return <button type="button" key={m} aria-pressed={m === month} onClick={() => { changeMonth(m); setPicker(false); }}>{dateLabel(`${m}-01`, { month: 'short' })}</button>; })}</div></div>}
      <div className="wm-weekdays" aria-hidden="true">{['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(label => <span key={label}>{label}</span>)}</div><div className="wm-calendar-days">{monthDays(month).map(date => { const count = data?.days[date] || 0, outside = !date.startsWith(month); return <button type="button" key={date} data-date={date} disabled={date.slice(0, 7) < MIN_MONTH || date.slice(0, 7) > MAX_MONTH} className={`${outside ? 'outside' : ''} ${date === today ? 'today' : ''} ${mode === 'day' && date === day ? 'selected' : ''}`} aria-pressed={mode === 'day' && date === day} aria-label={`${dateLabel(date)}${count ? `، ${count} ورشة` : ''}`} aria-current={date === today ? 'date' : undefined} onKeyDown={e => keyboard(e, date)} onClick={() => selectDay(date)}><span>{Number(date.slice(8))}</span>{count > 0 && <small className="wm-event-dot">{count > 99 ? '99+' : count}</small>}</button>; })}</div><footer className="wm-calendar-footer"><span>● يوم فيه ورشات{q ? ' مطابقة للبحث' : ''}</span><button type="button" onClick={() => selectDay(today)}>العودة لليوم</button></footer>
    </div><div className="wm-calendar-agenda"><nav className="wm-calendar-tabs" aria-label="فترة الورشات">{Object.entries(modes).map(([key, label]) => <button type="button" key={key} aria-pressed={mode === key} onClick={() => update({ view: key, day: '', page: 1 })}>{label} {data && <span>{data.counts[key]}</span>}</button>)}</nav><h2>{mode === 'day' ? dateLabel(day) : modes[mode]}</h2>{mode === 'undated' && <p>ورشات قديمة أو مسودات لم يُحدد موعدها بعد.</p>}{admin && <p className="wm-agenda-note">هذه بيانات المسودات؛ زوّار المنصة يرون آخر نسخة منشورة فقط.</p>}
      {!current && <p role="status">جاري تحميل الورشات…</p>}{current?.error && <div role="alert"><p>{current.error}</p><button type="button" onClick={() => setRevision(v => v + 1)}>إعادة المحاولة</button></div>}
      {data && <><p role="status" className="wm-result-count">{data.total} ورشة</p>{!data.items.length && <div className="wm-calendar-empty"><span>◇</span><h3>لا توجد ورشات لهذا الاختيار</h3><p>اختر يومًا آخر أو استعرض الورشات القادمة والسابقة.</p>{onCreate && <button type="button" onClick={() => onCreate(day || `${month}-01`)}>إضافة ورشة لهذا الموعد</button>}</div>}{data.items.map(item => <article className="wm-workshop-item" key={item.id}><div className="wm-workshop-date">{item.event_date ? <><strong>{Number(item.event_date.slice(8))}</strong><span>{dateLabel(item.event_date, { month: 'short', year: 'numeric' })}</span></> : <span>دون موعد</span>}</div><div><div className="wm-workshop-tags"><span>{item.event_date ? item.event_date < today ? 'سابقة' : item.event_date === today ? 'اليوم' : 'قادمة' : 'موعد لاحق'}</span>{admin && <span>{statuses[item.status]}</span>}{item.is_demo && <span>تجريبية</span>}</div><h3><button type="button" onClick={() => onOpen(item)}>{item.title}</button></h3>{item.summary && <p>{item.summary}</p>}{item.location && <small>المكان: {item.location}</small>}{item.organizer && <small>الجهة: {item.organizer}</small>}<button type="button" className="wm-open-workshop" onClick={() => onOpen(item)}>{admin ? 'فتح وتحرير' : 'تفاصيل الورشة'} ←</button></div></article>)}{(data.total > 20 || page > 1) && <div className="wm-calendar-pagination"><button type="button" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>السابق</button><span>{page} / {Math.max(1, Math.ceil(data.total / 20))}</span><button type="button" disabled={page * 20 >= data.total} onClick={() => update({ page: page + 1 })}>التالي</button></div>}</>}
    </div></div>
  </section>;
}
