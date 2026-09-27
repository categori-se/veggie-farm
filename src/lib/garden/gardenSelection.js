// Remember identifiers only, scoped to the signed-in owner. Never cache garden contents here.
export function gardenSelection({owner,storage=()=>globalThis.localStorage}){
 const key=()=>{const id=owner();return typeof id==='string'&&id?`veggie.farm:selected-garden:${encodeURIComponent(id)}`:null;};
 const valid=v=>v&&['saveId','gardenId'].every(k=>typeof v[k]==='string'&&v[k].length>0&&v[k].length<=200);
 return {
  read(){try{const k=key();if(!k)return null;const v=JSON.parse(storage()?.getItem(k)||'null');return valid(v)?{saveId:v.saveId,gardenId:v.gardenId}:null;}catch{return null;}},
  write(value){try{const k=key();if(!k||!valid(value))return false;const target=storage();if(!target)return false;target.setItem(k,JSON.stringify({saveId:value.saveId,gardenId:value.gardenId}));return true;}catch{return false;}},
  clear(){try{const k=key();if(k)storage()?.removeItem(k);}catch{}}
 };
}
