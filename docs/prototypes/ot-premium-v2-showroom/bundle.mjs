// Review-only offline artifact. Derived from the same generated data and renderer.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const folder=resolve(fileURLToPath(new URL('./',import.meta.url)));
const root=resolve(folder,'../../..');
const types={'.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'};
const local=path=>path.startsWith('/')?resolve(root,'.'+path):resolve(folder,path);
const embedded=new Map();
async function embed(path){if(!embedded.has(path)){const bytes=await readFile(local(path));embedded.set(path,`data:${types[extname(path)]};base64,${bytes.toString('base64')}`)}return embedded.get(path)}
let css=await readFile(resolve(folder,'showroom.css'),'utf8');
const licenses=[];
for(const family of ['inter','space-grotesk','share-tech-mono'])licenses.push(await readFile(resolve(folder,'assets',family+'-OFL.txt'),'utf8'));
css='/* Bundled font licenses:\n'+licenses.join('\n\n')+'\n*/\n'+css;
for(const match of [...css.matchAll(/url\('([^']+)'\)/g)])css=css.replaceAll(match[0],`url('${await embed(match[1])}')`);
let markup=await readFile(resolve(folder,'index.html'),'utf8');
for(const match of [...markup.matchAll(/(?:src|srcset)="([^"]+)"/g)])if(!match[1].endsWith('.mjs'))markup=markup.replaceAll(match[1],await embed(match[1]));
let generated=await readFile(resolve(folder,'projects.generated.mjs'),'utf8');
const mediaStart=generated.indexOf('export const media=');
const data=generated.slice(mediaStart).match(/export const media=([\s\S]+);\s*$/)[1];
const media=JSON.parse(data);
for(const item of Object.values(media)){
 for(const set of [item,item.brand,item.thumbnail].filter(Boolean)){
  for(const key of ['desktop','mobile','src'])if(set[key])set[key]=await embed(set[key]);
 }
}
// Keep canonical projects untouched; replace only presentation asset descriptors.
// Escape closing script delimiters from public text to keep the inline artifact safe.
const clean=code=>code.replace(/export (const|function)/g,'$1').replaceAll('</script','<\\/script');
generated=generated.slice(0,mediaStart)+`const media=${JSON.stringify(media)};\n`;
const renderer=clean(await readFile(resolve(folder,'templates.mjs'),'utf8'));
const behavior=(await readFile(resolve(folder,'showroom.mjs'),'utf8')).replace(/^import[^\n]+\n/gm,'');
markup=markup.replace(/<link rel="preload"[^>]+>\s*/,'').replace('<link rel="stylesheet" href="./showroom.css">',`<style>${css}</style>`).replace('<script type="module" src="./showroom.mjs"></script>','');
markup=markup.replace('href="../../../index.html#projetos"','href="https://olegariotech.com.br/#projetos"');
markup=markup.replace('</body>',`<script>${clean(generated)}\n${renderer}\n${clean(behavior)}</script></body>`);
markup=markup.split('\n').map(line=>line.trimEnd()).join('\n');
await writeFile(resolve(folder,'preview-offline.html'),markup);
console.log('Offline review artifact:',Buffer.byteLength(markup),'bytes. No external requests or runtime dependencies.');
