(() => {
  const client = window.supabaseClient;
  const root = document.getElementById('rewardsAdminApp');
  if (!client || !root) return;

  const categories = {
    ogolne:"OGÓLNE",
    dixper_bingo:"DIXPER ORAZ STREAM BOUNTY (BINGO)",
    dbd:"NAGRODY ZWIĄZANE Z DBD",
    uniwersalne:"NAGRODY UNIWERSALNE DO GIER",
    premium:"NAGRODY PREMIUM"
  };

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

  let rows=[];

  async function load(){
    let res = await client.from('rewards').select('*').order('sort_order',{ascending:true});
    if(res.error && String(res.error.message||'').includes('sort_order')) res = await client.from('rewards').select('*');
    if(res.error){ console.error('[REWARDS ADMIN]',res.error); rows=[]; }
    else rows=res.data||[];
    render();
  }

  function render(){
    root.innerHTML=`
      <div class="reward-admin-header">
        <button class="reward-add-main" id="rewardAdd">＋ DODAJ NAGRODĘ</button>
      </div>

      <div class="reward-admin-list">
      ${Object.entries(categories).map(([cat,title])=>{
        const items=rows.map((r,i)=>({r,i})).filter(x=>x.r.category===cat);
        if(!items.length) return '';
        return `
        <section class="reward-admin-category">
          <h3>${title}</h3>
          ${items.map(({r,i})=>`
          <article class="reward-admin-item">
            <div class="reward-admin-info">
              <b>${esc(r.icon||'🎁')} ${esc(r.title)}</b>
              <span>${esc(r.cost||'')}</span>
            </div>
            <div class="reward-actions">
              <button data-up="${i}">↑</button>
              <button data-down="${i}">↓</button>
              <button data-edit="${i}">✏️ EDYTUJ</button>
              <button data-del="${i}">🗑 USUŃ</button>
            </div>
          </article>`).join('')}
        </section>`;
      }).join('')}
      </div>
      <div id="rewardForm"></div>`;

    document.getElementById('rewardAdd').onclick=()=>form({});
    root.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>moveReward(Number(b.dataset.up),-1));
    root.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>moveReward(Number(b.dataset.down),1));
    root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>form(rows[b.dataset.edit]));
    root.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{
      const r=rows[b.dataset.del];
      if(confirm('Usunąć nagrodę?')){

        await client.from('rewards').delete().eq('id',r.id);
        load();
      }
    });
  }

  async function moveReward(index, direction){
    const item = rows[index];
    if(!item) return;

    // Lista w panelu jest pogrupowana kategoriami, dlatego przesuwamy
    // względem poprzedniej/następnej nagrody W TEJ SAMEJ KATEGORII.
    const sameCategoryIndexes = rows
      .map((r, i) => r.category === item.category ? i : -1)
      .filter(i => i >= 0);

    const positionInCategory = sameCategoryIndexes.indexOf(index);
    const targetPosition = positionInCategory + direction;
    if(positionInCategory < 0 || targetPosition < 0 || targetPosition >= sameCategoryIndexes.length) return;

    const targetIndex = sameCategoryIndexes[targetPosition];
    [rows[index], rows[targetIndex]] = [rows[targetIndex], rows[index]];

    // Nadajemy jednoznaczną kolejność całej tabeli. Publiczna strona pobiera
    // dokładnie po sort_order ASC, więc panel i strona mają ten sam porządek.
    const updates = rows.map((r, i) => ({ id: r.id, sort_order: i }));
    for(const u of updates){
      if(!u.id) continue;
      const { error } = await client.from('rewards').update({ sort_order: u.sort_order }).eq('id', u.id);
      if(error){
        console.error('[REWARDS ORDER]', error);
        alert('Nie udało się zapisać kolejności nagród: ' + (error.message || error));
        await load();
        return;
      }
    }

    await load();
    if(typeof window.reloadSupabaseRewards === 'function') window.reloadSupabaseRewards();
  }

  function form(r){
    if(['bingo','dixper'].includes(String(r.category||'').toLowerCase())) r={...r,family:r.family||String(r.category).toLowerCase(),category:'dixper_bingo'};
    const modal=document.querySelector('.cms-modal');
    const modalTitle=document.getElementById('cms-modal-title');
    if(modal){
      modal.classList.add('reward-full-editor');
    }
    if(modalTitle) modalTitle.textContent = r.id ? 'EDYTUJ NAGRODĘ' : 'DODAJ NAGRODĘ';
    document.getElementById('rewardForm').innerHTML=`
    <div class="reward-editor-page">
      <div class="reward-preview-box">
        <small>PODGLĄD NA ŻYWO</small>
        <h3>TAK NAGRODA BĘDZIE WYGLĄDAŁA NA STRONIE</h3>
        <article class="reward-card-preview">
          <div id="rwLiveImage">${(r.image||r.image_data)?`<img src="${esc(r.image||r.image_data)}">`:esc(r.icon||"🎁")}</div>
          <strong id="rwLiveTitle">${esc(r.title||"Nowa nagroda")}</strong>
          <span id="rwLiveCost">${esc(r.cost||"0 COINS")}</span>
          <p id="rwLiveDesc">${esc(r.description||"Opis nagrody")}</p>
        </article>
      </div>

      <div class="reward-grid modern">
        <label>Nazwa nagrody<input id="rwTitle" value="${esc(r.title)}"></label>
        <label>Koszt<input id="rwCost" value="${esc(r.cost)}"></label>
        <label>Kategoria>
          <select id="rwCat">${Object.entries(categories).map(([k,v])=>`<option value="${k}" ${k===r.category?'selected':''}>${v}</option>`).join('')}</select>
        </label>
        <label>Rodzina (tylko DIXPER/BINGO)>
          <select id="rwFamily"><option value="" ${!r.family?'selected':''}>Brak</option><option value="bingo" ${r.family==='bingo'?'selected':''}>BINGO / STREAM BOUNTY</option><option value="dixper" ${r.family==='dixper'?'selected':''}>DIXPER</option></select>
        </label>
        <label>Ikona / emoji<input id="rwIcon" value="${esc(r.icon||"🎁")}"></label>
        <label>Kolor tła ikonki<input id="rwIconColor" type="color" value="${esc(r.icon_color||"#18181d")}"></label>
        <label>Własna grafika<input id="rwImageFile" type="file" accept="image/png,image/jpeg,image/webp"></label>
      </div>

      <label>Opis nagrody<textarea id="rwDesc">${esc(r.description)}</textarea></label>



      <div class="reward-actions">
        <button id="rwBack" type="button">← WRÓĆ</button>
        <button id="rwSave" type="button">ZAPISZ NAGRODĘ</button>
      </div>
    </div>`;

    if(!document.getElementById('rewardEditorStyle')){
      const st=document.createElement('style');
      st.id='rewardEditorStyle';
      st.textContent=`
      .cms-modal.reward-full-editor{
        width:min(1200px,96vw)!important;
        max-height:95vh!important;
      }
      .cms-modal.reward-full-editor .cms-modal-body{
        overflow-y:auto;
      }
      .reward-editor-page{
        display:flex;flex-direction:column;gap:24px;padding:4px 0}
      .reward-editor-page h3{font-size:22px}
      .reward-editor-page .reward-preview-box{
        min-height:220px
      }
      .reward-preview-box{background:#15151b;border:1px solid #34343c;border-radius:18px;padding:24px}
      .reward-editor-page .reward-grid{background:#101015;border:1px solid #2f3038;border-radius:18px;padding:22px}
      .reward-editor-page .reward-grid label{font-size:13px;font-weight:700}
      .reward-editor-page .reward-actions{border-top:1px solid #303038;padding-top:20px;position:sticky;bottom:0;background:#101015}
      .reward-editor-page input,.reward-editor-page select,.reward-editor-page textarea{font-size:15px}
      .reward-editor-page .reward-preview-box img{transition:.2s}

      .reward-preview-box small{color:#ff3344}.reward-preview-box h3{margin:8px 0 20px}
      .reward-card-preview{position:relative;padding:20px;background:#18181d;border:1px solid #52242b;border-radius:14px;min-height:120px}
      #rwLiveImage img{width:70px;height:70px;object-fit:cover;border-radius:15px}
      #rwLiveImage{font-size:50px}.reward-card-preview strong{display:block;margin-top:10px}
      .reward-grid.modern{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .reward-editor-page label{display:flex;flex-direction:column;gap:8px;color:#bbb}
      .reward-editor-page input,.reward-editor-page select,.reward-editor-page textarea{background:#08090c;color:#fff;border:1px solid #333;border-radius:10px;padding:13px}
      .reward-editor-page textarea{min-height:130px}
      .zoom-controls{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:15px 0}
      .zoom-controls input[type=range]{accent-color:#ff3344;height:8px}
      .reward-card-preview{overflow:hidden}

      .reward-admin-category{background:#101015;border:1px solid #2f3038;border-radius:16px;padding:18px;margin-bottom:16px}.reward-admin-category h3{margin:0 0 14px;color:#fff;font-size:18px}.reward-admin-category .reward-admin-item{margin-bottom:10px}\n      .reward-actions{display:flex;justify-content:flex-end;gap:12px}
      .reward-actions button{padding:12px 20px;border-radius:10px;border:1px solid #555;background:#17171d;color:#fff}
      #rwSave{background:#f22;color:white;border:0}
      @media(max-width:700px){.reward-grid.modern,.zoom-controls{grid-template-columns:1fr}}
      `;
      document.head.appendChild(st);
    }

    const updatePreview=()=>{
      rwLiveTitle.textContent=rwTitle.value||"Nowa nagroda";
      rwLiveCost.textContent=rwCost.value||"0 COINS";
      rwLiveDesc.textContent=rwDesc.value||"Opis nagrody";
      const file=document.getElementById('rwImageFile')?.files?.[0];
      const img=document.querySelector('#rwLiveImage img');
      if(file){
        const reader=new FileReader();
        reader.onload=e=>rwLiveImage.innerHTML=`<img src="${e.target.result}">`;
        reader.readAsDataURL(file);
      }else if(img){
        img.style.transform=`scale(${(r.image_scale||100)/100})`;
      }else{
        rwLiveImage.textContent=rwIcon.value||"🎁";
      }
      document.querySelector('.reward-card-preview').style.setProperty('background',rwIconColor.value||'#18181d');
    };
    document.querySelectorAll('#rwTitle,#rwCost,#rwDesc,#rwIcon,#rwIconColor,#rwImageFile').forEach(e=>e.oninput=updatePreview);

    rwSave.onclick=async()=>{
      let imageUrl=r.image||null;
      const file=document.getElementById("rwImageFile")?.files?.[0];

      if(file){
        const ext=file.name.split(".").pop();
        const fileName=`rewards/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const upload=await client.storage.from("cms-images").upload(fileName,file,{upsert:false});
        if(upload.error){
          console.error("UPLOAD ERROR",upload.error);
          return alert("Nie udało się wysłać grafiki: "+upload.error.message);
        }

        const pub=client.storage.from("cms-images").getPublicUrl(fileName);
        imageUrl=pub.data.publicUrl;
      }

      const obj={
        title:rwTitle.value,
        cost:rwCost.value,
        category:rwCat.value,
        family:rwFamily.value||null,
        icon:rwIcon.value,
        icon_color:rwIconColor.value,
        image:imageUrl,
        image_data:imageUrl,
        description:rwDesc.value,
        active:true
      };

      const res=r.id
        ? await client.from("rewards").update(obj).eq("id",r.id)
        : await client.from("rewards").insert(obj);

      if(res.error)return alert(res.error.message);
      load();
    };
    rwBack.onclick=()=>{
      const modal=document.querySelector('.cms-modal');
      const modalTitle=document.getElementById('cms-modal-title');
      if(modal) modal.classList.remove('reward-full-editor');
      if(modalTitle) modalTitle.textContent='NAGRODY';
      render();
    };
  }

  load();
})();