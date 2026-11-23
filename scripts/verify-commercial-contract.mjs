import {projectApproved134,verifyApproved134Scope} from './verify-pre-ads-134-scope.mjs';
// PR #128: bounded authorized commercial delta, anchored to immutable production.
// This module is a test only; it is never loaded by a public page.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {applyApprovedVisualHotfix,verifyPublishedHotfixScope} from './verify-commercial-hotfix-contract.mjs';
import {applyApprovedTrustCopy} from './verify-approved-trust-copy.mjs';
import {isApprovedIssue126Path,assertApprovedIssue126File} from './verify-analytics-126-scope.mjs';
import {ADS_ORIGIN_PATH,assertApprovedAdsOriginFile,assertApprovedAdsOriginPage,verifyApprovedAdsOriginScope} from './verify-ads-whatsapp-origin-scope.mjs';

export const PRODUCTION_REF='2d6873bffbc66aafd1ff153a0455546b507a9759';
const manifest=JSON.parse(await readFile(new URL('../docs/reviews/commercial-premium/approved-commercial-delta.json',import.meta.url),'utf8'));
export const LEGACY_ASSERTION=" assert.equal(current,expected,`${path}: only shared asset versions and approved Diagnóstico V5 social metadata changed`);";
export const REVISED_ASSERTION=" if(['criacao-de-sites-valinhos/index.html','criacao-de-sites-campinas/index.html','diagnostico-digital/index.html'].includes(path)){\n  const {verifyCommercialTree,PRODUCTION_REF}=await import('./verify-commercial-contract.mjs');\n  assert.equal(expected,execFileSync('git',['show',PRODUCTION_REF+':'+path],{cwd:root,encoding:'utf8'}),path+': historical contract still resolves to the fixed production reference');\n  await verifyCommercialTree(root);\n }else{\n assert.equal(current,expected,`${path}: only shared asset versions and approved Diagnóstico V5 social metadata changed`);\n }";

export function assertLegacyGuardRevision(current,production){
 current=projectApproved134('scripts/verify-premium-v3.mjs',current).toString('utf8');
 assert.equal(production.split(LEGACY_ASSERTION).length-1,1,'Historical guard has exactly one authorized assertion site');
 const expected=applyApprovedTrustCopy('scripts/verify-premium-v3.mjs',production.replace(LEGACY_ASSERTION,REVISED_ASSERTION));
 const priorImport="import {execFileSync} from 'node:child_process';";
 const nextImport=priorImport+"\nimport {assertApprovedIssue126File} from './verify-analytics-126-scope.mjs';";
 const priorAssertion="assert.equal(analyticsAfter.slice(0,analyticsAfter.indexOf('  let consentReturnFocus')),analyticsBefore.slice(0,analyticsBefore.indexOf('  function bannerTemplate()')),'consent guards, tag loaders and analytic events unchanged');";
 const nextAssertion="assertApprovedIssue126File('assets/js/ot-analytics-core.js',Buffer.from(analyticsAfter));\nassert.equal(analyticsAfter.slice(0,analyticsAfter.indexOf('  function analyticsDestinationUrl(')),analyticsBefore.slice(0,analyticsBefore.indexOf('  function linkParams(')),'unchanged GA4/Meta initialization, consent guards and prior tracking');";
 assert.equal(expected.split(priorImport).length-1,1,'V3 import anchor is unchanged');
 assert.equal(expected.split(priorAssertion).length-1,1,'V3 event-guard anchor is unchanged');
 assert.equal(current,expected.replace(priorImport,nextImport).replace(priorAssertion,nextAssertion),'V3 historical guard only permits pinned Issue #126 analytics changes, preserving every other byte');
}

