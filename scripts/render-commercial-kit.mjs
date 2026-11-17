import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=process.env.OT_COMMERCIAL_OUTPUT||'/tmp/ot-commercial-premium';
const items=JSON.parse(await readFile(resolve(root,'docs/reviews/commercial-premium/kit.json'),'utf8'));
await mkdir(resolve(output,'kit'),{recursive:true});
const browser=await chromium.launch({headless:true});
const files=[];
try{
 for(const item of items)for(const kind of ['og','story']){
  const width=kind==='og'?1200:1080,height=kind==='og'?630:1920;
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const svg=await readFile(resolve(root,'docs/reviews/commercial-premium/kit',item.slug+'-'+kind+'.svg'),'utf8');
  await page.setContent('<!doctype html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet"><style>html,body{margin:0;width:'+width+'px;height:'+height+'px;overflow:hidden}svg{display:block}</style></head><body>'+svg+'</body></html>');
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('image')].map(node=>new Promise((done,fail)=>{const img=new Image();img.onload=done;img.onerror=fail;img.src=node.getAttribute('href');})))});
  const fontCheck=await page.evaluate(()=>({display:document.fonts.check('700 52px "Space Grotesk"'),body:document.fonts.check('400 21px Inter')}));
  assert.ok(fontCheck.display&&fontCheck.body,'Brand fonts loaded for '+item.slug);
  const overflow=await page.locator('svg>g text').evaluateAll(nodes=>nodes.filter(n=>{const b=n.getBBox();const w=n.ownerSVGElement.viewBox.baseVal.width;return b.x<40||b.x+b.width>w-40}).map(n=>n.textContent));
  assert.deepEqual(overflow,[],'Social text stays inside safe width: '+item.slug+' '+kind);
  const png=await page.screenshot({path:resolve(output,'kit',item.slug+'-'+kind+'.png'),type:'png'});
  assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),height);
  files.push({slug:item.slug,kind,width,height,bytes:png.length,fontCheck,url:item.url,caption:item.copy,cta:item.cta});
  await page.close();
 }
 await writeFile(resolve(output,'kit','manifest.json'),JSON.stringify({generated:true,visualApproval:false,files},null,2));
 console.log(JSON.stringify({kit:true,files:files.length,dimensions:'5 x 1200x630; 5 x 1080x1920',visualApproval:false}));
}finally{await browser.close()}
