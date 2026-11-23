// Independent exact-byte gate for the delta authorized by Issue #138.
// Historical assertions receive their previously reviewed bytes only AFTER this
// gate validates every actual candidate. Browser tests never use that projection.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const BASE138='a09087d4aaf33b590ea3cc77e3357ef92d8b33bd';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(readFileSync(new URL('../docs/reviews/issue-138/approved-delta.json',import.meta.url)));
assert.equal(manifest.baseRef,BASE138);
const html=['index.html','anuncios-google-instagram/index.html','criacao-de-sites-campinas/index.html','criacao-de-sites-valinhos/index.html','diagnostico-digital/index.html','presenca-no-google/index.html','cookies/index.html','privacidade/index.html','produtos/index.html'];
const files=[...html,'assets/js/ot-analytics-core.js','assets/js/ot-commercial-context.js','assets/js/ot-google-measurement.js','assets/js/ot-analytics.js','assets/ot-google-measurement.html','scripts/verify-analytics-126-scope.mjs','scripts/verify-commercial-contract.mjs'];
assert.deepEqual(Object.keys(manifest.reviewedBlobs).sort(),files.toSorted(),'No filename-only runtime exception');
const cache=new Map();
function base(path){if(!cache.has(path))cache.set(path,execFileSync('git',['show',BASE138+':'+path],{cwd:root}));return cache.get(path);}
const blob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
export function assertCandidate138(path,input){
 const bytes=Buffer.isBuffer(input)?input:Buffer.from(input);
 assert.ok(files.includes(path),'Only the reviewed delta has a projection');
 assert.equal(blob(bytes),manifest.reviewedBlobs[path],'Exact reviewed Issue 138 bytes: '+path);
 return true;
}
export function projectApproved138(path,input){
 const bytes=Buffer.isBuffer(input)?input:Buffer.from(input);
 if(files.includes(path)&&blob(bytes)===manifest.reviewedBlobs[path])return base(path);
 // No blanket exception: all other bytes continue to the unchanged historical
 // comparisons and negative controls, where unauthorized variants must fail.
 return bytes;
}
export function verifyApproved138Scope(directory=root){
 for(const path of files)assertCandidate138(path,readFileSync(resolve(directory,path)));
 const guard='scripts/verify-pre-ads-134-scope.mjs';
 let expected=base(guard).toString();
 expected=expected.replace('// Browser tests always serve the actual candidate files, never this test-only projection.','// Browser tests always serve the actual candidate files, never this test-only projection.\nimport {projectApproved138,verifyApproved138Scope} from \'./verify-issue-138-scope.mjs\';');
 expected=expected.replace('export function projectApproved134(path,input){','export function projectApproved134(path,input){\n input=projectApproved138(path,input);');
 expected=expected.replace('export function verifyApproved134Scope(directory=root){','export function verifyApproved134Scope(directory=root){\n verifyApproved138Scope(directory);');
 assert.equal(readFileSync(resolve(directory,guard),'utf8'),expected,'Only the new gate hooks may change the historical guard; every prior assertion stays literal');
 for(const path of html){
  let expected=base(path).toString().replace('/assets/js/ot-analytics.js?v=10','/assets/js/ot-analytics.js?v=11').replace('/assets/js/ot-commercial-context.js?v=3','/assets/js/ot-commercial-context.js?v=4');
  assert.equal(readFileSync(resolve(directory,path),'utf8'),expected,'HTML changes are cache keys only: '+path);
 }
 const negative=[
  ['assets/js/ot-commercial-context.js',"if(url.origin!==location.origin||!sources[url.pathname])return;","if(false)return;"],
  ['assets/js/ot-commercial-context.js',"get('debug_analytics')==='1'","has('debug_analytics')"],
  ['assets/js/ot-commercial-context.js','OT-GADS-SITES-VALINHOS','UNAPPROVED'],
  ['assets/js/ot-analytics-core.js',"track('click_whatsapp'","track('generate_lead'"],
  ['assets/js/ot-analytics-core.js',"question_name: safeText(name),","question_name: safeText(name), answer_category: option.dataset.value,"],
  ['assets/js/ot-google-measurement.js','if(data.debug===true)config.debug_mode=true;','config.debug_mode=false;'],
  ['assets/js/ot-google-measurement.js','permitted()?beacon','true?beacon'],
  ['assets/js/ot-google-measurement.js','event.origin!==location.origin','false'],
  ['index.html','<h1>','<h1>UNAPPROVED ']
 ];
 for(const [path,before,after] of negative){const source=readFileSync(resolve(directory,path),'utf8'),mutated=source.replace(before,after);assert.notEqual(mutated,source,'Negative control changes real bytes: '+path);assert.throws(()=>assertCandidate138(path,mutated));}
 const changed=execFileSync('git',['diff','--name-only',BASE138,'--'],{cwd:directory,encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const allowed=new Set([...files,guard]);
 for(const path of changed)assert.ok(allowed.has(path)||path.startsWith('docs/reviews/issue-138/')||path==='scripts/verify-issue-138-scope.mjs'||path==='scripts/verify-issue-138.mjs'||path==='.github/workflows/issue-138-qa.yml','No unrelated tracked change: '+path);
 return {status:'PASS',base:BASE138,pinnedFiles:files.length,negativeControls:negative.length,historicalAssertions:'preserved'};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(verifyApproved138Scope()));
