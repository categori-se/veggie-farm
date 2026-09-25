import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {publicFileIssues} from '../scripts/lib/public-policy.mjs';import {buildManifest,verifyManifest,validateDestination} from '../scripts/deploy-community.mjs';
test('public history policy catches indexed media, private config and deleted secret content',()=>{
 assert.ok(publicFileIssues('notes.txt',Buffer.from('AKIA'+'Z'.repeat(16))).length);
 for(const name of ['services/accounts/code.js','data/raw/source.json','picture.svg','auth-config.json'])assert.ok(publicFileIssues(name,Buffer.from('{}')).length,name);
 assert.deepEqual(publicFileIssues('examples/aws/static-site.yaml',Buffer.from('Resources: {}')),[]);
 assert.ok(publicFileIssues('src/link.js',Buffer.from('target'),{mode:'120000'}).length);
});
test('deployment manifest rejects changed, added and linked build files',()=>{
 const r=fs.mkdtempSync(path.join(os.tmpdir(),'community-release-'));try{
 fs.writeFileSync(path.join(r,'index.html'),'home');fs.writeFileSync(path.join(r,'studio.html'),'studio');const m=buildManifest(r);verifyManifest(r,m);
 fs.writeFileSync(path.join(r,'extra.txt'),'unreviewed');assert.throws(()=>verifyManifest(r,m),/changed/);fs.unlinkSync(path.join(r,'extra.txt'));
 fs.writeFileSync(path.join(r,'studio.html'),'modified');assert.throws(()=>verifyManifest(r,m),/changed/);
 fs.symlinkSync('/tmp',path.join(r,'linked'));assert.throws(()=>buildManifest(r),/symlink/);
 }finally{fs.rmSync(r,{recursive:true,force:true});}
});
test('AWS destination must be explicit and structurally valid',()=>{
 const c={accountId:'123456789012',bucket:'example-community-bucket',distributionId:'E123EXAMPLE12',originId:'community-site',region:'us-east-1'};assert.deepEqual(validateDestination(c),c);
 for(const k of Object.keys(c))assert.throws(()=>validateDestination({...c,[k]:''}));
});

