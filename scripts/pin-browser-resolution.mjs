import fs from 'node:fs/promises';
import path from 'node:path';
// Framework 1.13.4 seeds version resolution from cache directory names. Pin those
// names before launching it; downloaded module bodies still face the hash gate.
const pins=JSON.parse(await fs.readFile('browser-resolution.json','utf8'));
const framework=JSON.parse(await fs.readFile('node_modules/@observablehq/framework/package.json','utf8'));
if(pins.version!==1||framework.version!==pins.framework)throw Error('Review browser-resolution pins for this Framework version');
const cache='src/.observablehq/cache/_npm';await fs.mkdir(cache,{recursive:true});
async function existing(){const rows=[];for(const e of await fs.readdir(cache)){if(e.startsWith('@'))for(const sub of await fs.readdir(path.join(cache,e)))rows.push(`${e}/${sub}`);else rows.push(e);}return rows;}
for(const entry of await existing()){
 const at=entry.lastIndexOf('@'),name=entry.slice(0,at),version=entry.slice(at+1);
 if(pins.packages[name]&&!pins.packages[name].includes(version))throw Error(`Unreviewed cached browser version ${entry}; use a clean generated cache before building`);
}
for(const [name,versions]of Object.entries(pins.packages)){
 if(!/^(@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(name)||!Array.isArray(versions))throw Error('Invalid browser package pin');
 for(const version of versions){if(!/^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.-]+)?$/.test(version))throw Error('Invalid browser version');await fs.mkdir(path.join(cache,`${name}@${version}`),{recursive:true});}
}
