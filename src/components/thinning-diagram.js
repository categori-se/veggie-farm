// Original schematic: distances are scaled, plant shapes are illustrative.
// Source values are supplied separately so this does not become a universal rule.
export function thinningDiagram(reference) {
  const root = document.createElement('figure');
  root.className = 'thinning-diagram';
  root.setAttribute('aria-label', 'Thinning carrots');
  root.innerHTML = '<figcaption><strong>Give each root room</strong></figcaption><label>Space between remaining plants <select aria-label="Thinning spacing"></select></label><div class="thinning-drawing"></div><p data-result aria-live="polite"></p><details><summary>When to thin · source</summary><p data-guidance></p><p data-source></p></details>';
  const select = root.querySelector('select');
  for (const inches of reference.spacingInches) {
    const option = document.createElement('option'); option.value = inches; option.textContent = `${inches} inches`; select.append(option);
  }
  root.querySelector('[data-guidance]').textContent = reference.guidance;
  const link = document.createElement('a'); link.href = reference.sourceUrl; link.textContent = reference.sourceName;
  root.querySelector('[data-source]').append(link, ` · ${reference.scope} · checked ${reference.retrievedOn}. Schematic spacing example; plant and root sizes are not to scale. Check your variety’s instructions.`);
  const ns = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs, text) => {const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,v);if(text)n.textContent=text;return n;};
  function render() {
    const spacing = Number(select.value), positions = [];
    for(let inch=1;inch<=11;inch+=spacing)positions.push(inch);
    const svg = node('svg',{viewBox:'0 0 600 260',role:'img','aria-label':`Illustrative one-foot row before thinning and after leaving ${spacing} inches between plants. ${positions.length} plants remain in this example.`});
    const x = inch => 36 + inch*44;
    function row(y, points, label) {
      svg.append(node('text',{x:36,y:y-45,class:'thinning-label'},label));
      svg.append(node('path',{d:`M36 ${y}H564`,class:'thinning-soil'}));
      for(const inch of points) {
        const g=node('g',{transform:`translate(${x(inch)} ${y})`});
        g.append(node('path',{d:'M0 0V-25M0 -12Q-16 -32 -15 -15Q-10 -8 0 -7M0 -17Q15 -39 16 -23Q12 -14 0 -12',class:'thinning-leaf'}));
        g.append(node('path',{d:'M-3 1L0 25L3 1',class:'thinning-root'}));svg.append(g);
      }
    }
    row(72,Array.from({length:11},(_,i)=>i+1),'Before · crowded example');
    row(190,positions,'After · keep room between plants');
    const a=x(1),b=x(1+spacing);
    svg.append(node('path',{d:`M${a} 229V219M${a} 224H${b}M${b} 219V229`,class:'thinning-measure'}));
    svg.append(node('text',{x:(a+b)/2,y:246,'text-anchor':'middle',class:'thinning-label'},`${spacing} in`));
    root.querySelector('.thinning-drawing').replaceChildren(svg);
    root.querySelector('[data-result]').textContent=`${positions.length} plants in this illustrated 12-inch row. Wider spacing leaves fewer plants with more room; this is not a yield estimate.`;
  }
  select.addEventListener('change',render);render();return root;
}
