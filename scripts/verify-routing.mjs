// React/BrowserRouter/history and real Three geometry; HTTP/GPU/animation clock are mocked.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { installRoutingAPI } from '../tests/support/routing-api.mjs';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
const project=fileURLToPath(new URL('..', import.meta.url));
const temp=await mkdtemp(path.join(os.tmpdir(),'wemath-routing-'));
const bundle=path.join(temp,'app.cjs');
const require=createRequire(`${project}/package.json`);
const three=require.resolve('three').replace('/build/three.cjs','/build/three.module.js');
await build({stdin:{contents:"export {default as App} from './src/App.jsx'; export {routes} from './src/app/routing/routes.jsx'; export {setToken} from './src/shared/api/client.js';",resolveDir:project,loader:'jsx'},outfile:bundle,define:{'import.meta.env':'{}'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',loader:{'.css':'empty'},plugins:[{
 name:'headless-surface-only',setup(api){
  api.onResolve({filter:/^(react|react-dom|react-router-dom)(\/.*)?$/},args=>({path:require.resolve(args.path),external:true}));
  api.onResolve({filter:/^three$/},args=>args.importer.endsWith('/hive/rendering.js')?{path:'three-surface',namespace:'surface'}:undefined);
  api.onLoad({filter:/.*/,namespace:'surface'},()=>({loader:'js',resolveDir:project,contents:`export * from ${JSON.stringify(three)};import {Texture} from ${JSON.stringify(three)};
  export class WebGLRenderer{constructor(){this.shadowMap={};}setPixelRatio(){}setClearColor(){}setSize(){}render(scene,camera){scene.updateMatrixWorld();camera.updateMatrixWorld();}dispose(){}}
  export class PMREMGenerator{fromScene(){return{texture:new Texture(),dispose(){}};}dispose(){}}`}));
  api.onResolve({filter:/^gsap$/},()=>({path:'gsap-clock',namespace:'clock'}));
  api.onLoad({filter:/.*/,namespace:'clock'},()=>({loader:'js',contents:`export default {timeline(config){return{to(target,opts){this.target=target;this.opts=opts;return this;},restart(){this.target.seconds=0;return this;},progress(p){this.target.seconds=p*this.opts.seconds;if(p===1)config.onComplete();return this;},pause(){return this;},resume(){return this;},kill(){}};},to(target,opts){target.value=opts.value;return{kill(){}};},killTweensOf(){}};`}));
 }
}]});
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://localhost/',pretendToBeVisual:true});
for(const key of ['window','document','HTMLElement','HTMLInputElement','HTMLDialogElement','Event','MouseEvent','KeyboardEvent','MutationObserver','HTMLTextAreaElement','HTMLSelectElement','FormData','sessionStorage'])globalThis[key]=dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const frames=new Map();let frameId=0;
globalThis.requestAnimationFrame=fn=>{const id=++frameId;frames.set(id,fn);return id;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
window.requestAnimationFrame=globalThis.requestAnimationFrame;
window.cancelAnimationFrame=globalThis.cancelAnimationFrame;
window.matchMedia=query=>({matches:query.includes('reduced-motion')||query.includes('hover'),addEventListener(){},removeEventListener(){}});
window.innerWidth=1440;window.innerHeight=900;
HTMLElement.prototype.getBoundingClientRect=function(){return {x:0,y:0,left:0,top:0,width:1440,height:900,right:1440,bottom:900};};
Object.defineProperty(HTMLElement.prototype,'clientWidth',{get(){return 1440;}});
HTMLElement.prototype.scrollTo=function(){};
HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
const {createElement,act}=require('react');
const {createRoot}=require('react-dom/client');
const {App,routes,setToken}=require(bundle);
const {createBrowserRouter}=require('react-router-dom');
let root, router;
const api=installRoutingAPI(), checks=[];
const $=selector=>document.querySelector(selector), $$=selector=>[...document.querySelectorAll(selector)];
const label=name=>$$('button,a').find(node=>node.getAttribute('aria-label')===name&&!node.closest('[hidden]'));
const button=text=>$$('button').find(node=>node.textContent.trim()===text&&!node.closest('[hidden]'));
const text=()=>document.body.textContent, url=()=>window.location.pathname+window.location.search;
async function settle(){await act(async()=>{for(let i=0;i<6;i++){await new Promise(resolve=>setTimeout(resolve,0));const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(1000+i*16));}});}
async function click(node){assert(node,`missing click target on ${url()}`);await act(async()=>node.click());await settle();}
async function go(to){await act(async()=>router.navigate(to));await settle();}
async function history(delta){await act(async()=>{window.history.go(delta);await new Promise(resolve=>setTimeout(resolve,20));});await settle();}
async function fill(node,value){assert(node,`missing input on ${url()}`);await act(async()=>{Object.getOwnPropertyDescriptor(node.tagName==='SELECT'?HTMLSelectElement.prototype:node.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(node,value);node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));});}
async function submit(){await act(async()=>$('dialog form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await settle();}
async function boot(to,family=null,teacher=false){
  if(root){await act(async()=>root.unmount());router.dispose();}
  setToken(family);sessionStorage.removeItem('wemath.teacher.session.v1');if(teacher)sessionStorage.setItem('wemath.teacher.session.v1','teacher-token');
  window.history.replaceState(null,'',to);router=createBrowserRouter(routes,{window});root=createRoot($('#root'));
  await act(async()=>root.render(createElement(App,{router})));await settle();
}
try{
  await boot('/');const canvas=$('.bee-canvas');
  await click($('.bee-center-hit'));await click($('[data-cell="students"]'));
  assert(url().startsWith('/student/login'));assert.equal($$('dialog input').length,2);assert(!text().includes('إضافة طفل'));
  await fill($('[name="username"]'),'student.one');await fill($('[name="password"]'),'StudentPassword123!');await submit();
  assert.equal(url(),'/student/books/book1');assert(label('وحدة الأعداد'));assert(!label('الصف 2'));
  assert.equal($('a.student-cell').href,'https://example.org/book1.pdf');
  await click(label('وحدة الأعداد'));await click(label('درس 1-1'));
  const lesson='/student/books/book1/units/unit1/lessons/lesson1-1';assert.equal(url(),lesson);
  await click(label('أوراق عمل إلكترونية'));assert.equal(url(),`${lesson}/activities/worksheet`);assert(text().includes('مورد تجريبي'));
  await history(-1);assert.equal(url(),lesson);assert(!$('dialog'));
  await history(1);assert.equal(url(),`${lesson}/activities/worksheet`);assert($('dialog'));
  await click(label('إغلاق'));assert.equal(url(),lesson);
  await go('/');assert.equal($('.bee-canvas'),canvas);assert.equal($('.bee-experience').dataset.menu,'open');
  let external;window.open=(...args)=>{external=args;};await click($('[data-cell="steam"]'));assert.deepEqual(external,['https://steam.ps/','_blank','noopener,noreferrer']);assert.equal(url(),'/');
  assert(!window.location.href.includes('StudentPassword'));
  checks.push('Student login/saved grade, nested lesson/activity URLs, Back/Forward, external books and STEAM, home canvas retained');
  await boot(`${lesson}/activities/game`,'student-token');assert.equal(url(),`${lesson}/activities/game`);assert($('#polygon-sides'));assert.equal($('.bee-center-hit').hidden,false);
  await go('/');assert.equal($('.bee-experience').dataset.stage,'ready');await go(`${lesson}/activities/game`);
  const writes=api.calls.filter(call=>call.method==='PUT').length;
  await go('/student/books/book2/units/unit2/lessons/lesson2-1/activities/game');assert(text().includes('لا يتبع المنهاج'));assert.equal(api.calls.filter(call=>call.method==='PUT').length,writes);
  await go('/no-such-page');assert($('dialog'));
  checks.push('Direct-link reload restores sessions/activity and skips intro; wrong grade and unknown routes are rejected');
  await boot(`${lesson}/activities/worksheet`,'parent-token');assert(url().startsWith('/student/login?next='));assert(!text().includes('إضافة طفل'));
  await fill($('[name="username"]'),'parent.one');await fill($('[name="password"]'),'ParentPassword123!');await submit();assert(text().includes('ليس حساب طالب'));
  await fill($('[name="username"]'),'student.one');await submit();assert.equal(url(),`${lesson}/activities/worksheet`);
  checks.push('Parent account cannot enter student portal; correct login resumes the exact protected page');
  await boot('/parent','parent-token');await click(label('الطالب الأول'));assert.equal(url(),'/parent/children/2');
  await click(label('تقدّمه'));assert.equal(url(),'/parent/children/2/progress');assert(text().includes('دروس أنجزها'));
  await click(label('إغلاق'));await click(label('منهجه'));assert.equal(url(),'/parent/children/2/curriculum/books/book1');
  const beforePreview=api.calls.filter(call=>call.method==='PUT').length;
  await go('/parent/children/2/curriculum/books/book1/units/unit1/lessons/lesson1-1/activities/game');assert($('#polygon-sides'));assert(!label('أنهيت الدرس'));assert.equal(api.calls.filter(call=>call.method==='PUT').length,beforePreview);
  const beforeUnknown=api.calls.length;await go('/parent/children/999/progress');assert(text().includes('غير مرتبط'));assert(!api.calls.slice(beforeUnknown).some(call=>call.path.includes('/999/')));
  await go('/parent/children/2/password');await fill($('[name="password"]'),'NewPassword123!');await submit();assert(text().includes('تم تغيير كلمة المرور'));
  await go('/parent/children/3/password');assert($('[name="password"]'));
  api.setCapacity(5);await boot('/parent/children/create','parent-token');assert(text().includes('خمسة أطفال'));assert(!$('form'));api.setCapacity(2);
  checks.push('Parent child/progress/password routes, ownership, five-child limit and read-only preview');
  await boot('/teachers/plans/new','parent-token',true);await fill($('dialog input'),'مسودة التحضير');
  await fill($$('dialog select')[1],'book1');await fill($$('dialog select')[2],'lesson1-1');
  for(const[i,value]of ['هدف الحصة','خطوات الحصة','تقويم الحصة'].entries())await fill($$('dialog textarea')[i],value);
  await go('/teachers');await go('/teachers/plans/new');assert.equal($('dialog input').value,'مسودة التحضير');
  await submit();assert.equal(url(),'/teachers/plans/1');assert(text().includes('هدف الحصة'));
  await click(button('تعديل'));assert.equal(url(),'/teachers/plans/1/edit');await fill($('dialog input'),'مسودة قديمة');await go('/teachers');api.documents.get('1').version=2;
  await go('/teachers/plans/1/edit');await submit();assert(text().includes('تغيّر الملف'));assert.equal(api.documents.get('1').title,'مسودة التحضير');
  await click(button('تجاهل المسودة والبدء من جديد'));await fill($('dialog input'),'تحضير محدّث');await submit();assert.equal(url(),'/teachers/plans/1');
  await click(button('نقل إلى الأرشيف'));assert.equal(url(),'/teachers/plans?archived=1');
  await go('/teachers/plans/1');await click(button('استعادة من الأرشيف'));assert.equal(url(),'/teachers/plans');
  await go('/teachers/resources/activities/teacher_resources-7');assert(text().includes('مادة teacher_resources 7'));assert(api.calls.some(call=>call.path.endsWith('/teachers/library/teacher_resources-7')&&call.token==='teacher-token'));
  await go('/teachers/curriculum/grades/1/books/book1/units/unit1/lessons/lesson1-1');await click(button('أنشئ اختبارًا'));assert(url().startsWith('/teachers/assessments/new?'));assert.equal($$('dialog select')[2].value,'lesson1-1');
  await go('/teachers/plans/new');await fill($('dialog input'),'لا تبق بعد الخروج');await go('/teachers/account');await click(button('تسجيل خروج المعلّم'));
  assert.equal(url(),'/');assert.equal(sessionStorage.getItem('wemath.session.v1'),'parent-token');
  await go('/teachers/plans/new');assert(url().startsWith('/teachers/login'));
  await fill($('[name="username"]'),'teacher.one');await fill($('[name="password"]'),'TeacherPassword123!');await submit();assert.equal(url(),'/teachers/plans/new');assert.equal($('dialog input').value,'');
  checks.push('Teacher drafts, version conflict, save/edit/archive/restore, direct private details, lesson prefill and isolated logout');
  await boot('/workshops/scientific');await click(label('التالي'));assert.equal(url(),'/workshops/scientific?page=2');
  await click(label('مادة workshops 7'));assert.equal(url(),'/workshops/scientific/workshops-7?page=2');await click(label('إغلاق'));assert.equal(url(),'/workshops/scientific?page=2');
  await click(label('بحث'));await fill($('[name="q"]'),'7');await submit();assert.equal(new URLSearchParams(window.location.search).get('q'),'7');
  await boot('/workshops/scientific/workshops-7?q=does-not-match');assert(text().includes('مادة workshops 7'));
  await go('/competitions/scientific');await click(label('التقويم'));await fill($('[name="month"]'),'2026-11');await submit();assert.equal(url(),'/competitions/scientific?month=2026-11');
  await click(label('الأرشيف'));assert(url().includes('archived=1'));await history(-1);assert(!url().includes('archived=1'));
  await boot('/');await click($('.bee-center-hit'));let parp;window.open=(...args)=>{parp=args;};await click($('[data-cell="research"]'));assert.deepEqual(parp,['http://localhost:5174','_blank','noopener,noreferrer']);
  await go('/assistant/calculate');await fill($('[name="message"]'),'2+2');await submit();assert(text().includes('الناتج = 4'));await go('/workshops');await go('/assistant/calculate');assert(text().includes('الناتج = 4'));
  checks.push('Public search/page/archive/calendar/detail URLs, PARP external handoff and assistant history');
  assert(api.calls.filter(call=>/^\/api\/(curriculum|platform\/(entries|assistant))/.test(call.path)).every(call=>!call.token));
  console.log(JSON.stringify({passed:true,checks,limitation:'DOM integration uses mocked HTTP and GPU, not a native-browser visual review.'},null,2));
}finally{
  if(root)await act(async()=>root.unmount());router?.dispose();api.restore();dom.window.close();await rm(temp,{recursive:true,force:true});assert.equal(frames.size,0);
}
