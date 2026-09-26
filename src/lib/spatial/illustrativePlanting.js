import {geometryCoversPoint} from "./geoJsonPromotion.js";

/** Deterministic display-only planting; never an accession or saved source feature. */
export function illustrativePlanting(areas, obstacles = [], viewport, limit = 240) {
  const result = [], cap = Math.max(0, Math.min(400, Math.floor(limit)));
  const covered = (geometry, p) => geometryCoversPoint(geometry, p);
  function nearLine(p, points, distance) {
    return points.slice(1).some((b,i) => {const a=points[i], dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)<distance;});
  }
  for (const area of areas) {
    const kind=String(area.type || area.kind || "");
    if (!/^(forest|woodland|canopy|border|shrub|hedge|planted-border)$/.test(kind)) continue;
    const geometry=area.localGeometry;
    if (!geometry || !["Polygon","MultiPolygon"].includes(geometry.type)) continue;
    const points=geometry.coordinates.flat(geometry.type === "Polygon" ? 1 : 2);
    const minX=Math.max(Math.min(...points.map(p=>p[0])),viewport.x),maxX=Math.min(Math.max(...points.map(p=>p[0])),viewport.x+viewport.width);
    const minY=Math.max(Math.min(...points.map(p=>p[1])),viewport.y),maxY=Math.min(Math.max(...points.map(p=>p[1])),viewport.y+viewport.height);
    const tree=/forest|woodland|canopy/.test(kind),spacing=tree?240:84,radius=tree?72:24;
    let seed=[...String(area.id)].reduce((v,c)=>(v*31+c.charCodeAt(0))>>>0,7);
    const noise=(x,y)=>{let n=(seed^Math.imul(x,374761393)^Math.imul(y,668265263))>>>0;n=Math.imul(n^(n>>>13),1274126177)>>>0;return (n%1000)/1000;};
    let attempts=0;
    for(let gy=Math.floor(minY/spacing);gy*spacing<maxY && attempts<5000;gy++) for(let gx=Math.floor(minX/spacing);gx*spacing<maxX && attempts++<5000;gx++) {
      if(result.length>=cap)return result;
      const x=(gx+.3+.4*noise(gx,gy))*spacing,y=(gy+.3+.4*noise(gy,gx))*spacing;
      if(x<minX||x>maxX||y<minY||y>maxY)continue;
      if(![[x,y],[x-radius,y],[x+radius,y],[x,y-radius],[x,y+radius]].every(p=>covered(geometry,p)))continue;
      if(obstacles.some(o=>{const g=o.localGeometry;if(g?.type==="LineString")return nearLine([x,y],g.coordinates,radius+36);if(g)return covered(g,[x,y]);return Number.isFinite(o.x)&&Math.hypot(x-o.x,y-o.y)<Math.hypot(o.width||0,o.height||0)/2+radius;}))continue;
      result.push({x,y,radius,height:tree?216+noise(gx,gy)*120:18+noise(gx,gy)*36,form:tree?"tree":"border",parentId:area.id,basis:"illustrative-reconstruction"});
    }
  }
  return result;
}