function single(html,re,label){
 const matches=[...html.matchAll(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'))];
 assert.equal(matches.length,1,'Exactly one '+label);
 return matches[0][0];
}
// Parse script elements with the browser's HTML parser, never a tag-filter regex.
// Documents are inert, detached and offline; no page script is evaluated.
const scriptInventory=new Map();
let parserPage;
async function inventoryHTML(html){
 if(scriptInventory.has(html))return;
 assert.ok(parserPage,'HTML parser must be initialized');
 const scripts=await parserPage.evaluate(source=>{
  const document=new DOMParser().parseFromString(source,'text/html');
  return [...document.querySelectorAll('script')].map(script=>({type:script.type.toLowerCase(),text:script.textContent,markup:script.outerHTML}));
 },html);
 scriptInventory.set(html,scripts);
}
function parsedScripts(html){
 assert.ok(scriptInventory.has(html),'All HTML must be parsed before its script inventory is checked');
 return scriptInventory.get(html);
}
function schemas(html){
 return parsedScripts(html).filter(script=>script.type==='application/ld+json').map(script=>JSON.parse(script.text));
}
function runtimeScripts(html){
 return parsedScripts(html).filter(script=>script.type!=='application/ld+json').map(script=>script.markup);
}

export function assertApprovedCommercialPage(path,current,production){
 current=projectApproved134(path,current).toString('utf8');
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
 const contextTag='<script src="/assets/js/ot-commercial-context.js?v=2" defer=""></script>';
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
 assertApprovedAdsOriginPage(path,current,applyApprovedTrustCopy(path,applyApprovedVisualHotfix(path,expected.join('\n'))));
 return {path,hunks:operations.length,semantic:['title','description','canonical','H1','schema','consent/scripts','WhatsApp','regional content and all remaining markup']};
}

export async function mutationChecks(path,current,production){
 const variants=[
  ['H1',current.replace(/(<h1\b[^>]*>)/,'$1ALTERADO ')],
  ['duplicate H1',current.replace('</main>','<h1>Duplicado</h1></main>')],
  ['description',current.replace(/(<meta name="description" content=")/,'$1ALTERADO ')],
  ['canonical',current.replace(/(<link rel="canonical" href=")[^"]+/,'$1https://example.invalid/')],
  ['regional copy',current.replace(/(<p class="(?:lc-intro|lead)">)/,'$1Conteúdo regional indevido. ')],
  ['WhatsApp number',current.replaceAll('wa.me/5511912459144','wa.me/5511000000000')],
  ['WhatsApp message',current.replace('text=Ol%C3%A1','text=MensagemALTERADA')],
  ['tracking default',current.replace("analytics_storage:'denied'","analytics_storage:'granted'")],
  ['tracking script',current.replace(/\/assets\/js\/ot-analytics\.js\?v=\d+/,'/assets/js/unapproved-tracker.js')],
  ['new event',current.replace('</head>',"<script>gtag('event','unapproved');</script></head>")],
  ['navigation',current.replace('href="/criacao-de-sites-valinhos/"','href="/destino-incorreto/"')],
  ['schema',current.replace('"@type":"WebPage"','"@type":"FAQPage"')],
  ['OG path',current.replace('/assets/img/commercial/','/assets/img/missing/')],
  ['origin helper removed',current.replace('<script src="/assets/js/ot-commercial-context.js?v=3" defer></script>','')]
 ];
 for(const [label,injected] of [
  ['upper-case script',"<SCRIPT>gtag('event','unapproved');</SCRIPT>"],
  ['mixed-case script',"<sCrIpT>gtag('event','unapproved');</sCrIpT>"]
 ]){
  await inventoryHTML(injected);
  assert.equal(runtimeScripts(injected).length,1,'Case variants of script tags must be recognized');
  variants.push([label,current.replace('</head>',injected+'</head>')]);
 }
 if(path==='diagnostico-digital/index.html'){
  variants.push(['diagnostic option',current.replace('Gerar mais contatos','Opção indevida')]);
  variants.push(['diagnostic label',current.replace('for="nomeNegocio"','for="outroCampo"')]);
 }else variants.push(['diagnostic origin',current.replace(/origem=[a-z-]+/,'origem=unapproved')]);
 for(const [label,changed] of variants){
  assert.notEqual(changed,current,'Mutation really changes '+path+' '+label);
  await inventoryHTML(changed);
  assert.throws(()=>assertApprovedCommercialPage(path,changed,production),undefined,'Reject '+path+' '+label);
 }
 return variants.length;
}

let verifiedRoot;
export async function verifyCommercialTree(root){
 if(verifiedRoot===root)return;
 verifyApproved134Scope(root);
 await verifyPublishedHotfixScope(root);
 assert.equal(manifest.productionRef,PRODUCTION_REF);
 const historical=path=>execFileSync('git',['show',PRODUCTION_REF+':'+path],{cwd:root});
 const tree=execFileSync('git',['ls-tree','-r','-z',PRODUCTION_REF],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
 const objects=new Map(tree.map(line=>{const m=line.match(/^\d+ blob ([a-f0-9]{40})\t(.+)$/);assert.ok(m,'Expected a tracked blob: '+line);return [m[2],m[1]]}));
 const allFiles=[...objects.keys()];
 // Git owns its object format; compare raw content without filters or manual cryptography.
 const blobID=bytes=>execFileSync('git',['hash-object','--no-filters','--stdin'],{cwd:root,input:bytes,encoding:'utf8'}).trim();
 const pages=Object.keys(manifest.pages);
 assert.deepEqual([...pages].sort(),['anuncios-google-instagram/index.html','criacao-de-sites-campinas/index.html','criacao-de-sites-valinhos/index.html','diagnostico-digital/index.html','presenca-no-google/index.html']);
 let protectedFiles=0,mutations=0;const verified=[];
 for(const path of allFiles){
  if(pages.includes(path))continue;
  const bytes=projectApproved134(path,await readFile(resolve(root,path)));
  if(path===ADS_ORIGIN_PATH){
   assertApprovedAdsOriginFile(path,bytes);
   protectedFiles++;
  }else if(isApprovedIssue126Path(path)){
   assertApprovedIssue126File(path,bytes);
   protectedFiles++;
  }else if(path==='scripts/verify-premium-v3.mjs'){
   const previous=historical(path);
   assertLegacyGuardRevision(bytes.toString('utf8'),previous.toString('utf8'));
   assert.throws(()=>assertLegacyGuardRevision(bytes.toString('utf8').replace("const baseline=","const bypassBaseline="),previous.toString('utf8')),'Reject unrelated legacy guard mutation');
  }else if(path==='index.html'){
   assert.equal(bytes.toString('utf8'),applyApprovedTrustCopy(path,historical(path).toString('utf8')),'Home changes only the single approved trust tab label');
  }else if(path==='assets/js/ot-diagnostic-v2.js'){
   const previous=historical(path);
   const oldScroll="scrollIntoView({behavior:'smooth',block:'start'})";
   const newScroll="scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})";
   const old=previous.toString('utf8');assert.equal(old.split(oldScroll).length-1,1);
   assert.equal(bytes.toString('utf8'),applyApprovedTrustCopy(path,old.replace(oldScroll,newScroll)),'Diagnostic runtime permits only reduced-motion behavior and approved trust label routing');
  }else if(path==='scripts/verify-local-pages.mjs'){
   assert.equal(bytes.toString('utf8'),applyApprovedVisualHotfix(path,historical(path).toString('utf8')),'SEO QA permits only the bounded privacy presentation assertions');
  }else{
   assert.equal(blobID(bytes),objects.get(path),'Strict production blob identity: '+path);
   protectedFiles++;
  }
 }
 const pw=await import(process.env.OT_PLAYWRIGHT_MODULE||'playwright');
 const engine=process.env.OT_COMMERCIAL_ENGINE||process.env.OT_QA_ENGINES?.split(',')[0]||'chromium';
 assert.ok(['chromium','webkit','firefox'].includes(engine),'A supported installed HTML parser engine is required');
 const parserBrowser=await pw[engine].launch({headless:true});
 try{
  const context=await parserBrowser.newContext({offline:true});
  await context.route('**/*',route=>route.abort());
  parserPage=await context.newPage();
  for(const path of pages){
   const current=await readFile(resolve(root,path),'utf8'),production=historical(path).toString('utf8');
   await inventoryHTML(current);await inventoryHTML(projectApproved134(path,current).toString('utf8'));await inventoryHTML(production);
   verified.push(assertApprovedCommercialPage(path,current,production));
   mutations+=await mutationChecks(path,current,production);
  }
 }finally{
  await parserBrowser.close();parserPage=undefined;scriptInventory.clear();
 }
 // Approved visuals/UTM implementation are separately frozen; production remains the content reference.
 assert.equal(manifest.reviewedImplementationRef,'fb57fb8c73d3cc6b9f5bce13797cac33a7d7cfc9');
 for(const path of manifest.reviewedAssets){
  const bytes=projectApproved134(path,await readFile(resolve(root,path)));
  if(path==='assets/css/ot-commercial-premium.css'){
   const approved=execFileSync('git',['show',manifest.reviewedImplementationRef+':'+path],{cwd:root,encoding:'utf8'});
   assert.equal(bytes.toString('utf8'),applyApprovedVisualHotfix(path,approved),'Only the bounded privacy and ad-example CSS additions are permitted');
  }else if(path===ADS_ORIGIN_PATH){
   assertApprovedAdsOriginFile(path,bytes);
  }else assert.equal(blobID(bytes),execFileSync('git',['rev-parse',manifest.reviewedImplementationRef+':'+path],{cwd:root,encoding:'utf8'}).trim(),'Previously approved visual asset blob: '+path);
 }
 await verifyApprovedAdsOriginScope(root);
 const report={productionRef:PRODUCTION_REF,reviewedAssetsRef:manifest.reviewedImplementationRef,protectedFiles,htmlParser:'Native DOMParser; inert detached documents, offline, no script execution',pages:verified,negativeMutationChecks:mutations,reviewedAssets:manifest.reviewedAssets.length,legacyGuard:'one exact assertion replacement; every other byte preserved'};
 console.log('OT_COMMERCIAL_CONTRACT '+JSON.stringify(report));
 verifiedRoot=root;
 return report;
}
