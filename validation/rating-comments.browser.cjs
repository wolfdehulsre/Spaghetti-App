const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message)});page.setDefaultTimeout(10000);
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname!=='fixture.local')return route.fulfill({body:'',contentType:u.pathname.endsWith('.css')?'text/css':'text/javascript'});
  let path=u.pathname==='/'?'index.html':u.pathname==='/ratings-overview'?'ratings-overview.html':u.pathname.slice(1);
  if(path==='pwa.js')return route.fulfill({body:'',contentType:'text/javascript'});
  if(path==='runtime-config.js')return route.fulfill({body:'window.APP_CONFIG={supabaseUrl:"https://fixture.local",supabaseAnonKey:"test",groupId:"group"};',contentType:'text/javascript'});
  if(!fs.existsSync(root+'/'+path))return route.fulfill({status:404,body:''});
  return route.fulfill({body:fs.readFileSync(root+'/'+path),contentType:path.endsWith('.html')?'text/html':path.endsWith('.css')?'text/css':'text/javascript'});
 });
 await page.addInitScript(()=>{
  const restaurant={id:'place',name:'Pasta house',address:'Brussels',latitude:null,longitude:null};
  window.fixtureRows=[{id:'rating-1',restaurant_id:'place',created_by:'me',visited_on:'2026-10-19',sauce:4,texture:4,portion:5,comment:'Read more\n'+ 'Heerlijke pasta 🍝 met een rijke saus. '.repeat(10),restaurants:restaurant}];
  window.fixtureWrites=[];
  const db={auth:{onAuthStateChange(){},getSession:async()=>({data:{session:{user:{id:'me'}}}})},from(table){
   const q={select(){return q;},eq(){return q;},ilike(){return q;},order(){return Promise.resolve(q.result());},maybeSingle(){return Promise.resolve({data:restaurant});},insert(data){q.write=data;q.mode='insert';return q;},update(data){q.write=data;q.mode='update';return q;},result(){
    if(q.write){window.fixtureWrites.push(q.write);if(window.fixtureFail)return {error:{message:'fixture failure'}};if(q.mode==='update')Object.assign(window.fixtureRows[0],q.write);else window.fixtureRows.unshift({...q.write,id:'rating-new',restaurants:restaurant});return {error:null};}
    return {data:table==='group_members'?[{user_id:'me',role:'member',display_name:'Tester',active:true}]:table==='restaurants'?[restaurant]:window.fixtureRows,error:null};
   },then(resolve,reject){return Promise.resolve(q.result()).then(resolve,reject);}};return q;}};
  window.supabase={createClient:()=>db};
 });
 await page.goto('https://fixture.local/');
 await page.waitForSelector('.rating-comment');
 for(const [lang,label,more,less,error] of [
  ['nl','Opmerking (optioneel)','Meer lezen','Minder tonen','Je opmerking mag maximaal 500 tekens bevatten.'],
  ['fr','Commentaire (facultatif)','Lire la suite','Afficher moins','Votre commentaire ne peut pas dépasser 500 caractères.'],
  ['en','Comment (optional)','Read more','Show less','Your comment cannot exceed 500 characters.']]){
  await page.selectOption('#ui-language',lang,{force:true});
  await page.waitForFunction(label=>document.querySelector('[for="rating-comment"]').textContent===label,label);
  assert.equal(await page.locator('.comment-toggle').innerText(),more);
  assert.ok((await page.locator('.rating-comment-text').innerText()).startsWith('Read more'));
  await page.locator('.comment-toggle').click();assert.equal(await page.locator('.comment-toggle').getAttribute('aria-expanded'),'true');
  await page.waitForFunction(less=>document.querySelector('.comment-toggle').textContent===less,less);
  await page.locator('.comment-toggle').click();
  await page.fill('#rating-comment','😀'.repeat(500));assert.equal(await page.locator('#comment-count').textContent(),'500/500');assert.equal(await page.locator('#rating-comment').getAttribute('aria-invalid'),'false');
  await page.fill('#rating-comment','😀'.repeat(501));
  await page.waitForFunction(error=>document.querySelector('#comment-error').textContent===error,error);
 }
 // Editing loads and updates the same stored comment, with safe plain text rendering.
 await page.locator('[data-edit]').click();assert.match(await page.locator('#rating-comment').inputValue(),/Heerlijke pasta/);
 const safe='  <img src=x onerror=alert(1)>\nLekker 🍝  ';
 await page.fill('#rating-comment',safe);await page.locator('#rating-form [type=submit]').click();
 await page.waitForFunction(()=>window.fixtureRows[0].comment==='<img src=x onerror=alert(1)>\nLekker 🍝');
 await page.waitForSelector('.rating-comment');assert.equal(await page.locator('.rating-comment img').count(),0);assert.equal(await page.locator('.rating-comment-text').innerText(),safe.trim());
 assert.equal(await page.locator('#comment-count').textContent(),'0/500');
 // Overlong values are blocked before writing; backend failures preserve the draft.
 await page.locator('[data-edit]').click();
 await page.fill('#rating-comment','x'.repeat(501));const writes=await page.evaluate(()=>fixtureWrites.length);
 await page.locator('#rating-form [type=submit]').click();assert.equal(await page.evaluate(()=>fixtureWrites.length),writes);
 await page.fill('#rating-comment','Keep my draft');await page.evaluate(()=>window.fixtureFail=true);
 await page.locator('#rating-form [type=submit]').click();await page.waitForFunction(()=>document.querySelector('#save-status').textContent.includes('fixture failure'));assert.equal(await page.locator('#rating-comment').inputValue(),'Keep my draft');
 await page.evaluate(()=>window.fixtureFail=false);await page.fill('#rating-comment','  \n  ');await page.locator('#rating-form [type=submit]').click();
 await page.waitForFunction(()=>window.fixtureRows[0].comment===null);await page.waitForTimeout(50);assert.equal(await page.locator('.rating-comment').count(),0);
 // Create path saves normalized text as part of the rating.
 await page.fill('[name=restaurant]','Pasta house');await page.fill('#rating-comment','  New plate 🍝  ');
 for(const score of ['sauce','texture','portion'])await page.locator('[data-score='+score+'] [data-value="4"]').click();
 await page.locator('#rating-form [type=submit]').click();await page.waitForFunction(()=>window.fixtureRows[0].id==='rating-new');assert.equal(await page.evaluate(()=>fixtureRows[0].comment),'New plate 🍝');
 // Mobile card containing an unbroken maximum length comment.
 await page.evaluate(()=>{ratings[0].comment='x'.repeat(500);paint();});await page.locator('.comment-toggle').click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.evaluate(()=>{ratings[0].comment='Heerlijke bolognaise met een rijke saus en perfect gegaarde pasta.\nEen gezellige plek om samen terug te komen!';paint();});await page.selectOption('#ui-language','nl',{force:true});await page.waitForTimeout(50);await page.screenshot({path:root+'/validation/rating-comments-mobile.png',fullPage:true});
 await page.goto('https://fixture.local/ratings-overview');await page.waitForSelector('.rating-comment');
 for(const [lang,more,less] of [['nl','Meer lezen','Minder tonen'],['fr','Lire la suite','Afficher moins'],['en','Read more','Show less']]){
  await page.selectOption('#ui-language',lang,{force:true});await page.waitForFunction(more=>document.querySelector('.comment-toggle').textContent===more,more);
  await page.locator('.comment-toggle').click();await page.waitForFunction(less=>document.querySelector('.comment-toggle').textContent===less,less);await page.locator('.comment-toggle').click();
 }
 await page.setViewportSize({width:1280,height:900});await page.screenshot({path:root+'/validation/rating-comments-overview.png',fullPage:true});
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: NL/FR/EN form and cards, Unicode limits, create/edit/null/failure, safe rendering, mobile overflow, overview expansion.');
})().catch(e=>{console.error(e);process.exit(1)});
