import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { emptyGame, exampleGame, emptyItem, validateGame, importQuestions, shuffled } from '../src/shared/games/model.js';
const project=fileURLToPath(new URL('..',import.meta.url)), require=createRequire(`${project}/package.json`),temp=await mkdtemp(path.join(project,'.games-test-'));
const bundle=path.join(temp,'test.cjs');
await build({stdin:{contents:"export {default as Player} from './src/shared/games/GamePlayer.jsx'; export {default as Builder} from './src/shared/games/GameBuilder.jsx'; export {default as TeacherPage} from './src/features/platform/presentation/pages/TeacherGamesPage.jsx'; export {CurriculumContext} from './src/features/student/application/curriculumContext.js'; export {createMemoryRouter,RouterProvider} from 'react-router-dom';",resolveDir:project,loader:'jsx'},outfile:bundle,define:{'import.meta.env':'{}'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'react',setup(api){api.onResolve({filter:/^(react|react-dom)(\/.*)?$/},args=>({path:require.resolve(args.path),external:true}));}}]});
const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost',pretendToBeVisual:true});
for(const key of ['window','document','HTMLElement','HTMLInputElement','HTMLTextAreaElement','Event','sessionStorage'])globalThis[key]=dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {createElement:h,act,useState}=require('react'),{createRoot}=require('react-dom/client'),{Player,Builder,TeacherPage,CurriculumContext,createMemoryRouter,RouterProvider}=require(bundle);
const root=createRoot(document.querySelector('#root')), $$=s=>[...document.querySelectorAll(s)], button=text=>$$('button').find(b=>b.textContent.trim()===text);
let serial=0;
async function click(node){assert(node,'button exists');assert(!node.disabled,'button enabled');await act(async()=>node.click());}
async function mount(game){await act(async()=>root.render(h(Player,{key:++serial,game,title:'تجربة'})));await click(button('ابدأ اللعب'));}
function one(kind){const g=exampleGame(kind);g.items=g.items.slice(0,1);g.settings.shuffle=false;return g;}
const complete=()=>assert(document.body.textContent.includes('أحسنت، أكملت التحدي!'));
try {
 for(const kind of ['matching','memory','quiz','true_false','sorting','wheel','number_line','fractions','maze'])assert.equal(validateGame(exampleGame(kind)),'',kind);
 assert(validateGame({...exampleGame('number_line'),step:'0'}));
 assert.throws(()=>importQuestions(emptyGame('matching'),[{prompt:'a',options:['2','3'],correct:0},{prompt:'b',options:['2','3'],correct:0}]));
 assert.throws(()=>importQuestions(emptyGame('true_false'),[{type:'mcq',prompt:'a',options:['2','3'],correct:0}]));
 for(const kind of ['quiz','true_false','maze']){await mount(one(kind));if(kind==='maze')assert(document.querySelector('.wm-maze'));await click($$('.wm-game-options button')[1]);assert(document.querySelector('.wm-game-feedback').textContent.includes('حاول'));await click($$('.wm-game-options button')[0]);complete();await click(button('إعادة اللعب'));assert(!document.body.textContent.includes('أحسنت، أكملت'));}
 await mount(one('wheel'));assert(document.querySelector('.wm-wheel'));await click(button('تدوير العجلة'));await click($$('.wm-game-options button')[0]);complete();
 let g=exampleGame('matching');g.items=g.items.slice(0,2);await mount(g);for(const item of g.items){const operation=$$('.wm-pairs>div:first-child button').find(b=>b.textContent.includes(item.prompt.replaceAll('$',''))); // KaTeX includes source in annotation; find by index if rendered math differs.
 const index=g.items.indexOf(item);await click(operation||$$('.wm-pairs>div:first-child button')[index]);await click($$('.wm-pairs>div:last-child button').find(b=>b.textContent===item.answer));}complete();
 g=exampleGame('memory');g.items=g.items.slice(0,2);g.settings.shuffle=false;const random=Math.random;Math.random=()=>0;await mount(g);Math.random=random;
 const order=shuffled(g.items.flatMap((i,id)=>[{id,side:0},{id,side:1}]),()=>0);
 for(let id=0;id<2;id++)for(const [index,card]of order.entries())if(card.id===id)await click($$('.wm-memory button')[index]);complete();
 await mount(one('sorting'));await click($$('.wm-game-options button')[0]);await click($$('.wm-sort-groups button')[0]);assert(document.body.textContent.includes('حاول مرة أخرى'));await click($$('.wm-game-options button')[0]);await click($$('.wm-sort-groups button')[1]);complete();
 await mount(one('sorting'));await act(async()=>{const e=new Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(e,'dataTransfer',{value:{getData:()=> '0'}});$$('.wm-sort-groups>div')[1].dispatchEvent(e);});complete();
 g=one('number_line');g.maximum='1';g.step='1/2';g.items[0].value='1/2';await mount(g);await click(document.querySelector('[aria-label="الموقع 0.5"]'));await click(button('تأكيد الموقع'));complete();
 await mount(one('fractions'));await click(document.querySelector('.wm-fraction button'));await click(button('تحقق من الكسر'));complete();
 g=one('quiz');g.settings.max_mistakes=1;await mount(g);await click($$('.wm-game-options button')[1]);assert(document.body.textContent.includes('انتهت المحاولات'));assert(!document.querySelector('.wm-game-options'));
 g=one('quiz');g.settings.seconds=1;await mount(g);await act(async()=>await new Promise(r=>setTimeout(r,1150)));assert(document.body.textContent.includes('انتهى الوقت'));
 // Editing and changing template use explicit confirmation; preview executes the real player.
 let current;function Editor(){const[value,setValue]=useState(emptyGame());current=value;return h(Builder,{value,onChange:setValue,title:'تجربة'});}
 await act(async()=>root.render(h(Editor)));await click(button('تعبئة مثال قابل للتعديل'));assert.equal(current.items.length,5);await click(button('٤ · معاينة اللعبة'));assert(button('ابدأ اللعب'));await click($$('.wm-kind-grid button')[1]);assert(document.querySelector('[role="alertdialog"]'));assert.equal(current.kind,'matching');await click(button('تغيير النوع وإفراغ العناصر'));assert.equal(current.kind,'quiz');assert.equal(current.items.length,0);await click(button('٤ · معاينة اللعبة'));assert(document.querySelector('[role="alert"]'));

 // Real teacher editor routing: save, versioned review, and separate teacher authorization.
 const originalFetch=globalThis.fetch, calls=[];sessionStorage.setItem('wemath.teacher.session.v1','teacher-session');
 const saved={id:7,title:'لعبة جديدة',grade:1,book_id:null,unit_id:null,lesson_id:null,external_url:'',game:exampleGame('matching'),version:1,status:'draft',can_publish:false};
 globalThis.fetch=async(url,options={})=>{calls.push({url,options});if(options.method==='POST'&&url.endsWith('/status'))return Response.json({...saved,status:'review',version:2});if(options.method==='POST')return Response.json(saved,{status:201});return Response.json(saved);};
 const router=createMemoryRouter([{path:'/teachers/games/new',element:h(TeacherPage)},{path:'/teachers/games/:gameId',element:h(TeacherPage)}],{initialEntries:['/teachers/games/new']});
 await act(async()=>root.render(h(CurriculumContext.Provider,{value:{catalog:{books:[]},error:null,retry:()=>{}}},h(RouterProvider,{router}))));
 const name=$$('label').find(n=>n.textContent.startsWith('اسم اللعبة')).querySelector('input');
 await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(name,'لعبة جديدة');name.dispatchEvent(new Event('input',{bubbles:true}));});
 await click(button('تعبئة مثال قابل للتعديل'));
 await act(async()=>document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 assert.equal(router.state.location.pathname,'/teachers/games/7');
 const creation=calls.find(c=>c.options.method==='POST');assert.equal(creation.options.headers.Authorization,'Bearer teacher-session');assert.equal(JSON.parse(creation.options.body).game.kind,'matching');
 await click(button('إرسال للمراجعة'));assert.equal(JSON.parse(calls.at(-1).options.body).version,1);assert(!button('نشر للطلاب'));assert(document.body.textContent.includes('بانتظار المراجعة'));
 globalThis.fetch=originalFetch;router.dispose();
 await act(async()=>root.unmount());console.log('PASS: all eight engines + true/false; keyboard/tap and drag sorting; fractional number line; visual fractions; maze progress; wrong answers, attempt limit, timer, replay, import validation, builder confirmation and real preview.');
}finally{dom.window.close();await rm(temp,{recursive:true,force:true});}
