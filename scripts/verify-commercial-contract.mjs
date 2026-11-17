// PR #128: bounded authorized commercial delta, anchored to immutable production.
// This module is a test only; it is never loaded by a public page.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

export const PRODUCTION_REF='2d6873bffbc66aafd1ff153a0455546b507a9759';
const manifest=JSON.parse(await readFile(new URL('../docs/reviews/commercial-premium/approved-commercial-delta.json',import.meta.url),'utf8'));
export const LEGACY_ASSERTION=" assert.equal(current,expected,`${path}: only shared asset versions and approved Diagnóstico V5 social metadata changed`);";
export const REVISED_ASSERTION=" if(['criacao-de-sites-valinhos/index.html','criacao-de-sites-campinas/index.html','diagnostico-digital/index.html'].includes(path)){\n  const {verifyCommercialTree,PRODUCTION_REF}=await import('./verify-commercial-contract.mjs');\n  assert.equal(expected,execFileSync('git',['show',PRODUCTION_REF+':'+path],{cwd:root,encoding:'utf8'}),path+': historical contract still resolves to the fixed production reference');\n  await verifyCommercialTree(root);\n }else{\n assert.equal(current,expected,`${path}: only shared asset versions and approved Diagnóstico V5 social metadata changed`);\n }";

export function assertLegacyGuardRevision(current,production){
 assert.equal(production.split(LEGACY_ASSERTION).length-1,1,'Historical guard has exactly one authorized assertion site');
 assert.equal(current,production.replace(LEGACY_ASSERTION,REVISED_ASSERTION),'Every other legacy assertion, baseline, engine and runtime check remains literal');
}

