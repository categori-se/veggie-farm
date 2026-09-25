import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
// New photographs enter this registry only after individual subject and rights
// review. Existing legacy credits are separate and are not retroactively approved.
const rows=JSON.parse(fs.readFileSync('src/data/reviewed-plant-media.json','utf8'));
const ids=new Set();for(const row of rows){
 if(row.review_status!=='approved'||ids.has(row.image_id))throw Error('Unapproved or duplicate media record');ids.add(row.image_id);
 for(const key of ['image_id','crop_id','subject','life_stage','photographer','license','license_url','attribution','alt_text','source_url','original_url','source_file'])if(typeof row[key]!=='string'||!row[key].trim())throw Error(`Missing ${key}`);
 for(const key of ['source_url','original_url','license_url'])if(new URL(row[key]).protocol!=='https:')throw Error('Expected HTTPS source');
 if(!/^src\/assets\/images\/plants\/[a-z0-9-]+\.webp$/.test(row.local_path))throw Error('Invalid media path');
 if(!Number.isInteger(row.width)||!Number.isInteger(row.height)||row.width<1||row.height<1||![row.focal_x,row.focal_y].every(v=>Number.isFinite(v)&&v>=0&&v<=1))throw Error('Invalid image dimensions/focal point');
 for(const [file,hash]of (process.argv.includes('--derivatives-only')?[[row.local_path,row.checksum]]:[[row.local_path,row.checksum],[row.source_file,row.source_checksum]])){if(!path.resolve(file).startsWith(process.cwd()+path.sep))throw Error('Media outside repository');if(createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==hash)throw Error(`Media hash drift: ${file}`);}
}
console.log(`Reviewed media check passed: ${rows.length} individually approved photographs; legacy collection remains separate.`);
