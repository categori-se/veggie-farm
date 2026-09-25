// A geometric sketch, not a yield or growing recommendation.
export function spacingExplorer() {
 const root=document.createElement('section');root.className='spacing-explorer';
 root.innerHTML=`<h3>See how spacing changes a bed</h3><p>Try a square planting grid. Enter the spacing for your crop and variety; paths, trellises and harvest access need their own room.</p><div class="library-controls"><label>Bed length (feet)<input data-length type="number" min="1" max="30" step="1" value="8"></label><label>Bed width (feet)<input data-width type="number" min="1" max="12" step="1" value="4"></label><label>Spacing between plants (inches)<input data-spacing type="number" min="3" max="72" step="1" value="12"></label></div><p data-result role="status" aria-live="polite"></p><div data-drawing></div><p>Dots show plant centers. The sketch leaves half the selected spacing at each edge, uses the same spacing between rows, and reserves no internal path. Count describes geometry, not the number your garden should grow or its expected yield.</p>`;
 const fields=['length','width','spacing'].map(x=>root.querySelector('[data-'+x+']'));
 function render(){
  const [length,width,spacing]=fields.map(x=>Number(x.value));const result=root.querySelector('[data-result]'),drawing=root.querySelector('[data-drawing]');
  if(fields.some(x=>!x.value||!x.checkValidity())){result.textContent='Enter a length from 1–30 ft, width from 1–12 ft and spacing from 3–72 inches.';drawing.replaceChildren();return;}
  const columns=Math.floor(length*12/spacing),rows=Math.floor(width*12/spacing);const count=columns*rows;
  result.textContent=count?`${count} positions: ${columns} along the length × ${rows} across the width.`:'This spacing does not fit a complete row in the selected bed.';
  const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${length*12} ${width*12}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',result.textContent);svg.style.cssText='width:100%;max-height:340px;background:#eee4cc;border:2px solid #90764e;border-radius:8px;margin:1rem 0;';
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',(x+.5)*spacing);dot.setAttribute('cy',(y+.5)*spacing);dot.setAttribute('r',Math.min(spacing*.2,3));dot.setAttribute('fill','#3b673d');svg.append(dot);}drawing.replaceChildren(svg);
 }
 fields.forEach(x=>x.addEventListener('input',render));render();return root;
}
