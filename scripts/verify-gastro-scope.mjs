// OT Gastro Lab — PR #141. Narrow approved layer; no browser source projection.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const GASTRO_BASE='660037e53e8a87dcc91a3167d6390d34b5bc3883';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifestPath='docs/reviews/gastro-showcase/approved-delta.json';
const scopePath='scripts/verify-gastro-scope.mjs';
const manifest=JSON.parse(readFileSync(resolve(root,manifestPath),'utf8'));
assert.equal(manifest.baseRef,GASTRO_BASE);
const expectedPaths=['index.html','assets/css/ot-gastro-showcase.css','assets/js/ot-gastro-showcase.js','assets/img/gastro/cardapio-qr.svg','assets/img/gastro/pizza-especial-v03.webp','assets/img/gastro/hamburguer.webp','assets/img/gastro/bolo-chocolate-morangos-v03.webp','scripts/verify-issue-138-scope.mjs','scripts/verify-pre-ads-134-journeys.mjs','scripts/verify-gastro-showcase.mjs','.github/workflows/gastro-showcase-qa.yml'];
assert.deepEqual(Object.keys(manifest.reviewedBlobs).sort(),expectedPaths.toSorted());
const paths=new Set([...expectedPaths,manifestPath,scopePath]);
export const isApprovedGastroPath=path=>paths.has(path);
const blob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const base=path=>execFileSync('git',['show',GASTRO_BASE+':'+path],{cwd:root});
function stripHome(bytes){
 let s=bytes.toString('utf8');
 const remove=pattern=>{const matches=[...s.matchAll(pattern)];assert.equal(matches.length,1,'Exactly one bounded Gastro insertion: '+pattern);s=s.replace(pattern,'');};
 remove(/\n<p class="ot-gastro__jump">[^\n]*<\/p>\n/g);
 remove(/\n    <!-- OT GASTRO LAB SHOWCASE START -->[\s\S]*?    <!-- OT GASTRO LAB SHOWCASE END -->/g);
 remove(/  <link rel="stylesheet" href="\/assets\/css\/ot-gastro-showcase\.css\?v=3">\n  <script src="\/assets\/js\/ot-gastro-showcase\.js\?v=1" defer><\/script>\n/g);
 return Buffer.from(s);
}
export function assertGastroBlob(path,input){
 const bytes=Buffer.isBuffer(input)?input:Buffer.from(input);
 assert.ok(expectedPaths.includes(path),'Explicit reviewed path');
 assert.equal(blob(bytes),manifest.reviewedBlobs[path],'Exact reviewed Gastro bytes: '+path);
 if(path==='index.html')assert.deepEqual(stripHome(bytes),base(path),'Original home restored byte for byte');
 return true;
}
export function projectApprovedGastro(path,input){
 const bytes=Buffer.isBuffer(input)?input:Buffer.from(input);
 if(['index.html','scripts/verify-pre-ads-134-journeys.mjs','scripts/verify-issue-138-scope.mjs'].includes(path)&&blob(bytes)===manifest.reviewedBlobs[path]){
  assertGastroBlob(path,bytes);return base(path);
 }
 return bytes;
}
export function verifyApprovedGastroScope(directory=root){
 for(const path of expectedPaths)assertGastroBlob(path,readFileSync(resolve(directory,path)));
 const changed=execFileSync('git',['diff','--name-only','-z',GASTRO_BASE,'--'],{cwd:directory,encoding:'utf8'}).split('\0').filter(Boolean);
 assert.deepEqual(changed.sort(),[...paths].sort(),'Only exact approved Gastro files and gates may differ from main');
 const negative=[['index.html','<h1>','<h1>UNAPPROVED '],['index.html','https://olegariotech-site.github.io/ot-cardapio-3d/','https://evil.example/'],['assets/js/ot-gastro-showcase.js','input.value','document.cookie'],['assets/css/ot-gastro-showcase.css','--g-cyan:#67e8f9','--g-cyan:#ffffff'],['scripts/verify-pre-ads-134-journeys.mjs','assert.equal(pair[0].info.h1','assert.notEqual(pair[0].info.h1']];
 for(const [path,from,to] of negative){const original=readFileSync(resolve(directory,path),'utf8'),mutated=original.replace(from,to);assert.notEqual(mutated,original);assert.throws(()=>assertGastroBlob(path,mutated));if(path==='index.html')assert.deepEqual(projectApprovedGastro(path,mutated),Buffer.from(mutated),'No projection for changed bytes');}
 return {status:'PASS',base:GASTRO_BASE,reviewed:expectedPaths.length,negative:negative.length};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(verifyApprovedGastroScope()));
