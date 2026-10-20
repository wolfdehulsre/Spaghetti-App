import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../ratings-overview.js',import.meta.url),'utf8').replace(/\}\)\(\);\s*$/, 'globalThis.view={selectRows,normalize,readURL,writeURL,update,bindFilters,toggleRatings,revealRatings,get filters(){return filters;},set rows(v){allRows=v;},set ready(v){ready=v;},set names(v){memberNames=v;},set user(v){activeUser=v;}};})();');
function fixture(lang='en'){
 const elements=new Map(),events={},calls=[];
 const get=key=>{
  if(!elements.has(key))elements.set(key,{value:'',innerHTML:'',textContent:'',hidden:false,replaceChildren(){this.innerHTML='';},querySelector:get,addEventListener(type,fn){events[key+type]=fn;}});
  return elements.get(key);
 };
 const location=new URL('https://example.com/ratings-overview?unrelated=keep');
 const context=vm.createContext({window:{APP_CONFIG:{},UI:{language:lang,t:s=>s},addEventListener(type,fn){events[type]=fn;}},document:{querySelector:get,addEventListener(type,fn){events[type]=fn;}},location,URLSearchParams,history:{pushState(_,__,url){calls.push(url);location.href=new URL(url,location).href;},replaceState(_,__,url){calls.push(url);location.href=new URL(url,location).href;}}});
 vm.runInContext(fs.readFileSync(new URL('../rating-navigation.js',import.meta.url),'utf8'),context);
 vm.runInContext(fs.readFileSync(new URL('../rating-comments.js',import.meta.url),'utf8'),context);
 vm.runInContext(source,context);
 const view=context.view;view.names=new Map([['a','Alice'],['b','Bob']]);view.user='a';
 return {view,context,get,events,calls,location};
}
const row=(id,author,score,date,name,address='Gent',restaurant=id)=>({id,created_by:author,sauce:score,texture:score,portion:score,visited_on:date,restaurant_id:restaurant,restaurants:{name,address,latitude:50,longitude:4}});
const rows=[row('1','a',4,'2026-01-10','Zebra'),row('2','b',5,'2026-03-10','Alpha'),row('3','a',4.5,'2026-02-10','Bravo'),row('4','a',4.49,'2026-02-11','Charlie')];
test('filters combine, use raw scores and never mutate source',()=>{
 const {view}=fixture();
 const f=view.normalize({q:'GENT',member:'me',score:'4.5',from:'2026-02-01',to:'2026-02-28'});
 assert.deepEqual(Array.from(view.selectRows(rows,f),r=>r.id),['3']);
 assert.deepEqual(rows.map(r=>r.id),['1','2','3','4']);
 assert.equal(view.selectRows(rows,view.normalize({q:'absent'})).length,0);
});
test('sort directions, ties and names work in all three languages',()=>{
 for(const lang of ['en','nl','fr']){
  const {view}=fixture(lang);
  for(const [sort,expected] of [['newest',['2','4','3','1']],['oldest',['1','3','4','2']],['highest',['2','3','4','1']],['lowest',['1','4','3','2']],['name',['2','3','4','1']]]){
   assert.deepEqual(Array.from(view.selectRows(rows,view.normalize({sort})),r=>r.id),expected);
  }
  const ties=[row('z','a',4,'2026-01-01','Same'),row('a','b',4,'2026-01-01','Same'),row('c','a',4,'2026-02-01','Same')];
  assert.deepEqual(Array.from(view.selectRows(ties,view.normalize({sort:'highest'})),r=>r.id),['c','a','z']);
 }
});
test('invalid URL values normalize, valid choices survive history and unrelated parameters remain',()=>{
 const {view,location,calls}=fixture();
 location.search='?q=Gent&member=unknown&score=NaN&from=2026-02-30&sort=invalid&unrelated=keep';
 view.readURL();view.writeURL(true);
 assert.equal(view.filters.q,'Gent');assert.equal(view.filters.member,'');assert.equal(view.filters.from,'');assert.equal(view.filters.sort,'newest');
 assert.ok(calls[0].includes('unrelated=keep'));assert.ok(!calls[0].includes('invalid'));
 location.search='?member=me&score=4.5&from=2026-03-01&to=2026-01-01&sort=highest';
 view.readURL();
 assert.equal(view.filters.from,'2026-01-01');assert.equal(view.filters.to,'2026-03-01');assert.equal(view.filters.score,'4.5');
});
test('filtered list, summary and unique map count stay synchronized through language and history changes',()=>{
 const f=fixture();f.view.rows=rows;f.view.ready=true;f.view.bindFilters();
 f.location.search='?member=me&score=4.5';f.events.popstate();
 assert.equal(f.get('#stat-count').textContent,1);assert.equal(f.get('#map-count').textContent,'1 places');
 assert.match(f.get('#ratings-list').innerHTML,/Bravo/);assert.doesNotMatch(f.get('#ratings-list').innerHTML,/Charlie/);
 f.context.window.UI.language='fr';f.events.languagechange();
 assert.equal(f.get('#stat-average').textContent,'4,5');assert.equal(f.view.filters.member,'me');
 f.location.search='?q=absent';f.events.popstate();
 assert.equal(f.get('#stat-count').textContent,0);assert.equal(f.get('#map-count').textContent,'0 places');assert.match(f.get('#ratings-list').innerHTML,/No ratings found/);
 f.get('#clear-filters').onclick();assert.equal(f.get('#stat-count').textContent,4);assert.equal(f.view.filters.sort,'newest');
 f.view.rows=[];f.view.update();assert.match(f.get('#ratings-list').innerHTML,/No ratings yet/);
});

