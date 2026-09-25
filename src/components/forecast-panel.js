import {fetchNwsGardenForecast} from '../lib/environment/nwsForecast.js';
import {forecastPlot} from '../lib/environment/forecastPlot.js';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const svg=(tag,attrs={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
const value=(n,unit)=>n==null?'Unknown':`${Math.round(n)}${unit}`;
function position(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('Location is unavailable.'));navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:900000});});}
export function forecastPanel({invalidation,onChange=()=>{}}={}){
 const root=el('section',null,'forecast-panel');root.setAttribute('aria-label','Optional local forecast');root.value=null;
 const controls=el('div',null,'forecast-panel-controls'),load=el('button','Load local forecast'),clear=el('button','Clear forecast'),status=el('span','No forecast loaded.');status.setAttribute('role','status');load.type=clear.type='button';clear.hidden=true;controls.append(load,clear,status);
 const privacy=el('details',null,'forecast-permission');privacy.append(el('summary','Location & source'),el('p','Only when you choose Load: your browser sends a location rounded to 0.001° directly to NWS. This page keeps the forecast in memory; no garden address or notebook record is saved. A forecast describes an area, not your garden’s soil or frost pocket.'));
 const body=el('div',null,'forecast-panel-body');root.append(controls,privacy,body);let generation=0,disposed=false,downloadUrl;
 const notify=()=>{root.dispatchEvent(new Event('input',{bubbles:true}));onChange(root.value);};
 const revoke=()=>{if(downloadUrl){URL.revokeObjectURL(downloadUrl);downloadUrl=null;}};
 const render=forecast=>{
  revoke();body.replaceChildren();if(!forecast)return;
  const w=forecast.next48Hours,location=[forecast.location.city,forecast.location.state].filter(Boolean).join(', ')||forecast.location.grid.office;
  body.append(el('p',`${location} · NWS · fetched ${new Date(forecast.fetchedAt).toLocaleString()}`,'forecast-panel-source'));
  const facts=el('div',null,'forecast-panel-facts');for(const [label,text]of [['Low',value(w.minimumTemperatureF,'°F')],['High',value(w.maximumTemperatureF,'°F')],['Rain chance',value(w.maxPrecipitationProbabilityPct,'%')],['Wind peak',value(w.maximumWindMph,' mph')]]){const item=el('span');item.append(el('small',label),el('strong',text));facts.append(item);}body.append(facts);
  const plot=forecastPlot(forecast.periods);
  if(plot.coverage){const chart=svg('svg',{viewBox:'0 0 580 165',role:'img','aria-label':`Hourly air temperature. ${plot.coverage} readings; dashed line marks 32 degrees Fahrenheit.`});chart.append(svg('line',{x1:40,x2:550,y1:plot.freezeY,y2:plot.freezeY,class:'forecast-freeze-line'}));const freezing=svg('text',{x:2,y:plot.freezeY+4});freezing.textContent='32°F';chart.append(freezing);for(const line of plot.segments){chart.append(svg('polyline',{points:line.map(p=>p.join(',')).join(' '),class:'forecast-temperature-line'}));for(const [cx,cy]of line)chart.append(svg('circle',{cx,cy,r:2,class:'forecast-temperature-dot'}));}for(const [time,x,anchor]of [[plot.start,40,'start'],[plot.end,550,'end']]){const label=svg('text',{x,y:155,'text-anchor':anchor});label.textContent=new Date(time).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric'});chart.append(label);}body.append(chart);}
  body.append(el('p',`${plot.coverage}/${w.hoursRequested} temperature hours available. Gaps are not interpolated. Rain chance is not rainfall amount.`,'forecast-panel-source'));
  const source=el('a','NWS source');source.href=forecast.sourceUrls?.hourly||'https://www.weather.gov/documentation/services-web-api';source.target='_blank';source.rel='noopener noreferrer';
  downloadUrl=URL.createObjectURL(new Blob([JSON.stringify(forecast,null,2)],{type:'application/json'}));const download=el('a','Download forecast record');download.href=downloadUrl;download.download='veggie-farm-forecast.json';const links=el('div',null,'forecast-panel-controls');links.append(source,download);body.append(links);
 };
 load.onclick=async()=>{const request=++generation;load.disabled=true;status.textContent='Requesting location and forecast…';try{const p=await position();if(disposed||request!==generation)return;const forecast=await fetchNwsGardenForecast({latitude:p.coords.latitude,longitude:p.coords.longitude,useCache:false});if(disposed||request!==generation)return;root.value=forecast;render(forecast);clear.hidden=false;load.textContent='Refresh forecast';status.textContent='Forecast loaded';notify();}catch(error){if(disposed||request!==generation)return;root.value=null;render(null);clear.hidden=true;status.textContent=`Forecast unavailable: ${error.message}`;notify();}finally{if(!disposed&&request===generation)load.disabled=false;}};
 clear.onclick=()=>{generation++;root.value=null;render(null);clear.hidden=true;load.disabled=false;load.textContent='Load local forecast';status.textContent='No forecast loaded.';notify();};
 invalidation?.then(()=>{disposed=true;generation++;revoke();});return root;
}
