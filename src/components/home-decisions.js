import {recommendGardenToday} from '../lib/recommendations/gardenToday.js';
import {localDay} from '../lib/garden/gardenRecords.js';
import {decisionMatrix} from './decision-matrix.js';
import {forecastPanel} from './forecast-panel.js';
import {spacingExplorer} from './spacing-explorer.js';

export function homeDecisions(crops,rules,evidence,sources,{invalidation}={}) {
 const root=document.createElement('section');root.className='home-decisions';root.id='plant-now';
 let forecast=null;
 const today=localDay(),year=today.slice(0,4);
 root.innerHTML=`<div class="home-decision-heading"><div><h2>What can I plant now?</h2></div><a href="/content/reference/plant-database">Find a crop or variety →</a></div><details class="home-assumptions"><summary>Change planting assumptions</summary><form class="home-decision-inputs"><label>Planting date<input name="date" type="date" required></label><label>Last spring frost assumption<input name="lastFrostDate" type="date" required></label><label>First fall frost assumption<input name="firstFrostDate" type="date" required></label><label>Soil temperature (°F)<input name="soilTemperatureF" type="number" min="20" max="110" step="1" required></label><label>Soil input describes<select name="basis"><option value="example">An example to explore</option><option value="measured">My current measurement</option></select></label><button type="submit">Compare conditions</button></form><p class="home-assumption-note" data-note></p></details><p class="home-assumption-note">Massachusetts planning example. Change the assumptions to match your garden.</p><div data-weather></div><div class="home-condition-line" data-conditions role="status"></div><p data-error role="alert"></p><div data-results></div><div class="home-decision-links"><a href="/tools/today">All inputs & optional NWS forecast →</a><a href="/tools/season-weather">Compare seasons →</a><a href="/tools/my-garden">Your private notebook →</a></div><details class="home-sample"><summary>Try the space: an editable sample bed</summary><div data-bed></div><p><a href="https://studio.veggie.farm/">Open Studio to arrange and save your own garden →</a></p></details>`;
 const form=root.querySelector('form');for(const [name,value] of Object.entries({date:today,lastFrostDate:`${year}-05-10`,firstFrostDate:`${year}-10-15`,soilTemperatureF:61}))form.elements[name].value=value;
 const bed=root.querySelector('[data-bed]');bed.append(spacingExplorer());
 function render(){
  const error=root.querySelector('[data-error]'),results=root.querySelector('[data-results]');error.textContent='';
  if(!form.checkValidity()){error.textContent='Enter valid dates and a soil temperature from 20–110°F.';results.replaceChildren();return;}
  const data=Object.fromEntries(new FormData(form));
  if(data.lastFrostDate>=data.firstFrostDate){error.textContent='The spring frost assumption must come before the fall frost assumption.';results.replaceChildren();return;}
  const context={...data,soilTemperatureF:Number(data.soilTemperatureF),riskPreference:'typical',forecast};
  root.querySelector('[data-note]').textContent=data.basis==='example'?'Exploring a scenario: 61°F and May 10 / October 15 start as editable examples, not observations for your location. Changes stay on this page.':'Using the soil measurement you entered. Frost dates are still editable assumptions; this page does not save them.';
  const runway=Math.round((Date.parse(data.firstFrostDate)-Date.parse(data.date))/86400000);
  root.querySelector('[data-conditions]').textContent=`${runway>=0?`${runway} days to assumed fall frost`:`${-runway} days past assumed fall frost`} · Soil ${data.soilTemperatureF}°F (${data.basis==='example'?'example':'entered measurement'}) · Frost ${data.lastFrostDate.slice(5)} / ${data.firstFrostDate.slice(5)} (assumed) · ${forecast?'Forecast loaded; applicability shown below':'Forecast not loaded'}`;
  results.replaceChildren(decisionMatrix(recommendGardenToday(crops,rules,context,evidence),rules,sources,{limit:6}));
 }
 root.querySelector('[data-weather]').append(forecastPanel({invalidation,onChange:value=>{forecast=value;render();}}));
 form.addEventListener('submit',event=>{event.preventDefault();render();});form.addEventListener('change',render);render();return root;
}
