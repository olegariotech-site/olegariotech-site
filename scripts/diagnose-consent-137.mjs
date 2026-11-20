// Bounded repetitions to collect causal evidence, never retry-until-green.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createWriteStream} from 'node:fs';
import {finished} from 'node:stream/promises';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {analyzeConsentTimeline} from './analyze-consent-timeline-137.mjs';
const engine=process.env.OT_134_ENGINE;assert.ok(['firefox','webkit'].includes(engine));
const output=resolve(process.env.OT_137_CONSENT_OUTPUT||'/tmp/ot-consent-causal-137');await mkdir(output,{recursive:true});
const summary={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),engine,trials:[],diagnosticOnly:true};
for(let trial=1;trial<=3;trial++)for(const [script,file] of [['verify-pre-ads-134-real.mjs','real-sdk.json'],['verify-ga4-consent-137.mjs','ga4-consent-137.json']]){
 const folder=resolve(output,trial+'-'+file.replace('.json',''));await mkdir(folder,{recursive:true});
 const stdout=createWriteStream(resolve(folder,'stdout.log')),stderr=createWriteStream(resolve(folder,'stderr.log'));
 const child=spawn(process.execPath,['scripts/'+script],{env:{...process.env,OT_134_OUTPUT:folder},stdio:['ignore','pipe','pipe']});child.stdout.pipe(stdout);child.stderr.pipe(stderr);
 const [code,signal]=await new Promise(r=>child.once('close',(code,signal)=>r([code,signal])));await Promise.all([finished(stdout),finished(stderr)]);
 const report=JSON.parse(await readFile(resolve(folder,engine,file),'utf8'));const causal=analyzeConsentTimeline(report);await writeFile(resolve(folder,'causal.json'),JSON.stringify(causal,null,2));
 summary.trials.push({trial,script,code,signal,status:report.status,causalStatus:causal.status,phaseRequests:causal.requests.filter(x=>x.phase.includes('revoke')),report:resolve(folder,engine,file)});
 await writeFile(resolve(output,'summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify({trial,script,code,causal:causal.status,phaseRequests:summary.trials.at(-1).phaseRequests}));
}
assert.ok(summary.trials.every(x=>x.code===0&&x.causalStatus==='PASS'),'Every original assertion and causal invariant must pass; all failures stay recorded');
