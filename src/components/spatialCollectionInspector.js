import {gardenWorkspaceLayerFeatureCollections} from "../lib/spatial/gardenSpatial.js";

const collections = {parcels:"Parcel boundaries",site:"Site features and trees",beds:"Planning beds",plants:"Plantings"};

/** Attribute edits and spatial exports share entities with the planner, but never
 * change geometry or camera state. Navigation into planning is an explicit action.
 */
export function spatialCollectionInspector({host,getState,onApply,onLocate,onPlan,download}) {
  host.innerHTML = `<section class="spatial-collection-editor" aria-label="Spatial collection attributes">
    <h3>Spatial collections</h3>
    <p>Inspect site records separately from planting plans. Names and notes are editable; source and geometry records remain visible.</p>
    <label>Feature collection<select data-collection="layer">${Object.entries(collections).map(([id,label])=>`<option value="${id}">${label}</option>`).join("")}</select></label>
    <label>Find a feature<input data-collection="search" type="search" placeholder="Name, type or ID"></label>
    <p data-collection="count" role="status"></p>
    <label>Spatial feature<select data-collection="feature"></select></label>
    <div data-collection="editor">
      <dl data-collection="summary"></dl>
      <label>Feature name<input data-collection="name" type="text" maxlength="160"></label>
      <label>Feature notes<textarea data-collection="notes" rows="3" maxlength="4000"></textarea></label>
      <button data-collection="apply" type="button">Apply attributes</button>
      <button data-collection="discard" type="button">Discard attribute edits</button>
      <button data-collection="locate" type="button">Locate on garden map</button>
      <button data-collection="plan" type="button" hidden>Plan this bed</button>
      <details><summary>Source attributes</summary><pre data-collection="source" style="white-space:pre-wrap;overflow-wrap:anywhere;max-height:240px;overflow:auto"></pre></details>
    </div>
    <button data-collection="export" type="button">Download collection GeoJSON</button>
    <p data-collection="status" role="status"></p>
  </section>`;
  const refs=Object.fromEntries([...host.querySelectorAll("[data-collection]")].map(el=>[el.dataset.collection,el]));
  let gardenId, selectedKey="", selected=null, entries=[];
  const records = () => {
    const s=getState();
    if(refs.layer.value==="parcels") {
      const parcel=s.property.parcel||{};
      const members=parcel.members?.length?parcel.members:parcel.geometry?[{id:parcel.attributes?.MAP_PAR_ID||s.activeParcelId,geometry:parcel.geometry}]:[];
      return members.map(member=>({key:`parcel:${member.id}`,type:"parcel",entity:{
        id:member.id,name:`${s.property.name} · ${member.id}`,geometry:member.geometry,
        source:parcel.service||s.property.source,attributes:{...parcel.attributes,...member.attributes,MAP_PAR_ID:member.id,LOT_SIZE:member.acreage??null}
      }}));
    }
    const wrap=(items,type)=>(items||[]).map(entity=>({key:`${type}:${entity.id}`,type,entity}));
    if(refs.layer.value==="site") return [...wrap(s.structures,"structure"),...wrap(s.vegetation,"vegetation")];
    return refs.layer.value==="beds" ? wrap(s.beds,"bed") : wrap(s.placements,"placement");
  };
  const showSelected = () => {
    selected=entries.find(e=>e.key===refs.feature.value)||null;
    selectedKey=selected?.key||"";refs.editor.hidden=!selected;
    if(!selected) return;
    const {entity,type}=selected;
    refs.name.value=entity.name||"";refs.notes.value=entity.notes||"";
    for(const field of ["name","notes","apply","discard"]) refs[field].disabled=type==="parcel";
    refs.plan.hidden=type!=="bed";
    const geometry=entity.localGeometry?.type||entity.geometry?.type||(type==="placement"||entity.kind==="tree"||entity.geometryRepresentation==="point"?"Point":"Polygon");
    refs.summary.replaceChildren();
    for(const [label,value] of [["Record ID",entity.id||getState().activeParcelId],["Geometry",geometry],["Kind",entity.type||entity.kind||type]]) {
      const row=document.createElement("div"),term=document.createElement("dt"),definition=document.createElement("dd");
      term.textContent=label;definition.textContent=value;definition.style.overflowWrap="anywhere";row.append(term,definition);refs.summary.append(row);
    }
    const fields=["source","confidence","geometryBasis","surveyStatus","sourceFeatureId","sourceReferences","provenance","identificationStatus","crownMeasurementMethod","zone","bedId","plantId","geometryEdit"];
    const attributes=Object.fromEntries(fields.filter(key=>entity[key]!=null).map(key=>[key,entity[key]]));
    if(type==="parcel") attributes.parcel=entity.attributes||{};
    refs.source.textContent=JSON.stringify(attributes,null,2);
  };
  const refresh = () => {
    const all=records(),query=refs.search.value.trim().toLowerCase();
    entries=all.filter(({entity,type})=>`${entity.name||""} ${entity.id||""} ${entity.type||entity.kind||type}`.toLowerCase().includes(query));
    refs.count.textContent=`${entries.length} of ${all.length} records`;
    refs.feature.replaceChildren(...entries.map(entry=>new Option(`${entry.entity.name||entry.entity.id||"Parcel"} · ${entry.type}`,entry.key)));
    if(entries.some(e=>e.key===selectedKey))refs.feature.value=selectedKey;
    refs.feature.disabled=!entries.length;refs.export.disabled=!all.length;showSelected();
  };
  refs.layer.value="site";
  refs.layer.addEventListener("change",()=>{selectedKey="";refs.status.textContent="";refresh();});
  refs.search.addEventListener("input",refresh);
  refs.feature.addEventListener("change",showSelected);
  refs.discard.addEventListener("click",()=>{showSelected();refs.status.textContent="Unsaved attribute edits discarded.";});
  refs.apply.addEventListener("click",()=>{
    if(!selected||selected.type==="parcel")return;
    const name=refs.name.value.trim();if(!name){refs.status.textContent="Enter a feature name.";refs.name.focus();return;}
    onApply({type:selected.type,id:selected.entity.id},{name,notes:refs.notes.value});
    refresh();refs.status.textContent="Name and notes saved. Geometry and camera are unchanged.";
  });
  refs.locate.addEventListener("click",()=>{if(selected)onLocate({type:selected.type,id:selected.entity.id});});
  refs.plan.addEventListener("click",()=>{if(selected?.type==="bed")onPlan(selected.entity.id);});
  refs.export.addEventListener("click",()=>{
    const state=getState();
    const workspace={...state,id:state.activeParcelId,name:state.property.name};
    const collection=gardenWorkspaceLayerFeatureCollections(workspace)[refs.layer.value];
    download(JSON.stringify(collection,null,2),"application/geo+json",`${state.activeParcelId}-${refs.layer.value}.geojson`);
    refs.status.textContent=`Exported ${collection.features.length} features in longitude/latitude coordinates.`;
  });
  return {sync(){
    const state=getState();
    if(state.activeParcelId!==gardenId){gardenId=state.activeParcelId;selectedKey="";refs.search.value="";refs.status.textContent="";}
    if(state.activeTool!=="parcel"||!state.toolDrawerOpen)return;
    // Keep draft text while a background render occurs; explicit selection or
    // discard refreshes it from the current entity.
    if(host.contains(document.activeElement)&&[refs.name,refs.notes].includes(document.activeElement))return;
    refresh();
  }};
}
