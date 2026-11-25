export const KINDS = { matching: 'المطابقة', quiz: 'المسابقة التفاعلية', sorting: 'السحب والإفلات', wheel: 'عجلة الحظ', memory: 'الذاكرة', number_line: 'خط الأعداد', fractions: 'الكسور', maze: 'المتاهة الرياضية', true_false: 'صح أو خطأ' };
export const CHOICE = ['quiz', 'true_false', 'wheel', 'maze'];
export const PAIRS = ['matching', 'memory'];
export const emptyItem = (kind) => ({ prompt: '', answer: '', options: kind === 'true_false' ? ['صح', 'خطأ'] : ['', '', '', ''], correct: -1, explanation: '', image_url: '', image_alt: '', group: 0, value: '0', numerator: 1, denominator: 2 });
export const emptyGame = (kind = 'matching') => ({ schema_version: 1, kind, instructions: '', settings: { theme: 'orange', seconds: 0, max_mistakes: 0, points: 10, sound: false, shuffle: true }, items: [], groups: ['أعداد زوجية', 'أعداد فردية'], minimum: '0', maximum: '10', step: '1' });
export function numeric(text) {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\/[+-]?\d+)?$/.test(String(text).trim())) return NaN;
  const parts = String(text).split('/').map(Number); return parts[0] / (parts.length === 2 ? parts[1] : 1);
}
export function shuffled(items, random = Math.random) { const list = [...items]; for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; }
export function validateGame(g) {
  if (!g || !KINDS[g.kind]) return 'اختر نوع اللعبة';
  const n = g.items.length, pair = PAIRS.includes(g.kind);
  if (n < (pair ? 2 : 1) || n > (pair ? 12 : 20)) return pair ? 'أضف من 2 إلى 12 زوجًا' : 'أضف من 1 إلى 20 سؤالًا';
  if (pair && ['prompt', 'answer'].some(key => new Set(g.items.map(i => i[key].trim())).size !== n || g.items.some(i => !i[key].trim()))) return 'الأزواج تحتاج نصوصًا وإجابات مختلفة وغير فارغة';
  if (g.kind === 'sorting' && (g.groups.some(v => !v.trim()) || new Set(g.groups.map(v => v.trim())).size !== g.groups.length)) return 'أكمل أسماء مجموعات مختلفة';
  const lo = numeric(g.minimum), hi = numeric(g.maximum), step = numeric(g.step), count = (hi - lo) / step;
  if (g.kind === 'number_line' && (!Number.isFinite(count) || lo >= hi || step <= 0 || count > 40 || Math.abs(count - Math.round(count)) > 1e-8)) return 'خط الأعداد: تقسيم منتظم موجب حتى 40 فاصلة';
  for (const [index, i] of g.items.entries()) {
    const prefix = `العنصر ${index + 1}: `;
    if (!['number_line', 'fractions'].includes(g.kind) && !i.prompt.trim()) return prefix + 'النص مطلوب';
    if (i.image_url && (!/^https:\/\/[^/\s]+/.test(i.image_url) || !i.image_alt.trim())) return prefix + 'الصورة تحتاج رابط HTTPS ووصفًا';
    if (CHOICE.includes(g.kind) && (i.options.some(o => !o.trim()) || new Set(i.options.map(o => o.trim())).size !== i.options.length || i.correct < 0 || i.correct >= i.options.length)) return prefix + 'أكمل الخيارات المختلفة وحدد الصحيح';
    if (g.kind === 'true_false' && JSON.stringify(i.options) !== JSON.stringify(['صح', 'خطأ'])) return prefix + 'الخيارات يجب أن تكون صح ثم خطأ';
    if (g.kind === 'sorting' && (!Number.isInteger(i.group) || i.group < 0 || i.group >= g.groups.length)) return prefix + 'اختر مجموعة';
    if (g.kind === 'fractions' && (!Number.isInteger(i.numerator) || !Number.isInteger(i.denominator) || i.denominator < 1 || i.denominator > 12 || i.numerator < 0 || i.numerator > i.denominator)) return prefix + 'الكسر من صفر إلى واحد والمقام حتى 12';
    if (g.kind === 'number_line') { const value = numeric(i.value), tick = (value - lo) / step; if (!Number.isFinite(value) || value < lo || value > hi || Math.abs(tick - Math.round(tick)) > 1e-8) return prefix + 'العدد يجب أن يقع على علامة داخل الخط'; }
  }
  return '';
}
export function importQuestions(game, questions) {
  if (![...CHOICE, ...PAIRS].includes(game.kind)) throw new Error('استيراد الأسئلة متاح للمسابقة والمطابقة والذاكرة والعجلة والمتاهة وصح/خطأ');
  if (game.kind === 'true_false' && questions.some(q => q.type !== 'true_false')) throw new Error('اختر أسئلة صح/خطأ فقط');
  const items = questions.map(q => ({ ...emptyItem(game.kind), prompt: q.prompt, answer: q.options[q.correct], options: [...q.options], correct: q.correct, explanation: q.explanation || '', image_url: q.image_url || '', image_alt: q.image_alt || '' }));
  const result = { ...game, items: [...game.items, ...items] };
  if (result.items.length > (PAIRS.includes(game.kind) ? 12 : 20)) throw new Error('عدد العناصر يتجاوز حد هذا القالب');
  if (PAIRS.includes(game.kind) && ['prompt', 'answer'].some(key => new Set(result.items.map(i => i[key].trim())).size !== result.items.length)) throw new Error('احذف الأسئلة ذات النص أو الإجابة المكررة قبل استيراد الأزواج');
  return result;
}
export function exampleGame(kind = 'matching') {
  const g = emptyGame(kind);
  g.items = [[3, 4], [5, 5], [7, 2], [8, 3], [6, 6]].map(([a, b], index) => ({ ...emptyItem(kind), prompt: `$${a} \\times ${b}$`, answer: String(a * b), options: kind === 'true_false' ? ['صح', 'خطأ'] : [String(a * b), String(a * b + 1), String(a * b - 1), String(a * b + 2)], correct: 0, value: String(index + 1), numerator: index + 1, denominator: 6, group: index % 2 }));
  if (kind === 'true_false') g.items = g.items.map(i => ({ ...i, prompt: `${i.prompt} = ${i.answer}` }));
  if (kind === 'sorting') { g.groups = ['أعداد زوجية', 'أعداد فردية']; g.items = g.items.map((i, n) => ({ ...i, prompt: String(n + 1), group: (n + 1) % 2 })); }
  if (['fractions', 'number_line'].includes(kind)) g.items = g.items.map(i => ({ ...i, prompt: '' }));
  return g;
}
