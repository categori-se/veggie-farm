import {cropStatus} from "./crop-status.js";
import {plantingTimeline} from "./planting-timeline.js";
import {spacingExplorer} from "./spacing-explorer.js";
import {gardenActions} from "./garden-actions.js";
import {decisionWorkbench} from "./garden-decisions.js";
import {html} from "npm:htl";
import {getCropEvidence, formatEvidenceRange} from "../lib/evidence/horticulturalEvidence.js";

// Editorial summaries and transcribed source facts are intentionally separate.
export function cropGuide(crop, dataset, sources, decisionSources = [], rules = [], {invalidation} = {}) {
  if (!crop) return html`<p>Growing profile unavailable. Consult the linked guides and your seed supplier.</p>`;
  const facts = getCropEvidence(dataset, crop.slug).filter(d =>
    ["plant_spacing", "row_spacing", "planting_depth", "sow_indoors_lead", "planting_cue", "site_drainage"].includes(d.trait));
  const names = new Map(sources.map(d => [d.id, d.name]));
  const rows = [["Family / season", `${crop.family} · ${crop.season}`],
    ["Frost response", crop.frostTolerance], ["Start indoors", crop.startIndoors],
    ["Direct sow", crop.directSow], ["Transplant", crop.transplant],
    ["Spacing summary", crop.spacing], ["Maturity range", `${crop.daysToMaturity} days; confirm whether your variety counts from sowing or transplanting`]];
  const root=html`<section class="crop-dashboard" aria-label="Growing profile">
    <div class="crop-dashboard-header"><div data-crop-photo></div><div>
      <p class="kicker">${crop.family} · ${crop.season}</p>
      <dl class="crop-quick-facts"><dt>Frost</dt><dd>${crop.frostTolerance}</dd><dt>Space</dt><dd>${crop.spacing}</dd><dt>Start indoors</dt><dd>${crop.startIndoors}</dd><dt>Maturity</dt><dd>${crop.daysToMaturity} days — confirm your cultivar's sowing/transplant basis</dd></dl>
      ${gardenActions({crop: crop.name, cropSlug: crop.slug})}
      <p><a href=${`/content/reference/plant-database?search=${encodeURIComponent(({tomatoes:'tomato',potatoes:'potato',carrots:'carrot',peppers:'pepper',beans:'bean',cucumbers:'cucumber',onions:'onion',radishes:'radish',beets:'beet',peas:'pea',turnips:'turnip',collards:'collard'})[crop.slug]||crop.name)}`}>Compare varieties →</a></p>
    </div></div>
    ${cropStatus(crop, rules, dataset, {invalidation})}
    ${plantingTimeline([crop],dataset,{compact:true})}
    <details><summary>How to start and care for this crop</summary>
    <div class="table-wrap" tabindex="0" role="region" aria-label="Crop planning facts"><table>
      <thead><tr><th scope="col">Decision</th><th scope="col">Starting point</th></tr></thead>
      <tbody>${rows.map(([label, value]) => html`<tr><th scope="row">${label}</th><td>${value || "Not recorded"}</td></tr>`)}</tbody>
    </table></div>
    <p><strong>Bed history:</strong> ${crop.rotationNotes} If you do not know the bed’s history, start a record this season.</p>
    </details>
    <details><summary>Sketch the space in a bed</summary>${spacingExplorer()}</details>
    <details data-crop-evidence><summary>Source facts and regional context (${facts.length})</summary>
      <p>Compare these Extension recommendations with your region and crop type. Different growing systems can call for different spacing.</p>
      ${facts.length ? html`<ul>${facts.map(d => html`<li><strong>${d.trait.replaceAll("_", " ")}${d.form ? ` (${d.form.replaceAll("_", " ")})` : ""}:</strong>
        ${formatEvidenceRange(d) || "See source"}. ${d.geographicScope?.referenceLocation || "Region not recorded"}.
        <a href=${d.sourceUrl}>${names.get(d.sourceId) || "Extension source"}</a> · retrieved ${d.retrievedAt}.
        ${d.geographicScope?.sourceNote || ""}</li>`)}</ul>` : html`<p>No matching facts in this evidence collection; the summary above is editorial guidance.</p>`}
    </details>
    <details class="harvest-calculator"><summary>Estimate a harvest-check window</summary>${decisionWorkbench("harvest", {crop, sources: decisionSources})}</details>
    <p><a href="/tools/today">Check planting timing with your frost dates</a> · <a href="/tools/my-garden">Record your planting and harvest</a></p>
  </section>`;
  // Reuse the article's existing credited photograph. Its authored markup stays
  // in Markdown for static readers and build-time asset discovery; no new image
  // rights or diagnostic meaning are inferred from a crop name.
  const original=document.querySelector('figure.plant-photo[data-crop-original]')??document.querySelector('figure.plant-photo');
  if(original){const photo=original.cloneNode(true);photo.hidden=false;photo.removeAttribute('data-crop-original');root.querySelector('[data-crop-photo]').append(photo);original.dataset.cropOriginal='true';original.hidden=true;}
  else root.querySelector('[data-crop-photo]').remove();
  return root;
}
