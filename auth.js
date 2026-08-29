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