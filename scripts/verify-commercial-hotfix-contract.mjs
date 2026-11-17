// Post-publication visual hotfix. Production is immutable; only enumerated edits are accepted.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {applyApprovedTrustCopy,TRUST_COPY_PATHS,verifyApprovedTrustCopyTree} from './verify-approved-trust-copy.mjs';
import {isApprovedIssue126Path,assertApprovedIssue126File,verifyApprovedIssue126Scope} from './verify-analytics-126-scope.mjs';

export const PUBLISHED_REF='7dfb0eeaccccfa63fe6f305f19c04884dcd62c30';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const manifest=JSON.parse(await readFile(new URL('../docs/reviews/commercial-hotfix/approved-visual-hotfix.json',import.meta.url),'utf8'));
assert.equal(manifest.publishedRef,PUBLISHED_REF,'Published base must not follow the candidate HEAD');
assert.deepEqual(Object.keys(manifest.files).sort(),['anuncios-google-instagram/index.html','assets/css/ot-commercial-premium.css','scripts/verify-commercial-contract.mjs','scripts/verify-commercial-premium.mjs','scripts/verify-local-pages.mjs']);
const published=new Map();
function source(path){
 if(!published.has(path))published.set(path,execFileSync('git',['show',PUBLISHED_REF+':'+path],{cwd:root,encoding:'utf8'}));
 return published.get(path);
}
export function applyApprovedVisualHotfix(path,original){
 const operations=manifest.files[path];
 if(!operations)return original;
 assert.equal(original,source(path),'Hotfix input must still equal the published file: '+path);
 const lines=original.match(/[^\n]*\n|[^\n]+$/g)||[],result=[];let cursor=0;
 for(const op of operations){
  const start=op.line-1,count=(op.before.match(/\n/g)||[]).length;
  assert.ok(op.before.length>0&&count>0,'Every edit has a nonempty published anchor');
  assert.ok(start>=cursor,'Edits are ordered and nonoverlapping');
  assert.equal(lines.slice(start,start+count).join(''),op.before,'Exact published anchor: '+path);
  result.push(lines.slice(cursor,start).join(''),op.after);cursor=start+count;
 }
 result.push(lines.slice(cursor).join(''));
 return result.join('');
}
export function assertPublishedHotfixFile(path,current,original){
 assert.equal(current,applyApprovedVisualHotfix(path,original),'Only the authorized visual/test changes: '+path);
}
let verified;
export async function verifyPublishedHotfixScope(directory){
 if(verified===directory)return;
 const records=execFileSync('git',['ls-tree','-r','-z',PUBLISHED_REF],{cwd:directory,encoding:'utf8'}).split('\0').filter(Boolean);
 let unchanged=0,bounded=0;
 for(const record of records){
  const match=record.match(/^\d+ blob ([a-f0-9]{40})\t(.+)$/);assert.ok(match,'Expected published blob');
  const [,id,path]=match,bytes=await readFile(resolve(directory,path));
  if(isApprovedIssue126Path(path)){
   assertApprovedIssue126File(path,bytes);
   bounded++;
  }else if(manifest.files[path]){
   assert.equal(bytes.toString('utf8'),applyApprovedTrustCopy(path,applyApprovedVisualHotfix(path,source(path))),'Published visual hotfix plus only approved editorial changes: '+path);
   bounded++;
  }else if(TRUST_COPY_PATHS.includes(path)){
   assert.equal(bytes.toString('utf8'),applyApprovedTrustCopy(path,source(path)),'Only approved editorial change: '+path);
   bounded++;
  }else{
   assert.equal(execFileSync('git',['hash-object','--no-filters','--stdin'],{cwd:directory,input:bytes,encoding:'utf8'}).trim(),id,'Published file remains byte-exact: '+path);
   unchanged++;
  }
 }
 const ads=await readFile(resolve(directory,'anuncios-google-instagram/index.html'),'utf8');
 const css=await readFile(resolve(directory,'assets/css/ot-commercial-premium.css'),'utf8');
 const mutations=[
  ['anuncios-google-instagram/index.html',ads.replace('<title>','<title>Changed ')],
  ['anuncios-google-instagram/index.html',ads.replace("analytics_storage:'denied'","analytics_storage:'granted'")],
  ['anuncios-google-instagram/index.html',ads.replace('wa.me/5511912459144','wa.me/5511000000000')],
  ['anuncios-google-instagram/index.html',ads.replace('Empresa fictícia. Composição ilustrativa','Campanha de cliente real')],
  ['anuncios-google-instagram/index.html',ads.replace('Coletas em Valinhos','Resultados garantidos em Valinhos')],
  ['anuncios-google-instagram/index.html',ads.replace('</head>','<script src="https://example.invalid/tracker.js"></script></head>')],
  ['assets/css/ot-commercial-premium.css',css.replace('position:relative;left:auto;right:auto;bottom:auto','position:fixed;left:0;right:0;bottom:0')],
  ['assets/css/ot-commercial-premium.css',css+'\n.ot-consent-settings{display:none}\n'],
  ['assets/css/ot-commercial-premium.css',css.replace('min-height:44px;padding:0 14px','min-height:20px;padding:0 14px')],
  ['index.html',source('index.html').replace('<title>','<title>Changed ')]
 ];
 for(const [path,changed] of mutations){
  const current=await readFile(resolve(directory,path),'utf8');assert.notEqual(changed,current,'Mutation changes its input');
  assert.throws(()=>assertPublishedHotfixFile(path,changed,source(path)),undefined,'Reject unauthorized edit: '+path);
 }
 await verifyApprovedTrustCopyTree(directory);
 await verifyApprovedIssue126Scope(directory);
 const report={publishedRef:PUBLISHED_REF,unchangedFiles:unchanged,boundedFiles:bounded,negativeChecks:mutations.length,productionFiles:['anuncios-google-instagram/index.html','assets/css/ot-commercial-premium.css'],editorialBase:'ecf7e021327a83cdfec7a2dc7450783280d9fc8e'};
 console.log('OT_PUBLISHED_HOTFIX_CONTRACT '+JSON.stringify(report));verified=directory;return report;
}
