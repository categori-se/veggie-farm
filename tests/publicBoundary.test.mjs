import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const checker=new URL('../scripts/check-public-boundary.mjs',import.meta.url);
function candidate(run){const root=fs.mkdtempSync(path.join(os.tmpdir(),'community-boundary-'));try{fs.writeFileSync(path.join(root,'community-release.json'),JSON.stringify({profile:'community'}));run(root);}finally{fs.rmSync(root,{recursive:true,force:true});}}
function check(root,...args){return spawnSync(process.execPath,[checker.pathname,...args],{cwd:root,encoding:'utf8'});}
test('public boundary rejects concealed binary media, private modules, symlinks and local config',()=>{
 for(const [name,body] of [['photo.dat',Buffer.from([1,0,2])],['services/worker.js','export default 1'],['media-config.json','{}'],['src/module.js',"import x from '../../services/private/worker.js'"]])candidate(root=>{fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),body);assert.notEqual(check(root).status,0,name);});
 candidate(root=>{fs.symlinkSync('/tmp',path.join(root,'linked'));assert.notEqual(check(root).status,0);});
});
test('emitted-output gate scans excluded build output when requested and suppresses secret values',()=>candidate(root=>{
 fs.mkdirSync(path.join(root,'dist'));const canary='AKIA'+'Z'.repeat(16);fs.writeFileSync(path.join(root,'dist','bundle.js'),canary);
 assert.equal(check(root).status,0);const result=check(root,'--build');assert.notEqual(result.status,0);assert.ok(!result.stderr.includes(canary));
}));
