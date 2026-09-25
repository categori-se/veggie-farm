// Recompose existing authored facts; do not infer cultivar traits or annual timing.
// Build-time HTML keeps the growing profile and licensing usable without JavaScript.
export function fruitDashboard(source) {
  if (!source.includes('<!-- fruit-growing-profile -->')) return source;
  const pattern = /## At a glance\n\n\| Question \| Practical answer \|\n\|[-| ]+\|\n((?:\|[^\n]+\|\n)+)\s*(<figure class="plant-photo content-figure">[\s\S]*?<\/figure>)/;
  return source.replace(pattern, (original, table, figure) => {
    const rows = table.trim().split('\n').map(row => row.split('|').slice(1, -1).map(value => value.trim()));
    // Leave unfamiliar Markdown untouched rather than silently damaging authored content.
    if (rows.some(row => row.length !== 2 || row.some(value => /[<>\[\]`*]/.test(value)))) return original;
    const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    const facts = rows.map(([label, value]) => `<dt>${escape(label)}</dt><dd>${escape(value)}</dd>`).join('');
    return `<section class="fruit-dashboard" aria-label="Growing profile">\n<div class="fruit-profile-photo">${figure}</div>\n<div class="fruit-profile-facts"><h2 id="at-a-glance">At a glance</h2><dl>${facts}</dl></div>\n</section>`;
  });
}
