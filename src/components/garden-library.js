function element(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function link(text, href) {
  const a = element('a', text); a.href = href; return a;
}
function explorer(rows, {kind, categories, card, searchText, categoryOf, initialCategory = ''}) {
  const root = element('section', undefined, 'garden-library');
  const controls = element('div', undefined, 'library-controls');
  const searchLabel = element('label', kind === 'plants' ? 'Search plants' : 'Search gardening guides');
  const search = element('input'); search.type = 'search'; search.placeholder = kind === 'plants' ? 'Try tomato, basil or a variety name' : 'Try compost, pruning or yellow leaves'; searchLabel.append(search);
  const categoryLabel = element('label', 'Browse by topic'); const category = element('select');
  for (const [value, text] of [['', 'All topics'], ...categories]) {const o=element('option',text);o.value=value;category.append(o);}
  category.value=initialCategory;categoryLabel.append(category);controls.append(searchLabel,categoryLabel);
  const count=element('p');count.setAttribute('role','status');count.setAttribute('aria-live','polite');
  const grid=element('div',undefined,'library-results'); const pager=element('div',undefined,'library-pager');
  const previous=element('button','Previous'); const next=element('button','Next'); const position=element('span');
  previous.type=next.type='button';pager.append(previous,position,next);root.append(controls,count,grid,pager);
  let page=0;const indexed=rows.map(row=>({row,text:searchText(row).toLowerCase()}));
  function render() {
    const terms=search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches=indexed.filter(({row,text})=>(!category.value || categoryOf(row)===category.value)&&terms.every(t=>text.includes(t)));
    const pages=Math.max(1,Math.ceil(matches.length/12));page=Math.min(page,pages-1);
    count.textContent=matches.length ? `${matches.length} ${kind === 'plants' ? 'plants' : 'guides'} found` : 'No matches. Try a broader word or choose All topics.';
    grid.replaceChildren(...matches.slice(page*12,page*12+12).map(({row})=>card(row)));
    previous.disabled=page===0;next.disabled=page>=pages-1;position.textContent=`Page ${page+1} of ${pages}`;pager.hidden=!matches.length;
  }
  search.addEventListener('input',()=>{page=0;render();});category.addEventListener('change',()=>{page=0;render();});
  previous.addEventListener('click',()=>{page--;render();});next.addEventListener('click',()=>{page++;render();});render();return root;
}
export {plantExplorer} from "./plant-explorer.js";
export function guideExplorer(guides) {
  return explorer(guides,{kind:'guides',categories:[...new Set(guides.map(g=>g.category))].sort().map(c=>[c,c.charAt(0).toUpperCase()+c.slice(1).replaceAll('-',' ')]),categoryOf:g=>g.category,searchText:g=>[g.title,g.description,g.text].join(' '),card:g=>{
    const article=element('article',undefined,'library-card');const h=element('h3');h.append(link(g.title,g.url));article.append(element('p',g.category.replaceAll('-',' '),'kicker'),h,element('p',g.description));return article;
  }});
}
