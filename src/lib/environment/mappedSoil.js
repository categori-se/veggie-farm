export const SOIL_ENDPOINT='https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest';
export function soilPoint(longitude,latitude){
 const lon=Number(longitude),lat=Number(latitude);
 if(longitude===''||latitude===''||longitude==null||latitude==null||!Number.isFinite(lon)||!Number.isFinite(lat)||lon< -73.6||lon> -69.8||lat<41.1||lat>42.9)throw Error('Enter coordinates in the Massachusetts region (longitude −73.6 to −69.8, latitude 41.1 to 42.9).');
 return [Number(lon.toFixed(6)),Number(lat.toFixed(6))];
}
export function soilQueries(longitude,latitude){const [lon,lat]=soilPoint(longitude,latitude),point=`point(${lon} ${lat})`;return [
 `SELECT TOP 100 m.mukey, m.musym, m.muname, l.areasymbol, s.saverest, c.compname, c.comppct_r, c.drainagecl, c.slope_r FROM mapunit m JOIN legend l ON m.lkey=l.lkey JOIN sacatalog s ON l.areasymbol=s.areasymbol LEFT JOIN component c ON m.mukey=c.mukey WHERE m.mukey IN (SELECT mukey FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('${point}')) ORDER BY m.mukey, c.comppct_r DESC`,
 `SELECT TOP 5 mukey, mupolygonkey, mupolygongeo.STAsText() AS boundary FROM mupolygon WHERE mupolygonkey IN (SELECT mupolygonkey FROM SDA_Get_Mupolygonkey_from_intersection_with_WktWgs84('${point}'))`
 ];}
export function soilRows(raw){if(!raw.Table)return [];const [columns,...rows]=raw.Table;if(!Array.isArray(columns)||rows.length>100||columns.some(c=>typeof c!=='string'))throw Error('Unexpected soil response.');return rows.map(row=>Object.fromEntries(columns.map((key,i)=>[key,row[i]??null])));}
// The point-intersecting polygon query returns WGS84 polygons, including holes.
// Reject other geometries rather than drawing a guessed boundary.
export function soilRings(wkt){if(typeof wkt!=='string'||!/^POLYGON\s*\(/i.test(wkt))throw Error('Boundary geometry is not supported.');const matches=[...wkt.matchAll(/\(([^()]+)\)/g)];if(!matches.length)throw Error('Missing boundary rings.');return matches.map(([,ring])=>{const points=ring.split(',').map(pair=>pair.trim().split(/\s+/).map(Number));if(points.length<4||points.some(p=>p.length!==2||!p.every(Number.isFinite)||Math.abs(p[0])>180||Math.abs(p[1])>90)||points[0].some((v,i)=>v!==points.at(-1)[i]))throw Error('Invalid boundary ring.');return points;});}
export async function lookupMappedSoil(longitude,latitude,{fetchImpl=fetch,signal}={}){
 const point=soilPoint(longitude,latitude),queries=soilQueries(...point),responses=[];
 for(const query of queries){const response=await fetchImpl(SOIL_ENDPOINT,{method:'POST',credentials:'omit',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,format:'JSON+COLUMNNAME'}),signal:signal||AbortSignal.timeout(20000)});if(!response.ok)throw Error('USDA soil service is unavailable. Try again later.');const body=await response.text();if(body.length>2000000)throw Error('Soil response is too large for this view.');responses.push(JSON.parse(body));}
 const components=soilRows(responses[0]),boundaries=soilRows(responses[1]).map(row=>({...row,rings:soilRings(row.boundary)}));
 return {schemaVersion:1,kind:'mapped_landscape_estimate',point,retrievedAt:new Date().toISOString(),source:SOIL_ENDPOINT,queries,responses,components,boundaries,limits:{components:100,pointIntersectingPolygons:5},note:'Map-unit components describe the mapped area, not the exact soil beneath this point. Survey version is not a sampling date. No laboratory record or planting recommendation is changed.'};
}
