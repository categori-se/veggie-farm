import fs from 'node:fs';
import path from 'node:path';
// S3 website hosting resolves directory indexes, but does not infer .html.
export function htmlRouteAliases(directory) {
 const result=[];
 function visit(folder) {
  for(const entry of fs.readdirSync(folder,{withFileTypes:true})) {
   const file=path.join(folder,entry.name);
   if(entry.isDirectory())visit(file);
   else if(entry.isFile()&&entry.name.endsWith('.html')&&entry.name!=='index.html') {
    const relative=path.relative(directory,file).split(path.sep).join('/');
    result.push({file,key:relative.slice(0,-5)});
   }
  }
 }
 visit(directory);return result.sort((a,b)=>a.key.localeCompare(b.key));
}
