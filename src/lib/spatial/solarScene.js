// Studio uses x=east, y=up, z=south. Bed-only views remove the bed's
// plan rotation, so the solar direction must be transformed by the same angle.
export function solarSceneDirection(solar,bedRotation=0){
 const altitude=solar?.solarAltitudeDegrees,azimuth=solar?.solarAzimuthDegrees;
 if(!Number.isFinite(altitude)||!Number.isFinite(azimuth)||!Number.isFinite(bedRotation)||altitude< -90||altitude>90)return null;
 const a=altitude*Math.PI/180,b=azimuth*Math.PI/180,r=bedRotation*Math.PI/180;
 const east=Math.sin(b)*Math.cos(a),south=-Math.cos(b)*Math.cos(a);
 return {x:east*Math.cos(r)+south*Math.sin(r),y:Math.sin(a),z:-east*Math.sin(r)+south*Math.cos(r)};
}
export function solarScenePolygons(preview){
 if(!preview||preview.error||preview.lowSun)return [];
 return [...(preview.trees||[]).map(t=>t.shadow.points),...(preview.structures||[]).flatMap(s=>s.polygons)].filter(points=>Array.isArray(points)&&points.length>=3&&points.every(p=>Array.isArray(p)&&p.length>=2&&p.slice(0,2).every(Number.isFinite)));
}

// Clip site shadow polygons to a bed and express them in its centered 3D
// coordinate frame. All clipping is derived display geometry, never saved.
export function bedShadowPolygons(preview,bed) {
 if(!bed || ![bed.x,bed.y,bed.width,bed.height].every(Number.isFinite))return [];
 const a=(Number(bed.rotation)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 const limits=[['x',-bed.width/2,1],['x',bed.width/2,-1],['y',-bed.height/2,1],['y',bed.height/2,-1]];
 return solarScenePolygons(preview).map(ring=>{
  let points=ring.map(([x,y])=>[(x-bed.x)*c+(y-bed.y)*s,-(x-bed.x)*s+(y-bed.y)*c]);
  for(const [axis,bound,sign]of limits){
   const dim=axis==='x'?0:1,out=[];
   for(let i=0;i<points.length;i++){
    const p=points[i],q=points[(i+1)%points.length],pIn=(p[dim]-bound)*sign>=0,qIn=(q[dim]-bound)*sign>=0;
    if(pIn)out.push(p);
    if(pIn!==qIn){const t=(bound-p[dim])/(q[dim]-p[dim]);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}
   }
   points=out;
  }
  return points;
 }).filter(ring=>ring.length>=3);
}
