// Run with Playwright available (NODE_PATH may point to an external test install).
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.hostname!=='fixture.local')return route.fulfill({body:'',contentType:u.pathname.endsWith('.css')?'text/css':'text/javascript'});
   const file=u.pathname==='/'?'index.html':u.pathname==='/ratings-overview'?'ratings-overview.html':u.pathname.slice(1);
   if(file==='pwa.js')return route.fulfill({body:'',contentType:'text/javascript'});
   if(file==='runtime-config.js')return route.fulfill({body:'window.APP_CONFIG={supabaseUrl:"https://fixture.local",supabaseAnonKey:"test",groupId:"group"};',contentType:'text/javascript'});
   if(!fs.existsSync(path.join(root,file)))return route.fulfill({status:404,body:''});
   return route.fulfill({body:fs.readFileSync(path.join(root,file)),contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript'});
  });
  await page.addInitScript(()=>{
   localStorage.setItem('bbb-language','en');
   const restaurant={id:'place',name:'Pasta house',address:'Brussels',latitude:null,longitude:null};
   window.rows=[];window.uploads=[];window.rpcCalls=[];
   const storage={upload:async(path,blob,options)=>{
    if(window.failUpload)return {error:{message:'fixture upload failure'}};
    const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';bytes.forEach(x=>binary+=String.fromCharCode(x));
    window.photoURL='data:image/jpeg;base64,'+btoa(binary);window.uploads.push({path,size:blob.size,type:blob.type,options});return {data:{path}};
   },createSignedUrl:async()=>({data:{signedUrl:window.photoURL}})};
   const db={auth:{onAuthStateChange(){},getSession:async()=>({data:{session:{user:{id:'me'}}}}),signOut:async()=>({})},storage:{from:()=>storage},rpc:async(name,args)=>{
    window.rpcCalls.push(args.action);const r=window.rows.find(r=>r.id===args.target);
    if(args.action==='reserve')return {data:r.id+'/'+crypto.randomUUID()+'.jpg'};
    if(args.action==='finish')r.rating_photos={path:args.expected};
    if(args.action==='remove')r.rating_photos=null;
    return {data:args.expected};
   },from(table){const q={mode:null,select(){return q;},eq(k,v){(q.filters??=[]).push([k,v]);return q;},ilike(){return q;},order(){return Promise.resolve(q.result());},maybeSingle(){return Promise.resolve({data:restaurant});},single(){return Promise.resolve(q.result(true));},insert(data){q.mode='insert';q.write=data;return q;},update(data){q.mode='update';q.write=data;return q;},delete(){q.mode='delete';return q;},result(single=false){
    if(q.mode==='insert'){const r={...q.write,id:crypto.randomUUID(),restaurants:restaurant};window.rows.unshift(r);return {data:r};}
    if(q.mode==='update'){const r=window.rows.find(r=>r.id===q.filters.find(([k])=>k==='id')[1]);Object.assign(r,q.write);return {data:r};}
    if(q.mode==='delete'){window.rows=window.rows.filter(r=>r.id!==q.filters.find(([k])=>k==='id')[1]);return {data:[]};}
    const data=table==='group_members'?[{user_id:'me',role:'member',display_name:'Tester',active:true}]:table==='restaurants'?[restaurant]:window.rows;
    return {data:single?data[0]:data};
   },then(resolve,reject){return Promise.resolve(q.result()).then(resolve,reject);}};return q;}};
   window.supabase={createClient:()=>db};
  });
  await page.goto('https://fixture.local/');await page.waitForSelector('#application:not([hidden])');
  const image=await page.evaluate(async()=>{
   const c=document.createElement('canvas');c.width=2400;c.height=1800;const x=c.getContext('2d');x.fillStyle='tomato';x.fillRect(0,0,c.width,c.height);x.fillStyle='yellow';x.font='200px sans-serif';x.fillText('Photo test',100,500);
   return c.toDataURL('image/png').split(',')[1];
  });
  const upload=()=>page.locator('#rating-photo').setInputFiles({name:'plate.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
  await page.locator('[name=restaurant]').fill('Pasta house');await page.locator('[name=date]').fill('2026-10-19');
  for(const k of ['sauce','texture','portion'])await page.locator('[data-score='+k+'] [data-value="4"]').click();
  await page.locator('[name=comment]').fill('Keep my comment');
  await upload();await page.waitForFunction(()=>document.querySelector('#photo-status').textContent==='Photo ready.');
  const preview=await page.locator('#photo-preview').evaluate(i=>({width:i.naturalWidth,height:i.naturalHeight}));assert.deepEqual(preview,{width:1200,height:900});
  await page.evaluate(()=>window.failUpload=true);await page.locator('#rating-form [type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#save-status').textContent.startsWith('Rating saved, but'));
  assert.equal(await page.evaluate(()=>window.rows.length),1);assert.equal(await page.locator('[name=comment]').inputValue(),'Keep my comment');
  await page.evaluate(()=>window.failUpload=false);await page.locator('#rating-form [type=submit]').click();
  await page.waitForSelector('.rating-photo');await page.locator('.rating-photo').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.rating-photo').naturalWidth===1200);
  const state=await page.evaluate(()=>({count:window.rows.length,upload:window.uploads[0],calls:window.rpcCalls}));assert.equal(state.count,1);assert.ok(state.upload.size<=300000);assert.equal(state.upload.type,'image/jpeg');assert.equal(state.upload.options.upsert,false);assert.deepEqual(state.calls,['reserve','cancel','reserve','finish']);
  await page.locator('.rating-photo-button').click();await page.waitForSelector('#photo-dialog[open]');await page.keyboard.press('Escape');
  await page.screenshot({path:path.join(root,'validation/rating-photos-mobile.png'),fullPage:true});
  await page.locator('[data-edit]').click();await page.locator('#remove-photo').click();await page.locator('#rating-form [type=submit]').click();await page.waitForFunction(()=>!document.querySelector('.rating-photo'));
  assert.equal(await page.evaluate(()=>window.rows.length),1);assert.equal(await page.evaluate(()=>window.rows[0].rating_photos),null);
  await page.locator('[data-edit]').click();await page.locator('#rating-photo').setInputFiles({name:'broken.jpg',mimeType:'image/jpeg',buffer:Buffer.from('invalid image')});await page.waitForFunction(()=>document.querySelector('#photo-status').textContent==='Could not process this photo. Choose another photo.');
  await upload();await page.waitForFunction(()=>document.querySelector('#photo-status').textContent==='Photo ready.');await page.locator('#cancel-edit').click();assert.equal(await page.locator('#photo-preview').isVisible(),false);
  assert.deepEqual(errors,[]);console.log('Browser photo checks passed: compression, preview, upload failure/retry, single rating, dialog, removal, invalid image, cancellation.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
