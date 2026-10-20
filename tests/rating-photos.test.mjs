import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../rating-photos.js',import.meta.url),'utf8');
function fixture(){
 const context=vm.createContext({window:{},document:{querySelector:()=>null},console});
 vm.runInContext(source,context);return context.window.RatingPhotos;
}
test('only supported images up to 10 MB are accepted',()=>{
 const p=fixture();for(const type of ['image/jpeg','image/png','image/webp'])assert.doesNotThrow(()=>p.validate({type,size:10000000}));
 for(const file of [{type:'image/svg+xml',size:20},{type:'image/jpeg',size:10000001},{type:'image/png',size:0}])assert.throws(()=>p.validate(file));
});
test('image dimensions preserve aspect ratio and never enlarge',()=>{
 const p=fixture();assert.deepEqual([...p.dimensions(4000,3000)],[1200,900]);assert.deepEqual([...p.dimensions(800,1600)],[600,1200]);assert.deepEqual([...p.dimensions(100,80)],[100,80]);
});
test('photo markup reserves layout, loads lazily and escapes database paths',()=>{
 const p=fixture();assert.equal(p.markup(null,'r'),'');const html=p.markup('x" onclick="bad','r');assert.match(html,/loading="lazy"/);assert.match(html,/width="600" height="400"/);assert.doesNotMatch(html,/ onclick="bad/);assert.match(html,/&quot;/);
});
test('no photo change performs no remote calls',async()=>{
 const p=fixture();let calls=0;await p.persist({rpc(){calls++;}},'r');assert.equal(calls,0);
});
