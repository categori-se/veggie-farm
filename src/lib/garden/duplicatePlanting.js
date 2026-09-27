// Duplicate a plan, never its observed history. The original remains untouched.
export function duplicatePlanting({source,bed,plants,placements,id}) {
 if(!source||!bed||source.bedId!==bed.id||!id||placements.some(p=>p.id===id))throw Error('Select a planting in a bed to duplicate.');
 const lookup=new Map(plants.map(p=>[p.id,p]));
 const radius=p=>{const plant=lookup.get(p.plantId),spacing=Number(plant?.spacing),width=Number(plant?.matureDiameter);return Number.isFinite(spacing)&&spacing>0&&Number.isFinite(width)&&width>0?Math.max(spacing,width)/2:NaN;};
 const r=radius(source),margin=Number(bed.safeMargin)||0,occupied=placements.filter(p=>p.bedId===bed.id);
 if(![r,bed.width,bed.height,source.x,source.y,margin].every(Number.isFinite)||r<=0||margin<0||occupied.some(p=>![p.x,p.y,radius(p)].every(Number.isFinite)))throw Error('Enter valid planting dimensions and positions before duplicating.');
 const fits=(x,y)=>{
  if(x<r+margin||y<r+margin||x>bed.width-r-margin||y>bed.height-r-margin)return false;
  if(bed.polygon){
   const ring=bed.polygon;if(!Array.isArray(ring)||ring.length<3||ring.some(p=>!Array.isArray(p)||!p.slice(0,2).every(Number.isFinite)))return false;
   let inside=false;
   for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const [ax,ay]=ring[j],[bx,by]=ring[i];
    if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
    const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));
    if(Math.hypot(x-ax-t*dx,y-ay-t*dy)<r+margin-1e-8)return false;
   }
   if(!inside)return false;
  }
  return occupied.every(p=>Math.hypot(x-p.x,y-p.y)>=r+radius(p)-1e-8);
 };
 const candidates=[];
 // Try neighbors first, then a bounded grid across the actual bed.
 for(let i=0;i<16;i++){const angle=i*Math.PI/8;candidates.push({x:source.x+2*r*Math.cos(angle),y:source.y+2*r*Math.sin(angle)});}
 const step=Math.max(1,r/2,Math.max(bed.width,bed.height)/120);
 for(let y=r+margin;y<=bed.height-r-margin;y+=step)for(let x=r+margin;x<=bed.width-r-margin;x+=step)candidates.push({x,y});
 const point=candidates.filter(p=>fits(p.x,p.y)).sort((a,b)=>Math.hypot(a.x-source.x,a.y-source.y)-Math.hypot(b.x-source.x,b.y-source.y))[0];
 if(!point)throw Error('No clear space found for a copy. Move plants or enlarge the bed, then try again.');
 const copy={id,bedId:bed.id,plantId:source.plantId,...point,rotation:Number(source.rotation)||0,health:'planned',notes:''};
 for(const key of ['planted','plannedUntil','planYear','harvestEstimate','sizeScenario'])if(source[key]!==undefined)copy[key]=JSON.parse(JSON.stringify(source[key]));
 return copy;
}
