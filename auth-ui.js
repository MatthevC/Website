document.addEventListener("DOMContentLoaded", async () => {
const open=document.getElementById("openLogin");
const modal=document.getElementById("loginModal");
const close=document.getElementById("closeLogin");
const btn=document.getElementById("loginBtn");
const nick=document.getElementById("loginNick");
const pass=document.getElementById("loginPass");
const msg=document.getElementById("loginMsg");

if(!open) return;

async function refreshUser(){
 const {data:{session}}=await supabaseClient.auth.getSession();
 if(!session){
   open.textContent="LOGIN";
   open.className="header-login";
   return;
 }
 const {data:profile}=await supabaseClient.from("profiles")
  .select("username,role")
  .eq("email",session.user.email)
  .maybeSingle();
 if(profile){
   open.innerHTML=`${profile.username} ▾`;
   open.className="header-login logged";
   open.onclick=()=>{
     const menu=document.getElementById("userMenu");
     menu.classList.toggle("show");
   };
   const menu=document.getElementById("userMenu");
   const admin=document.getElementById("adminLink");
   if(profile.role==="admin") admin.style.display="block";
   document.getElementById("logoutBtn").onclick=async()=>{
    await supabaseClient.auth.signOut();
    location.reload();
   };
   return;
 }
 open.textContent="LOGIN";
}

await refreshUser();

open.onclick=()=>{
 if(!open.classList.contains("logged")){
  modal.style.display="flex";
 }
};

if(close) close.onclick=()=>modal.style.display="none";
if(btn) btn.onclick=async()=>{
 msg.textContent="Logowanie...";
 const {data:profile}=await supabaseClient.from("profiles")
 .select("email,username,role")
 .eq("username",nick.value.trim())
 .maybeSingle();
 if(!profile){msg.textContent="Nie znaleziono użytkownika";return;}
 const {error}=await supabaseClient.auth.signInWithPassword({
 email:profile.email,password:pass.value});
 if(error){msg.textContent="Błędne hasło";return;}
 location.reload();
};
document.getElementById("forgotPass").onclick=()=>{
 msg.textContent="Skontaktuj się z administratorem.";
};
});