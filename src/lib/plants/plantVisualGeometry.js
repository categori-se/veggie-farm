// Shared, deterministic organ layout in a normalized (east, up, south) frame.
// Both renderers consume these same parts. No garden/plant records are modified.
export function plantVisualGeometry(spec, placementId='') {
 let seed=2166136261;for(const c of String(placementId))seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 const random=i=>{let x=Math.imul(seed^(i+1),1597334677);x=Math.imul(x^(x>>>16),2246822507);return (x>>>0)/4294967296;};
 const parts=[],branches=[],add=(kind,x,y,z,sx,sy,sz,color,yaw=0)=>parts.push({kind,x,y,z,sx,sy,sz,color,yaw});
 const branch=(x,y,z,color)=>branches.push({kind:'branch',start:[0,.04,0],end:[x,y,z],color});
 const stem=(x,z,h,r=.015)=>add('cylinder',x,h/2,z,r,h,r,spec.colors.stem);
 const leaf=(x,y,z,length,width,yaw)=>add('sphere',x,y,z,length,.025,width,spec.colors.foliage,yaw);
 if(spec.id==='layered-conifer'){
  stem(0,0,1,.022);
  for(let i=0;i<spec.layers;i++){
   const radius=.5*(1-i*.15),h=.2;
   add('cone',0,.28+i*.14,0,radius*2,h,radius*2,spec.colors.foliage);
   for(let j=0;j<6;j++){const a=j*Math.PI/3+i*.6;leaf(Math.cos(a)*radius*.6,.16+i*.14,Math.sin(a)*radius*.6,radius*.8,.055,a);}
  }
 }else{
  const rosette=spec.id==='low-rosette',tuft=spec.id==='fine-tuft',paired=spec.id==='paired-herb',shrub=spec.form==='woody';
  stem(0,0,rosette?.22:tuft?.4:.92,shrub?.03:.012);
  if(shrub)for(let i=0;i<4;i++){const a=i*Math.PI/2;stem(Math.cos(a)*.16,Math.sin(a)*.16,.7,.014);}
  for(let i=0;i<spec.leaves;i++){
   const layer=i%spec.layers,angle=paired?Math.floor(i/2)*1.4+(i%2)*Math.PI:i*2.39996+random(i)*.3;
   const r=rosette?.12+.27*(i/spec.leaves):tuft?.18+.1*random(i):.18+.08*random(i);
   const y=rosette?.08+layer*.06:tuft?.22+layer*.18:shrub?.25+random(i+100)*.55:.2+layer/spec.layers*.62;
   if(!rosette)branch(Math.cos(angle)*r,y,Math.sin(angle)*r,tuft?spec.colors.foliage:spec.colors.stem);
   leaf(Math.cos(angle)*r,y,Math.sin(angle)*r,tuft?.55:rosette?.48:paired?.35:.3,tuft?.022:rosette?.23:.14,angle);
   if(spec.leafShape==='compound')for(const offset of [-.1,.1])leaf(Math.cos(angle)*r+Math.sin(angle)*offset,y+.018,Math.sin(angle)*r-Math.cos(angle)*offset,.18,.085,angle+offset*3);
   if(tuft)for(const sign of [-1,1])leaf(Math.cos(angle)*r+Math.sin(angle)*sign*.05,y+.04,Math.sin(angle)*r-Math.cos(angle)*sign*.05,.2,.016,angle+sign*.6);
  }
  if(spec.fruit)for(let i=0;i<6;i++){const a=i*2.39996+random(90);const d=shrub?.045:.1;add('sphere',Math.cos(a)*.25,.38+(i%3)*.11,Math.sin(a)*.25,d,d,d,spec.colors.fruit);}
 }
 // Normalize the complete silhouette, including yawed leaves, to declared width
 // and height. Width is a diameter; it is not the separate spacing requirement.
 let radius=0,minY=Infinity,maxY=-Infinity;
 for(const p of parts){radius=Math.max(radius,Math.hypot(p.x,p.z)+Math.max(p.sx,p.sz)/2);minY=Math.min(minY,p.y-p.sy/2);maxY=Math.max(maxY,p.y+p.sy/2);}
 const organs=parts.map(p=>({...p,x:p.x/(radius*2),z:p.z/(radius*2),sx:p.sx/(radius*2),sz:p.sz/(radius*2),y:(p.y-minY)/(maxY-minY),sy:p.sy/(maxY-minY)}));
 const point=([x,y,z])=>[x/(radius*2),(y-minY)/(maxY-minY),z/(radius*2)];
 return [...organs,...branches.map(p=>({...p,start:point(p.start),end:point(p.end)}))];
}
