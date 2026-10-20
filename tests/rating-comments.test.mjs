import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../rating-comments.js',import.meta.url),'utf8');
function fixture(){
 const nodes=new Map(['#comment-count','#comment-error'].map(key=>[key,{textContent:'',hidden:false}]));
 const context=vm.createContext({window:{},document:{addEventListener(){},querySelector:key=>nodes.get(key)}});
 vm.runInContext(source,context);return {api:context.window.RatingComments,nodes};
}
test('500 emoji code points fit, 501 fail without truncating the draft',()=>{
 const {api,nodes}=fixture();const field={value:'😀'.repeat(500),setAttribute(key,value){this[key]=value;}};
 assert.equal(api.validate(field),true);assert.equal(nodes.get('#comment-count').textContent,'500/500');
 field.value+='😀';assert.equal(api.validate(field),false);assert.equal(field['aria-invalid'],'true');assert.equal(api.count(field.value),501);assert.equal(nodes.get('#comment-error').hidden,false);
});
test('normalization retains internal newlines, trims Unicode whitespace and stores empty as null',()=>{
 const {api}=fixture();assert.equal(api.normalize('\u00a0\t Hi\r\nthere 🍝 \ufeff'),'Hi\nthere 🍝');assert.equal(api.normalize(' \n\u00a0'),null);assert.equal(api.normalize(null),null);
});
test('safe previews do not split emoji, translate user data or create empty blocks',()=>{
 const {api}=fixture();assert.equal(api.render(null,'one'),'');assert.equal(api.render('  ','one'),'');
 const html=api.render('🍝'.repeat(181)+'<img onerror=alert(1)>','one');
 assert.match(html,/data-i18n-skip/);assert.match(html,/aria-expanded="false"/);assert.match(html,/data-comment-rest hidden/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img|\uFFFD/);
 assert.doesNotMatch(api.render('Great!','two'),/data-comment-toggle/);
});
