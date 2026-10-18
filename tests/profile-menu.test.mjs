import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../profile-menu.js',import.meta.url),'utf8');
function fixture({session={user:{id:'me'}},result={data:{display_name:'New name'}},sessionError=null}={}){
 const calls=[];const context=vm.createContext({window:{},document:{querySelector(){return null;}}});vm.runInContext(source,context);
 const query={update(value){calls.push(['update',value]);return query;},eq(key,value){calls.push(['eq',key,value]);return query;},select(value){calls.push(['select',value]);return query;},async single(){return result;}};
 const db={auth:{getSession:async()=>({data:{session},error:sessionError})},from(table){calls.push(['from',table]);return query;}};
 return {save:context.window.ProfileMenu.saveName,db,calls};
}
test('name is trimmed and update is restricted to own membership in this group',async()=>{
 const f=fixture();assert.equal(await f.save(f.db,'group','me',' New name '),'New name');assert.deepEqual(JSON.parse(JSON.stringify(f.calls)),[['from','group_members'],['update',{display_name:'New name'}],['eq','group_id','group'],['eq','user_id','me'],['select','display_name']]);
});
test('blank and overlong names are rejected without a database request',async()=>{
 for(const name of ['','  ','x'.repeat(81)]){const f=fixture();await assert.rejects(f.save(f.db,'group','me',name),/1 and 80/);assert.equal(f.calls.length,0);}
});
test('missing or changed sessions cannot update a previous account',async()=>{
 for(const session of [null,{user:{id:'other'}}]){const f=fixture({session});await assert.rejects(f.save(f.db,'group','me','New name'),/session expired/);assert.equal(f.calls.length,0);}
});
test('database denial is reported as failure rather than a false success',async()=>{
 const f=fixture({result:{error:{message:'denied'},data:null}});await assert.rejects(f.save(f.db,'group','me','New name'),/could not be saved/);
});
test('no matching membership is reported as a failure',async()=>{
 const f=fixture({result:{data:null}});await assert.rejects(f.save(f.db,'group','me','New name'),/could not be saved/);
});
