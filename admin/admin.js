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
