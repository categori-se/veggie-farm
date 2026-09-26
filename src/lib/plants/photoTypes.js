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
const excluded = new Set(['plant:rareseeds:carrot-dara-flowering','plant:rareseeds:spinach-new-zealand','plant:rareseeds:spinach-red-malabar','plant:rareseeds:spinach-strawberry','plant:rareseeds:onion-ishikura-bunching']);
export function photoCropType(plant){if(excluded.has(plant.id))return null;const group=groups[plant.common];const describedTaxon=plant.description?.match(/^\(([A-Z][a-z]+ [a-z]+)\b/)?.[1];const scientific=plant.scientific||describedTaxon;return plant.category==='vegetable'&&group&&(!scientific||group[1].test(scientific))?group[0]:null;}
