// Actual JavaScript parser: the legacy acceptance call expressions stay literal.
import assert from 'node:assert/strict';
import {parse} from 'acorn';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
const reference='45c7ec54d964abf6eb1d41a053d0d43834f971c0';
function calls(source){const found=[];function visit(node){if(!node||typeof node!=='object')return;if(node.type==='CallExpression'&&(node.callee.type==='Identifier'&&node.callee.name==='assert'||node.callee.type==='MemberExpression'&&node.callee.object.name==='assert'))found.push({start:node.start,text:source.slice(node.start,node.end)});for(const [key,value] of Object.entries(node))if(key!=='start'&&key!=='end')if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}visit(parse(source,{sourceType:'module',ecmaVersion:'latest'}));return found.sort((a,b)=>a.start-b.start).map(x=>x.text);}
const report={reference,files:[]};
for(const path of ['scripts/verify-premium-v3.mjs','scripts/verify-earth-mobile.mjs','scripts/verify-pre-ads-134-real.mjs','scripts/verify-ga4-consent-137.mjs']){
 const before=calls(execFileSync('git',['show',reference+':'+path],{encoding:'utf8'})),after=calls(await readFile(path,'utf8'));assert.deepEqual(after,before,'All original assertion expressions and their order are unchanged: '+path);report.files.push({path,originalCalls:before.length,currentCalls:after.length,preserved:true});
}
if(process.env.OT_ASSERTION_PROOF)await writeFile(process.env.OT_ASSERTION_PROOF,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
