import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
if(JSON.parse(fs.readFileSync('community-release.json','utf8')).profile!=='community')throw Error('Expected community source tree');
const env={...process.env,VEGGIE_FARM_COMMUNITY:'1',OBSERVABLE_TELEMETRY_DISABLE:'1'};
const pinned=spawnSync(process.execPath,['scripts/pin-browser-resolution.mjs'],{stdio:'inherit',env});if(pinned.status!==0)process.exit(pinned.status??1);
for(const args of [['scripts/build-dependency-notices.mjs'],['scripts/build-dependency-notices.mjs','--build-tools'],['scripts/build-browser-notice-map.mjs']]){const result=spawnSync(process.execPath,args,{stdio:'inherit',env});if(result.status!==0)process.exit(result.status??1);}
const commands=process.argv.includes('--dev')
 ? [[process.execPath,['scripts/build-community-data.mjs']],[process.execPath,['scripts/build-public-data-api.mjs']],[process.execPath,['node_modules/@observablehq/framework/dist/bin/observable.js','preview']]]
 : [[process.execPath,['scripts/build-community-data.mjs']],[process.execPath,['scripts/build-public-data-api.mjs']],[process.execPath,['node_modules/@observablehq/framework/dist/bin/observable.js','build']],[process.execPath,['scripts/check-browser-dependencies.mjs']],[process.execPath,['scripts/check-public-boundary.mjs','--build']]];
for(const [cmd,args] of commands){const result=spawnSync(cmd,args,{stdio:'inherit',env});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);}
