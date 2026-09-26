import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createInterface} from 'node:readline/promises';
import {validateDestination} from './deploy-community.mjs';

export function writeSetup(directory, destination, sourceRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')) {
  const config=validateDestination(destination);
  const target=path.resolve(directory), root=fs.realpathSync(sourceRoot);
  let ancestor=target;
  while(!fs.existsSync(ancestor)) ancestor=path.dirname(ancestor);
  const actual=path.resolve(fs.realpathSync(ancestor),path.relative(ancestor,target));
  if(actual===root||actual.startsWith(root+path.sep)) throw Error('Choose a private directory outside this repository.');
  // Exclusive creation refuses existing directories and symlinks; nothing is overwritten.
  fs.mkdirSync(target,{mode:0o700});
  fs.writeFileSync(path.join(target,'deploy-config.json'),JSON.stringify(config,null,2)+'\n',{flag:'wx',mode:0o600});
  fs.writeFileSync(path.join(target,'NEXT-STEPS.md'),`# Your community deployment\n\nNo AWS resources were created and no files were uploaded.\n\n1. Run npm run verify:community in your source checkout and test the local site and Studio.\n2. Confirm the destination in deploy-config.json belongs to your AWS account.\n3. Create and review an offline release plan using scripts/deploy-community.mjs --plan, with this config and an external output file.\n4. Only after reviewing the plan, use the explicit --apply command documented in examples/aws/DEPLOYMENT.md. Apply requires clean committed main and checks the AWS account and origin.\n\nUse the CloudFront SiteUrl from your stack. The default layout serves the resource at / and Studio at /studio. A separate Studio domain is optional.\n\nBring your own media, data and AWS credentials. The owner's hosted images, models and deployment datasets are separately managed, not included in this source license. Publicly readable URLs are not a general redistribution grant. Bundled community fixtures and individually licensed open data retain their documented terms. Keep your private data and account configuration outside Git.\n\nThe core works without optional media or accounts. For optional media-config.json, see docs/architecture/media.md; for AWS templates and account services see examples/aws/DEPLOYMENT.md. Never put access keys in deploy-config.json.\n`,{flag:'wx',mode:0o600});
  return target;
}
async function main(){
  if(process.argv.includes('--help')) {console.log('npm run setup:deploy\nOffline interactive setup for an existing stack. Creates a NEW private directory outside the repository; never calls AWS. To provision first, follow examples/aws/DEPLOYMENT.md.');return;}
  if(!process.stdin.isTTY) throw Error('Run this wizard in an interactive terminal, or use the documented deployment configuration example.');
  const rl=createInterface({input:process.stdin,output:process.stdout});
  try{
    console.log('Community deployment setup — no AWS calls or uploads.\nUse outputs from your own examples/aws/static-site.yaml stack.\nThe resource site and Studio share one build; optional media and private data are yours to manage.');
    const directory=await rl.question('New private output directory (outside this repository): ');
    if(!directory.trim())throw Error('An output directory is required.');
    const config={};
    for(const [key,label] of Object.entries({accountId:'Your 12-digit AWS account ID',region:'AWS region',bucket:'Stack output BucketName',distributionId:'Stack output DistributionId',originId:'Stack output OriginId'}))config[key]=(await rl.question(label+': ')).trim();
    console.log('Created '+writeSetup(directory.trim(),config)+'. Read NEXT-STEPS.md before deployment.');
  }finally{rl.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
