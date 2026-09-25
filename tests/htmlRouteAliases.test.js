import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {htmlRouteAliases} from '../scripts/html-route-aliases.mjs';
test('website aliases cover nested HTML routes without copying indexes or binary assets',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'garden-routes-'));
 try{fs.mkdirSync(path.join(root,'tools'));for(const file of ['index.html','studio.html','tools/index.html','tools/today.html','asset.js'])fs.writeFileSync(path.join(root,file),'fixture');
 assert.deepEqual(htmlRouteAliases(root).map(x=>x.key),['studio','tools/today']);}
 finally{fs.rmSync(root,{recursive:true,force:true});}
});
