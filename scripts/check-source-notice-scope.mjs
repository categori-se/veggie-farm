// This gate permits only the recorded, non-bundled tooling gaps. The full
// dependency-notice validator remains strict for distributions of build tools.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export function checkScope({gaps,packages,lock,tracked,sourceImports=[]}) {
 const allowed=new Map([['eastasianwidth','0.2.0'],['is-reference','1.2.1']]);
 for(const gap of gaps){
  if(gap.scope!=='.'||allowed.get(gap.name)!==gap.version)throw Error('Unreviewed notice gap');
  const record=packages.find(p=>p.name===gap.name&&p.version===gap.version);
  const entry=record&&lock.packages[record.path];
  if(!entry?.dev||entry.license!=='MIT'||entry.integrity!==record.integrity||entry.version!==gap.version)throw Error('Gap is not the reviewed MIT build-only dependency');
 }
 if(tracked.some(p=>/(^|\/)(node_modules|dist|vendor)(\/|$)|\.(?:tgz|zip|tar|gz)$/.test(p)))throw Error('Source distribution includes dependencies or bundled artifacts');
 if(sourceImports.some(s=>/\b(?:from\s*|import\s*\(|require\s*\()\s*['"](?:eastasianwidth|is-reference)(?:['"/])/.test(s)))throw Error('Build-only gap imported by application');
 return gaps.length;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 if(read('community-release.json').profile!=='community')throw Error('Community profile required');
 const inventory=read('docs/licenses/build-tool-npm-notices.json');
 const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
 const sourceImports=[];const walk=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){if(e.name!=='.observablehq')walk(p);}else if(/\.(js|mjs|md)$/.test(p))sourceImports.push(fs.readFileSync(p,'utf8'));}};walk('src');
 const count=checkScope({gaps:inventory.missingTexts,packages:inventory.packages,lock:read('package-lock.json'),tracked,sourceImports});
 console.log(`Source distribution scope passed: ${count} recorded tooling-only notice gaps remain; tooling redistribution is not cleared.`);
}
