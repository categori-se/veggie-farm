import fs from 'node:fs';import {execFileSync} from 'node:child_process';
if(JSON.parse(fs.readFileSync('community-release.json')).profile!=='community')throw Error('Refusing hooks in a mixed/private workspace');
const current=(()=>{try{return execFileSync('git',['config','--local','--get','core.hooksPath'],{encoding:'utf8'}).trim();}catch{return '';}})();
if(current&&current!=='.githooks')throw Error('Existing hooksPath requires manual integration');
execFileSync('git',['config','--local','core.hooksPath','.githooks']);console.log('Community hooks enabled for this local repository. Server-side required checks remain essential.');
