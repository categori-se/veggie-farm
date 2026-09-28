// GitHub-readable guide generated from the same prose as the app's guide page.
import fs from 'node:fs/promises';
const option=(name,fallback)=>{const index=process.argv.indexOf(name);return index<0?fallback:process.argv[index+1];};
const source=await fs.readFile(option('--source','src/guide.md'),'utf8');
let guide=source.replace(/^---\n[\s\S]*?\n---\n/,'').trim();
guide=guide.replace(/<figure>\s*([\s\S]*?)\s*<figcaption>([\s\S]*?)<\/figcaption>\s*<\/figure>/g,(_,image,caption)=>{
 if(image.includes('<picture>'))return `${image.trim()}\n\n*${caption}*`;
 const src=image.match(/src="([^"]+)"/)[1],alt=image.match(/alt="([^"]+)"/)[1];
 return `![${alt}](${src})\n\n*${caption}*`;
});
guide=guide.replace('<small>Screenshots:','Screenshots:').replace('</small>','');
guide=guide.replace('# Your garden, from first plan to next season','# Explore veggie.farm: a visual walkthrough\n\n[Project overview](../../README.md) · [Open the interactive guide](https://veggie.farm/guide) · [50 procedural plant shapes](../architecture/common-plant-shapes.md)');
guide+='\n\nFor contributors: [capture method and theme support](captures.md).\n';
const path=option('--output','docs/user-guide/README.md');
if(process.argv.includes('--check')){if(await fs.readFile(path,'utf8')!==guide)throw Error('GitHub guide is stale; run node scripts/build-user-guide.mjs');}
else await fs.writeFile(path,guide);
console.log('GitHub guide matches the app walkthrough.');
