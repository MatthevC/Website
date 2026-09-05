import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};


function getSupabaseSecretKey() {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
    return String(keys?.default || Object.values(keys || {})[0] || '');
  } catch (_) {
    return '';
  }
}

let cachedTwitchToken = '';
let cachedTwitchTokenExpiresAt = 0;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function twitchLoginFromUrl(value: string) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    if (host !== 'twitch.tv') return '';
    const first = url.pathname.split('/').filter(Boolean)[0] || '';
    const login = decodeURIComponent(first).replace(/^@/, '').trim().toLowerCase();
    const reserved = new Set(['directory','downloads','jobs','p','settings','subscriptions','videos','clip','clips','inventory','wallet','search']);
    return /^[a-z0-9_]{1,25}$/.test(login) && !reserved.has(login) ? login : '';
  } catch (_) {
    return '';
  }
}

function compactDescription(value: string, max = 280) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const short = clean.slice(0, max - 1).replace(/\s+\S*$/, '').trim();
  return `${short || clean.slice(0, max - 1)}…`;
}

async function getTwitchToken(clientId: string, clientSecret: string, force = false) {
  const now = Date.now();
  if (!force && cachedTwitchToken && cachedTwitchTokenExpiresAt > now + 60_000) return cachedTwitchToken;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  });
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.message || 'Twitch odrzucił dane aplikacji (Client ID / Client Secret).');
  }
  cachedTwitchToken = payload.access_token;
  cachedTwitchTokenExpiresAt = now + Math.max(60, Number(payload.expires_in || 3600) - 60) * 1000;
  return cachedTwitchToken;
}

async function twitchGet(path: string, clientId: string, clientSecret: string, retry = true) {
  const token = await getTwitchToken(clientId, clientSecret);
  const response = await fetch(`https://api.twitch.tv/helix${path}`, {
    headers: {
      'Client-Id': clientId,
      'Authorization': `Bearer ${token}`,
    },
  });
  if (response.status === 401 && retry) {
    cachedTwitchToken = '';
    cachedTwitchTokenExpiresAt = 0;
    await getTwitchToken(clientId, clientSecret, true);
    return twitchGet(path, clientId, clientSecret, false);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || `Twitch API zwróciło błąd ${response.status}.`);
  return payload;
}

