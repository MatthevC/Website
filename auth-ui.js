document.addEventListener("DOMContentLoaded", async () => {

const open=document.getElementById("openLogin");
const modal=document.getElementById("loginModal");
const close=document.getElementById("closeLogin");
const btn=document.getElementById("loginBtn");
const nick=document.getElementById("loginNick");
const pass=document.getElementById("loginPass");
const msg=document.getElementById("loginMsg");

if(!open || !modal) return;

async function refreshUser(){
    const {data:{session}} = await supabaseClient.auth.getSession();

    if(!session){
        open.textContent="LOGIN";
        open.classList.remove("logged");
        return;
    }

    const {data:profile,error}=await supabaseClient
        .from("profiles")
        .select("username,role")
        .eq("email", session.user.email)
        .maybeSingle();

    if(profile && profile.username){
        open.textContent=profile.username;
        open.classList.add("logged");
    } else {
        open.textContent="LOGIN";
        open.classList.remove("logged");
    }
}

await refreshUser();

open.onclick=()=>{
    if(open.classList.contains("logged")){
        if(confirm("Wylogować?")){
            supabaseClient.auth.signOut().then(()=>location.reload());
        }
    } else {
        modal.style.display="flex";
        modal.classList.add("active");
    }
};

close.onclick=()=>{modal.classList.remove("active"); modal.style.display="none";};

modal.onclick=(e)=>{
    if(e.target===modal){ modal.classList.remove("active"); modal.style.display="none"; }
};

btn.onclick=async()=>{

msg.textContent="Logowanie...";

const {data:profile,error:pErr}=await supabaseClient
.from("profiles")
.select("email,username,role")
.eq("username",nick.value.trim())
.maybeSingle();

if(pErr || !profile){
    msg.textContent="Nie znaleziono użytkownika";
    return;
}

const {error}=await supabaseClient.auth.signInWithPassword({
    email:profile.email,
    password:pass.value
});

if(error){
    msg.textContent="Błędne hasło";
    return;
}

location.reload();

};

document.getElementById("forgotPass").onclick=()=>{
msg.textContent="Skontaktuj się z administratorem.";
};

});
