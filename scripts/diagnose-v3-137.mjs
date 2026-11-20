// Explicit ablations are evidence only. Required V3 still serves the full HEAD.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,symlink} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {finished} from 'node:stream/promises';
import {spawn,execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..'),published='70ae38a45831f03ea5e52e5bf45e7d61e1c2b942';
const component=process.argv[2];assert.ok(['consent','context','styles','combined'].includes(component));
const output=resolve(process.env.OT_137_ABLATION_OUTPUT||'/tmp/ot-v3-ablation-137',component);await mkdir(output,{recursive:true});
const temp=await mkdtemp(resolve(tmpdir(),'ot-v3-ablation-137-')),baseline=resolve(temp,'published'),variant=resolve(temp,'variant');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const summary={component,head,published,diagnosticOnly:true,alterations:[],trials:[],notes:['All functional assertions are retained, but ablations and debugger-attached runs never qualify the full candidate.','No version, motion preference, viewport, interaction timeout or rendering threshold is changed.']};
try{
 await symlink(resolve(root,'node_modules'),resolve(temp,'node_modules'),'dir');
 execFileSync('git',['worktree','add','--detach',baseline,published],{cwd:root});execFileSync('git',['worktree','add','--detach',variant,head],{cwd:root});
 const files=component==='consent'?['assets/js/ot-analytics-core.js']:component==='context'?['assets/js/ot-commercial-context.js']:component==='styles'?['assets/css/ot-cosmic-showcase.css']:['assets/js/ot-analytics-core.js','assets/js/ot-commercial-context.js'];
 for(const path of files){const before=await readFile(resolve(variant,path));const after=path.endsWith('ot-commercial-context.js')?Buffer.from('// QA diagnostic ablation: context observer disabled; never a candidate.\n'):execFileSync('git',['show',published+':'+path],{cwd:root});await writeFile(resolve(variant,path),after);summary.alterations.push({path,currentSha256:hash(before),diagnosticSha256:hash(after),operation:path.endsWith('ot-commercial-context.js')?'disable-only-in-diagnostic':'restore-published-only-in-diagnostic'});}
 const original=await readFile(resolve(root,'scripts/verify-premium-v3.mjs'),'utf8');let harness=original;
 // Only module resolution and the document root are adapted. Assertions, loops
 // and action timeouts remain byte-for-byte the same as the required harness.
 harness=harness.replace(/from '(\.\/[^']+)'/g,(_,name)=>'from '+JSON.stringify(pathToFileURL(resolve(root,'scripts',name)).href));
 const rootLine="const root=resolve(fileURLToPath(new URL('../',import.meta.url)));";assert.equal(harness.split(rootLine).length-1,1);harness=harness.replace(rootLine,'const root='+JSON.stringify(root)+';');
 const served="const servedRoot=comparisonRoot(root),runtimeRecord={},proof=runtimeEvidence(servedRoot,runtimeRecord);";assert.equal(harness.split(served).length-1,1);harness=harness.replace(served,'const servedRoot=process.env.OT_137_DIAGNOSTIC_DOCUMENT_ROOT,runtimeRecord={},proof=runtimeEvidence(servedRoot,runtimeRecord);');
 const script=resolve(temp,'diagnostic-harness.mjs');await writeFile(script,harness);summary.harness={originalSha256:hash(original),generatedSha256:hash(harness),adaptations:['absolute imports','original static-check root','explicit diagnostic document root']};
 for(const [index,label] of ['published','candidate','ablation','candidate','published'].entries()){
  const folder=resolve(output,String(index+1).padStart(2,'0')+'-'+label);await mkdir(folder,{recursive:true});
  const env={...process.env,DEBUG:'pw:browser',OT_QA_ENGINES:'webkit',OT_QA_OUTPUT:folder,OT_QA_RUN_LABEL:label,OT_137_V3_DIAGNOSTIC:'1',OT_137_DIAGNOSTIC_DOCUMENT_ROOT:label==='published'?baseline:label==='ablation'?variant:root};delete env.OT_QA_REQUIRE_ENGINES;delete env.OT_QA_COMPARE_ROOT;
  const stdout=createWriteStream(resolve(folder,'stdout.log')),stderr=createWriteStream(resolve(folder,'stderr.log'));const child=spawn(process.execPath,[script],{cwd:root,env,stdio:['ignore','pipe','pipe']});child.stdout.pipe(stdout);child.stderr.pipe(stderr);
  const [code,signal]=await new Promise(r=>child.once('close',(code,signal)=>r([code,signal])));await Promise.all([finished(stdout),finished(stderr)]);
  const report=JSON.parse(await readFile(resolve(folder,'results.json'),'utf8').catch(()=>'{"failure":"Harness ended before report"}'));
  summary.trials.push({index:index+1,label,code,signal,passed:code===0&&report.passed===true,failure:report.failure||null,source:report.runtime});await writeFile(resolve(output,'summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify({index:index+1,label,code,signal,passed:summary.trials.at(-1).passed,failure:report.failure||null}));
 }
 // A complete diagnostic dataset is not a candidate PASS. Failures are kept in
 // summary; qualification is solely the untouched full Gate B/V3 workflows.
 summary.completed=true;await writeFile(resolve(output,'summary.json'),JSON.stringify(summary,null,2));
}finally{for(const path of [baseline,variant])try{execFileSync('git',['worktree','remove','--force',path],{cwd:root});}catch{}}
