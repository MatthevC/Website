document.addEventListener("DOMContentLoaded",()=>{
const modal=document.getElementById("loginModal");
const open=document.getElementById("openLogin");
const close=document.getElementById("closeLogin");
if(open) open.onclick=()=>modal.style.display="flex";
if(close) close.onclick=()=>modal.style.display="none";
const login=document.getElementById("loginBtn");
if(login) login.onclick=async()=>{
 const nick=document.getElementById("loginNick").value.trim();
 const password=document.getElementById("loginPass").value;
 const msg=document.getElementById("loginMsg");
 const {data:p}=await supabaseClient.from("profiles").select("email,role").eq("username",nick).single();
 if(!p){msg.innerText="Nie znaleziono użytkownika";return;}
 const {error}=await supabaseClient.auth.signInWithPassword({email:p.email,password});
 if(error){msg.innerText="Błędne hasło";return;}
 if(p.role!=="admin"){await supabaseClient.auth.signOut();msg.innerText="Brak uprawnień";return;}
 location.href="admin/";
};
const forgot=document.getElementById("forgotPass");
if(forgot) forgot.onclick=()=>{};
});

// Automatyczne wylogowanie po braku aktywności
(function(){
 let idleTimer=null;
 let logoutTimer=null;
 const IDLE_LIMIT=5*60*1000;
 const WARNING_TIME=60;
 function resetIdle(){
   clearTimeout(idleTimer);
   clearTimeout(logoutTimer);
   const box=document.getElementById('idleLogoutModal');
   if(box) box.style.display='none';
   idleTimer=setTimeout(showWarning, IDLE_LIMIT);
 }
 async function forceLogout(){
   await supabaseClient.auth.signOut();
   location.reload();
 }
 function showWarning(){
   const box=document.getElementById('idleLogoutModal');
   if(!box) return;
   box.style.display='flex';
   let sec=WARNING_TIME;
   const counter=document.getElementById('idleCounter');
   counter.textContent=sec;
   logoutTimer=setInterval(()=>{
     sec--;
     counter.textContent=sec;
     if(sec<=0){ clearInterval(logoutTimer); forceLogout(); }
   },1000);
 }
 window.resetIdleTimer=resetIdle;
 ['mousemove','mousedown','keydown','scroll','touchstart'].forEach(e=>document.addEventListener(e,()=>{
   resetIdle();
 },{passive:true}));
 document.addEventListener('click',e=>{
   if(e.target.id==='stayLoggedBtn') resetIdle();
 });
 supabaseClient.auth.getSession().then(({data})=>{ if(data.session) resetIdle(); });
 window.addEventListener('beforeunload',()=>{
   supabaseClient.auth.signOut();
 });
})();
