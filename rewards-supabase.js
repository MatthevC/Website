/* Rewards Supabase integration */
(function(){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

 const categories={
  ogolne:"OGÓLNE",
  dixper_bingo:"DIXPER ORAZ STREAM BOUNTY (BINGO)",
  dbd:"NAGRODY ZWIĄZANE Z DBD",
  uniwersalne:"NAGRODY UNIWERSALNE DO GIER",
  premium:"NAGRODY PREMIUM"
 };

 function card(r){
  return `<article class="reward-card" data-reward-card data-supabase-reward="true">
   <div class="reward-card-top"><div class="reward-graphic">${r.image?`<img src="${esc(r.image)}">`:esc(r.icon||'🎁')}</div><span class="reward-cost">${esc(r.cost||'')}</span></div>
   <h3>${esc(r.title||r.name||'')}</h3><p>${esc(r.description||'')}</p>
  </article>`;
 }

 function findSection(category){
  const name=categories[category]||categories.ogolne;
  return [...document.querySelectorAll('.reward-group')].find(x=>x.querySelector('h2')?.textContent.trim()===name);
 }

 function addSupabaseRewards(items){
  document.querySelectorAll('[data-supabase-reward]').forEach(x=>x.remove());

  items.forEach(r=>{
   const section=findSection(String(r.category||'ogolne').toLowerCase());
   if(!section)return;
   const grid=section.querySelector('.reward-grid:not(.reward-grid-family)');
   if(!grid)return;
   const el=document.createElement('div');
   el.innerHTML=card(r);
   grid.appendChild(el.firstElementChild);
  });
 }

 async function load(){
  if(!window.supabaseClient)return;
  const page=document.querySelector('.rewards-page');
  if(!page)return;

  try{
   const {data,error}=await window.supabaseClient
    .from('rewards')
    .select('*')
    .eq('active',true)
    .order('sort_order',{ascending:true});

   if(error) throw error;
   if(Array.isArray(data)) addSupabaseRewards(data);
  }catch(e){
   console.error('Rewards Supabase:',e);
  }
 }

 function scheduleLoad(){
   setTimeout(load,100);
 }

 document.addEventListener('DOMContentLoaded',scheduleLoad);
 window.addEventListener('hashchange',scheduleLoad);
 new MutationObserver(()=>{
   if(document.querySelector('.rewards-page')) scheduleLoad();
 }).observe(document.body,{childList:true,subtree:true});

 window.reloadSupabaseRewards=scheduleLoad;
})();
