import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
const project=fileURLToPath(new URL('..',import.meta.url)),require=createRequire(`${project}/package.json`);
const temp=await mkdtemp(path.join(project,'.media-test-')),bundle=path.join(temp,'test.cjs');
await build({stdin:{contents:"export {default as MediaEditor} from './src/features/admin/MediaEditor.jsx'; export {default as MediaGallery} from './src/shared/media/MediaGallery.jsx';",resolveDir:project,loader:'jsx'},outfile:bundle,define:{'import.meta.env':'{}'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'react',setup(api){api.onResolve({filter:/^(react|react-dom)(\/.*)?$/},args=>({path:require.resolve(args.path),external:true}));}}]});
const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost/admin',pretendToBeVisual:true});
for(const key of ['window','document','HTMLElement','HTMLInputElement','HTMLTextAreaElement','Event','File','sessionStorage'])globalThis[key]=dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const originalFetch=globalThis.fetch,originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL,originalXHR=globalThis.XMLHttpRequest;
let serial=0,created=[],revoked=[],sent=[],previewRequests=[];
URL.createObjectURL=()=>{const url=`blob:test-${++serial}`;created.push(url);return url;};URL.revokeObjectURL=url=>revoked.push(url);
globalThis.fetch=async(url,opts)=>{previewRequests.push({url,opts});return new Response(new Uint8Array([1,2,3]));};
class XHR {
 constructor(){this.upload={};this.headers={};}
 open(method,url){this.method=method;this.url=url;}
 setRequestHeader(key,value){this.headers[key]=value;}
 send(file){this.file=file;sent.push(this);}
 abort(){this.onabort();}
 complete(status=201){this.status=status;this.responseText=JSON.stringify(status===201?{asset_id:'00000000-0000-0000-0000-000000000001',kind:this.file.type.startsWith('video')?'video':'image'}:{detail:'ليس لديك وصول'});this.onload();}
}
globalThis.XMLHttpRequest=XHR;sessionStorage.setItem('wemath.cms.session.v1','staff-token');
const {createElement:h,act,useState}=require('react'),{createRoot}=require('react-dom/client'),{MediaEditor,MediaGallery}=require(bundle);
const root=createRoot(document.querySelector('#root'));let last,busy;
function App({module='story_video'}){const [value,setValue]=useState([]),[working,setWorking]=useState(false);last=value;busy=working;return h(MediaEditor,{value,onChange:setValue,workspaceId:7,module,onBusy:setWorking});}
const $$=s=>[...document.querySelectorAll(s)],button=text=>$$('button').find(n=>n.textContent.trim()===text);
async function settle(){await act(async()=>{for(let i=0;i<4;i++)await new Promise(r=>setTimeout(r,0));});}
async function click(node){assert(node);await act(async()=>node.click());await settle();}
async function drop(file){await act(async()=>{const e=new Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(e,'dataTransfer',{value:{files:[file]}});document.querySelector('.cms-media-drop').dispatchEvent(e);});await settle();}
try{
 await act(async()=>root.render(h(App)));await settle();
 await drop(new File(['bad'],'bad.svg',{type:'image/svg+xml'}));assert.equal(sent.length,0);assert(document.querySelector('[role="alert"]'));
 await drop(new File(['png'],'picture.png',{type:'image/png'}));assert(busy);assert.equal(sent.length,1);assert(document.querySelector('img').src.startsWith('blob:'));
 assert.equal(sent[0].headers.Authorization,'Bearer staff-token');assert(sent[0].url.includes('workspace_id=7'));assert(sent[0].url.includes('module=story_video'));
 await act(async()=>sent[0].upload.onprogress({lengthComputable:true,loaded:1,total:2}));assert.equal(document.querySelector('progress').value,50);
 await act(async()=>sent[0].complete());await settle();assert(!busy);assert.equal(last.length,1);assert.equal(previewRequests[0].opts.headers.Authorization,'Bearer staff-token');
 const alt=$$('label').find(n=>n.textContent.startsWith('وصف الصورة')).querySelector('input');
 await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(alt,'صورة القصة');alt.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(last[0].alt,'صورة القصة');
 await click(button('إزالة من المادة'));assert.equal(last.length,0);
 await drop(new File(['png'],'picture.png',{type:'image/png'}));await click(button('إلغاء الرفع'));assert(!busy);assert.equal(last.length,0);
 await drop(new File(['png'],'picture.png',{type:'image/png'}));await act(async()=>sent.at(-1).complete(403));await settle();assert.equal(last.length,0);assert(document.querySelector('[role="alert"]').textContent.includes('ليس لديك وصول'));
 await act(async()=>root.render(h(App,{key:'film',module:'film'})));await settle();
 const before=sent.length;await drop(new File(['png'],'picture.png',{type:'image/png'}));assert.equal(sent.length,before);
 await drop(new File(['movie'],'movie.mp4',{type:'video/mp4'}));assert(document.querySelector('video'));await act(async()=>sent.at(-1).complete());await settle();assert.equal(last[0].kind,'video');
 await act(async()=>root.render(h(MediaGallery,{items:last})));assert(document.querySelector('video').src.includes('/api/media/'));
 await act(async()=>root.unmount());assert(created.every(url=>revoked.includes(url)),'All object URLs must be released');
 console.log('PASS: drag/drop validation, real file request shape, progress, authenticated preview, alt editing/removal, cancel, failed upload, film video, public gallery and object URL cleanup. HTTP/XHR mocked.');
}finally{globalThis.fetch=originalFetch;globalThis.XMLHttpRequest=originalXHR;URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;dom.window.close();await rm(temp,{recursive:true,force:true});}
