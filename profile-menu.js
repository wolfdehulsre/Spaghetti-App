(() => {
  const $=selector=>document.querySelector(selector);
  let current=null,dialog=null,busy=false,watchedDb=null;
  async function saveName(db,groupId,userId,value){
    const name=String(value).trim();
    if(!name||name.length>80)throw Error('Enter a name between 1 and 80 characters.');
    const {data:{session},error:sessionError}=await db.auth.getSession();
    if(sessionError||!session||session.user.id!==userId)throw Error('Your session expired. Sign in again.');
    const result=await db.from('group_members').update({display_name:name}).eq('group_id',groupId).eq('user_id',userId).select('display_name').single();
    if(result.error||!result.data)throw Error('Your name could not be saved. Try again.');
    return result.data.display_name;
  }
  function close(){if(dialog?.open)dialog.close();if($('#profile-name'))$('#profile-name').value='';if($('#profile-status'))$('#profile-status').textContent='';}
  function mount(options){
    if(current&&current.userId===options.userId&&current.db===options.db)Object.assign(current,options);else current=options;
    if(watchedDb!==options.db){
      watchedDb=options.db;
      options.db.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||(session&&current&&session.user.id!==current.userId)){current=null;close();}});
    }
    if($('#change-display-name'))return;
    $('#account-controls .account-dropdown').insertAdjacentHTML('afterbegin','<button type="button" id="change-display-name">Change name</button>');
    document.body.insertAdjacentHTML('beforeend','<dialog id="profile-dialog" class="profile-dialog" aria-labelledby="profile-title"><form id="profile-form"><h2 id="profile-title">Change your name</h2><p>This name appears next to your ratings.</p><label class="field" for="profile-name">Display name</label><input id="profile-name" class="profile-name-input" type="text" maxlength="80" required autocomplete="nickname"><p id="profile-status" role="status" aria-live="polite"></p><div class="profile-actions"><button id="profile-cancel" type="button">Cancel</button><button id="profile-save" type="submit">Save name</button></div></form></dialog>');
    dialog=$('#profile-dialog');
    $('#change-display-name').onclick=()=>{
      if(!current||busy)return;
      $('#account-controls').open=false;
      $('#profile-name').value=current.name;
      $('#profile-status').textContent='';dialog.showModal();$('#profile-name').focus();$('#profile-name').select();
    };
    $('#profile-cancel').onclick=close;
    dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
    dialog.addEventListener('close',()=>{$('#profile-name').value='';});
    $('#profile-form').onsubmit=async event=>{
      event.preventDefault();if(busy||!current)return;
      busy=true;const options=current;
      $('#profile-save').disabled=true;$('#profile-cancel').disabled=true;
      $('#profile-status').textContent='Saving your name…';
      try{
        const name=await saveName(options.db,options.groupId,options.userId,$('#profile-name').value);
        if(current!==options)return;
        options.name=name;$('#account-name').textContent=name;
        close();
        try{await options.onSaved?.();}catch{location.reload();}
      }catch(error){if(current===options)$('#profile-status').textContent=error.message;}
      finally{busy=false;$('#profile-save').disabled=false;$('#profile-cancel').disabled=false;}
    };
  }
  window.ProfileMenu={mount,saveName};
})();