test('overview initially shows five, expands all and collapses without changing totals or map',()=>{
 const f=fixture();f.view.rows=Array.from({length:8},(_,i)=>row(String(i),'a',4,'2026-01-10','Restaurant '+i));f.view.ready=true;
 const count=()=>[...f.get('#ratings-list').innerHTML.matchAll(/<article /g)].length;
 f.view.update();assert.equal(count(),5);assert.match(f.get('#ratings-list').innerHTML,/Show more \(3\)/);assert.match(f.get('#ratings-list').innerHTML,/aria-expanded="false"/);
 assert.equal(f.get('#stat-count').textContent,8);assert.equal(f.get('#map-count').textContent,'1 places');
 f.view.toggleRatings();assert.equal(count(),8);assert.match(f.get('#ratings-list').innerHTML,/Show less/);assert.match(f.get('#ratings-list').innerHTML,/aria-expanded="true"/);
 f.context.window.UI.language='nl';f.view.update();assert.equal(count(),8);
 f.view.toggleRatings();assert.equal(count(),5);
 f.view.revealRatings();assert.equal(count(),8);
});
test('filters search hidden ratings and cap the filtered results, not the source dataset',()=>{
 const f=fixture();f.view.rows=Array.from({length:12},(_,i)=>row(String(i),'a',4,'2026-01-10',i<6?'Hidden match '+i:'Other '+i));f.view.ready=true;f.view.bindFilters();
 f.view.update();assert.doesNotMatch(f.get('#ratings-list').innerHTML,/Hidden match 5/);
 f.location.search='?q=Hidden';f.events.popstate();
 assert.equal([...f.get('#ratings-list').innerHTML.matchAll(/<article /g)].length,5);
 assert.equal(f.get('#stat-count').textContent,6);assert.equal(f.get('#map-count').textContent,'1 places');
 assert.match(f.get('#ratings-list').innerHTML,/Show more \(1\)/);
 f.view.toggleRatings();assert.match(f.get('#ratings-list').innerHTML,/Hidden match 5/);
 f.location.search='?q=Hidden+match+5';f.events.popstate();
 assert.match(f.get('#ratings-list').innerHTML,/Hidden match 5/);assert.doesNotMatch(f.get('#ratings-list').innerHTML,/data-show-more/);
 assert.equal(f.get('#stat-count').textContent,1);
 f.get('#clear-filters').onclick();assert.equal([...f.get('#ratings-list').innerHTML.matchAll(/<article /g)].length,5);
});
