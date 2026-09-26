// Discovery types describe broad growth form and potential use, not site suitability.
export const plantTypeLabels={tree:'Trees',shrub:'Shrubs',subshrub:'Subshrubs',herbaceous:'Herbaceous plants',vine:'Vines & climbers',grass:'Grasses & grains',succulent:'Succulents',groundcover:'Groundcovers','cover-crop':'Cover crops',unclassified:'Type not assessed'};
const split=s=>new Set(s.split('|'));
const trees=split('Moringa|English Morello Cherry');
const shrubs=split('Goji Berry|Tamarillo');
const subshrubs=split('Lavender|Rosemary|Sage|Thyme|Marjoram|Oregano|Savory|Tweedia');
const grasses=split("Barley|Corn|Grass|Job's Tears|Lemongrass|Sorghum|Wheat");
const vines=split('Bitter Melon|Butterfly Pea|Cucumber|Gourd|Hyacinth Bean|Jelly Melon|Long Bean|Melon|Morning Glory|Runner Bean|Snail Vine|Snake Bean|Sweet Pea|Watermelon|Wax Melon|Winged Bean|Winter Squash');
const succulents=split('Iceplant|Moss Rose|Purslane');
const herbaceous=split("Agastache|Ageratum|Amaranth|Artichoke|Arugula|Asparagus|Aster|Baby's Breath|Bachelor's Button|Balloon Flower|Basil|Basketflower|Bean|Bee Balm|Beet|Bells of Ireland|Bok Choy|Borage|Broccoli|Broccoli Rabe|Brussels Sprouts|Buckwheat|Cabbage|Calamintha|Calendula|Canterbury Bell|Cardoon|Carrot|Catmint|Cauliflower|Celosia|Chamomile|Chicory|Chijimisai|Chinese Broccoli|Chinese Cabbage|Chive|Choy Sum|Cilantro|Clover|Coleus|Collard|Columbine|Coreopsis|Corn Salad|Cosmos|Cowpea|Craspedia|Crocus Bulbs|Dahlia|Daisy|Dandelion|Dianthus|Dill|Echinacea|Eggplant|Evening Primrose|Fava Bean|Fennel|Fenugreek|Four O'Clock|Gaillardia|Garbanzo Bean|Gomphrena|Ground Cherry|Hollyhock|Honeywort|Horehound|Hot Pepper|Huckleberry|Kale|Kohlrabi|Komatsuna|Lace Flower|Leek|Lemon Balm|Lettuce|Lima Bean|Litchi Tomato|Lovage|Love-In-A-Mist|Marigold|Marshmallow|Mexican Sunflower|Milkweed|Millennium Asparagus|Mint|Mizuna|Molokhia|Mullein|Mustard|Nasturtium|Nicotiana|Okra|Onion|Orach|Oyster Leaf|Parsley|Parsnip|Pea|Peanut|Petunia|Phlox|Poppy|Potato Tubers|Primrose|Radish|Rhubarb|Rudbeckia|Rugen Alpine Strawberry|Rutabaga|Safflower|Salpiglossis|Salvia|Scabiosa|Snapdragon|Sorrel|Soybean|Spinach|Stevia|Stock|Strawberry|Strawflower|Summer Squash|Sunflower|Sweet Pepper|Swiss Chard|Tatsoi|Tomatillo|Tomato|Toothache Plant|Turnip|Verbena|Vinca|Viola|Watercress|Yarrow|Zinnia");
const refs={
 thyme:'https://plants.ces.ncsu.edu/plants/thymus-vulgaris/',
 creepingThyme:'https://plants.ces.ncsu.edu/plants/thymus-serpyllum/',
 strawberry:'https://green2.kingcounty.gov/gonative/Plant.aspx?Act=view&PlantID=70',
 nasturtium:'https://nathistoc.bio.uci.edu/plants/Tropaeolaceae/Tropaeolum%20majus.htm',
 oregano:'https://ucanr.edu/site/uc-master-gardeners-san-luis-obispo-county/lawn-alternatives-grasses-and-groundcovers',
 iceplant:'https://extension.colostate.edu/resource/ground-cover-plants/',
 livingstone:'https://pza.sanbi.org/cleretum-bellidiforme',
 mossRose:'https://extension.okstate.edu/programs/plant-id/plant-profiles/rose-moss',
 clover:'https://www.nrcs.usda.gov/plantmaterials/orpmcpg11726.pdf',
 whiteClover:'https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/yard-and-garden-problems/dutch-white-clover'
};
const aliases={Beans:'Bean',Beets:'Beet',Carrots:'Carrot',Collards:'Collard',Cucumbers:'Cucumber','Ground Cherries':'Ground Cherry',Onions:'Onion',Peas:'Pea',Peppers:'Sweet Pepper',Potatoes:'Potato Tubers',Radishes:'Radish',Strawberries:'Strawberry',Tomatoes:'Tomato',Turnips:'Turnip',Zucchini:'Summer Squash'};
export function classifyPlantTypes(p){
 const common=aliases[p.common]||p.common||'',name=p.name||'',taxon=p.scientific||'',types=new Set(),sources=new Set();
 let basis='Inferred from catalog crop group; cultivar habit not independently verified.';
 if(plantTypeLabels[p.form]&&p.form!=='unclassified'){types.add(p.form);basis='Existing catalog form, with inferred discovery roles where indicated.';}
 if(trees.has(common)||/^Syzygium aromaticum\b/i.test(taxon))types.add('tree');
 else if(shrubs.has(common)||['Black Currants','Blueberries','Gooseberries','Raspberries'].includes(common)||/^Rosa\s/i.test(taxon))types.add('shrub');
 else if(subshrubs.has(common))types.add('subshrub');
 else if(grasses.has(common))types.add('grass');
 else if(vines.has(common))types.add('vine');
 else if(succulents.has(common))types.add('succulent');
 else if(herbaceous.has(common)||common==='Garlic'||/^(Liatris|Iris|Paeonia|Aquilegia|Symphyotrichum|Monarda|Phlox|Geranium|Solidago|Lobelia|Rudbeckia|Asclepias)\s/i.test(taxon))types.add('herbaceous');
 if(p.form==='groundcover')types.add('herbaceous');
 if(common==='Bean'&&/\bpole\b/i.test(name+' '+(p.description||'')))types.add('vine');
 if(common==='Spinach'&&/\bMalabar\b/i.test(name))types.add('vine');
 if(common==='Thyme'){types.add('groundcover');sources.add(/creeping|wild/i.test(name)?refs.creepingThyme:refs.thyme);}
 if(common==='Strawberry'||/\bStrawberry$/i.test(common)||/^Fragaria\b/i.test(taxon)){types.add('herbaceous');types.add('groundcover');sources.add(refs.strawberry);}
 if(common==='Nasturtium'){types.add('groundcover');sources.add(refs.nasturtium);if(/trailing|climb/i.test(p.description||''))types.add('vine');}
 if(/^Origanum vulgare\b/i.test(taxon)){types.add('groundcover');sources.add(refs.oregano);}
 if(/^Delosperma\b/i.test(taxon)){types.add('groundcover');sources.add(refs.iceplant);}
 if(/^(Dorotheanthus bellidiformis|Cleretum bellidiforme)\b/i.test(taxon)){types.add('succulent');types.add('groundcover');sources.add(refs.livingstone);}
 if(common==='Moss Rose'){types.add('groundcover');sources.add(refs.mossRose);}
 if(p.category==='grain-or-cover-crop')types.add('cover-crop');
 if(common==='Clover'&&/crimson/i.test(name)){types.add('cover-crop');sources.add(refs.clover);}
 if(/^Trifolium repens\b/i.test(taxon)){types.add('herbaceous');types.add('groundcover');types.add('cover-crop');sources.add(refs.whiteClover);}
 if(!types.size){types.add('unclassified');basis='Type not assessed; no matching reviewed crop-group rule.';}
 return {...p,plantTypes:[...types],plantTypeBasis:basis,plantTypeSources:[...sources]};
}
