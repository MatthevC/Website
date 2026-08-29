document.addEventListener('DOMContentLoaded',()=>{
const modal=document.getElementById('loginModal');
const open=document.getElementById('openLogin');
const close=document.getElementById('closeLogin');
if(open) open.onclick=()=>modal.style.display='flex';
if(close) close.onclick=()=>modal.style.display='none';
const btn=document.getElementById('loginBtn');
if(btn) btn.onclick=async()=>{
 const nick=document.getElementById('loginNick').value.trim();
 const pass=document.getElementById('loginPass').value;
 const msg=document.getElementById('loginMsg');
 msg.innerText='Logowanie...';
 const {data:p,error:e}=await supabaseClient.from('profiles').select('email,role').eq('username',nick).single();
 if(e||!p){msg.innerText='Nie znaleziono użytkownika';return;}
 const {data,error}=await supabaseClient.auth.signInWithPassword({email:p.email,password:pass});
 if(error){msg.innerText='Błędne hasło';return;}
 if(p.role!=='admin'){await supabaseClient.auth.signOut();msg.innerText='Brak uprawnień';return;}
 localStorage.setItem('admin','true'); location.href='admin/';
};
});
