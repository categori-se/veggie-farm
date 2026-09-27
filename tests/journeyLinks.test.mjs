import test from 'node:test';
import assert from 'node:assert/strict';
import {mountJourneyLinks} from '../src/components/journey-links.js';
import {gardenSelection} from '../src/lib/garden/gardenSelection.js';
const saved={saveId:'11111111-1111-1111-1111-111111111111',gardenId:'garden one'};
class Link extends EventTarget {
 constructor(current=false){super();this.attrs={href:'https://studio.veggie.farm/',...(current?{'aria-current':'page'}:{})};}
 getAttribute(k){return this.attrs[k]??null;}
 setAttribute(k,v){this.attrs[k]=v;}
}
test('Plan follows the current owner selection, clears on sign-out, and cleans up',async()=>{
 let owner='a';const data=new Map(),storage=()=>({getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)});
 const selection=gardenSelection({owner:()=>owner,storage}),link=new Link(),events=new EventTarget();let dispose;
 mountJourneyLinks({root:{querySelectorAll:()=>[link]},events,selection,invalidation:new Promise(r=>dispose=r)});
 assert.equal(link.getAttribute('href'),'https://studio.veggie.farm/');
 selection.write(saved);link.dispatchEvent(new Event('click'));
 assert.equal(new URL(link.getAttribute('href')).hash,'#accountSave='+saved.saveId+'&garden=garden+one');
 owner='b';events.dispatchEvent(new Event('storage'));assert.equal(link.getAttribute('href'),'https://studio.veggie.farm/');
 owner='a';events.dispatchEvent(new Event('focus'));assert.match(link.getAttribute('href'),/accountSave=/);
 owner=null;link.dispatchEvent(new Event('click'));assert.equal(link.getAttribute('href'),'https://studio.veggie.farm/');
 owner='a';events.dispatchEvent(new Event('pageshow'));dispose();await Promise.resolve();assert.equal(link.getAttribute('href'),'https://studio.veggie.farm/');
 events.dispatchEvent(new Event('focus'));assert.equal(link.getAttribute('href'),'https://studio.veggie.farm/');
});
test('local deployments and the active Plan workspace do not initiate an account restore',()=>{
 for(const local of [false,true]){const link=new Link(!local);mountJourneyLinks({local,root:{querySelectorAll:()=>[link]},events:new EventTarget(),selection:{read:()=>saved}});link.dispatchEvent(new Event('click'));assert.equal(link.getAttribute('href'),'https://studio.veggie.farm/');}
});
