// Test-only campaign extension. Published baselines stay fixed; only explicit reviewed hunks are added.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const CAMPAIGN_BASE='c0289b5b2bfd58dc0b7b3d84f579f6014b83c0f9';
export const CAMPAIGN_TITLE='Anúncios Google, Instagram e Facebook em Valinhos e Campinas | OT';
export const CAMPAIGN_DESCRIPTION='Campanhas no Google Ads, Instagram e Facebook com criativos, páginas de destino e acompanhamento. OT em Valinhos e Campinas. Diagnóstico gratuito.';
export const CAMPAIGN_H1='Anúncios no Google, Instagram e Facebook com estratégia comercial.';
export const CAMPAIGN_DISCLOSURE='Conceito de campanha para cliente real';
export const CAMPAIGN_ASSET_PATHS=['/assets/img/commercial/kl-concepts/kl-logo.webp','/assets/img/commercial/kl-concepts/kl-vehicle.webp'];
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const manifest=JSON.parse(await readFile(new URL('../docs/reviews/kl-campaign-concepts/approved-campaign-delta.json',import.meta.url),'utf8'));
assert.equal(manifest.publishedRef,CAMPAIGN_BASE,'The campaign base is the published PR #130 merge, never candidate HEAD');
assert.deepEqual(Object.keys(manifest.textFiles).sort(),['anuncios-google-instagram/index.html','docs/reviews/commercial-premium/kit.json','docs/reviews/commercial-premium/kit/anuncios-google-instagram-og.svg','docs/reviews/commercial-premium/kit/anuncios-google-instagram-story.svg','scripts/verify-approved-trust-copy.mjs','scripts/verify-commercial-contract.mjs','scripts/verify-commercial-hotfix-contract.mjs','scripts/verify-commercial-hotfix.mjs','scripts/verify-commercial-premium.mjs']);
assert.deepEqual(Object.keys(manifest.binaryFiles),['assets/img/commercial/anuncios-google-instagram-og.png']);
const released=new Map();
function published(path){
 if(!released.has(path))released.set(path,execFileSync('git',['show',CAMPAIGN_BASE+':'+path],{cwd:root,maxBuffer:16*1024*1024}));
 return released.get(path);
}
function approvedText(path){
 const source=published(path).toString('utf8'),lines=source.match(/[^\n]*\n|[^\n]+$/g)||[],out=[];let cursor=0;
 for(const edit of manifest.textFiles[path]){
  const start=edit.line-1,count=(edit.before.match(/\n/g)||[]).length;
  assert.ok(edit.before.length>0&&count>0&&start>=cursor,'Ordered, nonempty published anchors');
  assert.equal(lines.slice(start,start+count).join(''),edit.before,'Campaign published anchor: '+path);
  out.push(lines.slice(cursor,start).join(''),edit.after);cursor=start+count;
 }
 out.push(lines.slice(cursor).join(''));return out.join('');
}
function blob(bytes){return execFileSync('git',['hash-object','--no-filters','--stdin'],{cwd:root,input:bytes,encoding:'utf8'}).trim()}
export function assertApprovedCampaignFile(path,bytes){
 if(manifest.textFiles[path])assert.equal(bytes.toString('utf8'),approvedText(path),'Only explicit campaign text/style/test hunks: '+path);
 else if(manifest.binaryFiles[path])assert.equal(blob(bytes),manifest.binaryFiles[path],'Exact campaign binary: '+path);
 else assert.deepEqual(bytes,published(path),'Every other published byte stays protected: '+path);
}
let verifiedRoot,report;
export async function verifyCampaignTree(directory){
 if(verifiedRoot===directory)return report;
 const tree=execFileSync('git',['ls-tree','-r','-z',CAMPAIGN_BASE],{cwd:directory,encoding:'utf8'}).split('\0').filter(Boolean);
 let unchanged=0,bounded=0;
 for(const record of tree){
  const m=record.match(/^\d+ blob ([a-f0-9]{40})\t(.+)$/);assert.ok(m,'Expected published blob');
  const [,id,path]=m,bytes=await readFile(resolve(directory,path));
  if(manifest.textFiles[path]||manifest.binaryFiles[path]){assertApprovedCampaignFile(path,bytes);bounded++;}
  else{assert.equal(blob(bytes),id,'Unchanged from published PR #130: '+path);unchanged++;}
 }
 assert.deepEqual(Object.keys(manifest.newAssets).sort(),CAMPAIGN_ASSET_PATHS.map(p=>p.slice(1)).sort(),'Only the two approved client assets are added');
 for(const [path,id] of Object.entries(manifest.newAssets))assert.equal(blob(await readFile(resolve(directory,path))),id,'Original-identity derivative: '+path);
 const ads=await readFile(resolve(directory,'anuncios-google-instagram/index.html'),'utf8');
 const css=await readFile(resolve(directory,'assets/css/ot-commercial-premium.css'),'utf8');
 const invalid=[
  ads.replace('<title>','<title>Invalid '),
  ads.replace('Facebook em Valinhos','Outro canal em Valinhos'),
  ads.replace('rel="canonical" href="https://olegariotech.com.br/anuncios-google-instagram/"','rel="canonical" href="https://example.invalid/"'),
  ads.replace('wa.me/5511912459144','wa.me/5511000000000'),
  ads.replace("analytics_storage:'denied'","analytics_storage:'granted'"),
  ads.replace(CAMPAIGN_DISCLOSURE,'Campanha publicada com resultados garantidos'),
  ads.replace('INSTAGRAM ADS · CONCEITO','Patrocinado · 100 vendas'),
  ads.replace('FACEBOOK ADS · CONCEITO','ROTA 019'),
  ads.replace('name="kl-campaign-channel"','name="incorrect-channel"'),
  ads.replace('for="kl-channel-facebook"','for="missing-facebook"'),
  ads.replace('/assets/img/commercial/kl-concepts/kl-logo.webp','https://example.invalid/fake-logo.png'),
  ads.replace('</head>','<script src="https://example.invalid/tracker.js"></script></head>')
 ];
 for(const changed of invalid){assert.notEqual(changed,ads);assert.throws(()=>assertApprovedCampaignFile('anuncios-google-instagram/index.html',Buffer.from(changed)))}
 assert.throws(()=>assertApprovedCampaignFile('assets/css/ot-commercial-premium.css',Buffer.from(css+'\nbody{display:none}\n')));
 assert.throws(()=>assertApprovedCampaignFile('index.html',Buffer.concat([published('index.html'),Buffer.from('<!-- unauthorized home change -->')])));
 const provenance=JSON.parse(await readFile(resolve(directory,'docs/reviews/kl-campaign-concepts/brand-sources.json'),'utf8'));
 assert.ok(['not-confirmed','confirmed'].includes(provenance.authorizationStatus),'Explicit brand authorization status is required');
 if(provenance.authorizationStatus==='confirmed')assert.ok(provenance.authorizationEvidence?.trim(),'Confirmed authorization requires a verifiable record');
 verifiedRoot=directory;
 report={publishedRef:CAMPAIGN_BASE,unchangedFiles:unchanged,boundedFiles:bounded,newAssets:2,negativeChecks:invalid.length+2,brandPublicationApproval:provenance.authorizationStatus};
 console.log('OT_KL_CAMPAIGN_CONTRACT '+JSON.stringify(report));return report;
}
// Older gates examine their original published view only AFTER the actual current tree
// has passed the exact campaign contract above. No arbitrary normalization is accepted.
// Current browser QA always serves the actual files, including all three channels.
export function projectCampaignBytes(path,bytes){
 if(!manifest.textFiles[path]&&!manifest.binaryFiles[path])return bytes;
 assert.ok(verifiedRoot,'Validate the actual campaign tree before a historical projection');
 const original=published(path);
 if(bytes.equals(original))return original; // already projected by an outer historical gate
 assertApprovedCampaignFile(path,bytes);return original;
}
export function projectCampaignText(path,text){return projectCampaignBytes(path,Buffer.from(text)).toString('utf8')}
