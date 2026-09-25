import {html} from "npm:htl";

export function articleMeta({section, date, tags = []}) {
  return html`<p class="article-meta">
    ${section ? html`<span>${section}</span>` : null}
    ${date ? html`<time datetime=${date}>${date}</time>` : null}
    ${tags.length ? html`<span>${tags.join(", ")}</span>` : null}
  </p>`;
}
