// Supplemental causal comparison. Required historical gates still run separately.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createWriteStream} from 'node:fs';
import {finished} from 'node:stream/promises';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const kind=process.argv[2];assert.ok(['earth','v3'].includes(kind));
const base=process.env.OT_137_BASE;assert.ok(base,'Immutable published checkout is required');
const output=resolve(process.env.OT_137_OUTPUT||'/tmp/ot-pr137-comparison',kind);
await mkdir(output,{recursive:true});
const results=[];
for(const [index,version] of ['base','candidate','candidate','base'].entries()){
  const folder=resolve(output,String(index+1).padStart(2,'0')+'-'+version);await mkdir(folder,{recursive:true});
  const env={...process.env,DEBUG:'pw:browser',OT_QA_RUN_LABEL:version};
  if(version==='base')env.OT_QA_COMPARE_ROOT=base;else delete env.OT_QA_COMPARE_ROOT;
  if(kind==='earth')Object.assign(env,{OT_QA_ENGINES:'webkit',OT_EARTH_PROFILES:'high,intermediate-4gb,canvas-4gb',OT_EARTH_VIDEO:'1',OT_EARTH_OUTPUT:folder});
  else Object.assign(env,{OT_QA_ENGINES:'webkit',OT_QA_OUTPUT:folder});
  delete env.OT_QA_REQUIRE_ENGINES; // This supplemental comparison targets WebKit; the required V3 retains all three engines.
  const script=kind==='earth'?'scripts/verify-earth-mobile.mjs':'scripts/verify-premium-v3.mjs';
  const stdout=createWriteStream(resolve(folder,'stdout.log')),stderr=createWriteStream(resolve(folder,'browser-stderr.log'));
  const child=spawn(process.execPath,[script],{env,stdio:['ignore','pipe','pipe']});
  child.stdout.pipe(stdout);child.stderr.pipe(stderr);
  const [code,signal]=await new Promise(r=>child.once('close',(code,signal)=>r([code,signal])));
  await Promise.all([finished(stdout),finished(stderr)]);
  const reportFile=resolve(folder,kind==='earth'?'earth-report.json':'results.json');
  const report=await readFile(reportFile,'utf8').then(JSON.parse).catch(error=>({failure:error.message}));
  results.push({index:index+1,version,code,signal,passed:code===0&&report.passed===true,reportFile,runtime:report.runtime||report.runtimeSources, failure:report.failure||null});
  await writeFile(resolve(output,'comparison.json'),JSON.stringify({kind,results},null,2));
  console.log(JSON.stringify({kind,version,code,signal,passed:results.at(-1).passed}));
}
// A known failing historical base is evidence, not a failing candidate.
// Candidate failures always fail this job as well as the unfiltered required gate.
assert.ok(results.filter(r=>r.version==='candidate').every(r=>r.passed),'Every candidate trial must pass the unchanged comparison assertions in both orders');
