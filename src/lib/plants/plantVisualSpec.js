// Builder walkthrough: docs/building/README.md. Dimensions are planning inputs;
// this visual interpretation does not create horticultural source evidence.
// Catalog associations are identity-based. Renderers never infer species from appearance.
const CATALOG_ARCHETYPES = Object.freeze({tomato:'upright-fruiting',lettuce:'low-rosette',carrot:'fine-tuft',basil:'paired-herb',blueberry:'rounded-shrub','eastern-white-pine':'layered-conifer'});
// Schematic art directions, not botanical meshes or cultivar identifications.
const FLOWER_FORMS = Object.freeze({
 'flower-peony':'layered', 'flower-virginia-rose':'radial', 'flower-wild-geranium':'radial',
 'flower-red-columbine':'bell', 'flower-butterfly-weed':'cluster', 'flower-bee-balm':'cluster',
 'flower-black-eyed-susan':'rayed', 'flower-blue-flag-iris':'iris', 'flower-blazing-star':'spike',
 'flower-cardinal-flower':'spike', 'flower-smooth-aster':'rayed', 'flower-wild-blue-phlox':'radial',
 'flower-goldenrod':'spray'
});
export const PLANT_ARCHETYPES = Object.freeze({
 'broadleaf-tree':{form:'woody',leafShape:'crown',layers:4,leaves:0},
 'flowering-perennial':{form:'herbaceous',leafShape:'oval',layers:3,leaves:12},
 'upright-fruiting':{form:'herbaceous',leafShape:'compound',layers:5,leaves:24,fruit:true},
 'low-rosette':{form:'herbaceous',leafShape:'spoon',layers:3,leaves:21},
 'fine-tuft':{form:'herbaceous',leafShape:'frond',layers:3,leaves:30},
 'paired-herb':{form:'herbaceous',leafShape:'oval',layers:5,leaves:20},
 'rounded-shrub':{form:'woody',leafShape:'oval',layers:4,leaves:32,fruit:true},
 'layered-conifer':{form:'woody',leafShape:'needle',layers:5,leaves:0}
});
export function plantVisualSpec(plant) {
 const habit=plant?.visual?.habit;
 const id=plant?.visual?.archetype || CATALOG_ARCHETYPES[plant?.id] || (habit==='tree'?'broadleaf-tree':habit==='conifer'?'layered-conifer':FLOWER_FORMS[plant?.id]?'flowering-perennial':null), archetype=PLANT_ARCHETYPES[id];
 if(!archetype)return null;
 const width=Number(plant.matureDiameter),height=Number(plant.height),spacing=Number(plant.spacing);
 // Invalid dimensions keep the existing fallback; never invent a measurement.
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0)return null;
 return {id,...archetype,widthIn:width,heightIn:height,spacingIn:Number.isFinite(spacing)&&spacing>0?spacing:null,
  dimensionBasis:plant.dimensionBasis || 'catalog planning estimate',
  flowerForm:FLOWER_FORMS[plant.id] || null,
  colors:{flower:plant.visual?.flowerColor || null,center:plant.id==='flower-black-eyed-susan'?'#483323':'#d4ae45',foliage:plant.leafColor || '#53824e',stem:archetype.form==='woody'?'#73583d':'#4b743c',fruit:plant.visual?.fruitColor || '#bf493c'},
  description:id==='flowering-perennial'?'Schematic bloom form using the catalog color; cultivar and seasonal appearance may differ':'Illustrative plant form at mature planning dimensions'};
}
