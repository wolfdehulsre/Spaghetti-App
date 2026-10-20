// Count Unicode code points, matching PostgreSQL char_length (an emoji sequence
// can contain several code points). Do not use HTML maxlength: it counts UTF-16.
(() => {
  const LIMIT=500;
  const errorText='Your comment cannot exceed 500 characters.';
  const count=value=>Array.from(String(value??'').replace(/\r\n?/g,'\n')).length;
  const normalize=value=>String(value??'').replace(/\r\n?/g,'\n').trim()||null;
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function update(field){
    const length=count(field.value),invalid=length>LIMIT;
    document.querySelector('#comment-count').textContent=length+'/'+LIMIT;
    field.setAttribute('aria-invalid',String(invalid));
    const error=document.querySelector('#comment-error');
    error.hidden=!invalid;
    error.textContent=invalid?errorText:'';
    return !invalid;
  }
  function render(value,id){
    if(!value?.trim())return '';
    const points=Array.from(value),lines=value.split('\n');
    const cut=Math.min(180,lines.length>3?Array.from(lines.slice(0,3).join('\n')).length:Infinity);
    // Slice by code point so previews never split a surrogate pair.
    const preview=points.slice(0,cut).join(''),long=points.length>cut;
    const key='rating-comment-'+String(id).replace(/[^a-zA-Z0-9_-]/g,'');
    return '<div class="rating-comment"><p class="rating-comment-text" id="'+key+'" data-i18n-skip>'+esc(long?preview:value)+(long?'<span data-comment-ellipsis>…</span><span data-comment-rest hidden>'+esc(points.slice(cut).join(''))+'</span>':'')+'</p>'+(long?'<button class="comment-toggle" type="button" data-comment-toggle aria-expanded="false" aria-controls="'+key+'">Read more</button>':'')+'</div>';
  }
  function toggle(button){
    const paragraph=document.getElementById(button.getAttribute('aria-controls'));
    if(!paragraph)return;
    const expanded=button.getAttribute('aria-expanded')!=='true';
    button.setAttribute('aria-expanded',String(expanded));
    paragraph.querySelector('[data-comment-rest]').hidden=!expanded;
    paragraph.querySelector('[data-comment-ellipsis]').hidden=expanded;
    button.textContent=expanded?'Show less comment':'Read more';
  }
  function initForm(form){
    const field=form.elements.comment;
    field.addEventListener('input',()=>update(field));
    form.addEventListener('reset',()=>queueMicrotask(()=>update(field)));
    update(field);
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-comment-toggle]');
    if(button)toggle(button);
  });
  window.RatingComments={count,normalize,render,update,validate:update,initForm,toggle};
})();
