import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {publicFileIssues} from './lib/public-policy.mjs';
if(JSON.parse(fs.readFileSync('community-release.json')).profile!=='community')throw Error('Only run in the separate community repository');
const git=(...args)=>{try{return execFileSync('git',args,{maxBuffer:64*1024*1024,stdio:'pipe'});}catch{throw Error('Git inspection failed; blob contents suppressed');}};
const failures=new Set(),bodies=new Map();
function inspect(mode,oid,name){let body=bodies.get(oid);if(!body){body=git('cat-file','blob',oid);bodies.set(oid,body);}for(const issue of publicFileIssues(name,body,{mode}))failures.add(`${name}: ${issue}`);}
for(const line of git('ls-files','--stage','-z').toString().split('\0').filter(Boolean)){const split=line.indexOf('\t'),meta=line.slice(0,split),name=line.slice(split+1);const [mode,oid,stage]=meta.split(' ');if(stage!=='0')failures.add('Unresolved index conflicts');if(mode==='160000'){failures.add(`${name}: nested repository`);continue;}inspect(mode,oid,name);}
for(const ref of git('for-each-ref','--format=%(refname)').toString().trim().split('\n').filter(Boolean)){try{git('rev-parse','--verify',`${ref}^{commit}`);}catch{failures.add(`${ref}: non-commit ref is not public history`);}}
for(const commit of git('rev-list','--all').toString().trim().split('\n').filter(Boolean))for(const record of git('ls-tree','-r','-z',commit).toString().split('\0').filter(Boolean)){const split=record.indexOf('\t'),[mode,type,oid]=record.slice(0,split).split(' '),name=record.slice(split+1);if(type!=='blob'){failures.add(`${name}: nested repository`);continue;}inspect(mode,oid,name);}
// Includes unreachable objects: removing a file from HEAD does not certify a clean object store.
for(const record of git('cat-file','--batch-all-objects','--batch-check=%(objectname) %(objecttype)').toString().trim().split('\n').filter(Boolean)){const [oid,type]=record.split(' ');if(type==='blob'&&!bodies.has(oid))inspect('100644',oid,`unreachable-blob-${oid}`);}
if(failures.size){console.error([...failures].join('\n'));process.exit(1);}console.log(`Public Git gate: ${bodies.size} unique blobs checked; index and all local commit trees checked. No remote operation.`);
