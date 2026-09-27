// Fragments carry identifiers, never garden contents or credentials, between app origins.
const valid = value => value && /^[a-f0-9-]{36}$/.test(value.saveId) && typeof value.gardenId === 'string' && value.gardenId.length > 0 && value.gardenId.length <= 200;
export function gardenTodayHref(value) {
  if (!valid(value)) return null;
  return `https://veggie.farm/tools/today#${new URLSearchParams({accountSave:value.saveId,garden:value.gardenId})}`;
}
export function readGardenHandoff(hash='') {
  const params=new URLSearchParams(hash.replace(/^#/,''));
  if(params.getAll('accountSave').length!==1 || params.getAll('garden').length!==1)return null;
  const value={saveId:params.get('accountSave'),gardenId:params.get('garden')};
  if(params.has('bed')){if(params.getAll('bed').length!==1||!params.get('bed')||params.get('bed').length>200)return null;value.bedId=params.get('bed');}
  return valid(value)?value:null;
}
export function withoutGardenHandoff(hash='') {
  const params=new URLSearchParams(hash.replace(/^#/,''));params.delete('accountSave');params.delete('garden');params.delete('bed');
  return params.size?`#${params}`:'';
}
export function gardenPlanHref(value) {
  if (!valid(value)) return null;
  if(value.bedId!=null&&(typeof value.bedId!=='string'||!value.bedId||value.bedId.length>200))return null;
  return `https://studio.veggie.farm/#${new URLSearchParams({accountSave:value.saveId,garden:value.gardenId,...(value.bedId?{bed:value.bedId}:{})})}`;
}
