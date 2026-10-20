import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../rating-navigation.js',import.meta.url),'utf8');
for(const hidden of [false,true]) {
  test(`popup targets its exact rating, initially ${hidden?'hidden':'visible'}`,()=>{
    const calls=[],classes=new Set();
    const card={classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},focus:options=>calls.push(['focus',options]),scrollIntoView:options=>calls.push(['scroll',options])};
    let visible=!hidden,cleanup;
    const context=vm.createContext({window:{matchMedia:()=>({matches:hidden})},document:{getElementById:id=>id==='rating-second'&&visible?card:null},setTimeout:fn=>{cleanup=fn;return 1;},clearTimeout(){}});
    vm.runInContext(source,context);
    const popup={};
    context.window.RatingNavigation.bind(popup,{closePopup:()=>calls.push(['close'])},()=>{visible=true;calls.push(['reveal']);});
    popup.onclick({target:{closest:()=>({dataset:{rating:'second'}})}});
    assert.equal(calls[0][0],'close');
    assert.equal(calls.some(c=>c[0]==='reveal'),hidden);
    assert.equal(calls.find(c=>c[0]==='focus')[1].preventScroll,true);
    assert.equal(calls.find(c=>c[0]==='scroll')[1].behavior,hidden?'auto':'smooth');
    assert.ok(classes.has('rating-highlight'));
    cleanup();assert.ok(!classes.has('rating-highlight'));
  });
}
