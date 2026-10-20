import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const overview=fs.readFileSync(new URL('../ratings-overview.js',import.meta.url),'utf8');
function fixture(source){
 const elements=new Map();
 const get=id=>{if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',hidden:false,replaceChildren(){this.innerHTML='';},insertAdjacentHTML(_,html){this.innerHTML+=html;}});return elements.get(id);};
 const context=vm.createContext({window:{APP_CONFIG:{groupId:'group'}},document:{querySelector:get,addEventListener(){}},location:new URL('https://example.com/'),URLSearchParams,Map,console});
 vm.runInContext(fs.readFileSync(new URL('../rating-navigation.js',import.meta.url),'utf8'),context);vm.runInContext(fs.readFileSync(new URL('../rating-comments.js',import.meta.url),'utf8'),context);vm.runInContext(source,context);return {get,context,run:code=>vm.runInContext(code,context)};
}
const homeRows=[{id:'mine',restaurant_id:'r1',created_by:'me',date:'2026-10-18',name:'My restaurant',author:'Me',sauce:3,texture:3,portion:3,lat:50,lng:4},{id:'theirs',restaurant_id:'r2',created_by:'friend',date:'2026-10-18',name:'Friend restaurant',author:'Friend',sauce:5,texture:5,portion:5,lat:51,lng:3}];
test('home list, counters, mean and map all exclude other members',()=>{
 const f=fixture(app);f.context.rows=homeRows;f.run("user={id:'me'};member={role:'owner'};ratings=rows;paintPins=list=>{globalThis.mapped=list};paint()");
 assert.equal(f.get('#stat-count').textContent,1);assert.equal(f.get('#stat-average').textContent,'3.0');assert.equal(f.get('#list-count').textContent,'1 plates');assert.equal(f.get('#map-count').textContent,'1 places');assert.match(f.get('#ratings-list').innerHTML,/My restaurant/);assert.doesNotMatch(f.get('#ratings-list').innerHTML,/Friend restaurant/);assert.equal(f.context.mapped.length,1);
});
test('member without personal ratings gets zero and no group mean or map pins',()=>{
 const f=fixture(app);f.context.rows=homeRows;f.run("user={id:'new-member'};ratings=rows;paintPins=list=>{globalThis.mapped=list};paint()");assert.equal(f.get('#stat-count').textContent,0);assert.equal(f.get('#stat-average').textContent,'—');assert.equal(f.context.mapped.length,0);assert.doesNotMatch(f.get('#ratings-list').innerHTML,/Friend restaurant/);
});
test('home query filters by both group and authenticated author',async()=>{
 const f=fixture(app),filters=[];
 f.context.mock={from(table){const q={select(){return q;},eq(key,value){filters.push([table,key,value]);return q;},order(){return Promise.resolve({data:[],error:null});},then(resolve){resolve({data:table==='group_members'?[{user_id:'me',role:'member',display_name:'Me'}]:[],error:null});}};return q;}};
 await f.run("db=mock;user={id:'me'};paint=()=>{};load()");assert.ok(filters.some(([t,k,v])=>t==='ratings'&&k==='group_id'&&v==='group'));assert.ok(filters.some(([t,k,v])=>t==='ratings'&&k==='created_by'&&v==='me'));
});
function overviewFixture(){return fixture(overview.replace(/\}\)\(\);\s*$/, 'globalThis.testView={render,clear,pins};})();'));}
const groupRows=homeRows.map(r=>({...r,visited_on:r.date,restaurants:{name:r.name,address:'Belgium',latitude:r.lat,longitude:r.lng}}));
test('overview includes all authors, group mean and unique mapped places',()=>{
 const f=overviewFixture();f.context.rows=groupRows;f.run("testView.render(rows,new Map([['me','Me'],['friend','Friend']]))");assert.equal(f.get('#stat-count').textContent,2);assert.equal(f.get('#stat-average').textContent,'4.0');assert.equal(f.get('#map-count').textContent,'2 places');assert.match(f.get('#ratings-list').innerHTML,/Friend restaurant/);assert.match(f.get('#ratings-list').innerHTML,/My restaurant/);
});
test('overview counts unmapped ratings but counts a shared restaurant only once on map',()=>{
 const f=overviewFixture();f.context.rows=[groupRows[0],{...groupRows[1],restaurant_id:'r1'}, {...groupRows[0],restaurants:{name:'Unmapped'}}];f.run('testView.render(rows,new Map())');assert.equal(f.get('#stat-count').textContent,3);assert.equal(f.get('#map-count').textContent,'1 places');
});
test('overview escapes names and clears private results on sign-out',()=>{
 const f=overviewFixture();f.context.rows=[{...groupRows[0],restaurants:{name:'<img src=x onerror=alert(1)>'}}];f.run('testView.render(rows,new Map())');assert.doesNotMatch(f.get('#ratings-list').innerHTML,/<img/);assert.match(f.get('#ratings-list').innerHTML,/&lt;img/);f.run('testView.clear()');assert.equal(f.get('#ratings-list').innerHTML,'');assert.equal(f.get('#application').hidden,true);assert.equal(f.get('#stat-average').textContent,'—');
});

for(const page of ['home','overview'])for(const separateRecords of [false,true])test(`${page} shared pin has a separate button for each rating (${separateRecords?'different':'same'} restaurant records)`,()=>{
 const f=page==='home'?fixture(app):overviewFixture(),markers=[];
 const map={invalidateSize(){}};
 f.context.window.L=f.context.L={map:()=>({setView:()=>map}),tileLayer:()=>({addTo(){}}),marker:()=>{
   const marker={addTo(){return this;},bindPopup(content){this.content=typeof content==='string'?content:content.innerHTML;return this;},on(event,fn){this.open=fn;return this;},getPopup(){return {getElement:()=>this};},remove(){}};
   markers.push(marker);return marker;
 }};
 f.context.document.createElement=()=>({});
 let binding;
 f.context.window.RatingNavigation={...f.context.window.RatingNavigation,bind:(...args)=>{binding=args;}};
 f.context.rows=[{...homeRows[0],id:'first',author:'<unsafe>'},{...homeRows[0],id:'second',restaurant_id:separateRecords?'duplicate-record':'r1',date:'2026-10-17'}];
 if(page==='home')f.run("user={id:'me'};member={role:'member'};ratings=rows;map=L.map().setView();paint()");
 else f.run("testView.render(rows.map(r=>({...r,visited_on:r.date,restaurants:{name:r.name,address:'Belgium',latitude:r.lat,longitude:r.lng}})),new Map([['me','<unsafe>']]))");
 assert.equal(markers.length,1);
 assert.equal(f.get('#map-count').textContent,'1 places');
 const lookup=page==='home'?f.run('pins'):f.run('testView.pins');
 for(const row of f.context.rows)assert.equal(lookup.get(row.restaurant_id),markers[0]);
 for(const id of ['first','second']){
   assert.match(markers[0].content,new RegExp('data-rating="'+id+'"'));
   assert.match(f.get('#ratings-list').innerHTML,new RegExp('id="rating-'+id+'"'));
 }
 assert.doesNotMatch(markers[0].content,/<unsafe>/);
 assert.match(markers[0].content,/2026-10-17/);
 markers[0].open();assert.equal(binding[0],markers[0]);assert.equal(binding[1],map);
});
