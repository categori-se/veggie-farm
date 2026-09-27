import {mountJourneyLinks} from './journey-links.js';
import {NOTEBOOK_STORAGE} from '../data/runtime-capabilities.js';
import {browserSessionState} from '../lib/account/auth.js';
import {createCognitoBrowserAuth} from '../lib/account/cognitoAuth.js';
import {currentProtectedReturnTo} from '../lib/account/authNavigation.js';

// Session presence is a UI hint, not authorization. Every private API request
// still goes through server-side JWT/ownership checks. No token or email is shown.
export function mountAccountMenu({invalidation}={}) {
 mountJourneyLinks({invalidation,local:NOTEBOOK_STORAGE==='local'});
 if(NOTEBOOK_STORAGE==='local'){document.querySelectorAll('[data-session-status]').forEach(n=>n.textContent='Saved in this browser');document.querySelectorAll('[data-account-action]').forEach(n=>n.hidden=true);return;}

 const links=[...document.querySelectorAll('[data-account-action]')];
 if(!links.length)return;
 let busy=false;
 function render(){
  let state;try{state=browserSessionState().status;}catch{state='signed_out';}
  const signedIn=state==='signed_in';
  document.querySelectorAll('[data-session-status]').forEach(n=>{n.textContent=signedIn?'Signed in':state==='expired'?'Session expired':'Signed out';});
  for(const link of links){link.textContent=signedIn?'Sign out':'Sign in';link.dataset.signedIn=String(signedIn);link.setAttribute('aria-disabled',String(busy));link.href=`/login?start=1&returnTo=${encodeURIComponent(currentProtectedReturnTo(globalThis.location,'/'))}`;}
 }
 async function activate(event){
  event.preventDefault();if(busy)return;busy=true;render();
  try{
   const auth=createCognitoBrowserAuth();
   if(browserSessionState().status==='signed_in')await auth.signOut();
   else await auth.beginSignIn(currentProtectedReturnTo(globalThis.location,'/'));
  }catch{
   busy=false;render();
   document.querySelectorAll('[data-session-status]').forEach(n=>{n.textContent='Could not connect. Try again.';});
  }
 }
 links.forEach(link=>link.addEventListener('click',activate));
 for(const event of ['focus','storage','pageshow','notebook-sync-status'])globalThis.addEventListener(event,render);
 const timer=setInterval(render,30000);render();
 invalidation?.then(()=>{clearInterval(timer);links.forEach(link=>link.removeEventListener('click',activate));for(const event of ['focus','storage','pageshow','notebook-sync-status'])globalThis.removeEventListener(event,render);});
}
