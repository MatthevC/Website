/* Nagrody: tylko Supabase, bez konfliktu z domyślną listą */
(function(){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 function renderRewards(items){
  const grid=document.querySelector('.rewards-page .reward-grid');
  if(!grid)return;
  grid.innerHTML=items.map(r=>`<article class="reward-card" data-reward-card>
   <div class="reward-card-top"><div class="reward-graphic ${esc(r.icon_color||'purple')}">${esc(r.icon||'🎁')}</div><span class="reward-cost">${esc(r.cost||'')}</span></div>
   <h3>${esc(r.title)}</h3><p>${esc(r.description||'')}</p></article>`).join('');
 }
 async function load(){
  const grid=document.querySelector('.rewards-page .reward-grid');
  if(!grid||!window.supabaseClient)return;
  try{
   let {data,error}=await window.supabaseClient.from('rewards').select('*').eq('active',true).order('sort_order',{ascending:true});
   // Jeżeli baza jest pusta, nie czyścimy strony. Pozostawiamy dane statyczne z GitHuba.
   if(!error && Array.isArray(data)) renderRewards(data);
  }catch(e){console.error(e)}
 }
 const oldRender=window.render;
 if(typeof oldRender==='function') window.render=async function(){const r=await oldRender.apply(this,arguments);setTimeout(load,100);return r};
 document.addEventListener('DOMContentLoaded',()=>setTimeout(load,500));
})();
