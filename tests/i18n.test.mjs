import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../i18n.js',import.meta.url),'utf8');
function fixture({saved=null,browser='en',unavailable=false}={}){
  const callbacks={}, nodes=[], fields=[], head=[];
  const select={value:'',addEventListener(type,fn){callbacks.change=fn;}};
  const document={documentElement:{},body:{},dispatchEvent(){},addEventListener(type,fn){callbacks[type]=fn;},
    createTreeWalker(){let index=0;return {nextNode(){this.currentNode=nodes[index++];return !!this.currentNode;}};},
    querySelectorAll(selector){return selector.startsWith('title,')?head:fields;},
    querySelector(selector){return selector==='.topbar'?{insertAdjacentHTML(position,html){callbacks.menu=html;}}:selector==='#ui-language'?select:null;}};
  const storage={getItem(){if(unavailable)throw Error('blocked');return saved;},setItem(key,value){saved=value;}};
  const context=vm.createContext({window:{},document,Event,localStorage:storage,navigator:{language:browser},NodeFilter:{SHOW_TEXT:4},MutationObserver:class{observe(){}}});
  vm.runInContext(source.replace("  let language = 'en';","  globalThis.catalogs={nl:copy,fr:french};\n  let language = 'en';"),context);
  const change=lang=>{select.value=lang;callbacks.change({target:select});};
  return {context,document,nodes,fields,head,callbacks,change,get saved(){return saved;},t:text=>context.window.UI.t(text)};
}
test('French and Dutch cover the same complete catalog',()=>{
  const {catalogs}=fixture().context;
  assert.deepEqual(Object.keys(catalogs.fr).sort(),Object.keys(catalogs.nl).sort());
  for(const language of ['nl','fr'])for(const [key,value] of Object.entries(catalogs[language]))assert.ok(value.trim(),language+': '+key);
});
const decode=text=>text.replaceAll('&amp;','&').replaceAll('&copy;','©').replaceAll('&nbsp;',' ');
for(const page of ['index.html','ratings-overview.html','members.html'])test(page+' has translated static text, labels and page metadata in all three languages',()=>{
  const f=fixture(),html=fs.readFileSync(new URL('../'+page,import.meta.url),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
  assert.match(fs.readFileSync(new URL('../'+page,import.meta.url),'utf8'),/src="\/i18n.js"/); // Every route loads the shared selector.
  const text=[...html.matchAll(/>([^<>]+)</g)].map(m=>decode(m[1]).trim()).filter(x=>/[a-z]/i.test(x));
  const attributes=[...html.matchAll(/(?:placeholder|aria-label|title|alt|content)="([^"]+)"/g)].map(m=>decode(m[1]));
  const exempt=new Set(['B','Beste Belgische','Bolognaise','Beste Belgische Bolognaise','friend@example.com','width=device-width, initial-scale=1, viewport-fit=cover','#f7f3e9','noindex']);
  for(const value of [...text,...attributes]){
    if(exempt.has(value))continue;
    for(const language of ['nl','fr'])assert.ok(Object.hasOwn(f.context.catalogs[language],value)||/^\d+ (plates|places)$/.test(value),language+' missing: '+value);
  }
});
test('backend member errors have Dutch and French translations',()=>{
  const {catalogs}=fixture().context,handler=fs.readFileSync(new URL('../supabase/functions/invite-member/handler.mjs',import.meta.url),'utf8');
  for(const [,message]of handler.matchAll(/error: "([^"]+)"/g)){
    if(message==='Method not allowed')continue;
    for(const language of ['nl','fr'])assert.ok(Object.hasOwn(catalogs[language],message),language+': '+message);
  }
});
test('regional French browser preference and persisted choices are respected',()=>{
  for(const [options,expected]of [[{browser:'fr-BE'},'fr'],[{browser:'nl-BE'},'nl'],[{browser:'de-DE'},'en'],[{saved:'nl',browser:'fr-FR'},'nl'],[{saved:'invalid'},'en'],[{unavailable:true,browser:'fr-BE'},'fr']]){
    const f=fixture(options);f.callbacks.DOMContentLoaded();assert.equal(f.document.documentElement.lang,expected);
    assert.match(f.callbacks.menu,/<option value="fr">Français<\/option>/);
  }
});
test('switching languages updates static and dynamic copy, attributes and metadata without translating user data',()=>{
  const f=fixture();
  const node=(text,skip=false)=>({nodeValue:text,parentElement:{closest(){return skip;}}});
  f.nodes.push(node('Sign in'),node('Change name',true));
  const attr={placeholder:'Where did you eat?','aria-label':'Sauce rating'};
  f.fields.push({hasAttribute:key=>key in attr,getAttribute:key=>attr[key],setAttribute:(key,value)=>{attr[key]=value;}});
  f.head.push({tagName:'TITLE',textContent:'Members · Beste Belgische Bolognaise'});
  f.callbacks.DOMContentLoaded();
  for(const [lang,signIn,title]of [['fr','Se connecter','Membres'],['nl','Aanmelden','Leden'],['en','Sign in','Members'],['fr','Se connecter','Membres']]){
    f.change(lang);assert.equal(f.nodes[0].nodeValue,signIn);assert.equal(f.nodes[1].nodeValue,'Change name');assert.ok(f.head[0].textContent.startsWith(title));assert.equal(f.saved,lang);
  }
  assert.equal(attr.placeholder,'Où avez-vous mangé ?');assert.equal(attr['aria-label'],'Note de la sauce');
  f.nodes[0].nodeValue='Member deactivated. Their ratings are preserved.';f.change('fr');assert.match(f.nodes[0].nodeValue,/Membre désactivé/);
  f.change('en');assert.equal(f.nodes[0].nodeValue,'Member deactivated. Their ratings are preserved.');
});
test('counts, expansion controls and error wrappers translate in all three languages',()=>{
  const f=fixture();f.callbacks.DOMContentLoaded();
  for(const [lang,plate,plates,place,more]of [['fr','1 assiette','2 assiettes','1 lieu','Afficher plus (7)'],['nl','1 bord','2 borden','1 plek','Toon meer (7)'],['en','1 plate','2 plates','1 place','Show more (7)']]){
    f.change(lang);assert.equal(f.t('1 plates'),plate);assert.equal(f.t('2 plates'),plates);assert.equal(f.t('1 places'),place);assert.equal(f.t('Show more (7)'),more);
  }
  f.change('fr');assert.equal(f.t('Save failed: Network Your entries are still here; retry.'),'Échec de l’enregistrement : Network Vos données sont conservées ; réessayez.');
  assert.equal(f.t('Sign out failed: Network'),'Échec de la déconnexion : Network');
});

test('rating filter copy, result counts and language notifications cover all languages',()=>{
  const f=fixture(),notifications=[];
  f.document.dispatchEvent=event=>notifications.push(event.type);
  f.callbacks.DOMContentLoaded();
  for(const [lang,label,count] of [['nl','Alleen mijn ratings','2 van 3 beoordelingen'],['fr','Mes évaluations uniquement','2 sur 3 évaluations'],['en','Only my ratings','2 of 3 ratings']]){
    f.change(lang);
    assert.equal(f.context.window.UI.language,lang);
    assert.equal(f.t('Only my ratings'),label);
    assert.equal(f.t('{shown} of {total} ratings').replace('{shown}',2).replace('{total}',3),count);
  }
  assert.deepEqual(notifications,['languagechange','languagechange','languagechange']);
});
