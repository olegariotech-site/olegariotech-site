// Initial HTML is derived from the same projects record used by solutions and proof.
import {readFile,writeFile} from 'node:fs/promises';
import {media,order,renderTab,renderCase} from '../assets/js/ot-project-showroom.mjs';
const file=new URL('../index.html',import.meta.url);
const source=await readFile(file,'utf8');
const match=source.match(/const projects=(\{[\s\S]*?\n\});/);
if(!match)throw Error('Canonical projects record not found.');
const projects=JSON.parse(match[1]),initial='kl';
if(order.length!==6||Object.keys(projects).length!==6||order.some(key=>!projects[key]))throw Error('Review the canonical project inventory.');
const html=`
<div class="case-index" role="tablist" aria-label="Projetos da Olegario Tech">
  <div class="index-group" role="group" aria-labelledby="projectGroupReal"><div class="index-label" id="projectGroupReal"><span>Projetos reais · 05</span><span class="swipe-hint">Deslize para explorar →</span></div><div class="case-rail">${order.filter(key=>key!=='navalha').map(key=>renderTab(key,projects[key],initial,media[key])).join('\n')}</div></div>
  <div class="index-group index-group--concept" role="group" aria-labelledby="projectGroupConcept"><div class="index-label" id="projectGroupConcept">Conceito OT · 01</div><div class="concept-rail">${renderTab('navalha',projects.navalha,initial,media.navalha)}</div></div>
</div>
<p id="selectionStatus" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
<article class="case-stage project-stage" id="projectStage" role="tabpanel" tabindex="0" data-selected-project="${initial}" aria-labelledby="project-tab-${initial}">${renderCase(initial,projects[initial],media[initial])}</article>
`;
const region=/<!-- OT SHOWROOM START -->[\s\S]*?<!-- OT SHOWROOM END -->/;
if(!region.test(source))throw Error('Static showroom boundary missing.');
const next=source.replace(region,'<!-- OT SHOWROOM START -->'+html+'<!-- OT SHOWROOM END -->');
if(process.argv.includes('--check')){if(next!==source)throw Error('Initial HTML is stale. Run node scripts/build-showroom.mjs');console.log('Home showroom uses the current canonical projects.');}
else{await writeFile(file,next);console.log('Generated initial K.L showroom and six selectors.');}
