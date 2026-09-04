async function checkAdmin(){
  try{
    const {data:{session}} = await supabaseClient.auth.getSession();
    if(!session){ location.href='login.html'; return; }

    const {data:profile, error} = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('email', session.user.email)
      .maybeSingle();

    if(error || profile?.role !== 'admin'){
      location.href='../index.html';
      return;
    }

    window.currentUserIsAdmin = true;
  }catch(_){
    location.href='../index.html';
  }
}
checkAdmin();
async function logout(){await supabaseClient.auth.signOut();location.href='login.html';}
