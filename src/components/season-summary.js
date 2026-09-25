import {localDay} from '../lib/garden/gardenRecords.js';
import {seasonForDate,seasonRoutes} from '../lib/garden/seasonContext.js';
export function seasonSummary({date=localDay()}={}) {
 const season=seasonRoutes[seasonForDate(date)],root=document.createElement('section');root.className='home-routing season-summary';root.id='in-season';
 const heading=document.createElement('h2');heading.textContent=`${season.title} in the garden`;
 const context=document.createElement('p');context.className='season-context-note';context.textContent=`Massachusetts · ${date}. Calendar season guides these topics; local frost, soil and plant stage guide timing.`;
 const nav=document.createElement('nav');nav.className='home-knowledge-links';nav.setAttribute('aria-label','Seasonal tasks');
 for(const [label,url] of season.tasks){const a=document.createElement('a');a.textContent=label;a.href=url;nav.append(a);}
 const more=document.createElement('a');more.href=season.href;more.textContent=`Explore ${season.title.toLowerCase()} →`;root.append(heading,context,nav,more);return root;
}
