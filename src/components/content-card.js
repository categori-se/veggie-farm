import {html} from "npm:htl";

export function contentCard({title, description, href, section}) {
  return html`<a class="content-card" href=${href}>
    ${section ? html`<span>${section}</span>` : null}
    <h2>${title}</h2>
    <p>${description}</p>
  </a>`;
}

export function cardGrid(items) {
  return html`<div class="content-card-grid">${items.map(contentCard)}</div>`;
}
