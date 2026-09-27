import {plantVisualGeometry} from './plantVisualGeometry.js';
// D3 selection supplied by the application; no extra rendering dependency.
export function renderPlantVisual2d(group,spec,placement,{ghost=false}={}) {
 const parts=plantVisualGeometry(spec,placement?.id).sort((a,b)=>(a.y??0)-(b.y??0)),w=spec.widthIn;
 group.attr('data-archetype',spec.id);
 for(const p of parts){
  if(p.kind==='branch'){group.append('line').attr('x1',p.start[0]*w).attr('y1',p.start[2]*w).attr('x2',p.end[0]*w).attr('y2',p.end[2]*w).attr('stroke',p.color).attr('stroke-width',w*.006);continue;}
  group.append('ellipse').attr('cx',p.x*w).attr('cy',p.z*w).attr('rx',p.sx*w/2).attr('ry',p.sz*w/2)
   .attr('transform',`rotate(${p.yaw*180/Math.PI} ${p.x*w} ${p.z*w})`)
   .attr('fill',p.color).attr('fill-opacity',ghost?.35:.88).attr('stroke','#24432d').attr('stroke-width',Math.max(.07,w*.002));
 }
}
