import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {privateDataPath} from '../scripts/lib/private-data.mjs';
test('private runtime paths stay outside source and reject traversal/symlink escapes',t=>{const base=fs.mkdtempSync(path.join(os.tmpdir(),'garden-private-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));const source=path.join(base,'source'),data=path.join(base,'data');fs.mkdirSync(source);fs.mkdirSync(data);fs.symlinkSync(source,path.join(data,'escape'));
 assert.equal(privateDataPath('projects/one.json',{root:data,sourceRoot:source}),path.join(data,'projects/one.json'));
 for(const value of ['../secret','/absolute','escape/secret'])assert.throws(()=>privateDataPath(value,{root:data,sourceRoot:source}));assert.throws(()=>privateDataPath('one',{root:source,sourceRoot:source}));});
