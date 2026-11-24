import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
const project=fileURLToPath(new URL('..',import.meta.url)), require=createRequire(`${project}/package.json`);
const temp=await mkdtemp(path.join(project,'.calendar-test-')),bundle=path.join(temp,'test.cjs');
await build({stdin:{contents:"export {default as Calendar} from './src/shared/calendar/WorkshopCalendar.jsx'; export {default as AdminCalendar} from './src/features/admin/WorkshopCalendarPage.jsx'; export {default as Editor} from './src/features/admin/ContentEditor.jsx';",resolveDir:project,loader:'jsx'},outfile:bundle,define:{'import.meta.env':'{}'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'react',setup(api){api.onResolve({filter:/^(react|react-dom|react-router-dom)(\/.*)?$/},args=>({path:require.resolve(args.path),external:true}));}}]});
const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost/admin/workshops?workspace=7&category=ministry&month=2026-11',pretendToBeVisual:true});
for(const key of ['window','document','HTMLElement','HTMLInputElement','HTMLSelectElement','HTMLTextAreaElement','Event','FormData','sessionStorage'])globalThis[key]=dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {createElement:h,act}=require('react'),{createRoot}=require('react-dom/client'),{createBrowserRouter,RouterProvider}=require('react-router-dom');
const {Calendar,AdminCalendar,Editor}=require(bundle);
const me={is_admin:false,modules:{workshops:{label:'الورشات',resource:false,categories:{ministry:'الوزارة',directorates:'المديرية'}}},workspaces:[{id:7,name:'فريق الورشات',active:true,modules:['workshops'],can_publish:false}]};
let requests=[],fail=false, saved;
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,init={})=>{
 requests.push({url:String(url),headers:init.headers});
 if(String(url).includes('/calendar?'))return new Response(JSON.stringify(fail?{detail:'خطأ تجريبي'}:{items:[{id:1,title:'ورشة الوزارة',event_date:'2026-11-22',status:'draft',location:'القدس'}],total:25,days:{'2026-11-22':25},counts:{month:25,past:10,upcoming:15,undated:2},today:'2026-11-22'}),{status:fail?500:200});
 if(String(url).endsWith('/api/curriculum/catalog'))return new Response(JSON.stringify({books:[]}));
 if(init.method==='POST'){saved=JSON.parse(init.body);return new Response(JSON.stringify({...saved,id:99,version:1,status:'draft'}),{status:201});}
 if(String(url).endsWith('/content/99'))return new Response(JSON.stringify({...saved,id:99,version:1,status:'draft'}));
 throw new Error('Unexpected '+url);
};
sessionStorage.setItem('wemath.cms.session.v1','staff-token'); sessionStorage.setItem('wemath.session.v1','student-token');
const router=createBrowserRouter([{path:'/admin/workshops',element:h(AdminCalendar,{me})},{path:'/admin/content/new',element:h(Editor,{me})},{path:'/admin/content/:id',element:h(Editor,{me})},{path:'/public',element:h(Calendar,{category:'ministry',title:'الوزارة',onOpen:()=>{}})}],{window});
const root=createRoot(document.querySelector('#root'));
const $$=selector=>[...document.querySelectorAll(selector)];
const button=text=>$$('button').find(n=>n.textContent.trim()===text);
const field=text=>$$('label').find(n=>n.textContent.startsWith(text))?.querySelector('input,select,textarea');
async function settle(){await act(async()=>{for(let i=0;i<4;i++)await new Promise(r=>setTimeout(r,0));});}
async function click(node){assert(node,'Missing button');await act(async()=>node.click());await settle();}
async function fill(node,value){assert(node);await act(async()=>{const proto=node.tagName==='SELECT'?HTMLSelectElement.prototype:node.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(node,value);node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));});}
try{
 await act(async()=>root.render(h(RouterProvider,{router})));await settle();
 assert.equal(document.querySelectorAll('.wm-calendar-days button').length,42);
 assert.equal(document.querySelector('[data-date="2026-11-22"] small').textContent,'25');
 assert.equal(requests[0].headers.Authorization,'Bearer staff-token');
 await click(document.querySelector('[data-date="2026-11-22"]'));assert(locationSearch().includes('view=day'));
 await click(button('التالي'));assert(locationSearch().includes('page=2'));
 await click(document.querySelector('[aria-label="الشهر التالي"]'));assert(locationSearch().includes('month=2026-12'));assert(locationSearch().includes('page=1'));
 await click(document.querySelector('.wm-month-title'));assert(field('السنة'));await fill(field('السنة'),'2024');assert(locationSearch().includes('2024-12'));
 await click(button('العودة لليوم'));assert(locationSearch().includes('day=2026-11-22'));
 await click(button('＋ إضافة ورشة'));assert.equal(window.location.pathname,'/admin/content/new');assert.equal(field('التصنيف').value,'ministry');assert.equal(field('تاريخ الفعالية').value,'2026-11-22');
 await fill(field('عنوان المادة'),'ورشة جديدة');await act(async()=>document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await settle();
 assert.equal(saved.payload.category,'ministry');assert.equal(saved.payload.event_date,'2026-11-22');assert.equal(saved.workspace_id,7);
 await act(async()=>router.navigate('/public?month=2026-11'));await settle();assert.equal(requests.at(-1).headers.Authorization,undefined);
 fail=true;await click(document.querySelector('[aria-label="الشهر التالي"]'));assert(document.querySelector('[role="alert"]'));
 fail=false;await click(button('إعادة المحاولة'));assert(!document.querySelector('[role="alert"]'));assert(document.body.textContent.includes('ورشة الوزارة'));
 console.log('PASS: month/day/year navigation, day counts, paging, scoped auth, dated workshop creation, public token isolation and retry. React DOM with mocked HTTP.');
}finally{globalThis.fetch=originalFetch;await act(async()=>root.unmount());router.dispose();dom.window.close();await rm(temp,{recursive:true,force:true});}
function locationSearch(){return window.location.search;}
