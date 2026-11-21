// QA-only provenance and Linux process observations. No projection of served bytes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, readdir, writeFile, appendFile, mkdir} from 'node:fs/promises';
import {relative, resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import os from 'node:os';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export function runtimeEvidence(directory, report) {
  const served = new Map(), observed = new Map(), pending = [];
  report.runtime = {directory, head:execFileSync('git',['rev-parse','HEAD'],{cwd:directory,encoding:'utf8'}).trim(), served:[], browser:[]};
  return {
    serve(file, bytes, res) {
      const path = relative(directory,file), sha256 = digest(bytes);
      if (/\.(html|js|mjs|css)$/.test(path)) {
        served.set(path,{path,sha256,bytes:bytes.length});
        res.setHeader('X-OT-QA-Path',path);res.setHeader('X-OT-QA-SHA256',sha256);
      }
    },
    page(page) {
      page.on('response', response => {
        const path = response.headers()['x-ot-qa-path'];
        if (!path) return;
        pending.push((async()=>{
          const bytes = await response.body(), sha256 = digest(bytes);
          assert.equal(sha256,response.headers()['x-ot-qa-sha256'],'Browser body equals served candidate bytes: '+path);
          assert.equal(sha256,digest(await readFile(resolve(directory,path))),'Browser body equals checkout, no historical projection: '+path);
          observed.set(path,{path,sha256,bytes:bytes.length});
        })().catch(error=>({error:error.message,path})));
      });
    },
    async flush() {
      const values = await Promise.all(pending);
      report.runtime.served = [...served.values()];report.runtime.browser = [...observed.values()];
      report.runtime.failures = values.filter(x=>x?.error);
      assert.deepEqual(report.runtime.failures,[],'Every observed source body is the real checkout body');
      assert.ok(observed.has('index.html'),'Real home HTML inspected in the browser');
      assert.ok(observed.has('assets/js/ot-analytics-core.js'),'Real analytics runtime inspected in the browser');
    }
  };
}

export function comparisonRoot(candidate) {
  const input = process.env.OT_QA_COMPARE_ROOT;
  if (!input) return candidate;
  const directory = resolve(input);
  const sha = execFileSync('git',['rev-parse','HEAD'],{cwd:directory,encoding:'utf8'}).trim();
  assert.equal(sha,'70ae38a45831f03ea5e52e5bf45e7d61e1c2b942','Only the immutable published base may override the browser root');
  assert.equal(execFileSync('git',['diff','--name-only','HEAD'],{cwd:directory,encoding:'utf8'}).trim(),'','Comparison base must be unmodified');
  return directory;
}

async function memoryEvents() {
  const names=['memory.events','memory.current','memory.peak','memory.max','cpu.stat'];
  const result={};
  for(const name of names)result[name]=await readFile('/sys/fs/cgroup/'+name,'utf8').catch(()=>null);
  result.memoryV1=await readFile('/sys/fs/cgroup/memory/memory.oom_control','utf8').catch(()=>null);
  result.memoryFailCountV1=await readFile('/sys/fs/cgroup/memory/memory.failcnt','utf8').catch(()=>null);
  result.cpuPressure=await readFile('/proc/pressure/cpu','utf8').catch(()=>null);
  result.memoryPressure=await readFile('/proc/pressure/memory','utf8').catch(()=>null);
  result.cpuStat=await readFile('/proc/stat','utf8').catch(()=>null);
  return result;
}
export async function processEvidence(output,label) {
  await mkdir(output,{recursive:true});
  const report={label,pid:process.pid,platform:os.platform(),release:os.release(),cpu:os.cpus()[0]?.model,cores:os.cpus().length,totalMemory:os.totalmem(),start:new Date().toISOString(),before:await memoryEvents(),samplesFile:label+'-process.jsonl',sampleCount:0,peakRssKiB:0};
  const ticks=Number(execFileSync('getconf',['CLK_TCK'],{encoding:'utf8'}).trim());
  let sampling=false;
  async function sample(){
    if(sampling)return;sampling=true;
    try{
      const all=[];
      for(const name of await readdir('/proc'))if(/^\d+$/.test(name)){
        try{
          const stat=await readFile('/proc/'+name+'/stat','utf8'),end=stat.lastIndexOf(')'),fields=stat.slice(end+2).split(' ');
          const status=await readFile('/proc/'+name+'/status','utf8');
          all.push({pid:Number(name),ppid:Number(fields[1]),name:stat.slice(stat.indexOf('(')+1,end),state:fields[0],cpuSeconds:(Number(fields[11])+Number(fields[12]))/ticks,rssKiB:Number(status.match(/^VmRSS:\s+(\d+)/m)?.[1]||0),peakKiB:Number(status.match(/^VmHWM:\s+(\d+)/m)?.[1]||0)});
        }catch{ /* Process exited between the two reads. */ }
      }
      const descendants=new Set([process.pid]);let changed=true;
      while(changed){changed=false;for(const p of all)if(descendants.has(p.ppid)&&!descendants.has(p.pid)){descendants.add(p.pid);changed=true;}}
      const processes=all.filter(p=>descendants.has(p.pid));
      report.sampleCount++;report.peakRssKiB=Math.max(report.peakRssKiB,processes.reduce((sum,p)=>sum+p.rssKiB,0));
      await appendFile(resolve(output,report.samplesFile),JSON.stringify({at:new Date().toISOString(),freeMemory:os.freemem(),load:os.loadavg(),processes})+'\n');
    }finally{sampling=false;}
  }
  await writeFile(resolve(output,report.samplesFile),'');await sample();await writeFile(resolve(output,label+'-process.json'),JSON.stringify(report,null,2));const timer=setInterval(()=>sample().catch(()=>{}),1000);timer.unref();
  return {async stop(){clearInterval(timer);while(sampling)await new Promise(r=>setTimeout(r,10));await sample();report.after=await memoryEvents();report.end=new Date().toISOString();await writeFile(resolve(output,label+'-process.json'),JSON.stringify(report,null,2));return report;}};
}
