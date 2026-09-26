/* Nagrody: GitHub jako baza + Supabase jako dodatki */
(function(){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

 const githubRewards=[
  {title:"Obecny",cost:"10 COINS",category:"ogolne",description:"Nagroda, która pokazuje, że jesteś aktualnie na transmisji.",icon:"🎁"},
  {title:"Wyróżnij moją wiadomość",cost:"100 COINS",category:"ogolne",description:"Podkreśla Twoją wiadomość na chacie.",icon:"💬"},
  {title:"Skip piosenki",cost:"1,5K COINS",category:"ogolne",description:"Pomija aktualnie odtwarzany utwór.",icon:"⏭️"},
  {title:"Banicja",cost:"10K COINS",category:"ogolne",description:"Nakładasz 24h t/o na wybraną osobę.",icon:"🔨"}
 ];

 function renderRewards(items){
  const grid=document.querySelector('.rewards-page .reward-grid');
  if(!grid)return;
  grid.innerHTML=items.map(r=>`<article class="reward-card" data-reward-card>
   <div class="reward-card-top"><div class="reward-graphic ${esc(r.icon_color||'purple')}">${esc(r.icon||'🎁')}</div><span class="reward-cost">${esc(r.cost||'')}</span></div>
   <h3>${esc(r.title)}</h3><p>${esc(r.description||'')}</p></article>`).join('');
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

  // GitHub jest bazą. Supabase tylko rozszerza listę.
  const existing=new Set(githubRewards.map(x=>x.title.toLowerCase()));
  const merged=[
    ...githubRewards,
    ...custom.filter(x=>!existing.has(String(x.title).toLowerCase()))
  ];
  renderRewards(merged);
 }

 document.addEventListener('DOMContentLoaded',()=>setTimeout(load,500));
})();
