import {html} from "npm:htl";
import {contentCard} from "./content-card.js";

export function sectionIndex({intro, items}) {
  return html`<section class="section-index">
    ${intro ? html`<p class="section-intro">${intro}</p>` : null}
    <div class="content-card-grid">${items.map(contentCard)}</div>
  </section>`;
}
