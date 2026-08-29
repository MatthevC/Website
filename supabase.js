// UZUPEŁNIJ DANYMI Z SUPABASE (Settings -> API)
const SUPABASE_URL = "https://hbfgiecmyzgldgbbgwds.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_DQHt3NmJnRXkNIaM-Fmj7Q_5YT7yyA9";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;

console.log("Supabase połączony:", supabaseClient);
