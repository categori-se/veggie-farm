import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync,spawnSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export function validateDestination(c){
 if(!c||!/^\d{12}$/.test(c.accountId)||!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(c.bucket)||!/^[A-Z0-9]{8,32}$/.test(c.distributionId)||!/^[A-Za-z0-9_-]{1,64}$/.test(c.originId)||!/^[a-z]{2}(?:-[a-z]+)+-\d$/.test(c.region))throw Error('Invalid explicit deployment destination');
 return {accountId:c.accountId,bucket:c.bucket,distributionId:c.distributionId,originId:c.originId,region:c.region};
}
export function buildManifest(directory){const entries=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('Build symlink refused');if(e.isDirectory())walk(p);else if(e.isFile()){const body=fs.readFileSync(p);entries.push({path:path.relative(directory,p).split(path.sep).join('/'),bytes:body.length,sha256:hash(body)});}}}walk(directory);entries.sort((a,b)=>a.path.localeCompare(b.path,'en'));if(!entries.some(x=>x.path==='index.html')||!entries.some(x=>x.path==='studio.html'))throw Error('Build must contain resource site and Studio');return entries;}
export function verifyManifest(directory,expected){if(JSON.stringify(buildManifest(directory))!==JSON.stringify(expected))throw Error('Build changed after plan; regenerate and review');}
function outside(file){const resolved=path.resolve(file),root=fs.realpathSync('.');let parent=path.dirname(resolved);while(!fs.existsSync(parent))parent=path.dirname(parent);const real=fs.realpathSync(parent);if(real===root||real.startsWith(root+path.sep))throw Error('Keep deployment config/plans/receipts outside source');if(fs.existsSync(resolved)&&fs.lstatSync(resolved).isSymbolicLink())throw Error('External config/plan symlinks refused');return resolved;}
function git(...args){return execFileSync('git',args,{encoding:'utf8'}).trim();}
function runCheck(script){const r=spawnSync('npm',['run',script],{stdio:'inherit'});if(r.status!==0)throw Error(`Required check failed: ${script}`);}
async function main(){
 if(JSON.parse(fs.readFileSync('community-release.json')).profile!=='community')throw Error('Only the separate public core may use this deployer');
 const args=process.argv.slice(2);const value=name=>{const i=args.indexOf(name);if(i<0||!args[i+1]||args[i+1].startsWith('--'))throw Error(`Missing ${name}`);return args[i+1];};
 const mode=args[0];if(!['--plan','--apply'].includes(mode))throw Error('Use --plan --config FILE --output FILE, or --apply --config FILE --plan-file FILE');
 const config=validateDestination(JSON.parse(fs.readFileSync(outside(value('--config'))))),configDigest=hash(JSON.stringify(config));
 if(mode==='--plan'){
  runCheck('check:public');runCheck('check:public-git');
  const files=buildManifest('dist');let commit=null;try{commit=git('rev-parse','--verify','HEAD');}catch{}
  const buildDigest=hash(JSON.stringify(files)),stamp=new Date().toISOString().replace(/[^0-9]/g,'');
  const plan={version:1,sourceCommit:commit,buildDigest,destinationDigest:configDigest,releasePrefix:`releases/${stamp}-${buildDigest.slice(0,16)}`,files,approval:'Apply requires an explicit command, clean main branch and all strict checks; this plan makes no AWS calls.'};
  fs.writeFileSync(outside(value('--output')),JSON.stringify(plan,null,2)+'\n',{flag:'wx',mode:0o600});console.log(`Prepared ${files.length} uploads; zero deletions. No AWS calls.`);return;
 }
 const planPath=outside(value('--plan-file')),plan=JSON.parse(fs.readFileSync(planPath));
 if(plan.version!==1||plan.destinationDigest!==configDigest||!/^releases\/\d{17}-[a-f0-9]{16}$/.test(plan.releasePrefix))throw Error('Invalid plan or destination changed');
 if(!plan.sourceCommit||git('branch','--show-current')!=='main'||git('rev-parse','HEAD')!==plan.sourceCommit||git('status','--porcelain'))throw Error('Apply requires the reviewed commit on clean main');
 runCheck('verify:community');if(git('status','--porcelain'))throw Error('Checks changed source; commit and review before deploying');verifyManifest('dist',plan.files);
 if(hash(JSON.stringify(plan.files))!==plan.buildDigest)throw Error('Invalid build digest');
 const aws=(...a)=>JSON.parse(execFileSync('aws',[...a,'--region',config.region,'--output','json','--no-cli-pager'],{encoding:'utf8',maxBuffer:16*1024*1024})||'{}');
 if(aws('sts','get-caller-identity').Account!==config.accountId)throw Error('AWS account differs from explicit destination');
 const before=aws('cloudfront','get-distribution-config','--id',config.distributionId),origin=before.DistributionConfig.Origins.Items.find(x=>x.Id===config.originId);
 const expectedHosts=[`${config.bucket}.s3.${config.region}.amazonaws.com`,`${config.bucket}.s3.amazonaws.com`];
 if(!origin||!expectedHosts.includes(origin.DomainName)||!origin.OriginAccessControlId)throw Error('Distribution origin is not the reviewed private S3/OAC destination');
 if((aws('s3api','list-objects-v2','--bucket',config.bucket,'--prefix',plan.releasePrefix+'/','--max-keys','1').KeyCount||0)>0)throw Error('Release prefix already exists; never overwrite an immutable release');
 const receipt={sourceCommit:plan.sourceCommit,releasePrefix:plan.releasePrefix,previousOriginPath:origin.OriginPath||'',distributionId:config.distributionId,originId:config.originId,files:plan.files,status:'uploading'};
 const receiptPath=planPath+'.receipt.json';const save=()=>{fs.writeFileSync(receiptPath,JSON.stringify(receipt,null,2)+'\n',{mode:0o600});aws('s3api','put-object','--bucket',config.bucket,'--key','operations/'+plan.releasePrefix.slice('releases/'.length)+'.json','--body',receiptPath,'--content-type','application/json','--checksum-algorithm','SHA256');};if(fs.existsSync(receiptPath))throw Error('Receipt already exists; do not reuse an applied plan');save();
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.txt':'text/plain; charset=utf-8'};
 for(const f of plan.files){const file=path.resolve('dist',f.path);if(!file.startsWith(path.resolve('dist')+path.sep))throw Error('Build path escapes dist');const result=aws('s3api','put-object','--bucket',config.bucket,'--key',`${plan.releasePrefix}/${f.path}`,'--body',file,'--checksum-sha256',Buffer.from(f.sha256,'hex').toString('base64'),'--content-type',types[path.extname(f.path)]||'application/octet-stream','--cache-control','public,max-age=60');if(result.ChecksumSHA256!==Buffer.from(f.sha256,'hex').toString('base64'))throw Error('S3 upload checksum mismatch');}
 receipt.status='uploaded';save();origin.OriginPath='/'+plan.releasePrefix;
 const configPath=planPath+'.distribution.json';fs.writeFileSync(configPath,JSON.stringify(before.DistributionConfig),{flag:'wx',mode:0o600});
 aws('cloudfront','update-distribution','--id',config.distributionId,'--if-match',before.ETag,'--distribution-config','file://'+configPath);receipt.status='origin-updated';save();
 aws('cloudfront','wait','distribution-deployed','--id',config.distributionId);
 const invalidation=aws('cloudfront','create-invalidation','--distribution-id',config.distributionId,'--paths','/*');receipt.invalidationId=invalidation.Invalidation.Id;save();
 aws('cloudfront','wait','invalidation-completed','--distribution-id',config.distributionId,'--id',receipt.invalidationId);receipt.status='deployed';save();console.log('Immutable release uploaded and origin switched; receipt saved beside the plan. No object deletions.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
