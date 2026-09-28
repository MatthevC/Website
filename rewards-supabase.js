/* Nagrody: GitHub jako baza + Supabase jako dodatki */
(function(){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

 const githubRewards=[];

 const categories={
  ogolne:["OGÓLNE","Szybkie nagrody związane z czatem, muzyką i podstawową zabawą na transmisji."],
  dixper_bingo:["DIXPER ORAZ STREAM BOUNTY (BINGO)","Skrzynki Dixpera oraz nagrody wpływające na eventy i planszę Stream Bounty."],
  dbd:["NAGRODY ZWIĄZANE Z DBD","Nagrody związane z Dead by Daylight."],
  uniwersalne:["NAGRODY UNIWERSALNE DO GIER","Nagrody możliwe do wykorzystania w różnych grach."],
  premium:["NAGRODY PREMIUM","Specjalne nagrody premium."]
 };

 function card(r){
  return `<article class="reward-card" data-reward-card>
   <div class="reward-card-top"><div class="reward-graphic">${r.image?`<img src="${esc(r.image)}">`:esc(r.icon||'🎁')}</div><span class="reward-cost">${esc(r.cost||'')}</span></div>
   <h3>${esc(r.title)}</h3><p>${esc(r.description||'')}</p>
  </article>`;
 }

 function renderRewards(items){
  const page=document.querySelector('.rewards-page');
  const search=document.querySelector('.reward-search-panel');
  if(!page || !search)return;

  page.querySelectorAll('.reward-group, .reward-category-block').forEach(el=>el.remove());

  const html=Object.entries(categories).map(([key,val])=>{
    const list=items.filter(r=>String(r.category||'ogolne').toLowerCase()===key);
    return `<section class="reward-group reward-category-block" data-category="${key}">
      <div class="reward-group-head">
        <h2>${val[0]}</h2>
        <p>${val[1]}</p>
      </div>
      <div class="reward-grid">${list.map(card).join('')}</div>
    </section>`;
  }).join('');

  search.insertAdjacentHTML('afterend',html);
 }

 async function load(){
  const grid=document.querySelector('.rewards-page .reward-grid');
  if(!grid)return;
  let custom=[];
  if(window.supabaseClient){
   try{
    const {data,error}=await window.supabaseClient.from('rewards').select('*').eq('active',true).order('sort_order',{ascending:true});
    if(!error && Array.isArray(data)) custom=data;
   }catch(e){console.error(e)}
  }
  const merged=custom;
  renderRewards(merged);
 }

 document.addEventListener('DOMContentLoaded',()=>setTimeout(load,500));
})();