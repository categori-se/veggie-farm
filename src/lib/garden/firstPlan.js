// A conservative starting arrangement, not a planting recommendation.
export function firstPlanPositions(bed,plants){
 if(!plants.length||plants.length>6)throw Error('Choose one to six plants for your first arrangement.');
 const result=[];
 for(const plant of [...plants].sort((a,b)=>b.spacing-a.spacing)){
  const radius=Math.max(Number(plant.spacing)||0,Number(plant.matureDiameter)||0)/2;
  if(!Number.isFinite(radius)||radius<=0)throw Error('This plant needs dimensions before arranging it.');
  const margin=(Number(bed.safeMargin)||0)+radius;let point=null;
  for(let y=margin;y<=bed.height-margin&&!point;y+=3)for(let x=margin;x<=bed.width-margin;x+=3){
   if(result.every(p=>Math.hypot(x-p.x,y-p.y)>=radius+p.radius)){point={x,y,radius,plantId:plant.id};break;}
  }
  if(!point)throw Error(`${plant.name} does not fit with these choices. Choose fewer plants or make a larger bed.`);
  result.push(point);
 }
 return result.map(({radius,...point})=>point);
}
export function firstPlanDimensions(widthFeet,depthFeet){
 const values=[widthFeet,depthFeet].map(Number);if(values.some(v=>!Number.isFinite(v)||v<1||v>50))throw Error('Enter bed dimensions between 1 and 50 feet.');return {width:values[0]*12,height:values[1]*12};
}
