import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {runtimeEvidence} from './qa-runtime-evidence.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
async function sample(projected){
  const report={},proof=runtimeEvidence(root,report),page=new EventEmitter();proof.page(page);
  for(const path of ['index.html','assets/js/ot-analytics-core.js']){
    const bytes=projected&&path==='index.html'?execFileSync('git',['show','70ae38a45831f03ea5e52e5bf45e7d61e1c2b942:'+path],{cwd:root}):await readFile(resolve(root,path));
    const headers={};proof.serve(resolve(root,path),bytes,{setHeader:(key,value)=>headers[key.toLowerCase()]=value});
    page.emit('response',{headers:()=>headers,body:async()=>bytes});
  }
  await proof.flush();return report;
}
const positive=await sample(false);assert.equal(positive.runtime.browser.length,2);
await assert.rejects(()=>sample(true),'Historical projected HTML must fail even with a matching forged response hash');
console.log('PASS real checkout body proof; negative control rejects historical projection');
