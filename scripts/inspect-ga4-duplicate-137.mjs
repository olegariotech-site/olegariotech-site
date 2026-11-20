// Read immutable failed regression evidence; no candidate verdict is changed here.
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
const root=resolve(process.argv[2]),rows=[];
async function* walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=resolve(dir,e.name);if(e.isDirectory())yield*walk(p);else yield p;}}
for await(const path of walk(root)){
 if(!path.endsWith('ga4-resource-gates-137.json')||!path.includes('candidate'))continue;
 const r=JSON.parse(await readFile(path,'utf8'));
 const clicks=(r.network||[]).filter(n=>(n.eventRecords||[]).some(e=>e.name==='click_whatsapp'));
 const row={file:relative(root,path),status:r.status,failure:r.failure,modes:r.modes,reauthorization:r.reauthorization,clickRequests:clicks,requestCount:clicks.length,eventRecordCount:clicks.flatMap(n=>n.eventRecords||[]).filter(e=>e.name==='click_whatsapp').length,native:clicks.map(n=>r.consentTimeline.requests.find(q=>q.id===n.requestId)),initiators:r.consentTimeline.events.filter(e=>/fetch-start|beacon-start|xhr-start/.test(e.type)&&e.phase==='guard-reauthorize')};
 rows.push(row);console.log(JSON.stringify(row));
}
await writeFile(resolve(root,'duplicate-inspection.json'),JSON.stringify(rows,null,2));
if(rows.length!==3)throw Error('All three actual engine reports are required');
