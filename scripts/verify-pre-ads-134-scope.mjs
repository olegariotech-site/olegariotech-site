// Issue #134 authorization: bounded cache/accessibility edits and frozen runtime deltas.
// Historical assertions see their own approved bytes ONLY after this independent gate.
// Browser tests always serve the actual candidate files, never this test-only projection.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const CORRECTION_BASE='70ae38a45831f03ea5e52e5bf45e7d61e1c2b942';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(readFileSync(new URL('../docs/reviews/pre-ads-134/approved-correction.json',import.meta.url),'utf8'));
assert.equal(manifest.baseRef,CORRECTION_BASE,'Authorization starts from the actual immutable main');
export const CORRECTION_HTML=Object.freeze(['index.html','anuncios-google-instagram/index.html','criacao-de-sites-campinas/index.html','criacao-de-sites-valinhos/index.html','diagnostico-digital/index.html','presenca-no-google/index.html','cookies/index.html','privacidade/index.html','produtos/index.html']);
export const CORRECTION_PINNED=Object.freeze(['assets/js/ot-analytics-core.js','assets/js/ot-commercial-context.js','scripts/verify-analytics-126-scope.mjs','scripts/verify-ads-whatsapp-origin-scope.mjs','scripts/verify-commercial-contract.mjs','scripts/verify-commercial-hotfix-contract.mjs','scripts/verify-approved-trust-copy.mjs','scripts/verify-premium-v3.mjs','scripts/verify-ads-whatsapp-origin.mjs','scripts/verify-local-pages.mjs','scripts/verify-commercial-premium.mjs','scripts/verify-commercial-hotfix.mjs','scripts/verify-showroom.mjs','scripts/verify-premium-v3-final.mjs','scripts/verify-earth-mobile.mjs','.github/workflows/premium-v3-qa.yml','.github/workflows/showroom-integration-qa.yml','.github/workflows/codeql.yml','.github/workflows/commercial-premium-qa.yml','.github/workflows/seo-local-pages-qa.yml']);
export const CORRECTION_NEW_RUNTIME=Object.freeze(['assets/ot-google-measurement.html','assets/js/ot-google-measurement.js']);
assert.deepEqual(Object.keys(manifest.reviewedBlobs).sort(),[...CORRECTION_PINNED,...CORRECTION_NEW_RUNTIME].sort(),'No filename-only or unlisted runtime/guard exception');
const cache=new Map();
function base(path,ref=CORRECTION_BASE){const key=ref+':'+path;if(!cache.has(key))cache.set(key,execFileSync('git',['show',key],{cwd:root}));return cache.get(key);}
const blob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
function replaceOnce(text,before,after,path){assert.equal(text.split(before).length-1,1,'Exactly one authorized anchor: '+path);return text.replace(before,after);}
export function approved134HTML(path){
 assert.ok(CORRECTION_HTML.includes(path));let text=base(path).toString('utf8');
 text=replaceOnce(text,'/assets/js/ot-analytics.js?v=9','/assets/js/ot-analytics.js?v=10',path);
 if(path==='index.html'){text=replaceOnce(text,'<script src="/assets/js/ot-analytics.js?v=10" defer></script>','<script src="/assets/js/ot-analytics.js?v=10" defer></script>\n  <script src="/assets/js/ot-commercial-context.js?v=3" defer></script>',path);}
 else if(text.includes('/assets/js/ot-commercial-context.js?v=2'))text=replaceOnce(text,'/assets/js/ot-commercial-context.js?v=2','/assets/js/ot-commercial-context.js?v=3',path);
 if(path==='cookies/index.html'){
  text=replaceOnce(text,'<div class="table-wrap">','<div class="table-wrap" tabindex="0" role="region" aria-label="Tabela de tecnologias e cookies utilizados">',path);
  text=replaceOnce(text,'table{width:100%;border-collapse:collapse;min-width:720px','.table-wrap:focus-visible{outline:2px solid var(--ice);outline-offset:4px}table{width:100%;border-collapse:collapse;min-width:720px',path);
 }
 return text;
}
export function projectApproved134(path,input){
 const bytes=Buffer.isBuffer(input)?input:Buffer.from(input);
 if(CORRECTION_NEW_RUNTIME.includes(path)){assert.equal(blob(bytes),manifest.reviewedBlobs[path],'Exact new SDK-lifecycle asset: '+path);return bytes;}
 // Idempotent composition of the historical layers. The entry gate below requires
 // the actual files to contain the correction, so reverting it never passes QA.
 if((CORRECTION_HTML.includes(path)||CORRECTION_PINNED.includes(path)||path==='assets/js/ot-analytics.js')&&bytes.equals(base(path)))return bytes;
 if(CORRECTION_HTML.includes(path)){assert.equal(bytes.toString('utf8'),approved134HTML(path),'Only authorized cache/context/focus HTML edits: '+path);return base(path);}
 if(path==='assets/js/ot-analytics.js'){
  const expected=replaceOnce(base(path).toString('utf8'),'ot-analytics-core.js?v=8','ot-analytics-core.js?v=9',path);
  assert.equal(bytes.toString('utf8'),expected,'Only the core cache version is changed in the visual loader');return base(path);
 }
 if(CORRECTION_PINNED.includes(path)){assert.equal(blob(bytes),manifest.reviewedBlobs[path],'Exact reviewed #134 blob: '+path);return base(path);}
 if(path==='README.md'){
  // PR #135 was already merged into main; never revert or alter that approved copy.
  if(bytes.equals(base(path,'6bbc1bff045bdecbff30fedf98c0c14e0da45ea0')))return bytes;
  assert.deepEqual(bytes,base(path),'Keep the current published README exact');
  return base(path,'6bbc1bff045bdecbff30fedf98c0c14e0da45ea0');
 }
 return bytes;
}
export function verifyApproved134Scope(directory=root){
 for(const path of CORRECTION_NEW_RUNTIME)projectApproved134(path,readFileSync(resolve(directory,path)));
 for(const path of [...CORRECTION_HTML,...CORRECTION_PINNED,'assets/js/ot-analytics.js']){
  const bytes=readFileSync(resolve(directory,path));
  assert.ok(!bytes.equals(base(path)),'Actual candidate must contain the authorized correction: '+path);
  projectApproved134(path,bytes);
 }
 assert.deepEqual(readFileSync(resolve(directory,'README.md')),base('README.md'),'Approved current-main documentation is unchanged');
 const negative=[
  ['index.html',approved134HTML('index.html').replace('<h1>','<h1>UNAPPROVED ')],
  ['cookies/index.html',approved134HTML('cookies/index.html').replace('tabindex="0"','tabindex="-1"')],
  ['assets/js/ot-analytics-core.js',readFileSync(resolve(directory,'assets/js/ot-analytics-core.js'),'utf8').replace("'autoConfig', false","'autoConfig', true")],
  ['assets/js/ot-analytics-core.js',readFileSync(resolve(directory,'assets/js/ot-analytics-core.js'),'utf8').replace("window['ga-disable-' + GA_ID] = true;","window['ga-disable-' + GA_ID] = false;")],
  ['assets/js/ot-commercial-context.js',readFileSync(resolve(directory,'assets/js/ot-commercial-context.js'),'utf8').replace('OT-GADS-SITES-VALINHOS','UNAPPROVED-MARKER')],
  ['assets/js/ot-google-measurement.js',readFileSync(resolve(directory,'assets/js/ot-google-measurement.js'),'utf8').replace('active?beacon','true?beacon')],
  ['assets/js/ot-google-measurement.js',readFileSync(resolve(directory,'assets/js/ot-google-measurement.js'),'utf8').replace('event.origin!==location.origin','false')],
  ['assets/js/ot-analytics-core.js',readFileSync(resolve(directory,'assets/js/ot-analytics-core.js'),'utf8').replace('frame.contentWindow.OTGoogleMeasurement?.stop();','')]
 ];
 for(const [path,text] of negative){assert.notEqual(text,readFileSync(resolve(directory,path),'utf8'),'Mutation changes a real target');assert.throws(()=>projectApproved134(path,Buffer.from(text)),undefined,'Reject unrelated or unsafe #134 change: '+path);}
 console.log('OT_PRE_ADS_134_SCOPE '+JSON.stringify({base:CORRECTION_BASE,html:CORRECTION_HTML.length,pinned:CORRECTION_PINNED.length,negativeChecks:negative.length,visualAssetsChanged:0}));
}
