import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
function fixture(){
 const nodes=new Map(),markers=[];
 const element=()=>({value:'',hidden:false,textContent:'',innerHTML:'',setAttribute(k,v){this[k]=v;},replaceChildren(){this.innerHTML='';},focus(){this.focused=true;},scrollIntoView(){}});
 for(const name of ['#pin-status','#choose-location','#place-suggestions','#address-input','#place-search-status','#save-status','#belgium-map'])nodes.set(name,element());
 const form={elements:{lat:element(),lng:element(),date:element()}};nodes.set('#rating-form',form);
 const leaflet={marker(point,options){const m={point,options,removed:false,events:{},addTo(){return this;},on(event,handler){this.events[event]=handler;return this;},remove(){this.removed=true;},getLatLng(){return {lat:this.point[0],lng:this.point[1]};}};markers.push(m);return m;}};
 const context=vm.createContext({window:{APP_CONFIG:{geoapifyApiKey:'test-key'}},L:leaflet,document:{querySelector:s=>nodes.get(s),addEventListener(){}},location:new URL('https://example.com'),URLSearchParams,console});vm.runInContext(source,context);context.mockMap={setView(){}};vm.runInContext('map=mockMap',context);
 return {nodes,form,markers,context,run:code=>vm.runInContext(code,context)};
}
test('date validation accepts today and the past, rejects future and invalid calendar dates',()=>{
 const f=fixture();assert.equal(f.run("validRatingDate('2026-10-18','2026-10-18')"),true);assert.equal(f.run("validRatingDate('2026-10-17','2026-10-18')"),true);for(const date of ['2026-10-19','2026-02-30','','18/10/2026']){f.context.value=date;assert.equal(f.run("validRatingDate(value,'2026-10-18')"),false,date);}
});
test('future date is rejected before any persistence or score validation',async()=>{
 const f=fixture();f.form.elements.date.value='2999-01-01';f.context.form=f.form;await f.run('save({preventDefault(){},currentTarget:form})');assert.match(f.nodes.get('#save-status').textContent,/not in the future/);assert.equal(f.form.elements.date.focused,true);assert.match(f.form.elements.date.max,/^\d{4}-\d{2}-\d{2}$/);
});
test('replacing a manual pin removes the earlier marker and uses the latest coordinates',()=>{
 const f=fixture();f.run('setDraftPin(50,4);setDraftPin(51,3)');assert.equal(f.markers[0].removed,true);assert.equal(f.markers[1].removed,false);assert.equal(f.form.elements.lat.value,51);assert.equal(f.form.elements.lng.value,3);assert.equal(f.nodes.get('#choose-location').hidden,false);assert.equal(f.run('temporaryMarkers.length'),1);
});
test('dragging a manual pin updates saved coordinates',()=>{
 const f=fixture();f.run('setDraftPin(50,4)');assert.equal(f.markers[0].options.draggable,true);f.markers[0].point=[50.5,4.5];f.markers[0].events.dragend();assert.equal(f.form.elements.lat.value,50.5);assert.equal(f.form.elements.lng.value,4.5);
});
test('search selection hides manual pinning and works even if Leaflet did not load',()=>{
 const f=fixture();f.run('map=null;places=[{formatted:"Brussels",lat:50.85,lon:4.35}];selectPlace({target:{closest:()=>({dataset:{place:0}})}})');assert.equal(f.nodes.get('#choose-location').hidden,true);assert.equal(f.form.elements.lat.value,50.85);f.run('chooseMapLocation()');assert.equal(f.run('choosing'),false);assert.equal(f.nodes.get('#place-suggestions').hidden,true);
});
test('editing a search-selected address clears coordinates and restores manual pinning',async()=>{
 const f=fixture();f.context.fetch=async()=>({ok:true,json:async()=>({results:[]})});f.run('setDraftPin(50,4,true)');await f.run('searchPlaces({target:{value:"Changed address"}})');assert.equal(f.nodes.get('#choose-location').hidden,false);assert.equal(f.form.elements.lat.value,'');assert.equal(f.markers[0].removed,true);
});
test('a stale search response cannot reopen suggestions after the draft was reset',async()=>{
 const f=fixture();let resolve;f.context.fetch=()=>new Promise(r=>{resolve=r;});const pending=f.run('searchPlaces({target:{value:"Brussels"}})');f.run('resetDraftLocation()');resolve({ok:true,json:async()=>({results:[{formatted:'Old result'}]})});await pending;assert.equal(f.nodes.get('#place-suggestions').hidden,true);assert.equal(f.nodes.get('#place-suggestions').innerHTML,'');
});
test('location suggestion markup uses theme classes and escapes external labels',async()=>{
 const f=fixture();f.context.fetch=async()=>({ok:true,json:async()=>({results:[{name:'<img src=x>',formatted:'A & B',lat:50,lon:4}]})});await f.run('searchPlaces({target:{value:"Brussels"}})');const html=f.nodes.get('#place-suggestions').innerHTML;assert.match(html,/class="place-suggestion"/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);
});
