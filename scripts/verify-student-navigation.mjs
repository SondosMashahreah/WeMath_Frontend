// React/BrowserRouter/history and real Three geometry; HTTP/GPU/animation clock are mocked.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { installRoutingAPI, books } from '../tests/support/routing-api.mjs';
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
const scientific = { id: 2, username: 'scientific.student', full_name: 'طالب علمي', roles: ['student'], grade: 12, track: 'علمي' };
const catalog = [11, 12].map(grade => ({ id: `science${grade}`, grade, classification_label: 'علمي', period_label: 'كتاب كامل', title: 'الرياضيات', units: [{ id: `unit${grade}`, number_in_book: 1, title: 'وحدة علمي', lessons: [{ id: `lesson${grade}`, position: 1, title: 'درس علمي' }] }] }));
const api=installRoutingAPI({ studentProfile: scientific, catalog }), checks=[];
const $=selector=>document.querySelector(selector), $$=selector=>[...document.querySelectorAll(selector)];
const label=name=>$$('button,a').find(node=>node.getAttribute('aria-label')===name&&!node.closest('[hidden]'));
const button=text=>$$('button').find(node=>node.textContent.trim()===text&&!node.closest('[hidden]'));
const url=()=>window.location.pathname+window.location.search;
async function settle(){await act(async()=>{for(let i=0;i<6;i++){await new Promise(resolve=>setTimeout(resolve,0));const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(1000+i*16));}});}
async function click(node){assert(node,`missing click target on ${url()}`);await act(async()=>node.click());await settle();}
async function go(to){await act(async()=>router.navigate(to));await settle();}
async function history(delta){await act(async()=>{window.history.go(delta);await new Promise(resolve=>setTimeout(resolve,20));});await settle();}
async function boot(to,family=null,teacher=false){
  if(root){await act(async()=>root.unmount());router.dispose();}
  setToken(family);sessionStorage.removeItem('wemath.teacher.session.v1');if(teacher)sessionStorage.setItem('wemath.teacher.session.v1','teacher-token');
  window.history.replaceState(null,'',to);router=createBrowserRouter(routes,{window});root=createRoot($('#root'));
  await act(async()=>root.render(createElement(App,{router})));await settle();
}
try{
  for (const grade of [11, 12]) {
    scientific.grade = grade;
    const book = `/student/books/science${grade}`;
    await boot('/student', 'student-token');
    assert.equal(url(), book);
    await click(label('حسابي'));
    assert.equal(url(), '/student/account');
    assert(button('تسجيل الخروج'));
    await settle();
    assert.equal(url(), '/student/account', 'account must not redirect to the sole book');
    await click(label('إغلاق'));
    assert.equal(url(), book);
    await click(label('وحدة علمي'));
    assert.equal(url(), `${book}/units/unit${grade}`);
    await click($('.student-center'));
    assert.equal(url(), book);
    await click($('.student-center'));
    assert.equal(url(), '/', 'Back from a sole book must leave the curriculum');
    await boot('/student/account', 'student-token');
    assert(button('تسجيل الخروج'), 'direct account URL stays open');
    await click(button('تسجيل الخروج'));
    assert.equal(url(), '/');
    assert.equal(sessionStorage.getItem('wemath.session.v1'), null);
    assert(api.calls.some(call => call.path === '/api/auth/logout' && call.token === 'student-token'));
    await go(book);
    assert(url().startsWith('/student/login'));
    checks.push(`Grade ${grade}: account, close, nested Back, home, direct account, logout and protected route`);
  }
  // Multiple books retain the book-selection screen as their Back destination.
  catalog.push({ ...catalog[1], id: 'science12-second', period_label: 'الفصل الثاني' });
  await boot('/student', 'student-token');
  assert.equal(url(), '/student');
  await go('/student/books/science12');
  await click($('.student-center'));
  assert.equal(url(), '/student');
  await click($('.student-center'));
  assert.equal(url(), '/');
  // Browser history must not reopen/close the account automatically.
  catalog.pop();
  await boot('/student', 'student-token');
  await click(label('حسابي'));
  await history(-1); assert.equal(url(), '/student/books/science12');
  await history(1); assert.equal(url(), '/student/account');
  assert(button('تسجيل الخروج'));
  checks.push('Multiple-book Back and browser Back/Forward');
  catalog.push(books[0]);
  await boot('/parent/children/2/curriculum', 'parent-token');
  assert.equal(url(), '/parent/children/2/curriculum/books/book1');
  await click($('.student-center'));
  assert.equal(url(), '/parent/children/2');
  checks.push('Parent preview Back returns to the child');
  console.log(JSON.stringify({passed:true, checks, limitation:'HTTP and GPU are mocked; real React routes and DOM events are exercised.'}, null, 2));
}finally{
  if(root)await act(async()=>root.unmount());router?.dispose();api.restore();dom.window.close();await rm(temp,{recursive:true,force:true});assert.equal(frames.size,0);
}
