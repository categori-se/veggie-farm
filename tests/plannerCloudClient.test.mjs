import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlannerCloudClient} from '../src/lib/account/plannerCloudClient.js';
const config=()=>new Response(JSON.stringify({version:1,apiBaseUrl:'https://api.example.test'}));
test('cloud saves are explicit, use bearer auth and omit browser cookies',async()=>{
 const calls=[];
 const client=createPlannerCloudClient({origin:'https://veggie.farm',token:()=> 'session.token.value',fetchImpl:async(url,options)=>{
 calls.push({url:String(url),options});
 return String(url).endsWith('/account-config.json')?config():new Response(JSON.stringify({id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',revision:'"1"'}));
 }});
 assert.equal(calls.length,0);
 await client.create('Garden',{beds:[]});
 assert.equal(calls.length,2);assert.equal(calls[1].options.headers.authorization,'Bearer session.token.value');assert.equal(calls[1].options.credentials,'omit');
 assert.deepEqual(JSON.parse(calls[1].options.body),{name:'Garden',payload:{beds:[]}});
});
test('signed-out and oversized saves never make API requests',async()=>{
 let calls=0;
 const options={origin:'https://veggie.farm',fetchImpl:async()=>{calls++;return config();}};
 await assert.rejects(createPlannerCloudClient({...options,token:()=>null}).list(),{code:'sign_in_required'});
 await assert.rejects(createPlannerCloudClient({...options,token:()=> 'a.b.c'}).create('Large',{text:'x'.repeat(2*1024*1024)}),{code:'save_too_large'});
 assert.equal(calls,0);
});
test('account changes during fetch discard the previous account response',async()=>{
 let token='a.b.c';
 const client=createPlannerCloudClient({origin:'https://veggie.farm',token:()=>token,fetchImpl:async url=>{
 if(String(url).endsWith('/account-config.json'))return config();
 token='d.e.f';return new Response(JSON.stringify({plans:[{id:'private-record'}]}));
 }});
 await assert.rejects(client.list(),{code:'session_changed'});
});
test('conflicts return an actionable error without retry or payload mutation',async()=>{
 const payload={beds:[{id:'edited'}]};let writes=0;
 const client=createPlannerCloudClient({origin:'https://veggie.farm',token:()=> 'a.b.c',fetchImpl:async url=>{
 if(String(url).endsWith('/account-config.json'))return config();writes++;return new Response('{"error":"revision_conflict"}',{status:409});
 }});
 await assert.rejects(client.update('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','"1"','Draft',payload),{code:'revision_conflict'});
 assert.equal(writes,1);assert.deepEqual(payload,{beds:[{id:'edited'}]});
});
