/* Rewards: single source of truth = Firebase */
(function(){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 const categories={ogolne:'OGÓLNE',dixper_bingo:'DIXPER ORAZ STREAM BOUNTY (BINGO)',dbd:'NAGRODY ZWIĄZANE Z DBD',uniwersalne:'NAGRODY UNIWERSALNE DO GIER',premium:'NAGRODY PREMIUM'};
 const CACHE_KEY='matt_rewards_cache_v3';
 const CACHE_TTL=10*60*1000;
 const CACHE_STALE_TTL=24*60*60*1000;
 let memoryCache=null;
 let memoryCacheAt=0;
 let fetchPromise=null;

 function readCache(){
   if(memoryCache && Date.now()-memoryCacheAt<CACHE_TTL) return memoryCache;
   try{
     const raw=localStorage.getItem(CACHE_KEY) || sessionStorage.getItem(CACHE_KEY);
     if(!raw) return null;
     const parsed=JSON.parse(raw);
     if(!Array.isArray(parsed?.data) || Date.now()-Number(parsed.at||0)>=CACHE_STALE_TTL) return null;
     memoryCache=parsed.data;
     memoryCacheAt=Number(parsed.at||Date.now());
     return memoryCache;
   }catch(_){ return null; }
 }
 function writeCache(data){
   memoryCache=Array.isArray(data)?data:[];
   memoryCacheAt=Date.now();
   const payload=JSON.stringify({at:memoryCacheAt,data:memoryCache});
   try{ localStorage.setItem(CACHE_KEY,payload); }catch(_){ try{ sessionStorage.setItem(CACHE_KEY,payload); }catch(__){} }
 }
 async function fetchRewards(force=false){
   if(!force){
     const cached=readCache();
     if(cached) return cached;
     if(fetchPromise) return fetchPromise;
   }
   fetchPromise=(async()=>{
     const {data,error}=await window.firebaseClient.from('rewards').select('*').eq('active',true).order('sort_order',{ascending:true});
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
 // Lokalny katalog grafik nagrod. Dane i kolejnosc kart pozostaja w Firebase.
 const REWARD_ASSETS='/Website/assets/pictures/rewards/';
 const knownImages={
   'banicja':'twitch_reward_ban_24h_56x56.png',
   'ban na slowo':'ban_slowa_56x56.png',
   'wybor gry':'twitch_reward_choose_game_56x56.png',
   'wybierz gre':'twitch_reward_choose_game_56x56.png',
   'zmiana gry':'twitch_reward_choose_game_56x56.png',
   'test build':'twitch_reward_test_build_56x56.png',
   'alt f4':'twitch_reward_alt_f4_transparent_56x56.png',
   'zamowienie z pyszne do 50 zl / 100 zl':'fac075d8-e54d-4de3-938e-9c536aca56a9.png',
 };
 const availableFiles=new Set([
   'b74a5aaa-c5f9-4e1c-8500-cfd1c1c1f7e8.png','ban_slowa_56x56.png',
   'be4fcfe4-94ba-4a85-8597-7ce52d26dffe.png','d84e13dd-b36d-41b0-9e08-6eb39a18b8b7.png',
   'fac075d8-e54d-4de3-938e-9c536aca56a9.png','killer_56x56.png','survivor_56x56.png',
   'twitch_reward_alt_f4_transparent_56x56.png','twitch_reward_ban_24h_56x56.png',
   'twitch_reward_choose_game_56x56.png','twitch_reward_test_build_56x56.png'
 ]);
 function normalizedTitle(value){
   return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ł/g,'l').replace(/[^a-z0-9]+/g,' ').trim();
 }
 function rewardImage(r){
   const title=normalizedTitle(r.title);
   const known=knownImages[title];
   if(known) return REWARD_ASSETS+known;
   if(title.includes('pyszne')) return REWARD_ASSETS+'fac075d8-e54d-4de3-938e-9c536aca56a9.png';
   if(title.includes('ban na slowo')) return REWARD_ASSETS+'ban_slowa_56x56.png';
   if(title.includes('killer') && (title.includes('losow')||title.includes('random'))) return REWARD_ASSETS+'killer_56x56.png';
   if((title.includes('survivor')||title.includes('surw')) && (title.includes('losow')||title.includes('random'))) return REWARD_ASSETS+'survivor_56x56.png';
   const original=String(r.image_data||r.image||'').trim();
   if(!original) return '';
   if(/^data:image\//i.test(original)||/^blob:/i.test(original)) return original;
   try {
     const u=new URL(original,location.href);
     if(u.origin===location.origin){
       const file=decodeURIComponent(u.pathname.split('/').pop()||'');
       if(availableFiles.has(file)) return REWARD_ASSETS+file;
       // Historyczne pliki z /pictures/rewards/ bez /assets/.
       if(u.pathname.includes('/pictures/rewards/')) return '';
     }
     // Zewnetrzne URL-e moga nadal byc prawidlowe; blad obsluzy fallback.
     return /^https?:$/.test(u.protocol)?u.href:'';
   }catch(_){return '';}
 }
 function rewardFallback(r){
   const title=normalizedTitle(r.title);
   if(title.includes('bingo')) return '🎲';
   if(title.includes('dixper')) return '🎁';
   if(title.includes('subik')) return '⭐';
   if(title.includes('spam')||title.includes('like')) return '❤️';
   if(title.includes('ban')) return '🔨';
   return r.icon||'🎁';
 }
 // Brak grafiki nie powinien wyswietlac uszkodzonej ikony i tekstu alt.
 document.addEventListener('error',event=>{
   const img=event.target;
   if(!(img instanceof HTMLImageElement)||!img.matches('.rewards-page .reward-custom-image')) return;
   const wrapper=img.closest('.reward-graphic');
   if(!wrapper) return;
   const fallback=img.getAttribute('data-reward-fallback')||'🎁';
   img.remove();
   wrapper.textContent=fallback;
 },true);
 function card(r,priority=false){
   const color=esc(r.icon_color||'');
   const family=r.family?` data-reward-family-card="${esc(r.family)}"`:'';
   const image=rewardImage(r);
   const fallback=rewardFallback(r);
   return `<article class="reward-card" data-reward-card data-firebase-reward="true"${family}>
    <div class="reward-card-top"><div class="reward-graphic ${color}">${image?`<img class="reward-custom-image" src="${esc(image)}" data-reward-fallback="${esc(fallback)}" alt="" loading="${priority?'eager':'lazy'}" decoding="async"${priority?' fetchpriority="high"':''} style="object-fit:${esc(r.image_fit||'cover')};object-position:${Number(r.image_x??50)}% ${Number(r.image_y??50)}%;transform:scale(${Math.max(50,Math.min(250,Number(r.image_scale||100)))/100});transform-origin:${Number(r.image_x??50)}% ${Number(r.image_y??50)}%">`:esc(fallback)}</div><span class="reward-cost">${esc(r.cost||'')}</span></div>
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
   let cardIndex=0;
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
     buckets.get(target).push(card(r,cardIndex++<6));
   });
   buckets.forEach((html,target)=>target.insertAdjacentHTML('beforeend',html.join('')));
   window.dispatchEvent(new CustomEvent('rewards:loaded'));
 }
 async function waitForCriticalImages(){
   const imgs=[...document.querySelectorAll('.rewards-page .reward-custom-image')].slice(0,6);
   await Promise.all(imgs.map(async img=>{
     try{
       if(!img.complete) await new Promise(resolve=>{ img.addEventListener('load',resolve,{once:true}); img.addEventListener('error',resolve,{once:true}); });
       if(typeof img.decode==='function') await img.decode().catch(()=>{});
     }catch(_){}
   }));
 }
 async function load(force=false){
   if(!window.firebaseClient || !document.querySelector('.rewards-page')) return;
   try{ addRewards(await fetchRewards(force)); await waitForCriticalImages(); }
   catch(e){ console.error('Rewards Firebase:',e); }
 }
 function prefetch(){
   if(!window.firebaseClient) return Promise.resolve([]);
   return fetchRewards(false).catch(e=>{console.error('Rewards Firebase prefetch:',e);return[];});
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
 window.prefetchFirebaseRewards=prefetch;
 window.getFirebaseRewards=fetchRewards;
 window.reloadFirebaseRewards=()=>load(true);
 window.loadFirebaseRewards=load;

 // Dane nagród pobieramy dopiero przy wejściu na podstronę.
 // Nie uruchamiamy automatycznego prefetch na każdej wizycie.

})();
