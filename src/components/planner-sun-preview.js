import {bedShadowPolygons} from '../lib/spatial/solarScene.js';
import {estimateBedDaylight,sunlightScenario,seasonalLightDates} from '../lib/spatial/solarExposure.js';
import {solarPosition,easternPreviewInstant,sunlightShapes} from '../lib/spatial/solarPreview.js';
import {gardenSpatialReference} from '../lib/spatial/gardenSpatial.js';
import {localDay} from '../lib/garden/gardenRecords.js';
export function plannerSunPreview({getState,onChange}){
 const root=document.createElement('section');root.className='planner-sun-preview';root.setAttribute('aria-label','Sunlight preview');
 root.innerHTML='<label><input type="checkbox"> Sun &amp; shade · Map / 2D / 3D</label><div data-sun-controls hidden><label>Date <input type="date" aria-label="Sun preview date"></label><label>Season <input type="range" min="1" max="12" step="1" aria-label="Sun preview month"><span data-season-label></span></label><label>Eastern time <input type="range" min="240" max="1320" step="15" value="780" aria-label="Sun preview time"></label><output aria-live="polite"></output><label><input type="checkbox" data-illustrative-heights> Try illustrative heights where missing</label><button type="button" data-compare-light>Compare bed light for this date</button><button type="button" data-compare-months>Compare months for selected bed</button><dialog data-light-dialog aria-label="Bed daylight comparison"><form method="dialog"><button type="submit">Back to garden</button></form><div data-light-results role="region" aria-label="Estimated bed daylight" hidden></div></dialog><details><summary>Model & limits</summary><p>Violet shading estimates flat-ground shadows from entered heights. Unknown heights are omitted unless you enable illustrative heights: 20 ft trees/canopies, 4 ft shrubs, 12 ft buildings, 6 ft hedges/walls/fences. These scenario values never change saved object records. Trees are modeled as opaque columns from ground to entered height, using their crown shape and rotation; terrain, crown gaps, leaf loss and nearby unmapped objects are not modeled. Courtyards are treated as filled. Below 5° elevation shadows are hidden. Bed comparisons sample nine positions per bed every 20 minutes. They estimate mean unblocked and shaded hours only while the sun is at least 5° high; low-angle daylight is reported separately. Unmapped obstructions and missing heights can make unblocked hours too optimistic. Winter trees retain opaque crowns: leaf loss is not inferred. No measured sun-hour or plant-suitability claim is made. 3D sunlight follows the calculated direction; violet ground overlays use the same entered-height model. Decorative model shadows are disabled during preview. Bed views clip the same site-shadow estimate to the bed; they do not infer shade from decorative plants. Ambient light remains for visibility; brightness is not measured irradiance.</p><p>Uses the garden’s mapped origin and Eastern daylight/standard time. A practice garden uses its example location. Change heights in the object inspector. Settings reset when changing gardens or reloading.</p><a href="https://gml.noaa.gov/grad/solcalc/solareqns.PDF">NOAA solar equations</a></details></div>';
 const toggle=root.querySelector('[type=checkbox]'),date=root.querySelector('[type=date]'),time=root.querySelector('[aria-label="Sun preview time"]'),output=root.querySelector('output'),controls=root.querySelector('[data-sun-controls]');date.value=localDay();let gardenId=getState().activeParcelId;
 const month=root.querySelector('[aria-label="Sun preview month"]'),seasonLabel=root.querySelector('[data-season-label]'),results=root.querySelector('[data-light-results]');
 month.value=Number(date.value.slice(5,7));
 const assumed=root.querySelector('[data-illustrative-heights]'),dialog=root.querySelector('[data-light-dialog]');
 const style=document.createElement('style');style.textContent=`
 .planner-sun-preview{border-bottom:1px solid var(--line,#52634c);padding:.35rem .75rem}.planner-sun-preview [data-sun-controls]:not([hidden]){display:flex;flex-wrap:wrap}
 .planner-sun-preview [data-sun-controls]{gap:.4rem .8rem;align-items:center}
 .planner-sun-preview [data-sun-controls]>label{min-width:0;max-width:100%;font-size:.8rem;gap:.4rem}
 .planner-sun-preview input[type=range]{width:clamp(100px,16vw,190px);min-width:0;flex:1}
 .planner-sun-preview output{font-size:.78rem;line-height:1.35}
 .planner-sun-preview [data-season-label]{min-width:5.5em}
 .planner-sun-preview dialog{box-sizing:border-box;width:min(800px,92vw);max-height:80svh;overflow:auto;padding:1rem;border:1px solid #71806c;border-radius:8px;background:var(--theme-background,#f6f7f3);color:var(--theme-foreground,#18251b)}
 .planner-sun-preview dialog::backdrop{background:#10201588}
 .planner-sun-preview dialog form{display:flex;justify-content:flex-end;margin:0}
 .planner-sun-preview dialog p{font-size:.82rem;line-height:1.4;margin:.7rem 0}
 .planner-sun-preview dialog th{position:sticky;top:0;background:var(--theme-background,#f6f7f3)}
 @media(max-width:600px){.studio-preview-options[open] [data-role="time-preview-host"]{max-height:clamp(180px,28svh,280px);overflow-y:auto;overscroll-behavior:contain}.planner-sun-preview [data-sun-controls]>label{width:100%}.planner-sun-preview input[type=range]{max-width:190px}.planner-sun-preview{border-bottom:1px solid var(--line,#52634c);padding:.35rem .75rem}.planner-sun-preview [data-sun-controls]:not([hidden]){display:flex;flex-wrap:wrap}
 .planner-sun-preview [data-sun-controls]{gap:.3rem}.planner-sun-preview [data-season-label]{font-size:.75rem}}
 `;root.append(style);
 let estimateKey=null,comparisonRun=0;
 const signature=()=>{const state=getState();return JSON.stringify([date.value,assumed.checked,state.activeBedId,state.property,state.beds,state.vegetation,state.structures]);};
 const invalidate=()=>{comparisonRun++;results.hidden=true;results.replaceChildren();estimateKey=null;};
 function season(){month.value=Number(date.value.slice(5,7));seasonLabel.textContent=new Intl.DateTimeFormat('en-US',{month:'long',timeZone:'UTC'}).format(new Date(date.value+'T12:00:00Z'));}
 month.oninput=()=>{if(!date.value)return;const year=Number(date.value.slice(0,4)),m=Number(month.value),day=Math.min(Number(date.value.slice(8,10)),new Date(Date.UTC(year,m,0)).getUTCDate());date.value=`${year}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;invalidate();season();sync();onChange();};
 assumed.onchange=()=>{invalidate();sync();onChange();};
 root.querySelector('[data-compare-light]').onclick=()=>{
   comparisonRun++;results.hidden=false;results.replaceChildren();if(!dialog.open)dialog.showModal();
   try {
     const state=sunlightScenario(getState(),assumed.checked),[lon,lat]=gardenSpatialReference(state.property).origin.coordinates;
     const value=estimateBedDaylight(state,date.value,lat,lon);estimateKey=signature();
     const summary=document.createElement('p');summary.textContent=`${date.value}: ${value.modeledHours} h modeled daylight; ${value.lowSunHours} h low-angle daylight excluded. ${value.modeledObstructions} obstructions modeled (${state.assumedHeights} illustrative heights); ${value.omittedObstructions} omitted (missing height or unsupported geometry). Unblocked hours assume no other obstructions.`;results.append(summary);
     const scroller=document.createElement('div');scroller.style.cssText='max-height:240px;overflow:auto';
     const table=document.createElement('table');table.style.cssText='width:100%;font-size:.8rem';table.innerHTML='<thead><tr><th>Bed</th><th>Unblocked h</th><th>Shade h</th></tr></thead>';const body=document.createElement('tbody');
     for(const bed of value.beds){const row=document.createElement('tr');for(const text of [bed.name,bed.sunHours===null?'Not sampled':`${bed.sunHours} (${bed.sunMin}–${bed.sunMax})`,bed.shadeHours===null?'—':bed.shadeHours]){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}body.append(row);}
     table.append(body);scroller.append(table);results.append(scroller);
     const note=document.createElement('p');note.textContent='Mean hours across sampled bed positions; parentheses show the range. This is an opaque-canopy, flat-ground estimate. Change the date and compare again to explore seasons.';results.append(note);
   }catch(error){results.textContent=error.message;}
 };
 root.querySelector('[data-compare-months]').onclick=async()=>{
   invalidate();const run=comparisonRun,stamp=signature(),original=getState();
   const bed=original.beds.find(b=>b.id===original.activeBedId);
   results.hidden=false;results.textContent=bed?'Calculating monthly light estimates…':'Select a bed to compare its seasons.';
   if(!dialog.open)dialog.showModal();if(!bed)return;
   try{
     const state=sunlightScenario(structuredClone({property:original.property,beds:[bed],vegetation:original.vegetation,structures:original.structures}),assumed.checked);
     const [lon,lat]=gardenSpatialReference(state.property).origin.coordinates;
     const dates=seasonalLightDates(date.value),values=[];
     for(const day of dates){
       await new Promise(resolve=>requestAnimationFrame(resolve));
       if(run!==comparisonRun||stamp!==signature()||!dialog.open)return;
       values.push(estimateBedDaylight(state,day,lat,lon));
       results.textContent=`Calculating ${bed.name||'selected bed'} · ${values.length}/12 months…`;
     }
     estimateKey=signature();results.replaceChildren();
     const summary=document.createElement('p');summary.textContent=`${bed.name||'Selected bed'} · representative day of each month, ${date.value.slice(0,4)}. ${state.assumedHeights} illustrative heights. Flat-ground, opaque-canopy estimates; not measured sun hours or monthly averages.`;results.append(summary);
     const scroll=document.createElement('div');scroll.style.cssText='max-height:50svh;overflow:auto';
     const table=document.createElement('table');table.style.cssText='width:100%;font-size:.8rem';table.innerHTML='<thead><tr><th>Date</th><th>Unblocked h</th><th>Shade h</th><th>Preview</th></tr></thead>';const body=document.createElement('tbody');
     for(const value of values){const row=document.createElement('tr'),b=value.beds[0];
       for(const text of [value.date,b.sunHours??'Not sampled',b.shadeHours??'Not sampled']){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}
       const cell=document.createElement('td'),view=document.createElement('button');view.type='button';view.textContent='View';view.setAttribute('aria-label',`Preview sunlight on ${value.date}`);view.onclick=()=>{date.value=value.date;season();toggle.checked=true;dialog.close();invalidate();sync();onChange();};cell.append(view);row.append(cell);body.append(row);
     }
     table.append(body);scroll.append(table);results.append(scroll);
     const note=document.createElement('p');note.textContent=`${values[0].modeledObstructions} modeled obstructions; ${values[0].omittedObstructions} omitted. Hours exclude sun below 5° elevation and night. Vegetation stays opaque throughout the year; leaf loss is not modeled. Choose View, then move the time slider to inspect shadows in 3D.`;results.append(note);
   }catch(error){if(run===comparisonRun)results.textContent=error.message;}
 };
 dialog.addEventListener('close',()=>{comparisonRun++;});
 season();
 function model(){const state=sunlightScenario(getState(),assumed.checked);if(!toggle.checked)return null;try{const [lon,lat]=gardenSpatialReference(state.property).origin.coordinates;if(lat<41.2||lat>42.9||lon< -73.6||lon> -69.8)throw Error('Set a Massachusetts garden location to preview the sun.');const solar=solarPosition(easternPreviewInstant(date.value,Number(time.value)),lat,lon);return {...sunlightShapes(state,solar),...solar,lat,lon,assumedHeights:state.assumedHeights};}catch(e){return {error:e.message};}}
 function sync(){const state=getState();if(gardenId!==state.activeParcelId){gardenId=state.activeParcelId;toggle.checked=false;assumed.checked=false;invalidate();}controls.hidden=!toggle.checked;if(estimateKey && estimateKey!==signature())invalidate();const value=model();if(value){const m=Number(time.value),clock=String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');output.textContent=value.error||`${clock} Eastern · sun ${value.solarAltitudeDegrees.toFixed(0)}° above horizon, ${value.solarAzimuthDegrees.toFixed(0)}° from north · ${value.lowSun?'shadows hidden at low sun':value.trees.length+value.structures.length+' modeled objects ('+value.assumedHeights+' illustrative heights)'} · origin ${value.lat.toFixed(3)}, ${value.lon.toFixed(3)}`;}return value;}
 toggle.onchange=()=>{sync();onChange();};date.onchange=()=>{invalidate();if(date.value)season();sync();onChange();};time.oninput=()=>{sync();onChange();};
 function draw(svg,bed=null){svg?.querySelector('.solar-shadow-overlay')?.remove();const value=sync();if(!value||value.error||value.lowSun)return;const world=svg?.querySelector('.shared-view-world');if(!world)return;const ns='http://www.w3.org/2000/svg',group=document.createElementNS(ns,'g');group.setAttribute('class','solar-shadow-overlay');group.setAttribute('pointer-events','none');group.setAttribute('fill','#875be8');group.setAttribute('opacity','.32');
 const append=(shape,name)=>{const title=document.createElementNS(ns,'title');title.textContent=(name||'Object')+' · estimated shadow';shape.append(title);group.append(shape);};
 if(bed){for(const polygon of bedShadowPolygons(value,bed)){const shape=document.createElementNS(ns,'path');shape.setAttribute('d','M '+polygon.map(([x,y])=>[x+bed.width/2,y+bed.height/2].join(',')).join(' L ')+' Z');append(shape,bed.name);}world.append(group);return;}
 for(const item of value.trees){const shape=document.createElementNS(ns,'path');shape.setAttribute('class','solar-tree-shadow');shape.setAttribute('d','M '+item.shadow.points.map(p=>p.join(',')).join(' L ')+' Z');append(shape,item.name);}
 for(const item of value.structures)for(const polygon of item.polygons){const shape=document.createElementNS(ns,'path');shape.setAttribute('d','M '+polygon.map(p=>p.join(',')).join(' L ')+' Z');append(shape,item.name);}
 world.append(group);}
 return {root,sync,draw};
}
