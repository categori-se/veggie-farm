import {registerReferenceLandmarks} from "../lib/spatial/referenceRegistration.js";
import {localPointToLonLat, lonLatToLocalPoint} from "../lib/spatial/gardenSpatial.js";

const svgNode = (name, attributes = {}) => {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
};

/** A private image is transient; only landmarks and image identity enter a garden save. */
export function referenceMapInspector({host, getState, onChange, onStart}) {
  host.innerHTML = `<details class="advanced-disclosure reference-registration">
    <summary>Align a reference map</summary>
    <p>Choose a local site-map image. Pair at least three spread-out landmarks with the aerial map and reserve a fourth as a check. The image stays in this tab.</p>
    <label>Reference image<input data-ref="file" type="file" accept="image/png,image/jpeg,image/webp"></label>
    <p data-ref="image-name"></p>
    <svg data-ref="source" role="img" aria-label="Local reference map; click a landmark or enter pixel coordinates" style="width:100%;max-height:320px;background:#17241c" hidden></svg>
    <div class="form-grid">
      <label>Source X px<input data-ref="x" type="number" min="0" step="1"></label>
      <label>Source Y px<input data-ref="y" type="number" min="0" step="1"></label>
    </div>
    <button data-ref="pick-source" type="button">Use source coordinates</button>
    <label>Landmark name<input data-ref="name" type="text" maxlength="120" placeholder="For example, greenhouse roof corner"></label>
    <label>Landmark role<select data-ref="role"><option value="fit">Fit landmark</option><option value="check">Separate check (excluded from fit)</option></select></label>
    <p data-ref="status" role="status"></p>
    <button data-ref="cancel-pick" type="button" hidden>Cancel landmark pick</button>
    <details><summary>Enter aerial coordinates</summary>
      <label>Longitude<input data-ref="longitude" type="number" min="-180" max="180" step="0.000001"></label>
      <label>Latitude<input data-ref="latitude" type="number" min="-90" max="90" step="0.000001"></label>
      <button data-ref="pick-target" type="button">Use aerial coordinates</button>
    </details>
    <ol data-ref="landmarks"></ol>
    <p data-ref="fit" role="status"></p>
    <label><input data-ref="show" type="checkbox" checked> Preview registered image</label>
    <label>Reference preview opacity<input data-ref="opacity" type="range" min="0" max="1" step="0.05" value="0.35"></label>
    <button data-ref="save" type="button" disabled>Save reference alignment</button>
    <button data-ref="discard" type="button">Discard alignment changes</button>
    <p>Residuals measure agreement with your landmarks, not survey accuracy. Reselect the same image after reload to see its overlay.</p>
  </details>`;
  const refs = Object.fromEntries([...host.querySelectorAll("[data-ref]")].map(node => [node.dataset.ref, node]));
  let gardenId, savedKey = "", image = null, controls = [], pending = null, result = null, loadSequence = 0;
  const saved = () => getState().property?.referenceRegistration;
  const matchingControls = () => image && saved()?.image?.sha256 === image.sha256
    ? structuredClone(saved().controls || []) : [];
  const announce = text => {refs.status.textContent = text;};
  const repaint = () => {
    result = null;
    try {result = registerReferenceLandmarks(controls, getState().property);} catch (error) {refs.fit.textContent = error.message;}
    if (result) refs.fit.textContent = `Fit RMS ${result.transform.rmseFeet.toFixed(1)} ft · separate check maximum ${result.checkMaxErrorFeet.toFixed(1)} ft. Preview only until saved.`;
    refs.save.disabled = !result || !image;
    refs["pick-source"].disabled = !image;
    refs["pick-target"].disabled = !pending;
    refs["cancel-pick"].hidden = !pending;
    refs["image-name"].textContent = image ? `${image.name} · ${image.width} × ${image.height} px` : saved()?.image ? `Saved controls for ${saved().image.name}. Reselect that image to continue.` : "No image loaded.";
    refs.source.hidden = !image;
    refs.source.replaceChildren();
    if (image) {
      refs.source.setAttribute("viewBox", `0 0 ${image.width} ${image.height}`);
      refs.source.append(svgNode("image", {href:image.url,width:image.width,height:image.height}));
      for (const [index, control] of controls.entries()) {
        const text = svgNode("text", {x:control.sourcePixel[0],y:control.sourcePixel[1],fill:"#fff",stroke:"#14291c","stroke-width":2,"paint-order":"stroke","font-size":image.width/24});
        text.textContent = index+1; refs.source.append(text);
      }
    }
    refs.landmarks.replaceChildren();
    controls.forEach((control, index) => {
      const row = document.createElement("li");
      row.append(document.createTextNode(`${index+1}. ${control.description || "Landmark"} · ${control.role} `));
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove landmark ${index+1}`);
      remove.addEventListener("click", () => {controls.splice(index,1); repaint(); onChange();});
      row.append(remove); refs.landmarks.append(row);
    });
  };
  const selectSource = point => {
    if (!image || point.some((n,i) => !Number.isFinite(n) || n < 0 || n >= [image.width,image.height][i])) {
      announce("Choose a point within the reference image."); return;
    }
    pending = point; refs.x.value = point[0].toFixed(1); refs.y.value = point[1].toFixed(1);
    onStart(); announce("Now click the matching landmark on the aerial map, or enter its longitude and latitude. Escape cancels.");
    repaint(); onChange();
  };
  const selectTarget = targetLonLat => {
    if (!pending) return false;
    if (targetLonLat.some((n,i) => !Number.isFinite(n) || Math.abs(n) > [180,90][i])) {
      announce("Enter valid longitude and latitude."); return false;
    }
    controls.push({id:crypto.randomUUID(),sourcePixel:[...pending],targetLonLat,
      role:refs.role.value,description:refs.name.value.trim(),
      imageryId:getState().basemapId || getState().property?.imagery?.activeBasemapId || null});
    pending = null; refs.name.value = "";
    // After three fit landmarks, guide the next pick toward an independent check.
    if (controls.filter(c => c.role === "fit").length >= 3) refs.role.value = "check";
    announce("Landmark pair added to the preview. Choose another source point or save a valid alignment.");
    repaint(); onChange(); return true;
  };
  refs.file.addEventListener("change", async () => {
    const file = refs.file.files?.[0]; if (!file) return;
    const sequence = ++loadSequence;
    let url;
    try {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 10*1024*1024) throw Error("Choose a PNG, JPEG or WebP image up to 10 MB.");
      const bytes = await file.arrayBuffer();
      const sha256 = [...new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))].map(b=>b.toString(16).padStart(2,"0")).join("");
      url = URL.createObjectURL(file);
      const decoded = new Image(); decoded.src = url; await decoded.decode();
      if (decoded.naturalWidth > 8192 || decoded.naturalHeight > 8192) throw Error("Use an image no larger than 8192 pixels per side.");
      if (sequence !== loadSequence) {URL.revokeObjectURL(url); return;}
      if (image) URL.revokeObjectURL(image.url);
      image = {url,sha256,name:file.name,width:decoded.naturalWidth,height:decoded.naturalHeight};
      controls = matchingControls(); pending = null;
      announce(controls.length ? "Matching image loaded; saved landmarks restored." : "Click a landmark on the reference image to begin.");
      repaint(); onChange();
    } catch (error) {if (url) URL.revokeObjectURL(url); if(sequence===loadSequence) announce(error.message);}
  });
  refs.source.addEventListener("click", event => {
    const point = new DOMPoint(event.clientX,event.clientY).matrixTransform(refs.source.getScreenCTM().inverse());
    selectSource([point.x,point.y]);
  });
  refs["pick-source"].addEventListener("click", () => selectSource([refs.x.valueAsNumber,refs.y.valueAsNumber]));
  refs["pick-target"].addEventListener("click", () => selectTarget([refs.longitude.valueAsNumber,refs.latitude.valueAsNumber]));
  const cancelPick = () => {if (!pending) return false; pending = null; announce("Landmark pick cancelled."); repaint(); return true;};
  refs["cancel-pick"].addEventListener("click", () => {cancelPick(); onChange();});
  refs.save.addEventListener("click", () => {
    if (!result || !image) return;
    const {url,...identity} = image;
    getState().property.referenceRegistration = {version:1,image:identity,controls:structuredClone(controls),
      fit:{rmseFeet:result.transform.rmseFeet,checkMaxErrorFeet:result.checkMaxErrorFeet},status:result.status};
    pending = null; repaint();
    savedKey = JSON.stringify(saved()); announce("Alignment controls saved with this garden. The image remains in this tab only.");
    onChange();
  });
  refs.discard.addEventListener("click", () => {controls = matchingControls(); pending = null; repaint(); announce("Unsaved alignment changes discarded."); onChange();});
  for (const name of ["show","opacity"]) refs[name].addEventListener("input",onChange);
  return {
    sync() {
      const state = getState(), key = JSON.stringify(saved());
      if (gardenId !== state.activeParcelId) {
        gardenId = state.activeParcelId; ++loadSequence;
        if (image) URL.revokeObjectURL(image.url);
        image = null; controls = []; pending = null; refs.file.value = "";
        savedKey = key; announce(""); repaint();
      } else if (savedKey !== key) {savedKey = key; controls = matchingControls(); pending = null; repaint();}
      if (state.activeTool !== "structures") cancelPick();
    },
    isPicking: () => Boolean(pending),
    cancelPick,
    captureMapPoint: point => selectTarget(localPointToLonLat(point,getState().property)),
    renderOverlay(world) {
      if (!image || !refs.show.checked) return;
      const group = svgNode("g", {class:"local-reference-preview","pointer-events":"none"});
      if (result) {
        const t = result.transform;
        group.append(svgNode("image",{href:image.url,width:image.width,height:image.height,opacity:refs.opacity.value,
          transform:`matrix(${t.a} ${t.b} ${-t.b} ${t.a} ${t.translation.join(" ")})`}));
      }
      const matrix = world.getScreenCTM();
      const radius = 7 / Math.max(0.000001, Math.hypot(matrix.a,matrix.b));
      const landmarks = result?.landmarks || controls.map(c => ({...c,observedLocal:lonLatToLocalPoint(c.targetLonLat,getState().property)}));
      for (const [index, landmark] of landmarks.entries()) {
        const [x,y] = landmark.observedLocal;
        const color = landmark.role === "check" ? "#ffcd48" : "#00e9ef";
        if (landmark.fittedLocal) {
          const [fx,fy] = landmark.fittedLocal;
          group.append(svgNode("line",{x1:x,y1:y,x2:fx,y2:fy,stroke:color,"stroke-width":3,"vector-effect":"non-scaling-stroke"}));
        }
        group.append(svgNode("circle",{cx:x,cy:y,r:radius,fill:"#132019",stroke:color,"stroke-width":2,"vector-effect":"non-scaling-stroke"}));
        const label = svgNode("text",{x,y,fill:"white","font-size":radius*1.4,"text-anchor":"middle",dy:".35em"});
        label.textContent = index+1; group.append(label);
      }
      world.append(group);
    }
  };
}
