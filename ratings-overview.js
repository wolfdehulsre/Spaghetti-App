(() => {
  const config=window.APP_CONFIG||{};
  const $=selector=>document.querySelector(selector);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const average=rating=>(Number(rating.sauce)+Number(rating.texture)+Number(rating.portion))/3;
  let db,map,activeUser=null,generation=0;
  const pins=new Map();
  let allRows=[],memberNames=new Map(),ready=false;
  const defaults=()=>({q:'',member:'',score:'',from:'',to:'',sort:'newest'});
  let filters=defaults();
  const locale=()=>window.UI?.language||'en';
  const t=text=>window.UI?.t(text)||text;
  const number=value=>Number(value).toLocaleString(locale(),{minimumFractionDigits:1,maximumFractionDigits:1});
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
  const dateLabel=value=>validDate(value)?new Date(value+'T12:00:00Z').toLocaleDateString(locale(),{timeZone:'UTC'}):value;
  function normalize(values){
    const f={...defaults(),...values};
    f.q=String(f.q||'').trim();
    if(f.member!=='me'&&!memberNames.has(f.member))f.member='';
    if(!['','3','4','4.5'].includes(f.score))f.score='';
    if(!validDate(f.from))f.from='';
    if(!validDate(f.to))f.to='';
    if(f.from&&f.to&&f.from>f.to)[f.from,f.to]=[f.to,f.from];
    if(!['newest','oldest','highest','lowest','name'].includes(f.sort))f.sort='newest';
    return f;
  }
  function readURL(){
    const params=new URLSearchParams(location.search),values={};
    Object.keys(defaults()).forEach(key=>{if(params.has(key))values[key]=params.get(key);});
    filters=normalize(values);
  }
  function writeURL(replace=false){
    const params=new URLSearchParams(location.search),base=defaults();
    Object.keys(base).forEach(key=>{params.delete(key);if(filters[key]!==base[key])params.set(key,filters[key]);});
    const query=params.toString(),url=location.pathname+(query?'?'+query:'')+(location.hash||'');
    if(url!==location.pathname+location.search+(location.hash||''))history[replace?'replaceState':'pushState'](null,'',url);
  }
  function selectRows(rows,f){
    const search=f.q.toLocaleLowerCase(locale());
    const selected=rows.filter(r=>{
      const restaurant=r.restaurants||{};
      return (!search||(restaurant.name+' '+(restaurant.address||'')).toLocaleLowerCase(locale()).includes(search))&&
        (!f.member||r.created_by===(f.member==='me'?activeUser:f.member))&&
        (!f.score||average(r)>=Number(f.score))&&(!f.from||r.visited_on>=f.from)&&(!f.to||r.visited_on<=f.to);
    });
    const recent=(a,b)=>String(b.visited_on).localeCompare(String(a.visited_on));
    const collator=new Intl.Collator(locale(),{sensitivity:'base',numeric:true});
    return selected.sort((a,b)=>{
      let order=0;
      if(f.sort==='highest')order=average(b)-average(a);
      else if(f.sort==='lowest')order=average(a)-average(b);
      else if(f.sort==='name')order=collator.compare(a.restaurants?.name||'',b.restaurants?.name||'');
      else if(f.sort==='oldest')order=-recent(a,b);
      return order||recent(a,b)||String(a.id).localeCompare(String(b.id));
    });
  }
  function update(){
    if(!ready)return;
    render(selectRows(allRows,filters),memberNames,allRows.length);
    Object.keys(filters).forEach(key=>{if(key!=='q'||document.activeElement!==$('#filter-q'))$('#filter-'+key).value=filters[key];});
    // Options are excluded from automatic translation unless explicitly marked as UI copy.
    $('#filter-score').querySelector('[value="4.5"]').textContent=number(4.5)+'+';
    const labels={q:'Search ratings',member:'Reviewer',score:'Minimum average score',from:'From date',to:'To date'};
    $('#active-filters').innerHTML=Object.keys(labels).filter(key=>filters[key]).map(key=>{
      let value=filters[key];
      if(key==='member')value=value==='me'?t('Only my ratings'):memberNames.get(value);
      if(key==='score')value=number(value)+'+';
      if(key==='from'||key==='to')value=dateLabel(value);
      return '<span class="filter-chip">'+esc(t(labels[key]))+': '+esc(value)+'</span>';
    }).join('');
    $('#clear-filters').hidden=!Object.keys(filters).some(key=>filters[key]!==defaults()[key]);
  }
  function resetFilters(){filters=defaults();writeURL();update();}
  function bindFilters(){
    $('#rating-controls').addEventListener('input',event=>{
      if(event.target.id!=='filter-q')return;
      filters.q=event.target.value.trim();writeURL();update();
    });
    $('#rating-controls').addEventListener('change',event=>{
      const key=event.target.id.replace('filter-','');
      if(!(key in defaults())||key==='q')return;
      filters=normalize({...filters,[key]:event.target.value});writeURL();update();
    });
    $('#rating-controls').addEventListener('click',event=>{
      const button=event.target.closest('[data-period]');if(!button)return;
      const now=new Date(),end=new Date(now.getFullYear(),now.getMonth(),now.getDate());
      const start=new Date(end);
      if(button.dataset.period==='year'){start.setMonth(0,1);}
      else {
        const day=start.getDate();start.setDate(1);start.setMonth(start.getMonth()-3);
        start.setDate(Math.min(day,new Date(start.getFullYear(),start.getMonth()+1,0).getDate()));
      }
      const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      filters={...filters,from:iso(start),to:iso(end)};writeURL();update();
    });
    $('#clear-filters').onclick=resetFilters;
    window.addEventListener('popstate',()=>{if(ready){readURL();writeURL(true);update();}});
    document.addEventListener('languagechange',update);
  }

  function clear(){
    generation++;
    ready=false;allRows=[];memberNames.clear();
    filters=defaults();
    $('#filter-member').innerHTML='<option data-i18n-option value="">All members</option><option data-i18n-option value="me">Only my ratings</option>';
    $('#active-filters').replaceChildren();
    $('#application').hidden=true;
    $('#account-controls').hidden=true;
    $('#ratings-list').replaceChildren();
    $('#stat-count').textContent='0';
    $('#stat-average').textContent='—';
    $('#list-count').textContent='0 plates';
    $('#map-count').textContent='0 places';
    new Set(pins.values()).forEach(pin=>pin.remove());pins.clear();
  }
  function render(rows,names,total=rows.length){
    $('#stat-count').textContent=rows.length;
    $('#list-count').textContent=t(total===1?'{shown} of {total} rating':'{shown} of {total} ratings').replace('{shown}',rows.length).replace('{total}',total);
    $('#stat-average').textContent=rows.length?number(rows.reduce((sum,r)=>sum+average(r),0)/rows.length):'—';
    $('#ratings-list').innerHTML=rows.map(r=>{
      const restaurant=r.restaurants||{};
      return '<article class="rating-card" id="rating-'+esc(r.id)+'" tabindex="-1"><div class="card-top"><div><div class="card-name" data-i18n-skip>'+esc(restaurant.name)+'</div><div class="card-date"><span data-i18n-skip>'+esc(dateLabel(r.visited_on))+' · '+esc(names.get(r.created_by)||t('Member'))+'</span></div><div class="card-location" data-i18n-skip>'+esc(restaurant.address)+'</div></div><div class="card-score">'+number(average(r))+'<small> / 5</small></div></div><div class="score-summary"><span>Sauce <b>'+r.sauce+'/5</b></span><span>Texture <b>'+r.texture+'/5</b></span><span>Portion <b>'+r.portion+'/5</b></span></div>'+window.RatingComments.render(r.comment,r.id)+ (restaurant.latitude!=null&&restaurant.longitude!=null?'<div class="card-actions"><button type="button" class="card-action-button" data-map="'+esc(r.restaurant_id)+'">Show on map</button></div>':'')+'</article>';
    }).join('')||(total?'<div class="empty-state"><strong>No ratings found.</strong><button type="button" data-clear-filters>Clear filters</button></div>':'<div class="empty-state"><strong>No ratings yet.</strong></div>');
    const mapped=rows.filter(r=>r.restaurants?.latitude!=null&&r.restaurants?.longitude!=null);
    const places=window.RatingNavigation.groupLocations(mapped,r=>[r.restaurants.latitude,r.restaurants.longitude]);
    $('#map-count').textContent=places.size+' places';
    if(!map&&window.L){
      map=L.map('belgium-map',{scrollWheelZoom:false}).setView([50.65,4.65],8);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
    }
    new Set(pins.values()).forEach(pin=>pin.remove());pins.clear();
    if(map){
      places.forEach(ratings=>{
        const restaurant=ratings[0].restaurants;
        const popup=document.createElement('div');
        popup.innerHTML=window.RatingNavigation.popup(ratings.map(r=>({id:r.id,name:r.restaurants.name,address:r.restaurants.address,author:names.get(r.created_by)||t('Member'),date:dateLabel(r.visited_on),score:number(average(r))})));
        const pin=L.marker([restaurant.latitude,restaurant.longitude]).addTo(map).bindPopup(popup,{maxWidth:260,maxHeight:220});
        pin.on('popupopen',()=>window.RatingNavigation.bind(pin.getPopup().getElement(),map));
        ratings.forEach(rating=>pins.set(rating.restaurant_id,pin));
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
    allRows=result.data;
    memberNames=new Map(members.data.map(m=>[m.user_id,m.display_name]));
    $('#filter-member').innerHTML='<option data-i18n-option value="">All members</option><option data-i18n-option value="me">Only my ratings</option>'+[...memberNames].sort((a,b)=>a[1].localeCompare(b[1],locale())).map(([id,name])=>'<option data-i18n-skip value="'+esc(id)+'">'+esc(name)+'</option>').join('');
    ready=true;readURL();writeURL(true);update();
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
      if(event.target.closest('[data-clear-filters]')){resetFilters();return;}
      const button=event.target.closest('[data-map]');if(!button)return;
      const pin=pins.get(button.dataset.map);if(!pin)return;
      $('#belgium-map').scrollIntoView({behavior:'smooth',block:'center'});$('#belgium-map').focus({preventScroll:true});map.setView(pin.getLatLng(),14);pin.openPopup();
    };
    bindFilters();
    const {data:{session},error}=await db.auth.getSession();
    if(error)throw error;
    if(!session){location.replace('/?next=ratings-overview');return;}
    await load(session);
  }
  document.addEventListener('DOMContentLoaded',()=>boot().catch(error=>{clear();$('#overview-status').textContent=error.message;}));
})();
