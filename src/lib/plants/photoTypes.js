import {catalogIdentity} from './catalogIdentity.js';
// Explicit crop-group crosswalk, not a species/cultivar identity merge. Alternative
// crops (e.g. Malabar spinach, cowpea, ornamental carrot) must remain unassessed.
const groups={
 Artichoke:['artichokes',/^Cynara (scolymus|cardunculus)/i],Asparagus:['asparagus',/^Asparagus officinalis/i],
 Broccoli:['broccoli',/^Brassica oleracea/i],Eggplant:['eggplants',/^Solanum melongena/i],
 Arugula:['arugula',/^Eruca /i],Beet:['beets',/^Beta vulgaris/i],
 'Bok Choy':['bok-choy',/^Brassica rapa/i],Carrot:['carrots',/^Daucus carota/i],Collard:['collards',/^Brassica oleracea/i],
 Cucumber:['cucumbers',/^Cucumis sativus/i],Kale:['kale',/^Brassica (oleracea|napus)/i],
 Lettuce:['lettuce',/^Lactuca sativa/i],Mizuna:['mizuna',/^Brassica rapa/i],Onion:['onions',/^Allium cepa/i],
 Pea:['peas',/^Pisum sativum/i],'Potato Tubers':['potatoes',/^Solanum tuberosum/i],Radish:['radishes',/^Raphanus sativus/i],
 Spinach:['spinach',/^Spinacia oleracea/i],'Sweet Pepper':['peppers',/^Capsicum annuum/i],'Hot Pepper':['peppers',/^Capsicum annuum/i],
 'Swiss Chard':['swiss-chard',/^Beta vulgaris/i],Tomato:['tomatoes',/^Solanum (lycopersicum|pimpinellifolium)/i],
 Turnip:['turnips',/^Brassica rapa/i],'Winter Squash':['winter-squash',/^Cucurbita (maxima|moschata|pepo)/i]
};
const excluded = new Set(['plant:catalog:1d3caf5a5dfd6444','plant:catalog:5d3cb9098d2c6b7f','plant:catalog:4fb99adaf480a985','plant:catalog:7a899714829dcbfe','plant:catalog:2f95ea7040d47203']);
export function photoCropType(plant){if(excluded.has(catalogIdentity(plant.id)))return null;const group=groups[plant.common];const describedTaxon=plant.description?.match(/^\(([A-Z][a-z]+ [a-z]+)\b/)?.[1];const scientific=plant.scientific||describedTaxon;return plant.category==='vegetable'&&group&&(!scientific||group[1].test(scientific))?group[0]:null;}
