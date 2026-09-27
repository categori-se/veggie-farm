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
  return valid(value)?value:null;
}
export function withoutGardenHandoff(hash='') {
  const params=new URLSearchParams(hash.replace(/^#/,''));params.delete('accountSave');params.delete('garden');
  return params.size?`#${params}`:'';
}
