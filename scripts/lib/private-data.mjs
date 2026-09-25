import path from 'node:path';
import fs from 'node:fs';
// This module is for CLI/server tools, never browser bundles.
export function privateDataPath(relative,{root=process.env.VEGGIE_FARM_DATA_DIR,sourceRoot=process.cwd()}={}) {
 if(!root||!path.isAbsolute(root))throw Error('Set VEGGIE_FARM_DATA_DIR to an absolute directory outside the source tree');
 const base=fs.realpathSync(root),source=fs.realpathSync(sourceRoot);
 if(base===source||base.startsWith(source+path.sep))throw Error('Private data must be outside the source tree');
 if(!relative||path.isAbsolute(relative)||relative.split(/[\\/]/).includes('..'))throw Error('Expected a confined relative data path');
 const target=path.resolve(base,relative);
 let ancestor=target;while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
 const real=fs.realpathSync(ancestor);
 if(real!==base&&!real.startsWith(base+path.sep))throw Error('Private data symlink escapes the data directory');
 return target;
}
