import {solarPosition, easternPreviewInstant, sunlightShapes} from './solarPreview.js';
import {solarScenePolygons} from './solarScene.js';

function contains([x,y], ring) {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [xi,yi]=ring[i], [xj,yj]=ring[j];
    if ((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}
export function bedLightSamplePoints(bed) {
  if (![bed.x,bed.y,bed.width,bed.height].every(Number.isFinite) || bed.width<=0 || bed.height<=0) return [];
  const a=(Number(bed.rotation)||0)*Math.PI/180, points=[];
  for(const u of [1/6,1/2,5/6]) for(const v of [1/6,1/2,5/6]) {
    const x=(u-.5)*bed.width,y=(v-.5)*bed.height;
    const point=[bed.x+x*Math.cos(a)-y*Math.sin(a),bed.y+x*Math.sin(a)+y*Math.cos(a)];
    if (!bed.polygon || contains(point,bed.polygon)) points.push(point);
  }
  return points;
}
// Bounds keep this explicit, browser-local calculation predictable. Nine bed
// samples and 20-minute midpoint bins are a comparison model, not measurement.
export function estimateBedDaylight(state, date, latitude, longitude) {
  if (latitude<41.2 || latitude>42.9 || longitude< -73.6 || longitude> -69.8 || ![latitude,longitude].every(Number.isFinite)) throw Error('A Massachusetts garden location is required.');
  const beds=state.beds||[], vegetation=state.vegetation||[], structures=state.structures||[];
  if(beds.length>200 || vegetation.length+structures.length>500) throw Error('Compare at most 200 beds and 500 mapped obstructions at once.');
  const complexity=[...vegetation,...structures].reduce((n,f)=>n+JSON.stringify(f.localGeometry?.coordinates||f.polygon||[]).length,0);
  if(complexity>500000) throw Error('Simplify obstruction geometry before comparing light.');
  const rows=beds.map(bed=>({id:bed.id,name:bed.name||'Bed',points:bedLightSamplePoints(bed),sun:[],shade:0}));
  for(const row of rows)row.sun=row.points.map(()=>0);
  let modeledHours=0,lowSunHours=0,daylightHours=0;
  const used=new Set();
  for(let minutes=250;minutes<1320;minutes+=20) {
    const solar=solarPosition(easternPreviewInstant(date,minutes),latitude,longitude);
    if(solar.solarAltitudeDegrees<=0)continue;
    daylightHours+=1/3;
    if(solar.solarAltitudeDegrees<5){lowSunHours+=1/3;continue;}
    modeledHours+=1/3;
    const shapes=sunlightShapes(state,solar),polygons=solarScenePolygons(shapes);
    shapes.trees.forEach(f=>used.add('t:'+f.id));shapes.structures.forEach(f=>used.add('s:'+f.id));
    const shadows=polygons.map(ring=>({ring,minX:Math.min(...ring.map(p=>p[0])),maxX:Math.max(...ring.map(p=>p[0])),minY:Math.min(...ring.map(p=>p[1])),maxY:Math.max(...ring.map(p=>p[1]))}));
    for(const row of rows) row.points.forEach((point,index)=>{
      const shaded=shadows.some(s=>point[0]>=s.minX&&point[0]<=s.maxX&&point[1]>=s.minY&&point[1]<=s.maxY&&contains(point,s.ring));
      if(!shaded)row.sun[index]+=1/3;
    });
  }
  const round=x=>Math.round(x*10)/10;
  return {date,stepMinutes:20,daylightHours:round(daylightHours),modeledHours:round(modeledHours),lowSunHours:round(lowSunHours),modeledObstructions:used.size,
    omittedObstructions:vegetation.length+structures.length-used.size,
    beds:rows.map(row=>{const mean=row.sun.length?row.sun.reduce((a,b)=>a+b,0)/row.sun.length:null;return {id:row.id,name:row.name,sampleCount:row.points.length,sunHours:mean===null?null:round(mean),shadeHours:mean===null?null:round(modeledHours-mean),sunMin:row.sun.length?round(Math.min(...row.sun)):null,sunMax:row.sun.length?round(Math.max(...row.sun)):null};})};
}

// Optional design scenario only. Never persist these generic heights as facts.
export function sunlightScenario(state,useIllustrativeHeights=false) {
 if(!useIllustrativeHeights)return {...state,assumedHeights:0};
 let assumedHeights=0;
 const estimate=(feature,feet)=>{
  if(Number(feature.heightEstimateFeet)>0 || !feet)return feature;
  assumedHeights++;return {...feature,heightEstimateFeet:feet,heightConfidence:'illustrative'};
 };
 return {...state,vegetation:(state.vegetation||[]).map(f=>estimate(f,f.kind==='shrub'?4:20)),
  structures:(state.structures||[]).map(f=>estimate(f,/^(house|building|greenhouse|shed)$/.test(f.type)?12:/^(hedge|fence|wall)$/.test(f.type)?6:0)),assumedHeights};
}
