// Issue #126 — explicit, SHA-pinned exception for the analytics conversion correction.
// The historic visual/SEO/privacy guards stay active for every other path.
// A file name alone is NOT authorization; its full Git blob must match the reviewed digest.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

export const ISSUE_126_REVIEWED_BLOBS=Object.freeze({
  ".github/workflows/analytics-funnel-qa.yml": "c08bd540361705cea74ab14bb3cd80c63f1a1794",
  "assets/js/ot-analytics-core.js": "317a7379bac17b2cbc2eece3cd79dd0751e4758e",
  "assets/js/ot-analytics.js": "58eee67ebfc35a1b1a83626e9495a5bb26d252d9",
  "docs/reviews/analytics-funnel-126/README.md": "6526cb6c8b81221c6cde0b7f8c032d641814b9fe",
  "scripts/verify-analytics-funnel.mjs": "f3197957ae0d5bd8c7ca3477a09923f8b8b87beb",
  "scripts/verify-approved-trust-copy.mjs": "21bbf94a49e31b34fe0d55a7e556dd25d15192f5",
  "scripts/verify-commercial-contract.mjs": "3c08c552fe53f7f6744b1e14025bbd0ac39fa122",
  "scripts/verify-commercial-hotfix-contract.mjs": "40395cecff7cd585514a1894e6e62c2e5479f8ae",
  "scripts/verify-commercial-premium.mjs": "342892a03e336372a113fb4983e4a697344b1d72",
  "scripts/verify-showroom.mjs": "8982f7032eaf0020b2d184c81b8209fdeb1a41c5",
  "scripts/verify-solutions.mjs": "8458dd532fa3cc7bb9dccb2af80e7103fee346f1",
  "scripts/verify-premium-v3.mjs": "b993d8d8dec2e73db8b62416051b95b895f838c0"
});

function blobID(bytes){
 const data=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);
 return createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
}
export function isApprovedIssue126Path(path){
 return Object.hasOwn(ISSUE_126_REVIEWED_BLOBS,path);
}
export function assertApprovedIssue126File(path,bytes){
 assert.ok(isApprovedIssue126Path(path),'Issue #126 never authorizes an unlisted path: '+path);
 assert.equal(blobID(bytes),ISSUE_126_REVIEWED_BLOBS[path],'Issue #126 exact reviewed Git blob: '+path);
 return true;
}

let lastVerified;
export async function verifyApprovedIssue126Scope(root){
 if(lastVerified===root)return;
 for(const path of Object.keys(ISSUE_126_REVIEWED_BLOBS)){
  const bytes=await readFile(resolve(root,path));
  assertApprovedIssue126File(path,bytes);
 }
 const core=(await readFile(resolve(root,'assets/js/ot-analytics-core.js'))).toString('utf8');
 const loader=(await readFile(resolve(root,'assets/js/ot-analytics.js'))).toString('utf8');
 const bad=[
  ['assets/js/ot-analytics-core.js',core.replace('url.origin + url.pathname','url.href')],
  ['assets/js/ot-analytics-core.js',core.replace("track('click_whatsapp'","track('generate_lead'")],
  ['assets/js/ot-analytics.js',loader.replace("ot-analytics-core.js?v=8","ot-analytics-core.js?v=7")]
 ];
 for(const [path,mutated] of bad){
  const original=path.endsWith('ot-analytics.js')?loader:core;
  assert.notEqual(mutated,original,'Negative mutation must change its target: '+path);
  assert.throws(()=>assertApprovedIssue126File(path,Buffer.from(mutated)),undefined,'Reject unauthorized analytics mutation: '+path);
 }
 console.log('OT_ISSUE_126_APPROVED_SCOPE '+JSON.stringify({pinnedFiles:Object.keys(ISSUE_126_REVIEWED_BLOBS).length,negativeChecks:bad.length,policy:'exact Git blob only; legacy protections unchanged for all other paths'}));
 lastVerified=root;
}
