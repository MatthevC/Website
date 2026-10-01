/* Rewards: single source of truth = Supabase */
(function(){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 const categories={ogolne:'OGÓLNE',dixper_bingo:'DIXPER ORAZ STREAM BOUNTY (BINGO)',dbd:'NAGRODY ZWIĄZANE Z DBD',uniwersalne:'NAGRODY UNIWERSALNE DO GIER',premium:'NAGRODY PREMIUM'};

 function extras(r){
   if(r.title==='1 vs 1') return '<div class="reward-note">Jeśli nagroda dotyczy gry, której Matt nie posiada, zwrot punktów nastąpi w ciągu 30 dni.</div>';
   if(r.title==='Zamówienie z Pyszne do 50 zł / 100 zł') return '<div class="reward-note">Koszt w Coins zależy od aktualnie dostępnego wariantu nagrody na kanale.</div>';
   if(String(r.title||'').startsWith('Dixper')) return '<p><a href="#/viewer/dixper" class="reward-inline-link">Więcej info tutaj →</a></p>';
   return '';
 }
 function card(r){
   const color=esc(r.icon_color||'');
   const family=r.family?` data-reward-family-card="${esc(r.family)}"`:'';
   return `<article class="reward-card" data-reward-card data-supabase-reward="true"${family}>
    <div class="reward-card-top"><div class="reward-graphic ${color}">${r.image?`<img class="reward-custom-image" src="${esc(r.image)}" alt="">`:esc(r.icon||'🎁')}</div><span class="reward-cost">${esc(r.cost||'')}</span></div>
    <h3>${esc(r.title||'')}</h3><p>${esc(r.description||'')}</p>${extras(r)}
   </article>`;
 }
 function findSection(category){
   const name=categories[category]||categories.ogolne;
   return [...document.querySelectorAll('.reward-group')].find(x=>x.querySelector('h2')?.textContent.trim()===name);
 }
 function clearCards(){ document.querySelectorAll('.rewards-page [data-reward-card]').forEach(x=>x.remove()); }
 function addRewards(items){
   clearCards();
   items.forEach(r=>{
     let cat=String(r.category||'ogolne').toLowerCase();
     if(cat==='bingo'||cat==='dixper') cat='dixper_bingo';
     const section=findSection(cat); if(!section) return;
     let target;
     if(cat==='dixper_bingo'){
       const rawCategory=String(r.category||'').toLowerCase();
       const family=(String(r.family||'').toLowerCase()==='dixper'||rawCategory==='dixper')?'dixper':'bingo';
       target=section.querySelector(`[data-reward-family="${family}"]`);
     } else target=section.querySelector('.reward-grid:not(.reward-grid-family)');
     if(!target) return;
     const box=document.createElement('div'); box.innerHTML=card(r); target.appendChild(box.firstElementChild);
   });
   window.dispatchEvent(new CustomEvent('rewards:loaded'));
 }
 async function load(){
   if(!window.supabaseClient || !document.querySelector('.rewards-page')) return;
   try{
     const {data,error}=await window.supabaseClient.from('rewards').select('*').eq('active',true).order('sort_order',{ascending:true});
     if(error) throw error;
     addRewards(Array.isArray(data)?data:[]);
   }catch(e){ console.error('Rewards Supabase:',e); }
 }
 function scheduleLoad(){ setTimeout(load,80); }
 document.addEventListener('DOMContentLoaded',scheduleLoad);
 window.addEventListener('hashchange',scheduleLoad);
 new MutationObserver(()=>{ if(document.querySelector('.rewards-page')) scheduleLoad(); }).observe(document.body,{childList:true,subtree:true});
 window.reloadSupabaseRewards=scheduleLoad;
})();
