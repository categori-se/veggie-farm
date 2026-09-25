import test from 'node:test';
import assert from 'node:assert/strict';
import {notebookStorage} from '../src/lib/account/notebookStorage.js';
import {NOTEBOOK_STORAGE} from '../src/data/runtime-capabilities.js';
import {PERSISTENCE} from '../src/lib/account/persistenceModel.js';
import {AUTH_STORAGE_KEYS,clearBrowserSession,setAuthenticatedSession} from '../src/lib/account/auth.js';

const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};};
function fixture(t){
 const previous=['localStorage','sessionStorage'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]);
 const local=memory(),session=memory();
 Object.defineProperty(globalThis,'localStorage',{value:local,configurable:true});Object.defineProperty(globalThis,'sessionStorage',{value:session,configurable:true});
 t.after(()=>{for(const[key,descriptor]of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
 const signIn=owner=>setAuthenticatedSession({accessToken:`e30.${Buffer.from(JSON.stringify({sub:owner})).toString('base64url')}.signature`,expiresAt:Date.now()+60000},session);
 return {local,session,signIn};
}
test('configured notebook mode matches its persistence explanation',()=>{
 assert.ok(['account','local'].includes(NOTEBOOK_STORAGE));
 assert.equal(PERSISTENCE.notebook.mode,NOTEBOOK_STORAGE==='account'?'private-account':'browser-local');
 assert.equal(PERSISTENCE.notebook.upload,NOTEBOOK_STORAGE==='account'?'automatic-after-record':'none');
});
test('signed-out and expired sessions cannot read legacy or private notebook records',t=>{
 const {local,session,signIn}=fixture(t);local.setItem('notes','legacy browser notes');assert.equal(notebookStorage({mode:'account'}),null);
 signIn('alice');notebookStorage({mode:'account'}).setItem('notes','private Alice');session.setItem(AUTH_STORAGE_KEYS.accessTokenExpiresAt,'1');assert.equal(notebookStorage({mode:'account'}),null);
 assert.equal(local.getItem('notes'),'legacy browser notes');signIn('alice');assert.equal(notebookStorage({mode:'account'}).getItem('notes'),'private Alice');
 clearBrowserSession(session);assert.equal(notebookStorage({mode:'account'}),null);
});
test('account switching and explicit local mode keep distinct notebooks intact',t=>{
 const {signIn}=fixture(t);const local=notebookStorage({mode:'local'});local.setItem('notes','local only');
 signIn('alice');assert.equal(notebookStorage({mode:'account'}).getItem('notes'),null);notebookStorage({mode:'account'}).setItem('notes','Alice draft');
 signIn('bob');assert.equal(notebookStorage({mode:'account'}).getItem('notes'),null);notebookStorage({mode:'account'}).setItem('notes','Bob draft');
 assert.equal(local.getItem('notes'),'local only');signIn('alice');assert.equal(notebookStorage({mode:'account'}).getItem('notes'),'Alice draft');
 notebookStorage({mode:'account'}).removeItem('notes');signIn('bob');assert.equal(notebookStorage({mode:'account'}).getItem('notes'),'Bob draft');assert.equal(local.getItem('notes'),'local only');
});
test('malformed identity and unavailable browser storage do not fall back to shared records',t=>{
 const {session}=fixture(t);setAuthenticatedSession({accessToken:'e30.e30.signature',expiresAt:Date.now()+60000},session);assert.equal(notebookStorage({mode:'account'}),null);
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('Denied');}});
 assert.equal(notebookStorage({mode:'local'}),null);assert.equal(notebookStorage({mode:'account'}),null);
});
