// Discovery coverage envelopes are not legal state boundaries or promises of local data.
export const REGIONAL_SOURCES = Object.freeze([
 {id:'MA',name:'Massachusetts',bounds:[-73.6,41.1,-69.8,42.9],portal:'https://www.mass.gov/info-details/massgis-data-layers',note:'Existing MassGIS parcel, imagery and terrain tools; acquisition years vary.'},
 {id:'VT',name:'Vermont',bounds:[-73.44,42.72,-71.46,45.02],portal:'https://vcgi.vermont.gov/data-and-programs/data-status',note:'Check municipal parcel status and elevation product collection year with VCGI.'},
 {id:'CT',name:'Connecticut',bounds:[-73.73,40.95,-71.78,42.06],portal:'https://geodata.ct.gov/',note:'Parcel/CAMA completeness and accuracy vary by municipality; review imagery and elevation metadata.'},
 {id:'NJ',name:'New Jersey',bounds:[-75.57,38.92,-73.89,41.36],portal:'https://nj.gov/njgin/',note:'NJGIN publishes parcels, imagery and elevation. Services have changed; use current catalog links.'},
 {id:'NC',name:'North Carolina',bounds:[-84.33,33.75,-75.45,36.59],portal:'https://www.nconemap.gov/',note:'NC OneMap integrates county parcel sources; local geometry and dates vary.'},
 {id:'WI',name:'Wisconsin',bounds:[-92.9,42.49,-86.24,47.31],portal:'https://www.sco.wisc.edu/data/',note:'Statewide parcel data is available; find imagery and elevation through the state catalog and local metadata.'},
 {id:'NY',name:'New York',bounds:[-79.77,40.49,-71.85,45.02],portal:'https://data.gis.ny.gov/',note:'Check county parcel availability and current service URLs; imagery/elevation vintages vary.'},
 {id:'MN',name:'Minnesota',bounds:[-97.25,43.49,-89.48,49.39],portal:'https://gis.data.mn.gov/',note:'Strong terrain and environmental coverage; do not assume uniformly available parcel data.'},
 {id:'ME',name:'Maine',bounds:[-71.09,42.97,-66.88,47.46],portal:'https://www.maine.gov/geolib/',note:'Parcel coverage and freshness vary by municipality; check imagery-specific use terms.'}
].map(Object.freeze));
export function regionalPoint(state,longitude,latitude){
 const region=REGIONAL_SOURCES.find(r=>r.id===state);
 const valid=v=>(typeof v==='number'||typeof v==='string'&&v.trim()!=='')&&Number.isFinite(Number(v));
 if(!region||!valid(longitude)||!valid(latitude))throw Error('Choose a listed state and enter numeric longitude and latitude.');
 const lon=Number(longitude),lat=Number(latitude),[w,s,e,n]=region.bounds;
 if(lon<w||lon>e||lat<s||lat>n)throw Error(`Coordinates are outside the ${region.name} discovery region.`);
 return [Number(lon.toFixed(6)),Number(lat.toFixed(6))];
}
export const NATIONAL_MAP_PRODUCTS='https://tnmaccess.nationalmap.gov/api/v1/products';
export function lidarCatalogRequest(state,longitude,latitude,{radiusMeters=250,kind='point-cloud'}={}){
 const [lon,lat]=regionalPoint(state,longitude,latitude);
 if(![100,250,500].includes(radiusMeters)||!['point-cloud','terrain'].includes(kind))throw Error('Choose a supported search radius and product type.');
 const dy=radiusMeters/111320,dx=dy/Math.cos(lat*Math.PI/180),bbox=[lon-dx,lat-dy,lon+dx,lat+dy];
 const dataset=kind==='point-cloud'?'Lidar Point Cloud (LPC)':'Digital Elevation Model (DEM) 1 meter';
 return {state,point:[lon,lat],bbox,radiusMeters,kind,url:NATIONAL_MAP_PRODUCTS+'?'+new URLSearchParams({bbox:bbox.join(','),datasets:dataset,max:'20',outputFormat:'JSON'})};
}
function sourceUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&(/(^|\.)usgs\.gov$/.test(u.hostname)||u.hostname==='prd-tnm.s3.amazonaws.com')?u.href:null;}catch{return null;}}
export async function lookupLidarCatalog(state,longitude,latitude,{fetchImpl=fetch,signal,...options}={}){
 const request=lidarCatalogRequest(state,longitude,latitude,options);
 const response=await fetchImpl(request.url,{credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('USGS catalog is unavailable. Try the state portal.');
 const text=await response.text();if(text.length>2000000)throw Error('Catalog response exceeds the review limit.');
 const raw=JSON.parse(text);if(raw.error||!Array.isArray(raw.items)||raw.items.length>20||!Number.isInteger(raw.total)||raw.total<0)throw Error('Unexpected USGS catalog response.');
 const items=raw.items.map(i=>({title:String(i.title||'Untitled product').slice(0,300),publicationDate:i.publicationDate||null,downloadUrl:sourceUrl(i.downloadURL),metadataUrl:sourceUrl(i.metaUrl),sizeBytes:Number.isFinite(i.sizeInBytes)&&i.sizeInBytes>=0?i.sizeInBytes:null,boundingBox:i.boundingBox||null}));
 return {request,items,total:raw.total,truncated:raw.total>items.length,retrievedAt:new Date().toISOString(),note:'Catalog intersection only; verify tile coverage, acquisition date, datum, classification and terms before importing. Publication date is not flight date.'};
}
