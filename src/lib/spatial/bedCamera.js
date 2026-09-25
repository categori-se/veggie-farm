/** Bed-local camera state, kept outside planting geometry and GIS attributes. */
export function defaultBedViewport(bed) {
  const pad = Math.max(10, Math.min(24, Math.max(bed.width,bed.height)*0.08));
  return {x:-pad,y:-pad,width:bed.width+2*pad,height:bed.height+2*pad};
}
export function normalizeBedCamera(bed, saved = {}) {
  const base=defaultBedViewport(bed), v=saved?.viewport;
  let viewport={...base};
  if (v && [v.x,v.y,v.width,v.height].every(Number.isFinite) && v.width>0 && v.height>0) {
    const scale=Math.max(3/Math.min(v.width,v.height),Math.min(1,8*Math.max(base.width,base.height)/Math.max(v.width,v.height)));
    const width=v.width*scale,height=v.height*scale,limit=Math.max(base.width,base.height)*4;
    viewport={x:Math.max(-limit,Math.min(bed.width+limit-width,v.x)),y:Math.max(-limit,Math.min(bed.height+limit-height,v.y)),width,height};
  }
  // Older saved cameras could pan completely beyond the bed and reopen as an
  // empty canvas. Recover only camera state; never move beds or plantings.
  if (viewport.x >= bed.width || viewport.y >= bed.height || viewport.x+viewport.width <= 0 || viewport.y+viewport.height <= 0) viewport={...base};
  return {viewport,bearing:Number.isFinite(saved?.bearing)?((saved.bearing%360)+360)%360:0,
    pitch:Number.isFinite(saved?.pitch)?Math.max(5,Math.min(80,saved.pitch)):45};
}
export function normalizeBedCameras(beds, saved = {}) {
  return Object.fromEntries(beds.filter(b=>Object.hasOwn(saved||{},b.id)).map(b=>[b.id,normalizeBedCamera(b,saved[b.id])]));
}
export function zoomBedCamera(bed, camera, factor, anchor) {
  const view=normalizeBedCamera(bed,camera),v=view.viewport;
  if (!Number.isFinite(factor) || factor<=0) return view;
  const p=anchor||{x:v.x+v.width/2,y:v.y+v.height/2};
  return normalizeBedCamera(bed,{...view,viewport:{x:p.x-(p.x-v.x)*factor,y:p.y-(p.y-v.y)*factor,width:v.width*factor,height:v.height*factor}});
}
