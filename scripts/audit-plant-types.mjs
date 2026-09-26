import fs from 'node:fs/promises';
import {classifyPlantTypes} from '../src/lib/plants/plantTypes.js';
const input=process.argv[2]||'src/data/plant-explorer.json';
const rows=JSON.parse(await fs.readFile(input,'utf8'));if(!Array.isArray(rows))throw Error('Expected a plant array');
const typed=rows.map(classifyPlantTypes),counts={};for(const p of typed)for(const type of p.plantTypes)counts[type]=(counts[type]||0)+1;
console.log(JSON.stringify({records:rows.length,missingOriginalForm:rows.filter(p=>!p.form).length,types:counts,unclassified:typed.filter(p=>p.plantTypes.includes('unclassified')).map(p=>({id:p.id,name:p.name}))},null,2));
