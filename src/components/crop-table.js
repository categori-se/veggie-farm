import {html} from "npm:htl";

export function cropTable(crops) {
  return html`<table class="data-table">
    <thead>
      <tr>
        <th>Crop</th>
        <th>Family</th>
        <th>Season</th>
        <th>Planting window</th>
        <th>Spacing</th>
      </tr>
    </thead>
    <tbody>
      ${crops.map((d) => html`<tr>
        <td><a href=${d.path}>${d.name}</a></td>
        <td>${d.family}</td>
        <td>${d.season}</td>
        <td>${d.directSow}</td>
        <td>${d.spacing}</td>
      </tr>`)}
    </tbody>
  </table>`;
}
