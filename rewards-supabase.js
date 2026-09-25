
/* Dynamiczne nagrody z Supabase */
(function(){
  async function loadRewardsFromSupabase(){
    if(!window.supabaseClient) return;
    const target=document.querySelector('.rewards-page');
    if(!target) return;
    const grid=target.querySelector('.reward-grid');
    if(!grid) return;
    try{
      const {data,error}=await window.supabaseClient
        .from('rewards')
        .select('*')
        .eq('active',true)
        .order('sort_order',{ascending:true});
      if(error || !Array.isArray(data) || !data.length) return;

      const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
      grid.innerHTML=data.map(r=>`
        <article class="reward-card" data-reward-card data-reward-db-id="${esc(r.id)}">
          <div class="reward-card-top">
            <div class="reward-graphic ${esc(r.icon_color||'purple')}">${esc(r.icon||'🎁')}</div>
            <span class="reward-cost">${esc(r.cost||'')}</span>
          </div>
          <h3>${esc(r.title)}</h3>
          <p>${esc(r.description||'')}</p>
        </article>
      `).join('');
    }catch(e){
      console.warn('Rewards load error',e);
    }
  }

  const oldRender=window.render;
  if(typeof oldRender==='function'){
    window.render=async function(){
      const result=await oldRender.apply(this,arguments);
      setTimeout(loadRewardsFromSupabase,50);
      return result;
    };
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(loadRewardsFromSupabase,500));
})();
