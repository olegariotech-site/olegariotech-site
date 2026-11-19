// Issue #127: exact reviewed WhatsApp-attribution runtime blob.
// Never relax editorial, consent, URL, destination-number or analytics guards.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

export const ADS_ORIGIN_PATH='assets/js/ot-commercial-context.js';
export const ADS_ORIGIN_BLOB='19462a99afc0d2ed15c9af5b5ccf07aec2774d85';
export const ADS_ORIGIN_PAGES=Object.freeze([
 'anuncios-google-instagram/index.html',
 'criacao-de-sites-campinas/index.html',
 'criacao-de-sites-valinhos/index.html',
 'diagnostico-digital/index.html',
 'presenca-no-google/index.html'
]);
const loaderV1='<script src="/assets/js/ot-commercial-context.js?v=1" defer></script>';
const loaderV2='<script src="/assets/js/ot-commercial-context.js?v=2" defer></script>';
export function assertApprovedAdsOriginPage(path,current,approvedBefore){
 assert.ok(ADS_ORIGIN_PAGES.includes(path),'Only five commercial pages may update attribution loader');
 assert.equal(approvedBefore.split(loaderV1).length,2,'Exactly one approved original attribution loader');
 assert.equal(current,approvedBefore.replace(loaderV1,loaderV2),
  'Only the reviewed v1 to v2 cache-key change is allowed: '+path);
 return true;
}


function gitBlob(bytes){
 const data=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);
 return createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
}
export function assertApprovedAdsOriginFile(path,bytes){
 assert.equal(path,ADS_ORIGIN_PATH,'Ads attribution exception is path-specific');
 assert.equal(gitBlob(bytes),ADS_ORIGIN_BLOB,'Reviewed attribution Git blob must remain exact');
 return true;
}
let verified;
export async function verifyApprovedAdsOriginScope(root){
 if(verified===root)return;
 const source=await readFile(resolve(root,ADS_ORIGIN_PATH));
 assertApprovedAdsOriginFile(ADS_ORIGIN_PATH,source);
 const content=source.toString('utf8');
 const mutations=[
  content.replace('wa.me','evil.example'),
  content.replace('OT-GADS-SITES-VALINHOS','CUSTOMER-NAME'),
  content.replace("url.searchParams.set('text'","url.searchParams.set('gclid'"),
  content.replace("['cpc','ppc']","['cpc','organic']")
 ];
 for(const modified of mutations){
  assert.notEqual(modified,content,'Negative control must alter the checked file');
  assert.throws(()=>assertApprovedAdsOriginFile(ADS_ORIGIN_PATH,Buffer.from(modified)),
   undefined,'Unreviewed attribution changes are rejected');
 }
 console.log('OT_ADS_ORIGIN_APPROVED_SCOPE '+JSON.stringify({pinnedBlob:ADS_ORIGIN_BLOB,negativeChecks:mutations.length}));
 verified=root;
}
