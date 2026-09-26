/* Nagrody: baza Supabase + domyślne nagrody strony */
(function(){
  const defaults=[
    {title:"Obecny",description:"Nagroda, która pokazuje, że jesteś aktualnie na transmisji.",cost:"10 COINS",category:"ogolne",icon:"🎁",icon_color:"orange"},
    {title:"Wyróżnij moją wiadomość",description:"Podkreśla Twoją wiadomość na chacie, dzięki czemu jest bardziej widoczna.",cost:"100 COINS",category:"ogolne",icon:"💬",icon_color:"gold"},
    {title:"Skip piosenki",description:"Pomija aktualnie odtwarzany utwór na Music Bocie.",cost:"1,5K COINS",category:"ogolne",icon:"⏭️",icon_color:"purple"},
    {title:"Banicja",description:"Nakładasz 24h t/o na wybraną przez siebie osobę.",cost:"10K COINS",category:"ogolne",icon:"🔨",icon_color:"dark"}
  ];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function renderRewards(items){
    const grid=document.querySelector('.rewards-page .reward-grid');
    if(!grid) return;
    grid.innerHTML=items.map(r=>`
      <article class="reward-card" data-reward-card>
        <div class="reward-card-top">
          <div class="reward-graphic ${esc(r.icon_color||'purple')}">${esc(r.icon||'🎁')}</div>
          <span class="reward-cost">${esc(r.cost||'')}</span>
        </div>
        <h3>${esc(r.title)}</h3>
        <p>${esc(r.description||'')}</p>
      </article>`).join('');
  }

  async function load(){
    const grid=document.querySelector('.rewards-page .reward-grid');
    if(!grid) return;
    let items=[...defaults];
    if(window.supabaseClient){
      try{
        const {data,error}=await window.supabaseClient.from('rewards').select('*').eq('active',true).order('sort_order',{ascending:true});
        if(!error && Array.isArray(data) && data.length) items=data;
      }catch(e){}
    }
    renderRewards(items);
  }
  const oldRender=window.render;
  if(typeof oldRender==='function'){
    window.render=async function(){
      const r=await oldRender.apply(this,arguments);
      setTimeout(load,80);
      return r;
    };
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(load,500));
})();
