import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
function fixture(url){
 const elements=new Map();
 const element=()=>({hidden:false,textContent:'',disabled:false,remove(){elements.delete('#activate-form');}});
 for(const id of ['#application','#auth-panel','#account-controls','#account-name','#invite-friend','#login-form','#forgot-password','#auth-panel h1','#auth-status'])elements.set(id,element());
 const button=element();
 elements.get('#auth-panel').insertAdjacentHTML=()=>{const form=element();form.querySelector=()=>button;elements.set('#activate-form',form);};
 const location=new URL(url);const document={querySelector:id=>elements.get(id)||null,addEventListener(){}};
 const context=vm.createContext({window:{APP_CONFIG:{}},location,document,URLSearchParams,history:{replaceState(){}},FormData:class{get(){return 'valid-password';}}});
 vm.runInContext(source,context);vm.runInContext("load=()=>Promise.resolve();clearMemberData=()=>{member=null;};db={from(){const q={select(){return q;},eq(){return q;},maybeSingle:async()=>({data:{role:'owner',display_name:'Test owner',active:true}})};return q;}}",context);
 return {elements,button,run:code=>vm.runInContext(code,context)};
}
test('invite redirect marker opens only password form before session is ready',()=>{
 const f=fixture('https://example.com/?auth=invite');f.run('showPasswordSetup()');
 assert.equal(f.elements.get('#login-form').hidden,true);assert.equal(f.elements.get('#forgot-password').hidden,true);assert.equal(f.button.disabled,true);
 f.run("show({user:{id:'new-user'}},false)");assert.equal(f.button.disabled,false);assert.equal(f.elements.get('#application').hidden,true);
});
test('legacy invite and recovery fragments still select password setup',()=>{
 for(const type of ['invite','recovery']){const f=fixture('https://example.com/#type='+type);f.run("show({user:{id:'member'}},false)");assert.ok(f.elements.has('#activate-form'));}
});
test('auth refresh does not leave password setup before successful save',()=>{
 const f=fixture('https://example.com/?auth=invite');f.run("show({user:{id:'member'}},false);show({user:{id:'member'}},false)");assert.equal(f.elements.get('#login-form').hidden,true);assert.ok(f.elements.has('#activate-form'));
});
test('failed password save retains setup and allows retry',async()=>{
 const f=fixture('https://example.com/?auth=invite');f.run("db.auth={updateUser:async()=>({error:{message:'Too weak'}})};show({user:{id:'member'}},false)");
 await f.elements.get('#activate-form').onsubmit({preventDefault(){}});assert.equal(f.elements.get('#auth-status').textContent,'Too weak');assert.equal(f.button.disabled,false);assert.ok(f.elements.has('#activate-form'));
});
test('successful password save removes activation form and opens application',async()=>{
 const f=fixture('https://example.com/?auth=invite');f.run("db.auth={updateUser:async()=>({data:{user:{id:'member'}}})};show({user:{id:'member'}},false)");
 await f.elements.get('#activate-form').onsubmit({preventDefault(){}});assert.equal(f.elements.has('#activate-form'),false);assert.equal(f.elements.get('#application').hidden,false);
});
test('sign-out restores normal login and removes old password form',()=>{
 const f=fixture('https://example.com/#type=recovery');f.run("show({user:{id:'member'}},false);showLogin()");assert.equal(f.elements.has('#activate-form'),false);assert.equal(f.elements.get('#login-form').hidden,false);assert.equal(f.elements.get('#forgot-password').hidden,false);assert.equal(f.elements.get('#auth-panel h1').textContent,'Sign in');
});

test('password setup reveals the account menu only after active membership is checked',async()=>{
 const f=fixture('https://example.com/?auth=recovery');f.run('showPasswordSetup()');assert.equal(f.elements.get('#account-controls').hidden,true);
 f.run("show({user:{id:'member'}},false)");await f.run('loadPasswordMenu()');
 assert.equal(f.elements.get('#account-controls').hidden,false);assert.equal(f.elements.get('#account-name').textContent,'Test owner');assert.equal(f.elements.get('#application').hidden,true);assert.ok(f.elements.has('#activate-form'));
});
test('member menus hide owner actions and inactive or missing memberships remain hidden',async()=>{
 for(const data of [{role:'member',display_name:'Member',active:true},{role:'owner',active:false},null]){
  const f=fixture('https://example.com/?auth=recovery');f.run("show({user:{id:'member'}},false)");f.run('member=null');
  f.run('db.from=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:'+JSON.stringify(data)+'})};return q}');await f.run('loadPasswordMenu()');
  assert.equal(f.elements.get('#account-controls').hidden,!data||data.active===false);if(data?.role==='member')assert.equal(f.elements.get('#invite-friend').hidden,true);
 }
});
test('late membership responses cannot reopen menus after sign-out or a return to login',async()=>{
 for(const action of ["passwordSetupPending=false;user=null;showLogin()",'showLogin()']){
  const f=fixture('https://example.com/?auth=recovery');f.run("show({user:{id:'member'}},false)");
  f.run('db.from=()=>{const q={select(){return q},eq(){return q},maybeSingle:()=>new Promise(resolve=>globalThis.finishMembership=resolve)};return q}');
  const pending=f.run('loadPasswordMenu()');f.run(action);f.run("finishMembership({data:{role:'owner',active:true,display_name:'Late'}})");await pending;
  assert.equal(f.elements.get('#account-controls').hidden,true);
 }
});
