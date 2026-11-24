import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { installCMSAPI } from '../tests/support/cms-api.mjs';
const project = fileURLToPath(new URL('..', import.meta.url)), require = createRequire(`${project}/package.json`);
const temp = await mkdtemp(path.join(project, '.cms-test-')), bundle = path.join(temp, 'cms.cjs');
await build({ stdin: { contents: "export {default as AdminApp} from './src/features/admin/AdminApp.jsx';", resolveDir: project, loader: 'jsx' }, outfile: bundle, define: { 'import.meta.env': '{}' }, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', loader: { '.css': 'empty' }, plugins: [{ name: 'shared-react', setup(api) { api.onResolve({ filter: /^(react|react-dom|react-router-dom)(\/.*)?$/ }, args => ({ path: require.resolve(args.path), external: true })); } }] });
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/admin', pretendToBeVisual: true });
for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'Event', 'FormData', 'sessionStorage']) globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createElement, act } = require('react'), { createRoot } = require('react-dom/client'), { createBrowserRouter, RouterProvider } = require('react-router-dom');
const { AdminApp } = require(bundle), api = installCMSAPI();
const router = createBrowserRouter([{ path: '/admin/*', element: createElement(AdminApp) }], { window });
const root = createRoot(document.querySelector('#root'));
const $ = selector => document.querySelector(selector), $$ = selector => [...document.querySelectorAll(selector)];
const button = text => $$('button').find(node => node.textContent.trim() === text);
const input = text => $$('label').find(node => node.textContent.startsWith(text))?.querySelector('input,textarea,select');
async function settle() { await act(async () => { for (let i=0;i<5;i++) await new Promise(resolve => setTimeout(resolve, 0)); }); }
async function click(node) { assert(node, 'Missing click target'); await act(async () => node.click()); await settle(); }
async function go(to) { await act(async () => router.navigate(to)); await settle(); }
async function fill(node, value) { assert(node, 'Missing field'); await act(async () => { const prototype = node.tagName === 'SELECT' ? HTMLSelectElement.prototype : node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, value); node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); }); }
async function submit(selector = 'form') { await act(async () => $(selector).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); await settle(); }
try {
  await act(async () => root.render(createElement(RouterProvider, { router }))); await settle();
  await fill(input('اسم المستخدم'), 'administrator'); await fill(input('كلمة المرور'), 'test-password-123'); await submit();
  assert(document.body.textContent.includes('محتوى المنصة'));
  await go('/admin/team'); await click(button('＋ حساب جديد'));
  await fill(input('الاسم الكامل'), 'فريق الاختبارات'); await fill(input('اسم المستخدم'), 'exam-editor'); await fill(input('كلمة المرور'), 'test-password-123'); await fill(input('الإيميل'), 'editor@example.org'); await fill(input('نوع الفريق'), 'students'); await submit();
  assert.equal(api.calls.find(c => c.path === '/api/cms/staff' && c.method === 'POST').body.team_type, 'students');
  assert(document.body.textContent.includes('exam-editor'));
  await go('/admin/workspaces'); await click(button('＋ لوحة جديدة'));
  await fill(input('اسم اللوحة'), 'فريق الامتحانات وأوراق العمل');
  await click(input('الامتحانات')); await click(input('أوراق العمل')); await click(input('فريق الاختبارات'));
  await submit(); assert(document.body.textContent.includes('فريق الامتحانات وأوراق العمل'));
  await go('/admin/content/new?workspace=1&module=worksheet');
  assert.equal(input('عنوان المادة').value, '');
  await fill(input('عنوان المادة'), 'ورقة عمل الجمع'); await fill(input('الكتاب والصف'), 'book1');
  await fill(input('التفاصيل'), 'حل الأسئلة'); await fill(input('رابط المورد'), 'https://example.org/worksheet.pdf');
  await submit(); assert.equal(window.location.pathname, '/admin/content/1');
  await click(button('نشر على المنصة')); assert.equal(api.content.get(1).status, 'published');
  await fill(input('عنوان المادة'), 'تغييرات غير محفوظة'); await go('/admin');
  assert($('[role="alertdialog"]')); await click(button('البقاء ومتابعة التحرير'));
  assert.equal(input('عنوان المادة').value, 'تغييرات غير محفوظة');
  // A stale save must retain the local draft and show the conflict.
  api.content.get(1).version++; await submit(); assert($('[role="alert"]').textContent.includes('عدّل شخص آخر'));
  assert.equal(input('عنوان المادة').value, 'تغييرات غير محفوظة');
  await go('/admin'); await click(button('مغادرة دون حفظ'));
  await click(button('تسجيل الخروج')); assert.equal(sessionStorage.getItem('wemath.cms.session.v1'), null);
  await fill(input('اسم المستخدم'), 'exam-editor'); await fill(input('كلمة المرور'), 'test-password-123'); await submit();
  assert(!$$('nav a').some(a => a.textContent.includes('اللوحات الفرعية')));
  await go('/admin/content/1'); assert(!button('نشر على المنصة'));
  await fill(input('عنوان المادة'), 'مسودة الفريق'); await submit(); await click(button('إرسال للمراجعة'));
  assert.equal(api.content.get(1).status, 'review');
  console.log('PASS: admin login, staff creation, scoped workspace, blank template, save, publish, unsaved-change guard, conflict preservation, editor-only UI and review submission. HTTP mocked; real React Router and DOM.');
} finally { await act(async () => root.unmount()); router.dispose(); api.restore(); dom.window.close(); await rm(temp, { recursive: true, force: true }); }
