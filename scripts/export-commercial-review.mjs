import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
const output=process.env.OT_COMMERCIAL_OUTPUT||'/tmp/ot-commercial-premium';
const items=JSON.parse(await readFile('docs/reviews/commercial-premium/kit.json','utf8'));
function emit(id,path,mime,bytes){
 console.log('OT_REVIEW_META '+JSON.stringify({id,path,mime,size:bytes.length}));
 const encoded=bytes.toString('base64'),chunks=encoded.match(/.{1,8000}/g);
 chunks.forEach((chunk,i)=>console.log('OT_REVIEW_CHUNK '+id+' '+i+' '+chunks.length+' '+chunk));
}
const browser=await chromium.launch({headless:true});
try{
 for(const item of items){
  // Public brand assets only. Bounded base64 allows review without an attached local shell.
  const ogPath=resolve(output,'kit',item.slug+'-og.png');
  emit(item.slug+'-og',ogPath,'image/png',await readFile(ogPath));
  for(const width of [390,1440]){
   const sources=[];
   for(const state of ['before','after'])try{
    const bytes=await readFile(resolve(output,item.slug+'-'+width+'-'+state+'-viewport.jpg'));
    sources.push({state,data:bytes.toString('base64')});
   }catch{}
   if(sources.length!==2)continue;
   const paneWidth=width===1440?720:390,paneHeight=width===1440?450:844;
   const page=await browser.newPage({viewport:{width:paneWidth*2,height:paneHeight+36}});
   await page.setContent('<style>body{margin:0;background:#050008;color:white;font:16px Arial;display:flex}figure{margin:0;width:'+paneWidth+'px}figcaption{height:36px;display:grid;place-items:center}img{display:block;width:100%}</style>'+sources.map(s=>'<figure><figcaption>'+item.slug+' · '+s.state+'</figcaption><img src="data:image/jpeg;base64,'+s.data+'"></figure>').join(''));
   await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
   const path=resolve(output,item.slug+'-'+width+'-comparison.jpg'),bytes=await page.screenshot({path,type:'jpeg',quality:76});
   emit(item.slug+'-'+width+'-comparison',path,'image/jpeg',bytes);await page.close();
  }
  const page=await browser.newPage({viewport:{width:540,height:960}});
  const source=await readFile(resolve(output,'kit',item.slug+'-story.png'));
  await page.setContent('<style>body{margin:0}img{display:block;width:540px;height:960px}</style><img src="data:image/png;base64,'+source.toString('base64')+'">');
  await page.locator('img').evaluate(i=>i.decode());
  const path=resolve(output,'kit',item.slug+'-story-preview.jpg'),bytes=await page.screenshot({path,type:'jpeg',quality:78});
  emit(item.slug+'-story-preview',path,'image/jpeg',bytes);await page.close();
 }
}catch(e){console.error(e);throw e}finally{await browser.close()}
