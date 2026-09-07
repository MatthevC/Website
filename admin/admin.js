document.querySelector('#eventForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const f=new FormData(e.target);
  const msg=document.getElementById('msg');
  if(window.currentUserIsAdmin !== true){ msg.innerText='Brak uprawnień administratora'; return; }

  const backup=await supabaseClient.rpc('matt_create_backup',{p_label:'AUTO: przed dodaniem eventu z panelu /admin'});
  if(backup.error){ msg.innerText='Dodawanie anulowane — nie udało się utworzyć backupu: '+backup.error.message; return; }

  const {error}=await supabaseClient.from('events').insert([{
    title:f.get('title'),
    start_date:f.get('start_date'),
    end_date:f.get('end_date') || null,
    description:f.get('description'),
    image_url:f.get('image_url')
  }]);
  msg.innerText=error?error.message:'Dodano event';
  if(!error)e.target.reset();
});


async function loadAdminDashboard(){
  const users=document.getElementById('dashUsers');
  const logs=document.getElementById('dashLogs');
  const box=document.getElementById('recentChanges');
  try{
    const profiles=await supabaseClient.from('profiles').select('id',{count:'exact',head:true});
    if(users) users.textContent=profiles.count ?? '-';
    const audit=await supabaseClient.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(5);
    if(logs) logs.textContent=(audit.data||[]).length;
    if(box){
      box.innerHTML=(audit.data||[]).map(x=>`<div class="audit-mini"><b>${x.action||'Zmiana'}</b><br>${x.actor_email||''}</div>`).join('') || 'Brak zmian';
    }
  }catch(e){ if(box) box.textContent='Brak danych dashboardu'; }
}

async function rollbackLastChange(){
 alert('Cofanie zmian wymaga aktywnej funkcji Supabase rollback. Przycisk jest przygotowany pod podłączenie do historii zmian.');
}

document.addEventListener('DOMContentLoaded',()=>{
 loadAdminDashboard();
 const b=document.getElementById('rollbackLast');
 if(b) b.onclick=rollbackLastChange;
});
