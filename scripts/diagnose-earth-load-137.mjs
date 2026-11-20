// Recording-load ablation only: no production code or original frame limit changes.
import {spawn} from 'node:child_process';
import {createWriteStream} from 'node:fs';
import {finished} from 'node:stream/promises';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const output=resolve(process.env.OT_137_RENDER_OUTPUT||'/tmp/ot-earth-load-137');await mkdir(output,{recursive:true});
const summary={diagnosticOnly:true,factor:'Playwright video recording load; all original motion assertions retained',trials:[]};
for(const [index,video] of [true,false,false,true].entries()){
 const folder=resolve(output,String(index+1).padStart(2,'0')+'-'+(video?'recording':'no-recording'));await mkdir(folder,{recursive:true});
 const stdout=createWriteStream(resolve(folder,'stdout.log')),stderr=createWriteStream(resolve(folder,'stderr.log'));
 const child=spawn(process.execPath,['scripts/verify-earth-mobile.mjs'],{env:{...process.env,DEBUG:'pw:browser',OT_QA_ENGINES:'webkit',OT_EARTH_PROFILES:'high,intermediate-4gb,canvas-4gb',OT_EARTH_VIDEO:video?'1':'0',OT_EARTH_OUTPUT:folder},stdio:['ignore','pipe','pipe']});child.stdout.pipe(stdout);child.stderr.pipe(stderr);
 const [code,signal]=await new Promise(r=>child.once('close',(code,signal)=>r([code,signal])));await Promise.all([finished(stdout),finished(stderr)]);
 const report=JSON.parse(await readFile(resolve(folder,'earth-report.json'),'utf8').catch(()=>'{"failure":"No report"}'));
 const row={index:index+1,video,code,signal,passed:code===0&&report.passed===true,continuityFPS:(report.probes||[]).filter(p=>p.last.continuum).map(p=>p.earthFPS)};summary.trials.push(row);await writeFile(resolve(output,'summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(row));
}
summary.completed=true;await writeFile(resolve(output,'summary.json'),JSON.stringify(summary,null,2));