async function safeTwitchGet(path: string, clientId: string, clientSecret: string) {
  try { return await twitchGet(path, clientId, clientSecret); }
  catch (error) { console.warn('[twitch-streamer-autofill]', path, error); return { data: [] }; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok:false, error:'Dozwolone jest tylko żądanie POST.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = getSupabaseSecretKey();
    const twitchClientId = Deno.env.get('TWITCH_CLIENT_ID') || '';
    const twitchClientSecret = Deno.env.get('TWITCH_CLIENT_SECRET') || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ ok:false, error:'Brakuje konfiguracji Supabase w Edge Function.' }, 500);
    }
    if (!twitchClientId || !twitchClientSecret) {
      return json({ ok:false, error:'Brakuje TWITCH_CLIENT_ID lub TWITCH_CLIENT_SECRET w sekretach Supabase Edge Functions.' }, 500);
    }

    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!jwt) return json({ ok:false, error:'Musisz być zalogowany jako administrator.' }, 401);

    const service = createClient(supabaseUrl, serviceRoleKey, { auth:{ persistSession:false, autoRefreshToken:false } });
    const { data: userData, error: userError } = await service.auth.getUser(jwt);
    const user = userData?.user;
    if (userError || !user) return json({ ok:false, error:'Sesja użytkownika jest nieprawidłowa lub wygasła.' }, 401);

    let profile: { role?: string } | null = null;
    const byId = await service.from('profiles').select('role').eq('auth_user_id', user.id).maybeSingle();
    if (!byId.error) profile = byId.data;
    if (!profile && user.email) {
      const byEmail = await service.from('profiles').select('role').eq('email', user.email).maybeSingle();
      if (!byEmail.error) profile = byEmail.data;
    }
    if (String(profile?.role || '').toLowerCase() !== 'admin') {
      return json({ ok:false, error:'Ta funkcja jest dostępna tylko dla administratora.' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const login = twitchLoginFromUrl(String(body?.channelUrl || ''));
    if (!login) return json({ ok:false, error:'Wklej pełny link do kanału Twitch, np. https://www.twitch.tv/wazzzupek' }, 400);

    const users = await twitchGet(`/users?login=${encodeURIComponent(login)}`, twitchClientId, twitchClientSecret);
    const twitchUser = users?.data?.[0];
    if (!twitchUser) return json({ ok:false, error:'Nie znaleziono takiego kanału Twitch.' }, 404);

    const broadcasterId = String(twitchUser.id);
    const now = new Date();
    const startedAt = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const endedAt = now.toISOString();

    const [channelInfo, liveInfo, recentClips, bestClips] = await Promise.all([
      safeTwitchGet(`/channels?broadcaster_id=${encodeURIComponent(broadcasterId)}`, twitchClientId, twitchClientSecret),
      safeTwitchGet(`/streams?user_id=${encodeURIComponent(broadcasterId)}&first=1`, twitchClientId, twitchClientSecret),
      safeTwitchGet(`/clips?broadcaster_id=${encodeURIComponent(broadcasterId)}&first=100&started_at=${encodeURIComponent(startedAt)}&ended_at=${encodeURIComponent(endedAt)}`, twitchClientId, twitchClientSecret),
      safeTwitchGet(`/clips?broadcaster_id=${encodeURIComponent(broadcasterId)}&first=1`, twitchClientId, twitchClientSecret),
    ]);

    const channel = channelInfo?.data?.[0] || null;
    const live = liveInfo?.data?.[0] || null;
    const clips = Array.isArray(recentClips?.data) ? recentClips.data : [];
    const bestClip = Array.isArray(bestClips?.data) ? bestClips.data[0] : null;

    // Twitch zwraca klipy wg liczby wyświetleń, dlatego do ustalenia "ostatnich gier"
    // sortujemy pobrane klipy z 90 dni ponownie wg daty utworzenia.
    const recentSorted = [...clips].sort((a,b) => Date.parse(b?.created_at || 0) - Date.parse(a?.created_at || 0));
    const gameIds: string[] = [];
    const addGameId = (id: unknown) => {
      const value = String(id || '').trim();
      if (value && !gameIds.includes(value)) gameIds.push(value);
    };
    addGameId(live?.game_id);
    addGameId(channel?.game_id);
    recentSorted.forEach(clip => addGameId(clip?.game_id));

    const gameIdSlice = gameIds.slice(0, 20);
    const gameNames = new Map<string,string>();
    if (gameIdSlice.length) {
      const params = new URLSearchParams();
      gameIdSlice.forEach(id => params.append('id', id));
      const gamesPayload = await safeTwitchGet(`/games?${params.toString()}`, twitchClientId, twitchClientSecret);
      (gamesPayload?.data || []).forEach((game: any) => gameNames.set(String(game.id), String(game.name || '')));
    }

    const games: string[] = [];
    const addGameName = (name: unknown) => {
      const value = String(name || '').trim();
      if (value && !games.some(existing => existing.toLowerCase() === value.toLowerCase())) games.push(value);
    };
    addGameName(live?.game_name);
    addGameName(channel?.game_name);
    gameIdSlice.forEach(id => addGameName(gameNames.get(id)));

    const warnings: string[] = [];
    if (!bestClip?.url) warnings.push('Kanał nie ma dostępnego publicznego klipu, więc pole klipu pozostało bez zmian.');
    if (!games.length) warnings.push('Twitch nie zwrócił danych pozwalających ustalić ostatnie gry.');
    if (!twitchUser.description) warnings.push('Kanał nie ma publicznego opisu Twitch.');

    return json({
      ok: true,
      login: String(twitchUser.login || login).toLowerCase(),
      displayName: String(twitchUser.display_name || twitchUser.login || login),
      channelUrl: `https://www.twitch.tv/${String(twitchUser.login || login).toLowerCase()}`,
      tagline: compactDescription(String(twitchUser.description || '')),
      games: games.slice(0, 5),
      clipUrl: bestClip?.url ? String(bestClip.url) : '',
      clipSlug: bestClip?.id ? String(bestClip.id) : '',
      profileImageUrl: String(twitchUser.profile_image_url || ''),
      warning: warnings.join(' '),
      meta: {
        gamesWindowDays: 90,
        bestClipViewCount: Number(bestClip?.view_count || 0),
      },
    });
  } catch (error) {
    console.error('[twitch-streamer-autofill]', error);
    return json({ ok:false, error: error instanceof Error ? error.message : 'Nieznany błąd funkcji.' }, 500);
  }
});
