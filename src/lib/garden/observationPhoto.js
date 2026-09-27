// Small raster copies travel with the existing private garden backup.
export const MAX_OBSERVATION_PHOTO_BYTES=90000;
export function observationPhoto(value){
 if(value==null)return null;
 if(value.version!==1||!Number.isInteger(value.width)||!Number.isInteger(value.height)||value.width<1||value.height<1||value.width>960||value.height>960||typeof value.dataUrl!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value.dataUrl))throw Error('Choose a supported observation photo.');
 const encoded=value.dataUrl.slice(23),bytes=encoded.length*3/4-(encoded.endsWith('==')?2:encoded.endsWith('=')?1:0);
 if(encoded.length%4||bytes>MAX_OBSERVATION_PHOTO_BYTES||!encoded.startsWith('/9j/'))throw Error('The observation photo is too large or invalid.');
 return {version:1,width:value.width,height:value.height,dataUrl:value.dataUrl};
}
export async function prepareObservationPhoto(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024)throw Error('Choose a JPEG, PNG or WebP photo under 15 MB.');
 let bitmap;try{
  bitmap=await createImageBitmap(file);
  if(!bitmap.width||!bitmap.height||bitmap.width*bitmap.height>40000000)throw Error('Choose a photo smaller than 40 megapixels.');
  const scale=Math.min(1,960/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
  for(const quality of [.8,.65,.5,.35]){const dataUrl=canvas.toDataURL('image/jpeg',quality);try{return observationPhoto({version:1,width:canvas.width,height:canvas.height,dataUrl});}catch{}}
  throw Error('This photo is still too large. Crop it or choose a smaller photo.');
 }catch(error){throw Error(error.message||'This photo could not be opened. Try a JPEG, PNG or WebP image.');}finally{bitmap?.close();}
}
