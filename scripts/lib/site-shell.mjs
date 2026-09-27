import {fruitDashboard} from './fruit-dashboard.mjs';
import {persistenceCopy} from '../../src/lib/account/persistenceModel.js';
const community = process.env.VEGGIE_FARM_COMMUNITY === '1';
const resource=community?'':'https://veggie.farm',studio=community?'/studio':'https://studio.veggie.farm';
const normalize=path=>(path||'/').replace(/\.html$/,'').replace(/\/$/,'')||'/';
const gardenLinks=[['Vegetables','/content/vegetables/'],['Fruits','/content/fruits/'],['Herbs','/content/herbs/'],['Soil','/content/soil/'],['Seasons','/content/calendar/seasonal-garden-calendar'],['Guides','/content/reference/garden-knowledge-base'],['Garden basics','/content/garden/planning-your-vegetable-garden'],['Tools','/tools']];
export function siteHeader({path='/'}) {
 const current=normalize(path);
 const account=community?'<div class="vf-account"><a href="/demo">Try account demo</a></div>':'<div class="vf-account"><span class="vf-session-state" data-session-status role="status">Signed out</span><a data-account-action href="/login?start=1">Sign in</a></div>';
 const a=(label,url,key='')=>`<a${key==='plan'?' class="vf-studio-link" style="display:flex"':''}${key?` data-journey="${key}"`:''} href="${community ? url.replace(/^\/studio\/tools\//, "/tools/").replace(/^\/studio\/(?=[#?]|$)/, "/studio") : url}"${(key==='plan'?current==='/studio':!url.startsWith('https://studio.veggie.farm')&&normalize(new URL(url,"https://example.invalid").pathname)===current)?' aria-current="page"':''}>${label}</a>`;
 const destinations=[['Today',resource+'/tools/today','today'],['My Garden',resource+'/tools/my-garden','garden'],['Plan',studio+'/','plan'],['Journal',resource+'/journal','journal'],['Learn',resource+'/learn','learn']];
 const primary=destinations.map(([label,url,key])=>a(label,url,key)).join('');
 const resources=[['Find Plants',resource+'/content/reference/plant-database'],...gardenLinks.map(([label,url])=>[label,resource+url]),['User guide',resource+'/guide'],['Public examples',studio+'/#garden-examples'],['Search',resource+'/content/reference/garden-knowledge-base']].map(([label,url])=>a(label,url)).join('');
 return `<header class="vf-header"><nav class="vf-nav" aria-label="Primary navigation"><a class="vf-brand" href="${resource}/">veggie.farm</a><div class="vf-links">${primary}<details><summary>Resources</summary><div class="vf-menu-panel">${resources}</div></details></div><div class="vf-mobile-navigation">${a('Plan',studio+'/','plan')}<details><summary>Menu</summary><div class="vf-menu-panel">${primary}${resources}</div></details></div>${account}</nav></header>`;
}
export function sharedPersistenceCopy(md) {
 if(community) md.core.ruler.before('block','community-links',state=>{
  state.src=state.src.replace(/https:\/\/studio\.veggie\.farm\/(?=[#"')\s]|$)/g,'/studio').replace(/https:\/\/studio\.veggie\.farm(?=\/)/g,'').replace(/https:\/\/veggie\.farm(?=\/)(?!\/(?:evidence|media)\/)/g,'');
 });
 md.core.ruler.before('block','fruit-dashboard',state=>{
  const cropPage=state.src.includes('cropGuide(')||state.src.includes('<!-- fruit-growing-profile -->');
  state.src=fruitDashboard(state.src);
  if(cropPage)state.src+='\n\n```js\nimport {mountCropReadingTools} from "/components/crop-reading-tools.js";\nmountCropReadingTools({invalidation});\n```\n';
 });
 md.core.ruler.before('block','compact-photo-credits',state=>{
  // Native disclosures keep full authored captions, links and licensing intact,
  // including when JavaScript is unavailable. Diagram captions stay visible.
  state.src=state.src.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/g,figure=>{
   if(!/<img\b/.test(figure)||!/(?:plant-photo|data-stage=)/.test(figure))return figure;
   return figure.replace(/(<figcaption\b[^>]*>)([\s\S]*?)(<\/figcaption>)/g,(all,start,body,end)=>
    body.includes('photo-credit-details')?all:`${start}<details class="photo-credit-details"><summary>Photo details & credits</summary><div>${body}</div></details>${end}`);
  });
 });
 md.core.ruler.before('block','account-navigation',state=>{
  state.src='```js\nimport {mountAccountMenu} from "/components/account-menu.js";\nmountAccountMenu({invalidation});\n```\n\n'+state.src;
 });
 md.core.ruler.before('inline','garden-persistence-copy',state=>{
  for(const token of state.tokens) if(['inline','html_block'].includes(token.type)) {
   token.content=token.content.replace(/\{\{([a-z-]+)\}\}/g,(match,key)=>persistenceCopy[key]??match);
  }
 });
 return md;
}
