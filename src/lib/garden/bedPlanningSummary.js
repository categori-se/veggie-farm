import {plannedOccupancy} from './plannedOccupancy.js';
import {measurementDate} from './soilReading.js';
// Approximate union of mature spacing/width circles, clipped to the usable
// rectangle. This is geometric planning space, not a guarantee another crop fits.
export function bedPlanningSummary(garden,bed,plants,date){
 const records=(garden?.placements||[]).filter(p=>p.bedId===bed.id);
 const occupied=records.filter(p=>plannedOccupancy(p,date).visible);
 const uncertain=occupied.filter(p=>{const t=plannedOccupancy(p,date);return !t.start||!t.end||t.end<t.start;}).length;
 const result={date:measurementDate(date),count:occupied.length,uncertain,freeSqFt:null,reason:null,conditions:garden?.property?.bedConditions?.[bed.id]||null};
 const width=Number(bed.width),height=Number(bed.height),margin=Number(bed.safeMargin??0),crowding=Number(bed.crowding??1);
 if(Array.isArray(bed.polygon)&&bed.polygon.length){result.reason='Space estimate is unavailable for polygon beds.';return result;}
 if(![width,height,margin,crowding].every(Number.isFinite)||width<=0||height<=0||margin<0||crowding<=0){result.reason='Bed dimensions need review.';return result;}
 const circles=[];
 for(const p of occupied){const plant=plants.find(x=>x.id===p.plantId);const spacing=Number(plant?.spacing),diameter=Number(plant?.matureDiameter);
  if(!plant||![p.x,p.y,spacing,diameter].every(Number.isFinite)||spacing<=0||diameter<=0){result.reason='Some plant positions or dimensions are missing; free space is unknown.';return result;}
  circles.push({x:p.x,y:p.y,r:Math.max(spacing*crowding,diameter)/2});
 }
 const w=Math.max(0,width-2*margin),h=Math.max(0,height-2*margin),n=96;let free=0;
 for(let row=0;row<n;row++)for(let col=0;col<n;col++){const x=margin+(col+.5)*w/n,y=margin+(row+.5)*h/n;if(!circles.some(c=>(x-c.x)**2+(y-c.y)**2<c.r**2))free++;}
 result.freeSqFt=Math.floor(free/(n*n)*w*h/144);return result;
}
