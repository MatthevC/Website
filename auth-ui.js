document.addEventListener("DOMContentLoaded", async () => {
const open=document.getElementById("openLogin");
const modal=document.getElementById("loginModal");
const close=document.getElementById("closeLogin");
const btn=document.getElementById("loginBtn");
const nick=document.getElementById("loginNick");
const pass=document.getElementById("loginPass");
const msg=document.getElementById("loginMsg");
const menu=document.getElementById("userMenu");
const admin=document.getElementById("adminLink");
const logout=document.getElementById("logoutBtn");

if(!open) return;

function closeMenu(){ menu?.classList.remove("show"); }

async function refreshUser(){
 const {data:{session}}=await supabaseClient.auth.getSession();
 if(!session){
   open.textContent="LOGIN";
   open.classList.remove("logged");
   return;
 }
 const {data:profile}=await supabaseClient.from("profiles")
 .select("username,role")
 .eq("email",session.user.email)
 .maybeSingle();

 if(profile){
   open.textContent=profile.username;
   open.classList.add("logged");
   open.onclick=(e)=>{
     e.stopPropagation();
     menu?.classList.toggle("show");
   };
   if(profile.role==="admin" && admin) {
 admin.style.display="block";
 const add=document.getElementById("admin-add-event");
 if(add) add.style.display="inline-flex";
}
   if(logout) logout.onclick=async()=>{
      await supabaseClient.auth.signOut();
      location.reload();
   };
 }
}

await refreshUser();

document.addEventListener("click",e=>{
 if(!e.target.closest(".user-area")) closeMenu();
});

if(open && !open.classList.contains("logged")){
 open.onclick=()=> modal.classList.add("active");
}
if(close) close.onclick=()=>modal.classList.remove("active");

if(btn) btn.onclick=async()=>{
 msg.textContent="Logowanie...";
 const {data:profile}=await supabaseClient.from("profiles")
 .select("email")
 .eq("username",nick.value.trim())
 .maybeSingle();
 if(!profile){msg.textContent="Nie znaleziono użytkownika";return;}
 const {error}=await supabaseClient.auth.signInWithPassword({
 email:profile.email,
 password:pass.value
 });
 if(error){msg.textContent="Błędne hasło";return;}
 location.reload();
};
});