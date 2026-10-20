/* One private, compressed photo per rating. No originals or persistent URL cache. */
(() => {
  const MAX_INPUT=10000000, MAX_STORED=300000, TARGET=200000;
  const $=s=>document.querySelector(s), t=s=>window.UI?.t(s)||s;
  let selected=null, existing=null, remove=false, previewUrl=null, generation=0, processing=false, observer=null, authGeneration=0;
  const urls=new Map();
  function validate(file){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPEG, PNG or WebP photo.');
    if(!file.size||file.size>MAX_INPUT)throw Error('Choose a photo smaller than 10 MB.');
  }
  function dimensions(width,height,max=1200){const scale=Math.min(1,max/Math.max(width,height));return [Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale))];}
  async function compress(file){
    validate(file);
    // Browser decoding applies EXIF orientation; a new canvas encoding strips
    // source EXIF/GPS metadata. JPEG gives a predictable cross-browser fallback.
    let bitmap;
    try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});}
    catch{throw Error('Could not process this photo. Choose another photo.');}
    try{
      if(!bitmap.width||!bitmap.height||bitmap.width*bitmap.height>60000000)throw Error('This photo is too large to process. Choose a smaller photo.');
      const canvas=document.createElement('canvas');
      [canvas.width,canvas.height]=dimensions(bitmap.width,bitmap.height);
      const ctx=canvas.getContext('2d');
      if(!ctx)throw Error('Photo processing is unavailable in this browser.');
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      let blob;
      for(const quality of [.85,.75,.65,.55,.45]){
        blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
        if(!blob)throw Error('Could not process this photo. Choose another photo.');
        if(blob.size<=TARGET)break;
      }
      if(blob.size>MAX_STORED)throw Error('This photo could not be made small enough. Choose another photo.');
      return blob;
    }finally{bitmap.close();}
  }
  function releasePreview(){if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;}
  function reset(path=null,db=null){
    generation++;processing=false;selected=null;existing=path;remove=false;releasePreview();
    const input=$('#rating-photo');if(!input)return;
    input.value='';input.disabled=false;$('#remove-photo').hidden=!path;$('#remove-photo').disabled=false;
    const image=$('#photo-preview');image.removeAttribute('src');image.hidden=true;
    $('#photo-status').textContent='';
    if(path){
      $('#photo-status').textContent=t('A photo is attached. Choose another to replace it.');
      const current=generation;
      if(db)db.storage.from('rating-photos').createSignedUrl(path,300).then(result=>{
        if(current!==generation||result.error)return;
        image.src=result.data.signedUrl;image.hidden=false;
      }).catch(()=>{});
    }
  }
  function init(){
    if(!$('#rating-photo'))return;
    $('#rating-photo').onchange=async event=>{
      const file=event.target.files[0];if(!file)return;const current=++generation;
      selected=null;releasePreview();$('#photo-preview').hidden=true;processing=true;
      $('#photo-status').textContent=t('Preparing photo…');
      try{
        const blob=await compress(file);if(current!==generation)return;
        selected=blob;remove=false;previewUrl=URL.createObjectURL(blob);
        $('#photo-preview').src=previewUrl;$('#photo-preview').hidden=false;$('#remove-photo').hidden=false;
        $('#photo-status').textContent=t('Photo ready.');
      }catch(error){if(current===generation){event.target.value='';$('#photo-status').textContent=t(error.message);}}
      finally{if(current===generation)processing=false;}
    };
    $('#remove-photo').onclick=()=>{generation++;processing=false;selected=null;remove=!!existing;releasePreview();$('#rating-photo').value='';$('#photo-preview').hidden=true;$('#photo-preview').removeAttribute('src');$('#remove-photo').hidden=true;$('#photo-status').textContent=t('Photo will be removed when you save.');};
  }
  function lock(value){for(const id of ['#rating-photo','#remove-photo'])if($(id))$(id).disabled=value;}
  async function persist(db,ratingId){
    if(processing)throw Error('Wait until the photo is ready.');
    const rpc=async(action,expected=null)=>{const result=await db.rpc('change_rating_photo',{target:ratingId,action,expected});if(result.error)throw result.error;return result.data;};
    if(remove){await rpc('remove',existing);return;}
    if(!selected)return;
    const path=await rpc('reserve');
    try{
      const result=await db.storage.from('rating-photos').upload(path,selected,{contentType:'image/jpeg',cacheControl:'300',upsert:false});
      if(result.error)throw result.error;
      await rpc('finish',path);
    }catch(error){
      // Never delete a possibly committed image after a lost finish response.
      // Cancel only affects the pending reservation; the durable queue retries.
      try{await rpc('cancel',path);}catch{}
      throw error;
    }
  }
  function markup(path,id){
    if(!path)return '';
    // IDs and paths originate in the database, but escape attributes regardless.
    const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    return '<button type="button" class="rating-photo-button" data-photo="'+esc(path)+'" aria-label="'+esc(t('View photo'))+'"><img class="rating-photo" width="600" height="400" loading="lazy" decoding="async" alt="'+esc(t('Photo of the rated plate'))+'" data-photo-id="'+esc(id)+'"><span class="photo-load-status">'+esc(t('Loading photo…'))+'</span></button>';
  }
  function hydrate(db,root){
    observer?.disconnect();
    const current=authGeneration;
    async function load(button){
      if(!button.isConnected)return;
      const path=button.dataset.photo,image=button.querySelector('img'),status=button.querySelector('.photo-load-status');
      let item=urls.get(path);
      if(!item||item.expires<Date.now()){
        const result=await db.storage.from('rating-photos').createSignedUrl(path,300);
        if(current!==authGeneration||!button.isConnected)return;
        if(result.error){status.textContent=t('Photo unavailable. Reload to try again.');return;}
        item={url:result.data.signedUrl,expires:Date.now()+240000};urls.set(path,item);
      }
      image.onload=()=>{status.hidden=true;};image.onerror=()=>{status.hidden=false;status.textContent=t('Photo unavailable. Reload to try again.');};image.src=item.url;
      button.onclick=()=>{
        if(!image.complete||!image.naturalWidth)return;
        let dialog=$('#photo-dialog');
        if(!dialog){dialog=document.createElement('dialog');dialog.id='photo-dialog';dialog.className='photo-dialog';const close=document.createElement('button');close.type='button';close.textContent=t('Close photo');close.onclick=()=>dialog.close();dialog.append(close,document.createElement('img'));document.body.append(dialog);dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});}
        const large=dialog.querySelector('img');large.src=image.src;large.alt=image.alt;dialog.showModal();
      };
    }
    const buttons=root.querySelectorAll('[data-photo]');
    if(!buttons.length)return;
    if(!window.IntersectionObserver){buttons.forEach(button=>void load(button));return;}
    observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);void load(entry.target);}}),{rootMargin:'150px'});
    buttons.forEach(button=>observer.observe(button));
  }
  function clear(){authGeneration++;reset();urls.clear();observer?.disconnect();const dialog=$('#photo-dialog');if(dialog){dialog.close();dialog.remove();}}
  window.RatingPhotos={init,reset,clear,lock,persist,markup,hydrate,compress,validate,dimensions,isProcessing:()=>processing};
})();