function single(html,re,label){
 const matches=[...html.matchAll(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'))];
 assert.equal(matches.length,1,'Exactly one '+label);
 return matches[0][0];
}
function schemas(html){
 return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
}
function runtimeScripts(html){
 return [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(m=>m[0]).filter(s=>!s.startsWith('<script type="application/ld+json">'));
}

export function assertApprovedCommercialPage(path,current,production){
 assert.equal(manifest.productionRef,PRODUCTION_REF,'The production reference is fixed, never HEAD');
 const operations=manifest.pages[path];
 assert.ok(operations?.length,'Only the five authorized commercial pages have deltas');
 // Independent semantic invariants, with presence/uniqueness checks (undefined is never a pass).
 for(const [label,re] of [
  ['title',/<title>[\s\S]*?<\/title>/],
  ['description',/<meta name="description"[^>]*>/],
  ['canonical',/<link rel="canonical"[^>]*>/],
  ['H1',/<h1\b[\s\S]*?<\/h1>/]
 ])assert.equal(single(current,re,path+' '+label),single(production,re,path+' historical '+label),path+' preserves '+label);
 const oldSchemas=schemas(production),newSchemas=schemas(current);
 for(const item of oldSchemas)assert.ok(newSchemas.some(value=>JSON.stringify(value)===JSON.stringify(item)),path+' preserves all historical structured data');
 if(path!=='diagnostico-digital/index.html')assert.deepEqual(newSchemas,oldSchemas,'No new service schema claims');
 else{
  assert.equal(newSchemas.length,1,'Exactly the approved diagnostic WebPage and breadcrumbs graph');
  assert.deepEqual(newSchemas[0]['@graph'].map(x=>x['@type']),['WebPage','BreadcrumbList']);
  assert.equal(newSchemas[0]['@graph'][0].url,'https://olegariotech.com.br/diagnostico-digital/');
 }
 const scripts=runtimeScripts(current);
 const contextTag='<script src="/assets/js/ot-commercial-context.js?v=1" defer></script>';
 assert.equal(scripts.filter(x=>x===contextTag).length,1,'Exactly one non-analytics origin/UTM helper');
 assert.deepEqual(scripts.filter(x=>x!==contextTag),runtimeScripts(production),path+' inline consent, GA4, Pixel and diagnostic script tags remain exact');
 const allWA=[...current.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)].map(m=>m[1]);
 const historicalWA=[...production.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)].map(m=>m[1]);
 assert.ok(historicalWA.length>0&&allWA.length>0,'Existing WhatsApp path is present');
 for(const href of historicalWA)assert.ok(allWA.includes(href),'Every existing WhatsApp message is preserved');
 for(const href of allWA){const url=new URL(href.replaceAll('&amp;','&'));assert.equal(url.pathname,'/5511912459144');}
 // Apply only explicit reviewed hunks to historical production. All regional copy,
 // markup, links, questions, options, cases and inline code outside those hunks stay byte-exact.
 // Each before-fragment must exist at its historical location; no full candidate HTML is a baseline.
 const lines=production.split('\n'),expected=[];let cursor=0;
 for(const op of operations){
  assert.ok(op.line-1>=cursor,'Ordered non-overlapping authorized changes');
  assert.deepEqual(lines.slice(op.line-1,op.line-1+op.remove.length),op.remove,path+' historical '+op.category+' anchor');
  expected.push(...lines.slice(cursor,op.line-1),...op.add);
  cursor=op.line-1+op.remove.length;
 }
 expected.push(...lines.slice(cursor));
 assert.equal(current,expected.join('\n'),path+': only the enumerated authorized delta is accepted');
 return {path,hunks:operations.length,semantic:['title','description','canonical','H1','schema','consent/scripts','WhatsApp','regional content and all remaining markup']};
}

export function mutationChecks(path,current,production){
 const variants=[
  ['H1',current.replace(/(<h1\b[^>]*>)/,'$1ALTERADO ')],
  ['duplicate H1',current.replace('</main>','<h1>Duplicado</h1></main>')],
  ['description',current.replace(/(<meta name="description" content=")/,'$1ALTERADO ')],
  ['canonical',current.replace(/(<link rel="canonical" href=")[^"]+/,'$1https://example.invalid/')],
  ['regional copy',current.replace(/(<p class="(?:lc-intro|lead)">)/,'$1Conteúdo regional indevido. ')],
  ['WhatsApp number',current.replaceAll('wa.me/5511912459144','wa.me/5511000000000')],
  ['WhatsApp message',current.replace('text=Ol%C3%A1','text=MensagemALTERADA')],
  ['tracking default',current.replace("analytics_storage:'denied'","analytics_storage:'granted'")],
  ['tracking script',current.replace('/assets/js/ot-analytics.js?v=9','/assets/js/unapproved-tracker.js')],
  ['new event',current.replace('</head>',"<script>gtag('event','unapproved');</script></head>")],
  ['navigation',current.replace('href="/criacao-de-sites-valinhos/"','href="/destino-incorreto/"')],
  ['schema',current.replace('"@type":"WebPage"','"@type":"FAQPage"')],
  ['OG path',current.replace('/assets/img/commercial/','/assets/img/missing/')],
  ['origin helper removed',current.replace('<script src="/assets/js/ot-commercial-context.js?v=1" defer></script>','')]
 ];
 if(path==='diagnostico-digital/index.html'){
  variants.push(['diagnostic option',current.replace('Gerar mais contatos','Opção indevida')]);
  variants.push(['diagnostic label',current.replace('for="nomeNegocio"','for="outroCampo"')]);
 }else variants.push(['diagnostic origin',current.replace(/origem=[a-z-]+/,'origem=unapproved')]);
 for(const [label,changed] of variants){
  assert.notEqual(changed,current,'Mutation really changes '+path+' '+label);
  assert.throws(()=>assertApprovedCommercialPage(path,changed,production),undefined,'Reject '+path+' '+label);
 }
 return variants.length;
}

let verifiedRoot;
export async function verifyCommercialTree(root){
 if(verifiedRoot===root)return;
 assert.equal(manifest.productionRef,PRODUCTION_REF);
 const historical=path=>execFileSync('git',['show',PRODUCTION_REF+':'+path],{cwd:root});
 const tree=execFileSync('git',['ls-tree','-r',PRODUCTION_REF],{cwd:root,encoding:'utf8'}).trim().split('\n');
 const objects=new Map(tree.map(line=>{const m=line.match(/^\d+ blob ([a-f0-9]{40})\t(.+)$/);assert.ok(m,'Expected a tracked blob: '+line);return [m[2],m[1]]}));
 const allFiles=[...objects.keys()];
 const blobID=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 const pages=Object.keys(manifest.pages);
 assert.deepEqual([...pages].sort(),['anuncios-google-instagram/index.html','criacao-de-sites-campinas/index.html','criacao-de-sites-valinhos/index.html','diagnostico-digital/index.html','presenca-no-google/index.html']);
 let protectedFiles=0,mutations=0;const verified=[];
 for(const path of allFiles){
  if(pages.includes(path))continue;
  const bytes=await readFile(resolve(root,path));
  if(path==='scripts/verify-premium-v3.mjs'){
   const previous=historical(path);
   assertLegacyGuardRevision(bytes.toString('utf8'),previous.toString('utf8'));
   assert.throws(()=>assertLegacyGuardRevision(bytes.toString('utf8').replace("const baseline=","const bypassBaseline="),previous.toString('utf8')),'Reject unrelated legacy guard mutation');
  }else if(path==='assets/js/ot-diagnostic-v2.js'){
   const previous=historical(path);
   const oldScroll="scrollIntoView({behavior:'smooth',block:'start'})";
   const newScroll="scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})";
   const old=previous.toString('utf8');assert.equal(old.split(oldScroll).length-1,1);
   assert.equal(bytes.toString('utf8'),old.replace(oldScroll,newScroll),'Diagnostic runtime permits only approved reduced-motion behavior');
  }else{
   assert.equal(blobID(bytes),objects.get(path),'Strict production blob identity: '+path);
   protectedFiles++;
  }
 }
 for(const path of pages){
  const current=await readFile(resolve(root,path),'utf8'),production=historical(path).toString('utf8');
  verified.push(assertApprovedCommercialPage(path,current,production));
  mutations+=mutationChecks(path,current,production);
 }
 // Approved visuals/UTM implementation are separately frozen; production remains the content reference.
 assert.equal(manifest.reviewedImplementationRef,'fb57fb8c73d3cc6b9f5bce13797cac33a7d7cfc9');
 for(const path of manifest.reviewedAssets)assert.equal(blobID(await readFile(resolve(root,path))),execFileSync('git',['rev-parse',manifest.reviewedImplementationRef+':'+path],{cwd:root,encoding:'utf8'}).trim(),'Previously approved visual asset blob: '+path);
 const report={productionRef:PRODUCTION_REF,reviewedAssetsRef:manifest.reviewedImplementationRef,protectedFiles,pages:verified,negativeMutationChecks:mutations,reviewedAssets:manifest.reviewedAssets.length,legacyGuard:'one exact assertion replacement; every other byte preserved'};
 console.log('OT_COMMERCIAL_CONTRACT '+JSON.stringify(report));
 verifiedRoot=root;
 return report;
}
