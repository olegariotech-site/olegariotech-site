import {projectApproved134,verifyApproved134Scope} from './verify-pre-ads-134-scope.mjs';
// Test-only, bounded editorial copy layer on top of the merged premium commercial site.
// It does not execute in public pages. Baseline is the exact approved PR #129 merge.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {isApprovedIssue126Path,assertApprovedIssue126File} from './verify-analytics-126-scope.mjs';
import {assertApprovedAdsOriginPage} from './verify-ads-whatsapp-origin-scope.mjs';

export const TRUST_BASE='ecf7e021327a83cdfec7a2dc7450783280d9fc8e';
const repoRoot=resolve(fileURLToPath(new URL('../',import.meta.url)));
const manifest=JSON.parse(await readFile(new URL('../docs/reviews/diagnostic-trust-copy/approved-copy.json',import.meta.url),'utf8'));
assert.equal(manifest.baseRef,TRUST_BASE,'Editorial baseline must be the approved published merge, not candidate HEAD');
export const TRUST_COPY_PATHS=Object.keys(manifest.files);
assert.deepEqual([...TRUST_COPY_PATHS].sort(),["assets/js/ot-diagnostic-v2.js","diagnostico-digital/index.html","index.html","scripts/verify-commercial-contract.mjs","scripts/verify-commercial-hotfix-contract.mjs","scripts/verify-commercial-premium.mjs","scripts/verify-premium-v3.mjs"],'Only approved editorial and test paths allowed');
const cache=new Map();
function release(path){
 if(!cache.has(path))cache.set(path,execFileSync('git',['show',TRUST_BASE+':'+path],{cwd:repoRoot,encoding:'utf8'}));
 return cache.get(path);
}
export function applyApprovedTrustCopy(path,source){
 const edits=manifest.files[path];
 if(!edits)return source;
 assert.equal(source,release(path),'Trust-copy input must equal fixed published bytes: '+path);
 let expected=source;
 for(const {before,after} of edits){
  assert.ok(before.length>0&&after.length>0&&before!==after,'Nontrivial bounded editorial change');
  assert.equal(expected.split(before).length-1,1,'Exactly one released anchor: '+path);
  expected=expected.replace(before,after);
 }
 return expected;
}
export async function verifyApprovedTrustCopyTree(root){
 let checked=0,mutations=0;
 for(const path of TRUST_COPY_PATHS){
  const source=release(path);
  const actual=projectApproved134(path,await readFile(resolve(root,path))).toString('utf8');
  if(isApprovedIssue126Path(path)){
   assertApprovedIssue126File(path,Buffer.from(actual));
  }else if(path==='diagnostico-digital/index.html'){
   assertApprovedAdsOriginPage(path,actual,applyApprovedTrustCopy(path,source));
  }else{
   assert.equal(actual,applyApprovedTrustCopy(path,source),'No unrelated code or text changed: '+path);
  }
  checked++;
  const changed=actual.replaceAll('Transmitir mais confiança aos clientes','Texto não autorizado');
  if(changed!==actual){
   assert.notEqual(changed,applyApprovedTrustCopy(path,source),'Reject option tampering: '+path);mutations++;
  }
 }
 const page=await readFile(resolve(root,'diagnostico-digital/index.html'),'utf8');
 const runtime=await readFile(resolve(root,'assets/js/ot-diagnostic-v2.js'),'utf8');
 const home=await readFile(resolve(root,'index.html'),'utf8');
 const choice='Transmitir mais confiança aos clientes';
 assert.ok(page.includes('data-value="'+choice+'"><span>'+choice+'</span>'),'Visible choice and exact stored value match');
 assert.ok(runtime.includes("if(objective==='Transmitir mais confiança aos clientes')return routes.presenca;"),'Preserves the existing trust recommendation');
 assert.ok(runtime.includes("'Objetivo: '+(answers.objetivo||'Não informado')"),'WhatsApp includes the objective selected by the visitor');
 assert.ok(home.includes('<strong>Quero transmitir mais confiança</strong>'),'Home needs section matches diagnosis message');
 assert.ok(!page.includes('Parecer mais profissional')&&!runtime.includes('Parecer mais profissional')&&!home.includes('Minha empresa não parece profissional'),'Old commercial copy removed in all three runtime surfaces');
 console.log('OT_TRUST_COPY '+JSON.stringify({publishedRef:TRUST_BASE,files:checked,negativeChecks:mutations,consumer:"Diagnosis + route + WhatsApp + home"}));
}
