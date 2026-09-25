import {html} from "npm:htl";

export function relatedPages(items) {
  return html`<div class="related-pages">
    ${items.map((item) => html`<a href=${item.href}>
      <span>${item.section}</span>
      <strong>${item.title}</strong>
      <p>${item.description}</p>
    </a>`)}
  </div>`;
}
