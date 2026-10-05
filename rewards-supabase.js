/* Rewards: single source of truth = Supabase */
(function(){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 const categories={ogolne:'OGÓLNE',dixper_bingo:'DIXPER ORAZ STREAM BOUNTY (BINGO)',dbd:'NAGRODY ZWIĄZANE Z DBD',uniwersalne:'NAGRODY UNIWERSALNE DO GIER',premium:'NAGRODY PREMIUM'};
 const CACHE_KEY='matt_rewards_cache_v2';
 const CACHE_TTL=2*60*1000;
 let memoryCache=null;
 let memoryCacheAt=0;
 let fetchPromise=null;

 function readCache(){
   if(memoryCache && Date.now()-memoryCacheAt<CACHE_TTL) return memoryCache;
   try{
     const raw=sessionStorage.getItem(CACHE_KEY);
     if(!raw) return null;
     const parsed=JSON.parse(raw);
     if(!Array.isArray(parsed?.data) || Date.now()-Number(parsed.at||0)>=CACHE_TTL) return null;
     memoryCache=parsed.data;
     memoryCacheAt=Number(parsed.at||Date.now());
     return memoryCache;
   }catch(_){ return null; }
 }
 function writeCache(data){
   memoryCache=Array.isArray(data)?data:[];
   memoryCacheAt=Date.now();
   try{ sessionStorage.setItem(CACHE_KEY,JSON.stringify({at:memoryCacheAt,data:memoryCache})); }catch(_){}
 }
 async function fetchRewards(force=false){
   if(!force){
     const cached=readCache();
     if(cached) return cached;
     if(fetchPromise) return fetchPromise;
   }
   fetchPromise=(async()=>{
     const {data,error}=await window.supabaseClient.from('rewards').select('*').eq('active',true).order('sort_order',{ascending:true});
     if(error) throw error;
     const items=Array.isArray(data)?data:[];
     writeCache(items);
     return items;
   })();
   try{return await fetchPromise;}finally{fetchPromise=null;}
 }

 function extras(r){
   if(r.title==='1 vs 1') return '<div class="reward-note">Jeśli nagroda dotyczy gry, której Matt nie posiada, zwrot punktów nastąpi w ciągu 30 dni.</div>';
   if(r.title==='Zamówienie z Pyszne do 50 zł / 100 zł') return '<div class="reward-note">Koszt w Coins zależy od aktualnie dostępnego wariantu nagrody na kanale.</div>';
   if(String(r.title||'').startsWith('Dixper')) return '<p><a href="#/viewer/dixper" class="reward-inline-link">Więcej info tutaj →</a></p>';
   return '';
 }
 function card(r){
   const color=esc(r.icon_color||'');
   const family=r.family?` data-reward-family-card="${esc(r.family)}"`:'';
   const image=r.image_data||r.image;
   return `<article class="reward-card" data-reward-card data-supabase-reward="true"${family}>
    <div class="reward-card-top"><div class="reward-graphic ${color}">${image?`<img class="reward-custom-image" src="${esc(image)}" alt="" loading="lazy" decoding="async" style="object-fit:${esc(r.image_fit||'cover')};object-position:${Number(r.image_x??50)}% ${Number(r.image_y??50)}%;transform:scale(${Math.max(50,Math.min(250,Number(r.image_scale||100)))/100});transform-origin:${Number(r.image_x??50)}% ${Number(r.image_y??50)}%">`:esc(r.icon||'🎁')}</div><span class="reward-cost">${esc(r.cost||'')}</span></div>
    <h3>${esc(r.title||'')}</h3><p>${esc(r.description||'')}</p>${extras(r)}
   </article>`;
 }
 function findSection(category){
   const name=categories[category]||categories.ogolne;
   return [...document.querySelectorAll('.reward-group')].find(x=>x.querySelector('h2')?.textContent.trim()===name);
 }
 function clearCards(){ document.querySelectorAll('.rewards-page [data-reward-card]').forEach(x=>x.remove()); }
 function addRewards(items){
   if(!document.querySelector('.rewards-page')) return;
   clearCards();
   const buckets=new Map();
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
     if(!buckets.has(target)) buckets.set(target,[]);
     buckets.get(target).push(card(r));
   });
   buckets.forEach((html,target)=>target.insertAdjacentHTML('beforeend',html.join('')));
   window.dispatchEvent(new CustomEvent('rewards:loaded'));
 }
 async function load(force=false){
   if(!window.supabaseClient || !document.querySelector('.rewards-page')) return;
   try{ addRewards(await fetchRewards(force)); }
   catch(e){ console.error('Rewards Supabase:',e); }
 }
 function prefetch(){
   if(!window.supabaseClient) return Promise.resolve([]);
   return fetchRewards(false).catch(e=>{console.error('Rewards Supabase prefetch:',e);return[];});
 }
 let loadTimer=0;
 let lastRewardsPage=null;
 function scheduleLoad(force=false){
   clearTimeout(loadTimer);
   loadTimer=setTimeout(()=>{
     const page=document.querySelector('.rewards-page');
     if(!page){ lastRewardsPage=null; return; }
     if(!force && page===lastRewardsPage) return;
     lastRewardsPage=page;
     load(force);
   },0);
 }
 document.addEventListener('DOMContentLoaded',()=>scheduleLoad(false));
 window.addEventListener('hashchange',()=>{ lastRewardsPage=null; scheduleLoad(false); });
 new MutationObserver(()=>{
   const page=document.querySelector('.rewards-page');
   if(page && page!==lastRewardsPage) scheduleLoad(false);
   else if(!page) lastRewardsPage=null;
 }).observe(document.body,{childList:true,subtree:true});
 window.prefetchSupabaseRewards=prefetch;
 window.reloadSupabaseRewards=()=>load(true);
 window.loadSupabaseRewards=load;
})();
