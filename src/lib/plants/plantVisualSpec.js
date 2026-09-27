// Catalog associations are identity-based. Renderers never infer species from appearance.
const CATALOG_ARCHETYPES = Object.freeze({tomato:'upright-fruiting',lettuce:'low-rosette',carrot:'fine-tuft',basil:'paired-herb',blueberry:'rounded-shrub','eastern-white-pine':'layered-conifer'});
export const PLANT_ARCHETYPES = Object.freeze({
 'upright-fruiting':{form:'herbaceous',leafShape:'compound',layers:5,leaves:24,fruit:true},
 'low-rosette':{form:'herbaceous',leafShape:'spoon',layers:3,leaves:21},
 'fine-tuft':{form:'herbaceous',leafShape:'frond',layers:3,leaves:30},
 'paired-herb':{form:'herbaceous',leafShape:'oval',layers:5,leaves:20},
 'rounded-shrub':{form:'woody',leafShape:'oval',layers:4,leaves:32,fruit:true},
 'layered-conifer':{form:'woody',leafShape:'needle',layers:5,leaves:0}
});
export function plantVisualSpec(plant) {
 const id=plant?.visual?.archetype || CATALOG_ARCHETYPES[plant?.id], archetype=PLANT_ARCHETYPES[id];
 if(!archetype)return null;
 const width=Number(plant.matureDiameter),height=Number(plant.height),spacing=Number(plant.spacing);
 // Invalid dimensions keep the existing fallback; never invent a measurement.
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0)return null;
 return {id,...archetype,widthIn:width,heightIn:height,spacingIn:Number.isFinite(spacing)&&spacing>0?spacing:null,
  dimensionBasis:plant.dimensionBasis || 'catalog planning estimate',
  colors:{foliage:plant.leafColor || '#53824e',stem:archetype.form==='woody'?'#73583d':'#4b743c',fruit:plant.visual?.fruitColor || '#bf493c'},
  description:'Illustrative plant form at mature planning dimensions'};
}
