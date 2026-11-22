import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
const project = fileURLToPath(new URL('..', import.meta.url)), require = createRequire(`${project}/package.json`);
const temp = await mkdtemp(path.join(project, '.exams-test-')), bundle = path.join(temp, 'exams.cjs');
await build({ stdin: { contents: "export {default as ExamBuilder} from './src/features/admin/ExamBuilder.jsx'; export {default as MathText} from './src/shared/exams/MathText.jsx';", resolveDir: project, loader: 'jsx' }, outfile: bundle, define: { 'import.meta.env': '{}' }, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', loader: { '.css': 'empty' }, plugins: [{ name: 'shared-react', setup(api) { api.onResolve({ filter: /^(react|react-dom|react-router-dom)(\/.*)?$/ }, args => ({ path: require.resolve(args.path), external: true })); } }] });
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/admin', pretendToBeVisual: true });
for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'Event', 'FormData', 'sessionStorage']) globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createElement: h, act, useState } = require('react'), { createRoot } = require('react-dom/client');
const { ExamBuilder, MathText } = require(bundle);
const root = createRoot(document.querySelector('#root'));
let latest, generateBody, saved, failGeneration = false;
const bankQuestion = { type: 'true_false', prompt: '$2>1$', options: ['صح', 'خطأ'], correct: 0, explanation: 'أكبر', points: 3, image_url: 'https://example.org/q.png', image_alt: 'خط الأعداد' };
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const body = init.body ? JSON.parse(init.body) : null;
  if (String(url).includes('/generate')) { generateBody = body; return new Response(JSON.stringify(failGeneration ? { detail: 'تعذر توليد العدد المطلوب' } : { questions: Array.from({ length: body.count }, (_, i) => ({ ...bankQuestion, prompt: `${i + 2}>1` })) }), { status: failGeneration ? 422 : 200 }); }
  if (init.method === 'POST') { saved = body; return new Response(JSON.stringify({ ...body, id: 1 }), { status: 201 }); }
  return new Response(JSON.stringify({ items: [{ id: 1, kind: 'question', title: 'من البنك', grade: 3, difficulty: 'easy', topic: '', payload: bankQuestion }], total: 1 }));
};
function App({ bankAllowed = true }) { const [questions, setQuestions] = useState([]); latest = questions; return h('form', { onSubmit: e => { e.preventDefault(); throw new Error('Auxiliary buttons must not submit the exam'); } }, h(ExamBuilder, { questions, onChange: setQuestions, workspaceId: 7, bankAllowed, title: 'امتحان تجريبي', instructions: 'تعليمات كاملة', })); }
const $$ = selector => [...document.querySelectorAll(selector)];
const button = text => $$('button').find(node => node.textContent.trim() === text);
const input = text => $$('label').find(node => node.textContent.startsWith(text))?.querySelector('input,textarea,select');
async function settle() { await act(async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setTimeout(resolve, 0)); }); }
async function click(node) { assert(node, 'Missing click target'); await act(async () => node.click()); await settle(); }
async function fill(node, value) { assert(node, 'Missing field'); await act(async () => { const prototype = node.tagName === 'SELECT' ? HTMLSelectElement.prototype : node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, value); node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); }); }
try {
  await act(async () => root.render(h(App))); await settle();
  await click(button('＋ إضافة سؤال فارغ'));
  await fill(input('نوع السؤال'), 'true_false');
  assert.deepEqual(latest[0].options, ['صح', 'خطأ']); assert.equal(latest[0].correct, -1);
  await fill(input('نص السؤال'), 'هل $\\frac{1}{2}<1$؟');
  await fill(input('الإجابة الصحيحة'), '0');
  await fill(input('رابط صورة السؤال'), 'https://example.org/q.png');
  await fill(input('وصف الصورة'), 'نصف دائرة');
  await fill(input('العلامة'), '4');
  assert(document.querySelector('.katex')); assert.equal(document.querySelector('img').alt, 'نصف دائرة');
  await click(input('معاينة نسخة الطالب')); assert(!input('الإجابة الصحيحة')); assert(!document.querySelector('.exam-preview strong'));
  await click(input('معاينة نسخة الطالب'));
  await click(button('حفظ السؤال بالبنك')); await click(button('حفظ في البنك'));
  assert.equal(saved.workspace_id, 7); assert.equal(saved.kind, 'question'); assert.equal(saved.payload.points, 4);
  await click(button('إغلاق'));
  await click(button('حفظ الامتحان في البنك')); await click(button('حفظ في البنك'));
  assert.equal(saved.kind, 'exam'); assert.equal(saved.payload.instructions, 'تعليمات كاملة');
  await click(button('إغلاق'));
  await click(button('توليد نسخ بالأرقام')); await fill(input('عدد النسخ'), '2');
  await fill(input('الشروط'), 'a>=b\n'); await click(button('توليد ومعاينة'));
  assert.deepEqual(generateBody.template.constraints, ['a>=b']); assert.equal(generateBody.workspace_id, 7);
  await click(button('إضافة 2 سؤال إلى الامتحان')); assert.equal(latest.length, 3);
  await click(button('توليد نسخ بالأرقام')); failGeneration = true; await click(button('توليد ومعاينة'));
  assert(document.querySelector('[role="alert"]').textContent.includes('تعذر توليد')); assert(!button('إضافة 2 سؤال إلى الامتحان'));
  await click(button('إضافة من البنك')); await click(button('استخدام نسخة'));
  assert.equal(latest.length, 4); assert.equal(latest[3].prompt, bankQuestion.prompt);
  // Editing the copied question cannot change the bank object.
  const fields = $$('textarea'); await fill(fields.at(-2), 'تعديل مستقل');
  assert.equal(bankQuestion.prompt, '$2>1$');
  await act(async () => root.render(h(App, { key: 'no-bank', bankAllowed: false })));
  assert(!button('توليد نسخ بالأرقام')); assert(!button('إضافة من البنك'));
  await act(async () => root.render(h(MathText, null, '$\\href{javascript:alert(1)}{X}$ <script>alert(1)</script>')));
  assert(!document.querySelector('a')); assert(!document.querySelector('script'));
  console.log('PASS: true/false, image + math preview, hidden answers, points, question/exam bank saves, constrained generation request, error handling, bank copy and scoped UI. Real React/DOM; HTTP mocked.');
} finally { globalThis.fetch = originalFetch; await act(async () => root.unmount()); dom.window.close(); await rm(temp, { recursive: true, force: true }); }
