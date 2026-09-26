document.addEventListener("DOMContentLoaded", () => {

const btn = document.getElementById("loginBtn");

btn.addEventListener("click", async () => {

const nick = document.getElementById("nick").value.trim();
const password = document.getElementById("pass").value;
const msg = document.getElementById("msg");

msg.textContent = "Logowanie...";

try {

const {data: profile, error: profileError} =
await supabaseClient
.from("profiles")
.select("email,role")
.eq("username", nick)
.single();

if(profileError || !profile){
    msg.textContent = "Nie znaleziono użytkownika";
    return;
}

const {error} =
await supabaseClient.auth.signInWithPassword({
    email: profile.email,
    password: password
});

if(error){
    msg.textContent = "Błędne hasło";
    return;
}

if(profile.role !== "admin"){
    await supabaseClient.auth.signOut();
    msg.textContent = "Brak uprawnień";
    return;
}

window.location.href="../index.html";

} catch(e) {
    console.error(e);
    msg.textContent="Błąd logowania";
}

});

});
