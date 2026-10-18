(() => {
  const config=window.APP_CONFIG||{};
  const $=selector=>document.querySelector(selector);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const average=rating=>(Number(rating.sauce)+Number(rating.texture)+Number(rating.portion))/3;
  let db,map,activeUser=null,generation=0;
  const pins=new Map();
  function clear(){
    generation++;
    $('#application').hidden=true;
    $('#account-controls').hidden=true;
    $('#ratings-list').replaceChildren();
    $('#stat-count').textContent='0';
    $('#stat-average').textContent='—';
    $('#list-count').textContent='0 plates';
    $('#map-count').textContent='0 places';
    pins.forEach(pin=>pin.remove());pins.clear();
  }
  function render(rows,names){
    $('#stat-count').textContent=rows.length;
    $('#list-count').textContent=rows.length+' plates';
    $('#stat-average').textContent=rows.length?(rows.reduce((sum,r)=>sum+average(r),0)/rows.length).toFixed(1):'—';
    $('#ratings-list').innerHTML=rows.map(r=>{
      const restaurant=r.restaurants||{};
      return '<article class="rating-card"><div class="card-top"><div><div class="card-name" data-i18n-skip>'+esc(restaurant.name)+'</div><div class="card-date"><span data-i18n-skip>'+esc(r.visited_on)+' · '+esc(names.get(r.created_by)||'Member')+'</span></div><div class="card-location" data-i18n-skip>'+esc(restaurant.address)+'</div></div><div class="card-score">'+average(r).toFixed(1)+'<small> / 5</small></div></div><div class="score-summary"><span>Sauce <b>'+r.sauce+'/5</b></span><span>Texture <b>'+r.texture+'/5</b></span><span>Portion <b>'+r.portion+'/5</b></span></div>'+ (restaurant.latitude!=null&&restaurant.longitude!=null?'<div class="card-actions"><button type="button" class="card-action-button" data-map="'+esc(r.restaurant_id)+'">Show on map</button></div>':'')+'</article>';
    }).join('')||'<div class="empty-state"><strong>No ratings yet.</strong></div>';
    const places=new Map();
    rows.forEach(r=>{if(r.restaurants?.latitude==null||r.restaurants?.longitude==null)return;if(!places.has(r.restaurant_id))places.set(r.restaurant_id,[]);places.get(r.restaurant_id).push(r);});
    $('#map-count').textContent=places.size+' places';
    if(!map&&window.L){
      map=L.map('belgium-map',{scrollWheelZoom:false}).setView([50.65,4.65],8);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
    }
    pins.forEach(pin=>pin.remove());pins.clear();
    if(map){
      places.forEach((ratings,id)=>{
        const restaurant=ratings[0].restaurants;
        const popup=document.createElement('div');
        popup.textContent=restaurant.name+' · '+(restaurant.address||'')+' — '+ratings.map(r=>(names.get(r.created_by)||'Member')+': '+average(r).toFixed(1)+'/5').join(' · ');
        const pin=L.marker([restaurant.latitude,restaurant.longitude]).addTo(map).bindPopup(popup);
        pins.set(id,pin);
      });
      map.invalidateSize();
    }else $('#map-help').textContent='The map could not load. You can still browse the ratings above.';
  }
  async function load(session){
    const current=++generation;
    activeUser=session.user.id;
    const members=await db.from('group_members').select('user_id,role,display_name,active').eq('group_id',config.groupId);
    if(current!==generation)return;
    if(members.error)throw Error('Could not load group ratings. Reload and try again.');
    const member=members.data.find(m=>m.user_id===session.user.id&&m.active!==false);
    if(!member)throw Error('This account is not in this group. Ask the owner for an invitation.');
    const result=await db.from('ratings').select('*,restaurants(name,address,latitude,longitude)').eq('group_id',config.groupId).order('visited_on',{ascending:false});
    if(current!==generation)return;
    if(result.error)throw Error('Could not load group ratings. Reload and try again.');
    $('#account-name').textContent=member.display_name;
    window.ProfileMenu?.mount({db,groupId:config.groupId,userId:session.user.id,name:member.display_name,onSaved:()=>load(session)});
    $('#overview-members').hidden=member.role!=='owner';
    $('#account-controls').hidden=false;
    $('#application').hidden=false;
    $('#overview-status').textContent='';
    render(result.data,new Map(members.data.map(m=>[m.user_id,m.display_name])));
  }
  async function boot(){
    if(!config.supabaseUrl||!config.supabaseAnonKey||!config.groupId||!window.supabase)throw Error('The app could not connect. Reload and try again.');
    db=window.supabase.createClient(config.supabaseUrl,config.supabaseAnonKey);
    db.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT'||(activeUser&&session&&activeUser!==session.user.id)){clear();location.replace('/?next=ratings-overview');}
    });
    $('#sign-out').onclick=async()=>{clear();const result=await db.auth.signOut();if(result.error)$('#overview-status').textContent='Sign out failed. Try again.';};
    document.addEventListener('click',event=>{if(!$('#account-controls').contains(event.target))$('#account-controls').open=false;});
    $('#ratings-list').onclick=event=>{
      const button=event.target.closest('[data-map]');if(!button)return;
      const pin=pins.get(button.dataset.map);if(!pin)return;
      $('#belgium-map').scrollIntoView({behavior:'smooth',block:'center'});$('#belgium-map').focus({preventScroll:true});map.setView(pin.getLatLng(),14);pin.openPopup();
    };
    const {data:{session},error}=await db.auth.getSession();
    if(error)throw error;
    if(!session){location.replace('/?next=ratings-overview');return;}
    await load(session);
  }
  document.addEventListener('DOMContentLoaded',()=>boot().catch(error=>{clear();$('#overview-status').textContent=error.message;}));
})();
