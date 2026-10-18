const C=window.APP_CONFIG||{},extras=[['cheese','Enough cheese'],['hotSauce','Hot sauce'],['gratinated','Gratinated'],['location','Great location'],['hospitality','Warm hospitality']];
let db,user,member,ratings=[],map,choosing=false,editing=null,busy=false,passwordSetupPending=['invite','recovery'].includes(new URLSearchParams(location.hash.slice(1)).get('type'))||['invite','recovery'].includes(new URLSearchParams(location.search).get('auth')),scores={sauce:0,texture:0,portion:0},pins=new Map(),temporaryMarkers=[],places=[],showAllRatings=false,geoSelected=false,placeRequest=0;
const $=s=>document.querySelector(s),esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),say=(s,m)=>$(s).textContent=m,avg=r=>(+r.sauce+ +r.texture+ +r.portion)/3;
function scoresInit(){document.querySelectorAll('.score-options').forEach(g=>{let k=g.dataset.score;g.innerHTML=[1,2,3,4,5].map(n=>'<button class="score-button" type="button" role="radio" aria-checked="false" data-value="'+n+'">'+n+'</button>').join('');g.onclick=e=>{let b=e.target.closest('button');if(!b)return;scores[k]=+b.dataset.value;g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-checked',String(x===b)))}})}
function localRatingDate(date=new Date()){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
function validRatingDate(value,today=localRatingDate()){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||value>today)return false;
  const parsed=new Date(value+'T12:00:00');
  return !Number.isNaN(parsed.getTime())&&localRatingDate(parsed)===value;
}
function clearDraftMarkers(){temporaryMarkers.forEach(marker=>marker.remove());temporaryMarkers=[];}
function resetDraftLocation(){
  choosing=false;geoSelected=false;placeRequest++;places=[];
  clearDraftMarkers();
  const form=$('#rating-form');
  if(form){form.elements.lat.value='';form.elements.lng.value='';}
  $('#choose-location').hidden=false;
  $('#choose-location').textContent='Choose spot on map';
  say('#pin-status','No map pin selected');
  $('#place-suggestions').replaceChildren();$('#place-suggestions').hidden=true;
  $('#address-input').setAttribute('aria-expanded','false');
}
function setDraftPin(lat,lng,fromGeo=false){
  if(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng)))return;
  clearDraftMarkers();
  const form=$('#rating-form');form.elements.lat.value=lat;form.elements.lng.value=lng;
  geoSelected=fromGeo;choosing=false;
  $('#choose-location').hidden=fromGeo;
  $('#choose-location').textContent='Move map pin';
  say('#pin-status',fromGeo?'Location selected from search':'Pin selected. You can move it on the map.');
  if(!map)return;
  const marker=L.marker([lat,lng],{draggable:!fromGeo}).addTo(map);
  if(!fromGeo)marker.on('dragend',()=>{const point=marker.getLatLng();form.elements.lat.value=point.lat;form.elements.lng.value=point.lng;});
  temporaryMarkers.push(marker);
}
function mapInit(){
  if(!window.L){say('#pin-status','The map could not load. You can still enter the address manually.');return;}
  map=L.map('belgium-map',{scrollWheelZoom:false}).setView([50.65,4.65],8);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
  map.on('click',event=>{if(choosing&&!geoSelected)setDraftPin(event.latlng.lat,event.latlng.lng);});
}
async function searchPlaces(event){
  ++placeRequest;const text=event.target.value.trim(),key=C.geoapifyApiKey;
  if(geoSelected)resetDraftLocation();
  const current=placeRequest;
  places=[];$('#place-suggestions').replaceChildren();$('#place-suggestions').hidden=true;$('#address-input').setAttribute('aria-expanded','false');
  if(text.length<3||!key)return;
  try{
    const params=new URLSearchParams({text,filter:'countrycode:be',format:'json',limit:'5',apiKey:key});
    const response=await fetch('https://api.geoapify.com/v1/geocode/autocomplete?'+params);
    if(!response.ok)throw Error('Place search failed');
    const result=await response.json();if(current!==placeRequest)return;
    places=result.results||[];
    $('#place-suggestions').innerHTML=places.map((place,index)=>'<button type="button" class="place-suggestion" role="option" aria-selected="false" data-place="'+index+'"><strong data-i18n-skip>'+esc(place.name||place.address_line1||place.formatted)+'</strong><span data-i18n-skip>'+esc(place.formatted)+'</span></button>').join('');
    $('#place-suggestions').hidden=!places.length;$('#address-input').setAttribute('aria-expanded',String(!!places.length));
  }catch{if(current===placeRequest)say('#place-search-status','Location search is unavailable. Enter an address and choose a spot on the map.');}
}
function selectPlace(event){
  const button=event.target.closest('[data-place]');if(!button)return;
  const place=places[button.dataset.place];if(!place||!Number.isFinite(place.lat)||!Number.isFinite(place.lon))return;
  placeRequest++;$('#address-input').value=place.formatted;setDraftPin(place.lat,place.lon,true);
  if(map)map.setView([place.lat,place.lon],15);
  places=[];$('#place-suggestions').replaceChildren();$('#place-suggestions').hidden=true;$('#address-input').setAttribute('aria-expanded','false');
}
function chooseMapLocation(){
  if(geoSelected)return;
  if(!map){say('#pin-status','The map is unavailable. Enter the address manually.');return;}
  choosing=true;say('#pin-status','Tap the map to drop a pin');$('#belgium-map').scrollIntoView({behavior:'smooth'});
}
function paint(){
  const ownRatings=ratings.filter(r=>r.created_by===user.id);
  let n=ownRatings.length;
  $('#stat-count').textContent=n;
  $('#list-count').textContent=n+' plates';
  $('#stat-average').textContent=n?(ownRatings.reduce((s,r)=>s+avg(r),0)/n).toFixed(1):'—';
  let mapped=ownRatings.filter(r=>r.lat!=null&&r.lng!=null);
  $('#map-count').textContent=new Set(mapped.map(r=>r.restaurant_id)).size+' places';
  let sorted=[...ownRatings].sort((a,b)=>b.date.localeCompare(a.date));
  let visible=showAllRatings?sorted:sorted.slice(0,3);
  $('#ratings-list').innerHTML=visible.map(r=>'<article class="rating-card"><div class="card-top"><div><div class="card-name">'+esc(r.name)+'</div><div class="card-date">'+esc(r.date)+' · '+esc(r.author)+'</div><div class="card-location">'+esc(r.address)+'</div></div><div class="card-score">'+avg(r).toFixed(1)+'<small> / 5</small></div></div><div class="score-summary"><span>Sauce <b>'+r.sauce+'/5</b></span><span>Texture <b>'+r.texture+'/5</b></span><span>Portion <b>'+r.portion+'/5</b></span></div><div class="tag-list">'+extras.filter(x=>r[x[0]]).map(x=>'<span class="tag">'+x[1]+'</span>').join('')+'</div><div class="card-actions">'+(r.lat!=null?'<button type="button" class="card-action-button" data-map="'+r.restaurant_id+'">Show on map</button>':'')+(r.created_by===user.id?'<button type="button" class="card-action-button" data-edit="'+r.id+'">Edit</button><button type="button" class="delete-button" data-delete="'+r.id+'">Remove</button>':member.role==='owner'?'<button type="button" class="delete-button" data-delete="'+r.id+'">Remove</button>':'')+'</div></article>').join('')||'<div class="empty-state"><strong>Your first plate awaits.</strong></div>';
  if(sorted.length>3)$('#ratings-list').insertAdjacentHTML('beforeend','<button type="button" class="show-more-button" data-show-more aria-expanded="'+showAllRatings+'">'+(showAllRatings?'Show less':'Show more ('+(sorted.length-3)+')')+'</button>');
  paintPins(mapped)
}function paintPins(list){if(!map)return;pins.forEach(x=>x.remove());pins.clear();let groups=new Map();list.forEach(r=>{if(!groups.has(r.restaurant_id))groups.set(r.restaurant_id,[]);groups.get(r.restaurant_id).push(r)});groups.forEach((rs,id)=>{let r=rs[0],m=L.marker([r.lat,r.lng]).addTo(map);m.bindPopup('<strong>'+esc(r.name)+'</strong><br>'+esc(r.address)+'<br>'+rs.map(x=>esc(x.author)+' '+avg(x).toFixed(1)+'/5').join('<br>'));pins.set(id,m)})}
async function load(){say('#save-status','Loading shared ratings…');let a=await db.from('restaurants').select('*').eq('group_id',C.groupId),b=await db.from('group_members').select('user_id,role,display_name,active').eq('group_id',C.groupId);if(a.error)throw a.error;if(b.error)throw b.error;member=b.data.find(x=>x.user_id===user.id&&x.active!==false);if(!member)throw Error('This account is not in this group. Ask the owner for an invitation.');$('#account-name').textContent=member.display_name;window.ProfileMenu?.mount({db,groupId:C.groupId,userId:user.id,name:member.display_name,onSaved:load});$('#invite-friend').hidden=member.role!=='owner';let q=await db.from('ratings').select('*,restaurants(name,address,latitude,longitude)').eq('group_id',C.groupId).eq('created_by',user.id).order('visited_on',{ascending:false});if(q.error)throw q.error;let names=new Map(b.data.map(x=>[x.user_id,x.display_name]));ratings=q.data.map(x=>({id:x.id,restaurant_id:x.restaurant_id,name:x.restaurants.name,address:x.restaurants.address,lat:x.restaurants.latitude,lng:x.restaurants.longitude,date:x.visited_on,sauce:x.sauce,texture:x.texture,portion:x.portion,cheese:x.enough_cheese,hotSauce:x.hot_sauce,gratinated:x.gratinated,location:x.great_location,hospitality:x.hospitality,created_by:x.created_by,author:names.get(x.created_by)||'Member'}));paint();say('#save-status','Ratings are shared with your group.')}
function clearMemberData(){resetDraftLocation();ratings=[];member=null;showAllRatings=false;choosing=false;editing=null;if($('#ratings-list'))$('#ratings-list').replaceChildren();if($('#stat-count'))$('#stat-count').textContent='0';if($('#list-count'))$('#list-count').textContent='0 plates';if($('#stat-average'))$('#stat-average').textContent='—';if($('#map-count'))$('#map-count').textContent='0 places';if($('#account-name'))$('#account-name').textContent='Account';if($('#rating-form')){$('#rating-form').reset();$('#rating-form').elements.lat.value='';$('#rating-form').elements.lng.value=''}scores={sauce:0,texture:0,portion:0};document.querySelectorAll('.score-button').forEach(x=>x.setAttribute('aria-checked','false'));places=[];if($('#place-suggestions')){$('#place-suggestions').replaceChildren();$('#place-suggestions').hidden=true}if(map){pins.forEach(x=>x.remove());pins.clear();temporaryMarkers.forEach(x=>x.remove());temporaryMarkers=[]}sessionStorage.removeItem('bbb-submit-key')}
function showLogin(){
  $('#application').hidden=true;
  $('#auth-panel').hidden=false;
  $('#account-controls').hidden=true;
  $('#login-form').hidden=false;
  $('#forgot-password').hidden=false;
  $('#activate-form')?.remove();
  $('#auth-panel h1').textContent='Sign in';
}
function showPasswordSetup(){
  $('#application').hidden=true;
  $('#auth-panel').hidden=false;
  $('#account-controls').hidden=!user||!member;
  $('#login-form').hidden=true;
  $('#forgot-password').hidden=true;
  $('#auth-panel h1').textContent='Set new password';
  let form=$('#activate-form');
  if(!form){
    $('#auth-panel').insertAdjacentHTML('beforeend','<form id="activate-form"><label class="field">Choose a password<input name="password" type="password" minlength="8" required autocomplete="new-password"></label><button class="submit-button" disabled>Set new password</button></form>');
    form=$('#activate-form');
    form.onsubmit=async event=>{
      event.preventDefault();
      const button=form.querySelector('button');
      button.disabled=true;
      say('#auth-status','Saving your password…');
      try{
        const result=await db.auth.updateUser({password:new FormData(form).get('password')});
        if(result.error)throw result.error;
        passwordSetupPending=false;
        history.replaceState(null,'',location.pathname);
        form.remove();
        say('#auth-status','Password updated. Signing you in…');
        show({user:result.data.user||user},false);
      }catch(error){say('#auth-status',error.message);button.disabled=false;}
    };
  }
  form.querySelector('button').disabled=!user;
}
let passwordMenuGeneration=0;
async function loadPasswordMenu(){
  const currentUser=user, generation=++passwordMenuGeneration;
  if(!currentUser)return;
  try{
    const result=await db.from('group_members').select('role,display_name,active').eq('group_id',C.groupId).eq('user_id',currentUser.id).maybeSingle();
    if(generation!==passwordMenuGeneration||!passwordSetupPending||user?.id!==currentUser.id||!$('#activate-form'))return;
    if(result.error||!result.data||result.data.active===false){$('#account-controls').hidden=true;return;}
    member=result.data;
    $('#account-name').textContent=member.display_name;
    $('#invite-friend').hidden=member.role!=='owner';
    window.ProfileMenu?.mount({db,groupId:C.groupId,userId:currentUser.id,name:member.display_name,onSaved:loadPasswordMenu});
    $('#account-controls').hidden=false;
  }catch{if(generation===passwordMenuGeneration&&passwordSetupPending)$('#account-controls').hidden=true;}
}
function show(s,recovery){
  if(user&&user.id!==s.user.id)clearMemberData();
  user=s.user;
  if(recovery)passwordSetupPending=true;
  if(passwordSetupPending){showPasswordSetup();void loadPasswordMenu();return;}
  $('#activate-form')?.remove();
  $('#application').hidden=false;
  $('#auth-panel').hidden=true;
  $('#account-controls').hidden=false;
  load().then(()=>{const next=new URLSearchParams(location.search).get('next');if(next==='ratings-overview')location.replace('/ratings-overview');else if(next==='members'&&member?.role==='owner')location.replace('/members')}).catch(error=>{showLogin();say('#auth-status',error.message);});
}
async function getRestaurant(name,address,lat,lng){let q=await db.from('restaurants').select('*').eq('group_id',C.groupId).ilike('name',name).ilike('address',address).maybeSingle();if(q.error)throw q.error;if(q.data)return q.data;let r=await db.from('restaurants').insert({group_id:C.groupId,name:name,address:address,latitude:lat,longitude:lng,created_by:user.id}).select().single();if(r.error){q=await db.from('restaurants').select('*').eq('group_id',C.groupId).ilike('name',name).ilike('address',address).maybeSingle();if(q.data)return q.data;throw r.error}return r.data}
async function save(e){e.preventDefault();if(busy)return;const dateField=e.currentTarget.elements.date;dateField.max=localRatingDate();if(!validRatingDate(dateField.value)){say('#save-status','Choose a valid date that is not in the future.');dateField.focus();return;}if(Object.values(scores).some(x=>x<1||x>5)){say('#save-status','Choose all three scores first.');return}busy=true;let f=e.currentTarget,button=f.querySelector('[type=submit]'),v=new FormData(f);button.disabled=true;say('#save-status','Saving…');try{let r=await getRestaurant(String(v.get('restaurant')).trim(),String(v.get('address')||'').trim(),v.get('lat')?+v.get('lat'):null,v.get('lng')?+v.get('lng'):null),data={restaurant_id:r.id,visited_on:v.get('date'),sauce:scores.sauce,texture:scores.texture,portion:scores.portion,enough_cheese:f.elements.cheese.checked,hot_sauce:f.elements.hotSauce.checked,gratinated:f.elements.gratinated.checked,great_location:f.elements.location.checked,hospitality:f.elements.hospitality.checked},q;if(editing)q=await db.from('ratings').update(data).eq('id',editing);else{let key=sessionStorage.getItem('bbb-submit-key');if(!key){key=crypto.randomUUID();sessionStorage.setItem('bbb-submit-key',key)}q=await db.from('ratings').insert({...data,group_id:C.groupId,created_by:user.id,client_submission_id:key})}if(q.error)throw q.error;if(!editing)sessionStorage.removeItem('bbb-submit-key');editing=null;f.reset();f.elements.date.max=localRatingDate();f.elements.date.value=localRatingDate();resetDraftLocation();scores={sauce:0,texture:0,portion:0};document.querySelectorAll('.score-button').forEach(x=>x.setAttribute('aria-checked','false'));$('#cancel-edit').hidden=true;$('#form-title').textContent='Rate a plate';await load();say('#save-status','Rating saved and shared.')}catch(x){say('#save-status','Save failed: '+x.message+' Your entries are still here; retry.')}finally{busy=false;button.disabled=false}}
function boot(){let authError=new URLSearchParams(location.hash.slice(1));if(authError.has('error')){passwordSetupPending=false;say('#auth-status','That reset link expired or was already used. Enter your email and request a new link.');history.replaceState(null,'',location.pathname)}if(!C.supabaseUrl||!C.supabaseAnonKey||!C.groupId){say('#auth-status','Configure Supabase, then run npm run build.');return}db=window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey);mapInit();scoresInit();$('[name=date]').max=localRatingDate();$('[name=date]').value=localRatingDate();$('[name=date]').onfocus=()=>{$('[name=date]').max=localRatingDate();};$('#auth-panel').insertAdjacentHTML('beforeend','<form id="login-form"><label class="field">Email<input name="email" type="email" required></label><label class="field">Password<input name="password" type="password" required></label><button class="submit-button">Sign in</button></form><button type="button" id="forgot-password" class="auth-secondary-button">Forgot password?</button>');document.querySelector('.topbar').insertAdjacentHTML('beforeend','<details id="account-controls" class="account-menu" hidden><summary id="account-name">Account</summary><div class="account-dropdown"><a href="/">Home</a><a href="/ratings-overview">Rating overview</a><button id="invite-friend" type="button" hidden>Manage members</button><button id="change-password" type="button">Change password</button><button id="sign-out" type="button">Sign out</button></div></details>');$('#application').hidden=true;$('#auth-panel').hidden=false;$('#account-controls').hidden=true;$('#login-form').onsubmit=async e=>{e.preventDefault();let f=new FormData(e.currentTarget),r=await db.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});if(r.error)say('#auth-status',r.error.message)};$('#forgot-password').onclick=async()=>{let email=$('#login-form').elements.email.value.trim();if(!email){say('#auth-status','Enter your email above first.');$('#login-form').elements.email.focus();return}say('#auth-status','Sending password reset email…');let q=await db.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/?auth=recovery'});say('#auth-status',q.error?q.error.message:'Password reset email sent. Check your inbox and open the newest link.')};$('#invite-friend').onclick=()=>{if(member?.role==='owner')location.href='/members'};$('#change-password').onclick=()=>{$('#account-controls').open=false;show({user:user},true)};$('#sign-out').onclick=async()=>{$('#account-controls').open=false;clearMemberData();passwordSetupPending=false;showLogin();let q=await db.auth.signOut();if(q.error)say('#auth-status','Sign out failed: '+q.error.message)};document.addEventListener('click',e=>{if(!$('#account-controls').contains(e.target))$('#account-controls').open=false});if(passwordSetupPending){showPasswordSetup();say('#auth-status','Verifying your email link…');}db.auth.onAuthStateChange((e,s)=>{if(s){if(passwordSetupPending)say('#auth-status','');show(s,e==='PASSWORD_RECOVERY');}else{clearMemberData();user=null;$('#account-controls').hidden=true;if(passwordSetupPending)showPasswordSetup();else showLogin();}});db.auth.getSession().then(x=>{if(x.data.session){if(passwordSetupPending)say('#auth-status','');show(x.data.session);}else if(passwordSetupPending){passwordSetupPending=false;showLogin();say('#auth-status','This email link expired or was already used. Request a new password reset link.');}});$('#rating-form').onsubmit=save;$('#cancel-edit').onclick=()=>{editing=null;let f=$('#rating-form');f.reset();f.elements.date.max=localRatingDate();f.elements.date.value=localRatingDate();resetDraftLocation();scores={sauce:0,texture:0,portion:0};document.querySelectorAll('.score-button').forEach(x=>x.setAttribute('aria-checked','false'));$('#form-title').textContent='Rate a plate';$('#cancel-edit').hidden=true};$('#ratings-list').onclick=async e=>{let b=e.target.closest('[data-show-more]');if(b){showAllRatings=!showAllRatings;paint();return}b=e.target.closest('[data-edit]');if(b){let r=ratings.find(x=>x.id===b.dataset.edit),f=$('#rating-form');resetDraftLocation();editing=r.id;f.elements.restaurant.value=r.name;f.elements.date.value=r.date;f.elements.address.value=r.address;if(r.lat!=null&&r.lng!=null)setDraftPin(r.lat,r.lng);scores={sauce:r.sauce,texture:r.texture,portion:r.portion};for(let k of Object.keys(scores))document.querySelectorAll('[data-score="'+k+'"] button').forEach(x=>x.setAttribute('aria-checked',String(+x.dataset.value===scores[k])));extras.forEach(x=>f.elements[x[0]].checked=!!r[x[0]]);$('#form-title').textContent='Edit your rating';$('#cancel-edit').hidden=false;return}b=e.target.closest('[data-map]');if(b&&pins.has(b.dataset.map)){let mapElement=$('#belgium-map');mapElement.scrollIntoView({behavior:'smooth',block:'center'});mapElement.focus({preventScroll:true});map.setView(pins.get(b.dataset.map).getLatLng(),14);pins.get(b.dataset.map).openPopup();return}b=e.target.closest('[data-delete]');if(b&&confirm(window.UI.t('Remove rating?'))){let q=await db.from('ratings').delete().eq('id',b.dataset.delete);if(q.error)say('#save-status',q.error.message);else await load()}};$('#choose-location').onclick=chooseMapLocation;$('#address-input').oninput=searchPlaces;$('#place-suggestions').onclick=selectPlace;
  $('#address-input').onkeydown=event=>{if(event.key==='Escape'){placeRequest++;places=[];$('#place-suggestions').hidden=true;$('#address-input').setAttribute('aria-expanded','false');}else if(event.key==='ArrowDown'&&!$('#place-suggestions').hidden){event.preventDefault();$('#place-suggestions button')?.focus();}};
  $('#place-suggestions').onkeydown=event=>{const buttons=[...$('#place-suggestions').querySelectorAll('button')],index=buttons.indexOf(event.target);if(event.key==='Escape'){placeRequest++;places=[];$('#place-suggestions').hidden=true;$('#address-input').setAttribute('aria-expanded','false');$('#address-input').focus();}else if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();buttons[(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();}};
}

document.addEventListener('DOMContentLoaded',boot);
