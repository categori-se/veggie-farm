import test from 'node:test';import assert from 'node:assert/strict';
import {parseMediaManifest,loadMediaManifest} from '../src/lib/media/runtimeMedia.js';
test('media is optional and remote credentials or executable URLs are rejected',async()=>{
 for(const url of ['javascript:alert(1)','http://example.org/a.jpg','https://user:pass@example.org/a.jpg','https://example.org/a.jpg?token=secret'])assert.throws(()=>parseMediaManifest({version:1,assets:{photo:{url}}}));
 assert.equal(parseMediaManifest({version:1,assets:{photo:{url:'https://media.example.org/a.webp'}}}).photo.url,'https://media.example.org/a.webp');
 assert.deepEqual(await loadMediaManifest({origin:'https://example.org',fetchImpl:async()=>new Response('',{status:404})}),{});
 assert.deepEqual(await loadMediaManifest({origin:'https://example.org',fetchImpl:async()=>{throw Error('offline');}}),{});
});
test('media keys cannot pollute objects or traverse logical namespaces',()=>{for(const assets of [JSON.parse('{"__proto__":{"url":"https://example.org/a"}}'),{'a/../b':{url:'https://example.org/a'}}])assert.throws(()=>parseMediaManifest({version:1,assets}));});
