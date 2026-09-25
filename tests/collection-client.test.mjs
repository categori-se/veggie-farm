import test from 'node:test';
import assert from 'node:assert/strict';
import {createCollectionClient} from '../src/lib/account/collectionClient.js';
const reply=(value,status=200)=>({ok:status>=200&&status<300,status,text:async()=>JSON.stringify(value)});
test('private collection requests bind to one session and pass the conditional revision',async()=>{
  const requests=[];let token='token-a';
  const client=createCollectionClient({origin:'https://studio.example',token:()=>token,fetchImpl:async(url,options)=>{
    requests.push({url:String(url),options});return String(url).endsWith('/account-config.json')?reply({version:1,apiBaseUrl:'https://api.example'}):reply({revision:'"abc"'});
  }});
  await client.request('PUT','/workspaces/id/collections/id',{gardens:[]},'"old"');
  assert.equal(requests[1].options.headers.authorization,'Bearer token-a');assert.equal(requests[1].options.headers['if-match'],'"old"');
  assert.equal(requests[1].options.credentials,'omit');assert.equal(requests[1].options.redirect,'error');
  const raced=createCollectionClient({origin:'https://studio.example',token:()=>token,fetchImpl:async()=>{token='token-b';return reply({version:1,apiBaseUrl:'https://api.example'});}});
  await assert.rejects(raced.request('GET','/workspaces'),{code:'session_changed'});
});
test('anonymous public reads omit even an available account token and do not permit writes',async()=>{
  const requests=[];
  const client=createCollectionClient({origin:'https://studio.example',token:()=> 'private-token',fetchImpl:async(url,options)=>{
    requests.push({url:String(url),options});return String(url).endsWith('/account-config.json')?reply({version:1,apiBaseUrl:'https://api.example'}):reply({gardens:[]});
  }});
  await client.request('GET','/public/collections/w/c',undefined,undefined,{publicRead:true});
  assert.equal(requests[1].options.headers.authorization,undefined);
  await assert.rejects(client.request('POST','/public/collections/w/c',{},undefined,{publicRead:true}),{code:'invalid_request'});
  await assert.rejects(client.request('GET','/workspaces',undefined,undefined,{publicRead:true}),{code:'invalid_request'});
});
test('lost session after a response cannot expose a previous account collection',async()=>{
  let token='a';
  const client=createCollectionClient({origin:'https://studio.example',token:()=>token,fetchImpl:async url=>{
    if(String(url).endsWith('/account-config.json'))return reply({version:1,apiBaseUrl:'https://api.example'});
    token=null;return reply({gardens:[{name:'private'}]});
  }});
  await assert.rejects(client.request('GET','/workspaces/a/collections/b'),{code:'session_changed'});
});
