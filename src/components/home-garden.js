import {accountGardenHome} from './account-garden-home.js';
import {gardenSelection} from '../lib/garden/gardenSelection.js';
import {notebookOwner} from '../lib/account/notebookStorage.js';
// Fresh visitors keep the resource homepage; returning account gardeners get their selected garden first.
export function homeGarden({owner=notebookOwner,...options}={}){
 const selection=gardenSelection({owner});let root;
 root=accountGardenHome({...options,owner,showToday:true,compact:true,onGardenChange:workspace=>{if(root)root.hidden=!workspace&&!selection.read();}});
 root.hidden=!selection.read();return root;
}
