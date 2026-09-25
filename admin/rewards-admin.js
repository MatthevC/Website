
(() => {
  const client = window.supabaseClient;
  if (!client) return;

  const root = document.getElementById('rewardsAdminApp');
  if (!root) return;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  async function load() {
    const {data,error}=await client.from('rewards').select('*').order('sort_order');
    if(error){root.innerHTML='<p>Błąd ładowania nagród</p>'; return;}
    root.innerHTML=`
      <button id="rewardAdd">+ Dodaj nagrodę</button>
      <div>${data.map(r=>`
        <article class="panel" style="margin-top:10px">
          <b>${esc(r.title)}</b> ${esc(r.cost||'')}
          <p>${esc(r.description||'')}</p>
          <button data-edit="${r.id}">Edytuj</button>
          <button data-del="${r.id}">Usuń</button>
        </article>`).join('') || 'Brak nagród'}
      </div>
      <div id="rewardForm"></div>`;
    document.getElementById('rewardAdd').onclick=()=>form();
    root.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{
      await client.from('rewards').delete().eq('id',b.dataset.del); load();
    });
    root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>form(data.find(x=>x.id===b.dataset.edit)));
  }

  function form(r={}) {
    document.getElementById('rewardForm').innerHTML=`
      <h3>${r.id?'Edytuj':'Dodaj'} nagrodę</h3>
      <input id="rwTitle" placeholder="Nazwa" value="${esc(r.title)}">
      <input id="rwCost" placeholder="Koszt" value="${esc(r.cost)}">
      <input id="rwCat" placeholder="Kategoria" value="${esc(r.category||'ogolne')}">
      <input id="rwFamily" placeholder="Rodzina" value="${esc(r.family)}">
      <input id="rwIcon" placeholder="Ikona" value="${esc(r.icon)}">
      <textarea id="rwDesc" placeholder="Opis">${esc(r.description)}</textarea>
      <button id="rwSave">Zapisz</button>`;
    document.getElementById('rwSave').onclick=async()=>{
      const obj={
        title:rwTitle.value,
        description:rwDesc.value,
        cost:rwCost.value,
        category:rwCat.value,
        family:rwFamily.value||null,
        icon:rwIcon.value,
        active:true
      };
      if(r.id) await client.from('rewards').update(obj).eq('id',r.id);
      else await client.from('rewards').insert(obj);
      load();
    };
  }
  load();
})();
