import {measurementDate} from '../garden/soilReading.js';
import {derivedTreeShadowPolygon, deriveTreeShadowVector} from './treeObservation.js';
const rad=Math.PI/180;
// NOAA General Solar Position Calculations. Geometric center of sun; no
// atmospheric refraction, terrain horizon or measured irradiance is inferred.
export function solarPosition(instant,latitude,longitude){
 const d=new Date(instant),lat=Number(latitude),lon=Number(longitude);
 if(!Number.isFinite(d.getTime())||!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180)throw Error('A valid date and garden location are required.');
 const year=d.getUTCFullYear(),start=Date.UTC(year,0,1),days=(Date.UTC(year+1,0,1)-start)/86400000;
 const hour=d.getUTCHours()+d.getUTCMinutes()/60+d.getUTCSeconds()/3600;
 const day=Math.floor((d.getTime()-start)/86400000)+1,g=2*Math.PI/days*(day-1+(hour-12)/24);
 const eq=229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g));
 const dec=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g);
 const minutes=((hour*60+eq+4*lon)%1440+1440)%1440,ha=(minutes/4-180)*rad;
 const altitude=Math.asin(Math.max(-1,Math.min(1,Math.sin(lat*rad)*Math.sin(dec)+Math.cos(lat*rad)*Math.cos(dec)*Math.cos(ha))))/rad;
 const azimuth=(Math.atan2(Math.sin(ha),Math.cos(ha)*Math.sin(lat*rad)-Math.tan(dec)*Math.cos(lat*rad))/rad+180+360)%360;
 return {solarAltitudeDegrees:altitude,solarAzimuthDegrees:azimuth};
}
// Restrict the preview to daytime clock values, away from DST's ambiguous or
// nonexistent transition hours. Intl applies America/New_York's dated offset.
export function easternPreviewInstant(date,minutes){
 if(!measurementDate(date)||!Number.isInteger(minutes)||minutes<240||minutes>1320)throw Error('Choose a valid date and time from 04:00 to 22:00.');
 const noon=new Date(date+'T12:00:00Z');
 const zone=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',timeZoneName:'shortOffset'}).formatToParts(noon).find(p=>p.type==='timeZoneName').value;
 const offset=Number(zone.replace('GMT',''));
 return new Date(Date.parse(date+'T00:00:00Z')+(minutes-offset*60)*60000);
}
export function structureShadowPolygons(feature,solar){
 const vector=deriveTreeShadowVector(feature,solar);if(!vector)return [];
 let ring;
 if(feature.localGeometry){if(feature.localGeometry.type!=='Polygon')return [];ring=feature.localGeometry.coordinates?.[0];}
 else {const {x,y,width,height}=feature;if(![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)return [];const a=(feature.rotation||0)*rad;ring=[[-width/2,-height/2],[width/2,-height/2],[width/2,height/2],[-width/2,height/2]].map(([px,py])=>[x+px*Math.cos(a)-py*Math.sin(a),y+px*Math.sin(a)+py*Math.cos(a)]);}
 if(!Array.isArray(ring)||ring.length<3||!ring.every(p=>Array.isArray(p)&&p.slice(0,2).every(Number.isFinite)))return [];
 const shifted=ring.map(([x,y])=>[x+vector.dxInches,y+vector.dyInches]);
 // Sweep each edge, preserving concave outlines instead of using a bounding
 // box. Courtyard holes are intentionally treated as filled for this estimate.
 return [ring,shifted,...ring.map((p,i)=>[p,ring[(i+1)%ring.length],shifted[(i+1)%ring.length],shifted[i]])];
}
export function sunlightShapes({vegetation=[],structures=[]},solar){
 // Near-horizon shadows diverge. Suppress them explicitly instead of clipping
 // their length and implying precise coverage at a low sun angle.
 if(solar.solarAltitudeDegrees<5)return {trees:[],structures:[],lowSun:true};
 const trees=vegetation.map(tree=>({id:tree.id,name:tree.name,shadow:derivedTreeShadowPolygon(tree,solar)})).filter(t=>t.shadow);
 const buildings=structures.map(f=>({id:f.id,name:f.name,polygons:structureShadowPolygons(f,solar)})).filter(f=>f.polygons.length);
 return {trees,structures:buildings,lowSun:false};
}
