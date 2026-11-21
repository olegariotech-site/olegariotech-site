import assert from 'node:assert/strict';
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const directory=resolve(process.argv[2]);
async function files(dir){const result=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())result.push(...await files(path));else if(path.endsWith('.sarif'))result.push(path);}return result;}
const paths=await files(directory);assert.ok(paths.length,'Actual CodeQL SARIF is required; a green job is insufficient');
const counts={},locations=[];
for(const path of paths){const sarif=JSON.parse(await readFile(path,'utf8'));for(const run of sarif.runs||[])for(const result of run.results||[]){counts[result.ruleId]=(counts[result.ruleId]||0)+1;locations.push({rule:result.ruleId,location:result.locations?.[0]?.physicalLocation});}}
const rule='js/incomplete-url-substring-sanitization';
await writeFile(resolve(directory,'alert-counts-137.json'),JSON.stringify({previousAlerts:[6,7,8,9],rule,currentRuleFindings:counts[rule]||0,totalFindings:locations.length,counts,locations},null,2));
assert.equal(counts[rule]||0,0,'All four hostname-boundary findings must be absent, without suppression');
console.log(JSON.stringify({rule,previous:4,current:0,totalFindings:locations.length}));
