import test from 'node:test';
import assert from 'node:assert/strict';
import {createCleanupHandler} from '../supabase/functions/cleanup-rating-photos/handler.mjs';
function fixture({paths=['r/old.jpg'],removeError=false,ackError=false}={}){
 const calls=[];const db={rpc:async(name,args)=>{calls.push([name,args]);return name==='photo_cleanup_batch'?{data:paths}:{error:ackError};},storage:{from(bucket){assert.equal(bucket,'rating-photos');return {remove:async p=>{calls.push(['remove',p]);return {error:removeError};}};}}};
 return {calls,handle:createCleanupHandler({getSecret:()=> 'test-secret',createClient:()=>db})};
}
const request=(secret='test-secret')=>new Request('https://example.invalid',{method:'POST',headers:{'x-cleanup-secret':secret}});
test('unauthorized requests never create a privileged client',async()=>{
 const f=fixture();assert.equal((await f.handle(request('wrong'))).status,401);assert.equal(f.calls.length,0);
});
test('successful Storage API deletion is acknowledged only afterwards',async()=>{
 const f=fixture();const response=await f.handle(request());assert.equal(response.status,200);assert.deepEqual(f.calls.map(c=>c[0]),['photo_cleanup_batch','remove','ack_photo_cleanup']);assert.deepEqual(f.calls[2][1],{paths:['r/old.jpg']});
});
test('failed Storage deletion leaves the queue intact for retry',async()=>{
 const f=fixture({removeError:true});assert.equal((await f.handle(request())).status,500);assert.deepEqual(f.calls.map(c=>c[0]),['photo_cleanup_batch','remove']);
});
test('acknowledgement failure is retried; empty queue skips Storage',async()=>{
 assert.equal((await fixture({ackError:true}).handle(request())).status,500);
 const f=fixture({paths:[]});assert.equal((await f.handle(request())).status,200);assert.equal(f.calls.length,1);
});
