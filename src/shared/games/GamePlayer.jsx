import { useEffect, useRef, useState } from 'react';
import MathText from '../exams/MathText.jsx';
import { KINDS, numeric, shuffled, validateGame } from './model.js';
import './games.css';

function Prompt({ item }) { return <div className="wm-game-prompt"><MathText>{item.prompt}</MathText>{item.image_url && <img src={item.image_url} alt={item.image_alt} loading="lazy" referrerPolicy="no-referrer" />}</div>; }
function Choices({ item, answer }) { return <div className="wm-game-options">{item.options.map((text, i) => <button type="button" key={i} onClick={() => answer(i === item.correct)}><MathText>{text}</MathText></button>)}</div>; }
function PairBoard({ items, memory, answer, solved }) {
  const [left, setLeft] = useState(null), [revealed, setRevealed] = useState([]), [mismatch, setMismatch] = useState(false);
  const [cards] = useState(() => shuffled(items.flatMap(i => [{ id: i.id, side: 'prompt', text: i.prompt, image_url: i.image_url, image_alt: i.image_alt }, { id: i.id, side: 'answer', text: i.answer }])));
  const [answers] = useState(() => shuffled(items));
  function flip(card, index) {
    if (mismatch || revealed.includes(index) || solved.includes(card.id)) return;
    const next = [...revealed, index]; setRevealed(next);
    if (next.length === 2) { const good = cards[next[0]].id === card.id; answer(card.id, good); if (good) setRevealed([]); else setMismatch(true); }
  }
  if (memory) return <><div className="wm-memory">{cards.map((card, index) => <button type="button" key={index} disabled={solved.includes(card.id)} aria-label={revealed.includes(index) || solved.includes(card.id) ? undefined : `كشف البطاقة ${index + 1}`} onClick={() => flip(card, index)} className={revealed.includes(index) || solved.includes(card.id) ? 'revealed' : ''}>{revealed.includes(index) || solved.includes(card.id) ? <><MathText>{card.text}</MathText>{card.image_url && <img src={card.image_url} alt={card.image_alt} referrerPolicy="no-referrer" />}</> : '?'}</button>)}</div>{mismatch && <button type="button" onClick={() => { setRevealed([]); setMismatch(false); }}>إخفاء البطاقتين والمحاولة مجددًا</button>}</>;
  return <div className="wm-pairs"><div><h4>العمليات</h4>{items.map(i => <button type="button" key={i.id} disabled={solved.includes(i.id)} aria-pressed={left === i.id} onClick={() => setLeft(i.id)}><Prompt item={i} /></button>)}</div><div><h4>الإجابات</h4>{answers.map(i => <button type="button" key={i.id} disabled={left === null || solved.includes(i.id)} onClick={() => { answer(left, left === i.id); setLeft(null); }}><MathText>{i.answer}</MathText></button>)}</div></div>;
}
function Sorting({ game, items, solved, answer }) {
  const [selected, setSelected] = useState(null);
  function drop(id, group) { const item = items.find(i => i.id === id); if (item && !solved.includes(id)) answer(id, item.group === group); setSelected(null); }
  return <><p>اسحب العنصر إلى مجموعته، أو اختره ثم اضغط المجموعة.</p><div className="wm-game-options">{items.filter(i => !solved.includes(i.id)).map(i => <button type="button" key={i.id} draggable aria-pressed={selected === i.id} onDragStart={e => { e.dataTransfer.setData('text/plain', String(i.id)); setSelected(i.id); }} onClick={() => setSelected(i.id)}><Prompt item={i} /></button>)}</div><div className="wm-sort-groups">{game.groups.map((name, group) => <div key={group} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const raw = e.dataTransfer.getData('text/plain'); if (/^\d+$/.test(raw)) drop(Number(raw), group); }}><button type="button" disabled={selected === null} onClick={() => drop(selected, group)}>{name}</button>{items.filter(i => solved.includes(i.id) && i.group === group).map(i => <p key={i.id}><MathText>{i.prompt}</MathText> ✓</p>)}</div>)}</div></>;
}
function NumberLine({ game, item, answer }) {
  const [tick, setTick] = useState(0), lo = numeric(game.minimum), step = numeric(game.step), count = Math.round((numeric(game.maximum) - lo) / step);
  const label = n => Number((lo + n * step).toFixed(5)).toString();
  return <><Prompt item={item} /><h3>ضع العدد <bdi>{item.value}</bdi> في مكانه</h3><div className="wm-number-line" dir="ltr"><div className="wm-ticks">{Array.from({ length: count + 1 }, (_, i) => <button type="button" key={i} aria-label={`الموقع ${label(i)}`} aria-pressed={tick === i} onClick={() => setTick(i)}><span>│</span><small>{label(i)}</small></button>)}</div><input aria-label="الموقع على خط الأعداد" type="range" min={0} max={count} step={1} value={tick} onChange={e => setTick(Number(e.target.value))} /></div><p>الموقع المختار: <bdi>{label(tick)}</bdi></p><button type="button" onClick={() => answer(Math.abs(lo + tick * step - numeric(item.value)) < 1e-8)}>تأكيد الموقع</button></>;
}
function Fractions({ item, answer }) {
  const [selected, setSelected] = useState([]);
  return <><Prompt item={item} /><h3>لوّن <bdi>{item.numerator}/{item.denominator}</bdi> من الشكل</h3><div className="wm-fraction" style={{ gridTemplateColumns: `repeat(${item.denominator}, 1fr)` }}>{Array.from({ length: item.denominator }, (_, i) => <button type="button" key={i} aria-label={`الجزء ${i + 1} من ${item.denominator}`} aria-pressed={selected.includes(i)} onClick={() => setSelected(old => old.includes(i) ? old.filter(v => v !== i) : [...old, i])} />)}</div><p>الأجزاء الملوّنة: {selected.length} من {item.denominator}</p><button type="button" onClick={() => answer(selected.length === item.numerator)}>تحقق من الكسر</button></>;
}
function Maze({ progress, total }) {
  // A continuous serpentine corridor; answers move the explorer one gate at a time.
  const path = []; for (let r = 0; r < 7; r += 2) { const row = Array.from({ length: 7 }, (_, c) => r * 7 + c); if (r % 4) row.reverse(); path.push(...row); if (r < 6) path.push((r + 1) * 7 + (r % 4 ? 0 : 6)); }
  const position = Math.floor(progress / total * (path.length - 1));
  return <div className="wm-maze" dir="ltr" role="img" aria-label={`المتاهة: اجتزت ${progress} من ${total} بوابة`}>{Array.from({ length: 49 }, (_, i) => <span key={i} className={!path.includes(i) ? 'wall' : path.indexOf(i) < position ? 'passed' : ''}>{i === path[position] ? '●' : i === path.at(-1) ? '⚑' : ''}</span>)}</div>;
}
function Round({ game, title, replay }) {
  const [items] = useState(() => { const rows = game.items.map((i, id) => ({ ...i, id })); return game.settings.shuffle ? shuffled(rows) : rows; });
  const [solved, setSolved] = useState([]), [mistakes, setMistakes] = useState(0), [feedback, setFeedback] = useState(''), [end, setEnd] = useState(''), [now, setNow] = useState(() => Date.now()), [started] = useState(() => Date.now());
  const state = useRef({ solved: [], mistakes: 0, end: '' }), [active, setActive] = useState(null), [rotation, setRotation] = useState(0), [sound, setSound] = useState(game.settings.sound);
  const remaining = game.settings.seconds ? Math.max(0, Math.ceil((started + game.settings.seconds * 1000 - now) / 1000)) : null;
  useEffect(() => { const timer = setInterval(() => { const time = Date.now(); if (state.current.end) return; setNow(time); if (game.settings.seconds && time >= started + game.settings.seconds * 1000) { state.current.end = 'انتهى الوقت'; setEnd(state.current.end); } }, 250); return () => clearInterval(timer); }, [started, game.settings.seconds]);
  function answer(id, correct) {
    const s = state.current;
    if (s.end || s.solved.includes(id)) return;
    if (game.settings.seconds && Date.now() >= started + game.settings.seconds * 1000) { s.end = 'انتهى الوقت'; setEnd(s.end); return; }
    if (sound) { try { const Audio = window.AudioContext || window.webkitAudioContext; const ctx = new Audio(), oscillator = ctx.createOscillator(), gain = ctx.createGain(); oscillator.frequency.value = correct ? 660 : 220; gain.gain.value = .07; oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(); oscillator.stop(ctx.currentTime + .12); oscillator.onended = () => ctx.close(); } catch { /* Audio is optional. */ } }
    if (correct) { s.solved = [...s.solved, id]; setSolved(s.solved); setFeedback('إجابة صحيحة! ' + (items.find(i => i.id === id)?.explanation || '')); if (game.kind === 'wheel') setActive(null); if (s.solved.length === items.length) s.end = 'أحسنت، أكملت التحدي!'; }
    else { s.mistakes++; setMistakes(s.mistakes); setFeedback('حاول مرة أخرى'); if (game.settings.max_mistakes && s.mistakes >= game.settings.max_mistakes) s.end = 'انتهت المحاولات'; }
    if (s.end) { setNow(Date.now()); setEnd(s.end); }
  }
  const item = items.find(i => !solved.includes(i.id)), wheelItem = items.find(i => i.id === active);
  return <section className={`wm-game theme-${game.settings.theme}`} dir="rtl" aria-label={title || KINDS[game.kind]}><header><span className="wm-eyebrow">WE MATH / {KINDS[game.kind]}</span><h2>{title || 'تحدي الرياضيات'}</h2><div className="wm-game-stats"><span>النقاط <b>{solved.length * game.settings.points} / {items.length * game.settings.points}</b></span><span>الأخطاء <b>{mistakes}{game.settings.max_mistakes ? ` / ${game.settings.max_mistakes}` : ''}</b></span><span>{remaining === null ? 'الوقت المستغرق' : 'الوقت المتبقي'} <b>{remaining ?? Math.floor((now - started) / 1000)} ث</b></span></div><progress aria-label="التقدم" max={items.length} value={solved.length} /><button type="button" aria-pressed={sound} onClick={() => setSound(!sound)}>الصوت {sound ? 'مفعّل' : 'متوقف'}</button></header>
    {game.instructions && <p><MathText>{game.instructions}</MathText></p>}
    {end ? <div className="wm-game-finish" role="status"><span className="wm-trophy">✦</span><h3>{end}</h3><p>{solved.length} إجابة صحيحة · {mistakes} أخطاء</p>{game.kind === 'maze' && <Maze progress={solved.length} total={items.length} />}<button type="button" onClick={replay}>إعادة اللعب</button></div> : <div className="wm-game-board">
      {['matching', 'memory'].includes(game.kind) && <PairBoard items={items} memory={game.kind === 'memory'} solved={solved} answer={answer} />}
      {game.kind === 'sorting' && <Sorting game={game} items={items} solved={solved} answer={answer} />}
      {game.kind === 'number_line' && <NumberLine key={item.id} game={game} item={item} answer={good => answer(item.id, good)} />}
      {game.kind === 'fractions' && <Fractions key={item.id} item={item} answer={good => answer(item.id, good)} />}
      {['quiz', 'true_false', 'maze'].includes(game.kind) && <>{game.kind === 'maze' && <Maze progress={solved.length} total={items.length} />}<p>السؤال {solved.length + 1} من {items.length}</p><Prompt item={item} /><Choices key={item.id} item={item} answer={good => answer(item.id, good)} /></>}
      {game.kind === 'wheel' && <><div className="wm-wheel-wrap"><span className="wm-wheel-pointer">▼</span><div className="wm-wheel" style={{ transform: `rotate(${rotation}deg)`, background: `conic-gradient(${items.map((_, n) => `${n % 2 ? 'var(--game-accent)' : '#233f35'} ${n * 360 / items.length}deg ${(n + 1) * 360 / items.length}deg`).join(',')})` }}>{items.map((i, n) => <span key={i.id} style={{ transform: `translate(-50%, -50%) rotate(${(n + .5) * 360 / items.length}deg) translateY(-90px)` }}>{solved.includes(i.id) ? '✓' : n + 1}</span>)}</div></div><button type="button" disabled={active !== null} onClick={() => { const choices = items.filter(i => !solved.includes(i.id)), chosen = choices[Math.floor(Math.random() * choices.length)], index = items.findIndex(i => i.id === chosen.id); setActive(chosen.id); setRotation(old => (Math.floor(old / 360) + 4) * 360 - (index + .5) * 360 / items.length); setFeedback(''); }}>تدوير العجلة</button>{wheelItem && <div className="wm-wheel-question" key={wheelItem.id}><Prompt item={wheelItem} /><Choices item={wheelItem} answer={good => answer(wheelItem.id, good)} /></div>}</>}
    </div>}
    <p role="status" className="wm-game-feedback"><MathText>{feedback}</MathText></p><footer>تدريب ذاتي؛ هذه النتيجة لا تُسجّل كعلامة رسمية.</footer></section>;
}
export default function GamePlayer({ game, title }) {
  const [round, setRound] = useState(0), [playing, setPlaying] = useState(false);
  const error = validateGame(game);
  if (error) return <p role="alert">اللعبة غير جاهزة: {error}</p>;
  if (!playing) return <section className={`wm-game theme-${game.settings.theme}`} dir="rtl"><span className="wm-eyebrow">WE MATH PLAY</span><h2>{title || KINDS[game.kind]}</h2><p>{KINDS[game.kind]} · {game.items.length} عناصر</p><p><MathText>{game.instructions}</MathText></p><p>{game.settings.seconds ? `${game.settings.seconds} ثانية` : 'دون مؤقت'} · {game.settings.max_mistakes ? `${game.settings.max_mistakes} أخطاء مسموحة` : 'محاولات غير محدودة'}</p><button type="button" onClick={() => setPlaying(true)}>ابدأ اللعب</button></section>;
  return <Round key={round + JSON.stringify(game)} game={game} title={title} replay={() => setRound(n => n + 1)} />;
}