import vm from 'node:vm';import {execFileSync,spawnSync} from 'node:child_process';
test('static route function serves Studio, directory indexes and untouched module assets',()=>{
 const template=fs.readFileSync(new URL('../examples/aws/static-site.yaml',import.meta.url),'utf8');
 const code=template.split('      FunctionCode: |\n')[1].split('\n  SiteCache:')[0].split('\n').map(line=>line.slice(8)).join('\n');const context={};vm.createContext(context);vm.runInContext(code,context);
 for(const [input,expected] of [['/','/index.html'],['/studio','/studio.html'],['/studio/','/studio.html'],['/tools/today','/tools/today.html'],['/content/vegetables','/content/vegetables/index.html'],['/content/vegetables/','/content/vegetables/index.html'],['/_import/planner.js','/_import/planner.js'],['/media-config.json','/media-config.json']]){const request={uri:input,querystring:{search:{value:'tomato'}}};assert.equal(context.handler({request}).uri,expected);assert.equal(request.querystring.search.value,'tomato');}
});
test('Git gate rejects a secret removed from HEAD but retained in history',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'community-git-'));const git=(...args)=>execFileSync('git',args,{cwd:root,stdio:'pipe'});
 try{git('init','--initial-branch=main');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');fs.writeFileSync(path.join(root,'community-release.json'),JSON.stringify({profile:'community'}));git('add','community-release.json');git('commit','-m','Synthetic clean fixture');
 const script=new URL('../scripts/check-public-git.mjs',import.meta.url).pathname;assert.equal(spawnSync(process.execPath,[script],{cwd:root}).status,0);
 fs.writeFileSync(path.join(root,'note.txt'),'AKIA'+'Z'.repeat(16));git('add','note.txt');git('commit','-m','Synthetic canary');git('rm','note.txt');git('commit','-m','Remove canary');const result=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});assert.notEqual(result.status,0);assert.ok(!result.stderr.includes('AKIA'+'Z'.repeat(16)));assert.match(result.stderr,/sensitive pattern/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('deployment apply uses explicit account, checksums, ETag and retained releases (mock AWS only)',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'community-apply-')),root=path.join(temp,'core'),bin=path.join(temp,'bin');fs.mkdirSync(root);fs.mkdirSync(bin);
 const git=(...a)=>execFileSync('git',a,{cwd:root,stdio:'pipe'});const trace=path.join(temp,'calls.jsonl');
 try{
  fs.writeFileSync(path.join(root,'community-release.json'),JSON.stringify({profile:'community'}));fs.writeFileSync(path.join(root,'.gitignore'),'dist/\n');
  fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({scripts:{'check:public':'node -e "process.exit(0)"','check:public-git':'node -e "process.exit(0)"','verify:community':'node -e "process.exit(0)"'}}));
  fs.mkdirSync(path.join(root,'dist'));fs.writeFileSync(path.join(root,'dist/index.html'),'home');fs.writeFileSync(path.join(root,'dist/studio.html'),'studio');
  git('init','--initial-branch=main');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');git('config','commit.gpgsign','false');git('add','.gitignore','package.json','community-release.json');git('commit','-m','Synthetic deployment fixture');
  const config=path.join(temp,'destination.json'),plan=path.join(temp,'plan.json');fs.writeFileSync(config,JSON.stringify({accountId:'123456789012',bucket:'example-community-bucket',distributionId:'E123EXAMPLE12',originId:'community-site',region:'us-east-1'}));
  const mock=`#!/usr/bin/env node
const fs=require('fs');const a=process.argv.slice(2);fs.appendFileSync(process.env.MOCK_AWS_TRACE,JSON.stringify(a)+'\\n');let r={};
if(a[0]==='sts')r={Account:'123456789012'};
if(a[1]==='get-distribution-config')r={ETag:'original-etag',DistributionConfig:{Origins:{Items:[{Id:'community-site',DomainName:'example-community-bucket.s3.us-east-1.amazonaws.com',OriginAccessControlId:'OACEXAMPLE',OriginPath:'/releases/old'}]}}};
if(a[1]==='list-objects-v2')r={KeyCount:0};
if(a[1]==='put-object'&&a.includes('--checksum-sha256'))r={ChecksumSHA256:a[a.indexOf('--checksum-sha256')+1]};
if(a[1]==='create-invalidation')r={Invalidation:{Id:'IEXAMPLE'}};
process.stdout.write(JSON.stringify(r));\n`;
  fs.writeFileSync(path.join(bin,'aws'),mock,{mode:0o755});const env={...process.env,PATH:bin+path.delimiter+process.env.PATH,MOCK_AWS_TRACE:trace};const script=new URL('../scripts/deploy-community.mjs',import.meta.url).pathname;
  const run=(...args)=>spawnSync(process.execPath,[script,...args],{cwd:root,env,encoding:'utf8'});
  let result=run('--plan','--config',config,'--output',plan);assert.equal(result.status,0,result.stderr);assert.equal(fs.existsSync(trace),false,'offline plan must not call AWS');
  const original=fs.readFileSync(path.join(root,'dist/studio.html'));fs.writeFileSync(path.join(root,'dist/studio.html'),'changed');result=run('--apply','--config',config,'--plan-file',plan);assert.notEqual(result.status,0);assert.equal(fs.existsSync(trace),false,'changed build must fail before AWS');fs.writeFileSync(path.join(root,'dist/studio.html'),original);
  result=run('--apply','--config',config,'--plan-file',plan);assert.equal(result.status,0,result.stderr);
  const calls=fs.readFileSync(trace,'utf8').trim().split('\n').map(JSON.parse),uploads=calls.filter(x=>x[1]==='put-object'&&x.includes('--checksum-sha256'));assert.equal(uploads.length,2);
  const update=calls.find(x=>x[1]==='update-distribution');assert.equal(update[update.indexOf('--if-match')+1],'original-etag');assert.ok(calls.indexOf(update)>calls.indexOf(uploads.at(-1)));assert.ok(!calls.some(x=>x[1].startsWith('delete')));
  const receipt=JSON.parse(fs.readFileSync(plan+'.receipt.json'));assert.equal(receipt.status,'deployed');assert.equal(receipt.previousOriginPath,'/releases/old');
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
