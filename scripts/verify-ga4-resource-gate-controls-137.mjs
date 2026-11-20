// Same runner/engine, exact pre-fix candidate versus the actual candidate. Never retry.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync,spawnSync} from 'node:child_process';
const before='2d3513663223e9a0b60ec986dc969b7743a9e7c7',adBefore='d552290da2cba778f48de43fd51ea53b16835aae',engine=process.env.OT_134_ENGINE;
const output=resolve(process.env.OT_134_OUTPUT||'/tmp/ot-pre-ads-134','resource-gate-controls');await mkdir(output,{recursive:true});
const base=await mkdtemp(resolve(tmpdir(),'ot-ga4-prefx-137-'));execFileSync('git',['worktree','add','--detach',base,before]);
const adBase=await mkdtemp(resolve(tmpdir(),'ot-ga4-ad-before-137-'));execFileSync('git',['worktree','add','--detach',adBase,adBefore]);
const rows=[];
try{
 for(const mode of ['before','before-advertising','candidate']){
  const folder=resolve(output,mode);
  const env={...process.env,OT_134_OUTPUT:folder};if(mode==='before')env.OT_GUARD137_BASE=base;else if(mode==='before-advertising')env.OT_GUARD137_BASE=adBase;else delete env.OT_GUARD137_BASE;
  const result=spawnSync(process.execPath,['scripts/verify-ga4-resource-gates-137.mjs'],{env,encoding:'utf8',maxBuffer:1024*1024});
  await mkdir(folder,{recursive:true});await writeFile(resolve(folder,'stdout.log'),result.stdout||'');await writeFile(resolve(folder,'stderr.log'),result.stderr||'');
  const report=JSON.parse(await readFile(resolve(folder,engine,'ga4-resource-gates-137.json'),'utf8'));
  rows.push({mode,code:result.status,status:report.status,failure:report.failure||null,modes:report.modes,sourceFiles:report.sourceFiles});
  console.log(JSON.stringify(rows.at(-1)));
 }
 await writeFile(resolve(output,'control-summary.json'),JSON.stringify({before,adBefore,engine,rows},null,2));
 assert.notEqual(rows[0].code,0,'Pre-fix control must detect the defect, never silently PASS');
 assert.match(rows[0].failure,/No post-revocation script or transport initiation/,'Pre-fix control must fail for the actual resource gate, not for setup or navigation');
 assert.ok(rows[0].modes.some(r=>r.attempts.length>0),'Pre-fix SDK actually initiates the forbidden fixture');
 assert.notEqual(rows[1].code,0,'The reviewed candidate must reproduce the advertising duplication');
 assert.match(rows[1].failure,/Reauthorization restores exactly one real SDK commercial event/,'Advertising negative control must fail on the observed duplicate, not on setup');
 assert.ok(rows[1].modes.every(r=>r.attempts.length===0),'The reviewed candidate already blocks post-revocation probes');
 assert.equal(rows[2].code,0,'Actual candidate must pass every new regression');
 assert.equal(rows[2].status,'PASS');
}finally{for(const path of [base,adBase])execFileSync('git',['worktree','remove','--force',path]);}
