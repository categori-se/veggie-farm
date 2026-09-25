import fs from 'node:fs';
import path from 'node:path';
import {parsePlannerBackup} from '../src/lib/garden/plannerBackup.js';
import {privateDataPath} from './lib/private-data.mjs';
const [input,name]=process.argv.slice(2);
if(!input||!name||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(name))throw Error('Usage: node scripts/import-private-garden.mjs exported-planner.json project-name');
const body=fs.readFileSync(input,'utf8');parsePlannerBackup(body);
const target=privateDataPath(`projects/${name}.json`);fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});fs.writeFileSync(target,body,{flag:'wx',mode:0o600});
console.log('Validated private backup stored outside the source tree. Import it with Studio’s file picker.');
