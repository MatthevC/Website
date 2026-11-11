document.addEventListener('DOMContentLoaded', () => {
 const btn=document.getElementById('loginBtn'), field=document.getElementById('nick'), pass=document.getElementById('pass'), msg=document.getElementById('msg');
 btn.addEventListener('click',async()=>{
  const email=field.value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.textContent='Wpisz e-mail konta Firebase.';return;}
  msg.textContent='Logowanie...';btn.disabled=true;
  try{
   const result=await firebaseClient.auth.signInWithPassword({email,password:pass.value});
   pass.value='';if(result.error)throw new Error(result.error.message);
   const {data:{session}}=await firebaseClient.auth.getSession();
   const profile=await firebaseClient.from('profiles').select('role').eq('id',session.user.id).maybeSingle();
   if(profile.error||profile.data?.role!=='admin'){await firebaseClient.auth.signOut();throw new Error('Brak uprawnień administratora.');}
   location.href='../index.html';
  }catch(e){msg.textContent=e.message||'Błąd logowania.';}finally{btn.disabled=false;}
 });
 [field,pass].forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter')btn.click();}));
});
