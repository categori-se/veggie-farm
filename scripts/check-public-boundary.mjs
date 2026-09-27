import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(), built=process.argv.includes('--build');
const marker=JSON.parse(fs.readFileSync('community-release.json','utf8'));
if(marker.profile!=='community')throw Error('Expected community source profile');
const forbiddenRoots=new Set(['services','infrastructure','vendor','tools','.launch-private','.ai-studio','.agents','.codex']);
const failures=[];
const secretPatterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,/\bgithub_pat_[A-Za-z0-9_]{30,}/,/\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/,/(?:X-Amz-Signature|X-Goog-Signature)=[0-9a-f]{20,}/];
const privatePatterns=[/\/(?:home|Users)\/[A-Za-z0-9_.-]+\//];
let files=0;
function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,e.name),rel=path.relative(root,file).split(path.sep).join('/');
 if(e.isSymbolicLink()){failures.push(`${rel}: symlink`);continue;}
 if(['.git','node_modules','.observablehq','__pycache__'].includes(e.name))continue;
 if(!built&&rel==='dist')continue;
 if(forbiddenRoots.has(rel)||rel.startsWith('data/raw/')||rel==='data/raw'||rel==='data/spatial/source-cache'||rel==='docs/launch'||rel==='docs/archive')failures.push(`${rel}: private source directory`);
 if(e.isDirectory()){scan(file);continue;}
 if(/\.(?:png|jpe?g|webp|gif|avif|svg|ico|glb|gltf|obj|fbx|woff2?|ttf|otf|mp[34]|webm|wav|pdf|zip|kmz)$/i.test(rel))failures.push(`${rel}: media/archive forbidden in source`);
 if(/(?:^|\/)(?:\.env(?:\..*)?|auth-config\.json|account-config\.json|media-config\.json)$/.test(rel)&&e.name!=='.env.example')failures.push(`${rel}: local configuration`);
 if(rel.startsWith('scripts/')&&/(?:^|\/)(?:harvest[^/]*|extract-catalog[^/]*)\.(?:py|mjs|js)$/.test(rel))failures.push(`${rel}: partner extraction tool`);
 const b=fs.readFileSync(file);files++;
 if(b.includes(0))failures.push(`${rel}: binary content is outside the source profile`);
 if(b.length>20_000_000)failures.push(`${rel}: file exceeds reviewed source size limit`);
 if(!b.subarray(0,8192).includes(0)){
  const text=b.toString('utf8');if([...secretPatterns,...privatePatterns].some(p=>p.test(text)))failures.push(`${rel}: sensitive pattern (value suppressed)`);
  if(rel.startsWith('src/')&&/from\s*['"][^'"\n]*(?:services|vendor|\.launch-private)\//.test(text))failures.push(`${rel}: private implementation import`);
 }
}}
scan(root);
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`Public boundary: ${files} files checked${built?' including build output':''}; no forbidden paths/imports or credential patterns. Rights review remains separate.`);
