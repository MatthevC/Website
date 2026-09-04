const MATT_DEFAULT_AVATAR = "pictures/default-avatar.svg";

function mattSetHeaderUser(profile) {
  const open = document.getElementById("openLogin");
  const name = document.getElementById("headerUserName");
  const avatar = document.getElementById("headerUserAvatar");
  if (!open || !name || !avatar) return;

  if (!profile) {
    name.textContent = "LOGIN";
    avatar.src = MATT_DEFAULT_AVATAR;
    avatar.hidden = true;
    open.classList.remove("logged");
    return;
  }

  name.textContent = profile.username || "UŻYTKOWNIK";
  avatar.src = profile.avatar_url || MATT_DEFAULT_AVATAR;
  avatar.hidden = false;
  avatar.onerror = () => {
    avatar.onerror = null;
    avatar.src = MATT_DEFAULT_AVATAR;
  };
  open.classList.add("logged");
}

async function mattGetOwnProfile(session) {
  if (!session?.user) return null;

  // Najpierw po auth_user_id (nowa wersja profilu), potem kompatybilność ze starszymi rekordami po e-mailu.
  let result = await supabaseClient
    .from("profiles")
    .select("username,email,role,avatar_url,avatar_path,auth_user_id")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  if (result.error && /auth_user_id|avatar_/i.test(result.error.message || "")) {
    // Czytelny komunikat pojawi się w edycji profilu; tutaj zachowujemy działanie starego logowania.
    result = await supabaseClient
      .from("profiles")
      .select("username,email,role")
      .eq("email", session.user.email)
      .maybeSingle();
  } else if (!result.data) {
    result = await supabaseClient
      .from("profiles")
      .select("username,email,role,avatar_url,avatar_path,auth_user_id")
      .eq("email", session.user.email)
      .maybeSingle();
  }

  if (result.error) throw result.error;
  return result.data;
}

async function mattLoadUserHeader() {
  const open = document.getElementById("openLogin");
  const modal = document.getElementById("loginModal");
  const menu = document.getElementById("userMenu");
  const admin = document.getElementById("adminLink");
  const logout = document.getElementById("logoutBtn");
  if (!open) return;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.currentUserIsAdmin = false;
    window.currentUserProfile = null;
    window.dispatchEvent(new CustomEvent("matt-auth-change", { detail: { isAdmin: false } }));
    mattSetHeaderUser(null);
    open.onclick = () => modal?.classList.add("active");
    return;
  }

  try {
    const profile = await mattGetOwnProfile(session);
    if (!profile) {
      mattSetHeaderUser({ username: session.user.email?.split("@")[0] || "UŻYTKOWNIK", avatar_url: null });
      return;
    }

    window.currentUserProfile = profile;
    window.currentUserIsAdmin = profile.role === "admin";
    window.dispatchEvent(new CustomEvent("matt-auth-change", { detail: { isAdmin: window.currentUserIsAdmin } }));
    mattSetHeaderUser(profile);

    open.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      menu?.classList.toggle("show");
    };

    // Panel administratora pozostaje obsługiwany osobnym mechanizmem CMS.
    if (admin) admin.style.display = "none";

    if (logout) {
      logout.onclick = async () => {
        await supabaseClient.auth.signOut();
        location.reload();
      };
    }
  } catch (error) {
    console.error("Nie udało się wczytać profilu:", error);
  }
}

window.mattLoadUserHeader = mattLoadUserHeader;

async function mattUploadProfileAvatar(file, userId, username) {
  if (!file) return null;
  if (!file.type?.startsWith("image/")) throw new Error("Wybrany plik nie jest obrazem.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Avatar może mieć maksymalnie 8 MB.");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const slug = (username || "user")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30) || "user";
  const path = `${userId}/${slug}-${Date.now()}.${ext}`;

  const { error } = await supabaseClient.storage.from("profile-avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type
  });
  if (error) throw error;

  const publicUrl = supabaseClient.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl;
  return { path, publicUrl };
}

async function mattDeleteProfileAvatar(path, userId) {
  if (!path || !userId || !path.startsWith(`${userId}/`)) return;
  const { error } = await supabaseClient.storage.from("profile-avatars").remove([path]);
  if (error) console.warn("Nie udało się usunąć starego avatara:", error.message);
}

document.addEventListener("DOMContentLoaded", async () => {
  const open = document.getElementById("openLogin");
  const modal = document.getElementById("loginModal");
  const close = document.getElementById("closeLogin");
  const btn = document.getElementById("loginBtn");
  const nick = document.getElementById("loginNick");
  const pass = document.getElementById("loginPass");
  const msg = document.getElementById("loginMsg");
  const menu = document.getElementById("userMenu");

  if (!open) return;
  await mattLoadUserHeader();

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".user-area")) menu?.classList.remove("show");
  });

  if (close) close.onclick = () => modal?.classList.remove("active");

  const forgot = document.getElementById("forgotPass");
  const resetBox = document.getElementById("resetBox");
  const resetSend = document.getElementById("resetSend");
  const resetEmail = document.getElementById("resetEmail");
  const resetAnswer = document.getElementById("resetAnswer");
  const resetQuestion = document.getElementById("resetQuestion");
  const resetQuestions = [["Ile jest 2 + 2?", "4"], ["Ile dni ma tydzień?", "7"], ["Ile miesięcy ma rok?", "12"], ["Jak ma na imię kapitan Sparrow?", "Jack"], ["Ile nóg ma pies?", "4"], ["Ile nóg ma kot?", "4"], ["Jakiego koloru jest śnieg?", "biały"], ["Jakiego koloru jest trawa?", "zielony"], ["Ile to 5 + 5?", "10"], ["Ile to 10 - 3?", "7"], ["Ile to 3 x 3?", "9"], ["Jaka planeta jest najbliżej Słońca?", "Merkury"], ["Jak nazywa się nasza planeta?", "Ziemia"], ["Ile godzin ma doba?", "24"], ["Ile minut ma godzina?", "60"], ["Ile sekund ma minuta?", "60"], ["Jakie zwierzę mówi miau?", "kot"], ["Jakie zwierzę szczeka?", "pies"], ["Jaki owoc jest żółty i długi?", "banan"], ["Ile palców ma człowiek u jednej dłoni?", "5"], ["Jaki dzień jest po poniedziałku?", "wtorek"], ["Jaki dzień jest przed niedzielą?", "sobota"], ["Stolica Polski?", "Warszawa"], ["W jakim kraju leży Polska?", "Polska"], ["Ile boków ma kwadrat?", "4"], ["Ile boków ma trójkąt?", "3"], ["Ile nóg ma pająk?", "8"], ["Jak nazywa się młode psa?", "szczeniak"], ["Jak nazywa się młode kota?", "kocię"], ["Czym piszemy na papierze?", "długopis"], ["Czym mierzymy czas?", "zegarek"], ["Jak nazywa się gwiazda naszej planety?", "Słońce"], ["Ile to 1+1?", "2"], ["Ile to 20/2?", "10"], ["Jaki kolor ma ogień?", "czerwony"], ["Co daje pszczoła?", "miód"], ["Gdzie mieszka ryba?", "woda"], ["Jak nazywa się statek na morzu?", "statek"], ["Ile kół ma samochód?", "4"], ["Co świeci w nocy na niebie?", "Księżyc"], ["Jak nazywa się pora roku po lecie?", "jesień"], ["Jak nazywa się pora roku po zimie?", "wiosna"], ["Ile uszu ma człowiek?", "2"], ["Ile oczu ma człowiek?", "2"], ["Co robi zegar?", "odmierza czas"], ["Jaki napój robi się z ziaren?", "kawa"], ["Jaki instrument ma klawisze?", "pianino"], ["Jak nazywa się największy ocean?", "spokojny"], ["Co rośnie na drzewie?", "liście"], ["Jaki kształt ma piłka?", "okrągły"]];
  let currentResetAnswer = "";

  if (forgot) {
    forgot.onclick = () => {
      resetBox.style.display = "block";
      const q = resetQuestions[Math.floor(Math.random() * resetQuestions.length)];
      resetQuestion.textContent = q[0];
      currentResetAnswer = q[1].toLowerCase();
    };
  }

  if (resetSend) {
    resetSend.onclick = async () => {
      const email = resetEmail.value.trim();
      const answer = resetAnswer.value.trim().toLowerCase();
      if (answer !== currentResetAnswer) {
        msg.textContent = "Niepoprawna odpowiedź zabezpieczająca";
        return;
      }
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password.html"
      });
      msg.textContent = error ? "Nie udało się wysłać wiadomości" : "Wysłano wiadomość resetującą";
    };
  }

  if (btn) {
    btn.onclick = async () => {
      msg.textContent = "Logowanie...";
      const { data: p, error: lookupError } = await supabaseClient
        .from("profiles")
        .select("email")
        .eq("username", nick.value.trim())
        .maybeSingle();

      if (lookupError || !p) {
        msg.textContent = "Nie znaleziono użytkownika";
        return;
      }

      const { error } = await supabaseClient.auth.signInWithPassword({
        email: p.email,
        password: pass.value
      });
      if (error) {
        msg.textContent = "Błędne hasło";
        return;
      }
      location.reload();
    };
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const edit = document.getElementById("editProfileBtn");
  const modal = document.getElementById("profileModal");
  const close = document.getElementById("closeProfile");
  const save = document.getElementById("saveProfile");
  const avatarInput = document.getElementById("profileAvatarFile");
  const avatarPick = document.getElementById("profileAvatarPick");
  const avatarRemove = document.getElementById("profileAvatarRemove");
  const avatarPreview = document.getElementById("profileAvatarPreview");
  const avatarName = document.getElementById("profileAvatarName");
  const newNick = document.getElementById("profileNewNick");
  const newEmail = document.getElementById("profileNewEmail");
  const currentPassword = document.getElementById("profileCurrentPassword");
  const newPassword = document.getElementById("profileNewPassword");
  const newPasswordRepeat = document.getElementById("profileNewPasswordRepeat");
  const msg = document.getElementById("profileMsg");

  if (!edit || !modal) return;

  let selectedAvatarFile = null;
  let avatarRemovalRequested = false;
  let originalAvatarUrl = null;
  let originalAvatarPath = null;
  let session = null;

  const setPreview = (url) => {
    avatarPreview.src = url || MATT_DEFAULT_AVATAR;
    avatarPreview.onerror = () => {
      avatarPreview.onerror = null;
      avatarPreview.src = MATT_DEFAULT_AVATAR;
    };
  };

  const resetSensitiveFields = () => {
    currentPassword.value = "";
    newPassword.value = "";
    newPasswordRepeat.value = "";
  };

  edit.onclick = async () => {
    msg.textContent = "Wczytywanie profilu...";
    modal.classList.add("active");
    selectedAvatarFile = null;
    avatarRemovalRequested = false;
    avatarName.textContent = "Nie wybrano nowego zdjęcia";
    resetSensitiveFields();

    const sessionResult = await supabaseClient.auth.getSession();
    session = sessionResult.data.session;
    if (!session) {
      msg.textContent = "Sesja wygasła. Zaloguj się ponownie.";
      return;
    }

    try {
      const profile = await mattGetOwnProfile(session);
      if (!profile || !("avatar_url" in profile)) {
        msg.innerHTML = "Aby korzystać z nowego profilu i avatarów, uruchom najpierw plik <b>CMS_UPDATE_USER_PROFILE.sql</b> w Supabase.";
        return;
      }
      newNick.value = profile.username || "";
      newEmail.value = session.user.email || profile.email || "";
      originalAvatarUrl = profile.avatar_url || null;
      originalAvatarPath = profile.avatar_path || null;
      setPreview(originalAvatarUrl);
      msg.textContent = "";
    } catch (error) {
      console.error(error);
      msg.textContent = "Nie udało się wczytać profilu: " + (error.message || "nieznany błąd");
    }
  };

  if (close) close.onclick = () => modal.classList.remove("active");

  avatarPick.onclick = () => avatarInput.click();
  avatarInput.onchange = () => {
    const file = avatarInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      msg.textContent = "Wybierz plik graficzny JPG, PNG, WEBP lub GIF.";
      avatarInput.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      msg.textContent = "Avatar może mieć maksymalnie 8 MB.";
      avatarInput.value = "";
      return;
    }
    selectedAvatarFile = file;
    avatarRemovalRequested = false;
    avatarName.textContent = file.name;
    setPreview(URL.createObjectURL(file));
    msg.textContent = "";
  };

  avatarRemove.onclick = () => {
    selectedAvatarFile = null;
    avatarInput.value = "";
    avatarRemovalRequested = true;
    avatarName.textContent = "Użyty zostanie avatar domyślny";
    setPreview(null);
    msg.textContent = "Po zapisaniu zostanie ustawiony domyślny avatar.";
  };

  save.onclick = async () => {
    msg.textContent = "Zapisywanie...";
    save.disabled = true;

    let uploaded = null;
    try {
      const sessionResult = await supabaseClient.auth.getSession();
      session = sessionResult.data.session;
      if (!session) throw new Error("Sesja wygasła. Zaloguj się ponownie.");

      const username = newNick.value.trim();
      const email = newEmail.value.trim();
      const password = newPassword.value;
      const passwordRepeat = newPasswordRepeat.value;
      const oldPassword = currentPassword.value;

      if (username.length < 2 || username.length > 32) throw new Error("Nazwa użytkownika musi mieć od 2 do 32 znaków.");
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Podaj poprawny adres e-mail.");
      if (password && password.length < 8) throw new Error("Nowe hasło musi mieć co najmniej 8 znaków.");
      if (password !== passwordRepeat) throw new Error("Nowe hasła nie są takie same.");

      const emailChanged = email.toLowerCase() !== (session.user.email || "").toLowerCase();
      const passwordChanged = Boolean(password);

      if ((emailChanged || passwordChanged) && !oldPassword) {
        throw new Error("Aby zmienić e-mail lub hasło, wpisz obecne hasło.");
      }

      if (emailChanged || passwordChanged) {
        const verify = await supabaseClient.auth.signInWithPassword({
          email: session.user.email,
          password: oldPassword
        });
        if (verify.error) throw new Error("Obecne hasło jest nieprawidłowe.");
      }

      let avatarUrl = originalAvatarUrl;
      let avatarPath = originalAvatarPath;
      let setAvatar = false;

      if (selectedAvatarFile) {
        uploaded = await mattUploadProfileAvatar(selectedAvatarFile, session.user.id, username);
        avatarUrl = uploaded.publicUrl;
        avatarPath = uploaded.path;
        setAvatar = true;
      } else if (avatarRemovalRequested) {
        avatarUrl = null;
        avatarPath = null;
        setAvatar = true;
      }

      const profileUpdate = await supabaseClient.rpc("matt_update_own_profile", {
        p_username: username,
        p_avatar_url: avatarUrl,
        p_avatar_path: avatarPath,
        p_set_avatar: setAvatar
      });
      if (profileUpdate.error) {
        if (uploaded?.path) await mattDeleteProfileAvatar(uploaded.path, session.user.id);
        uploaded = null;
        throw profileUpdate.error;
      }

      let authNote = "";
      if (emailChanged || passwordChanged) {
        const authChanges = {};
        if (emailChanged) authChanges.email = email;
        if (passwordChanged) authChanges.password = password;
        const authUpdate = await supabaseClient.auth.updateUser(authChanges);
        if (authUpdate.error) {
          authNote = " Profil i avatar zapisano, ale nie udało się zmienić danych logowania: " + authUpdate.error.message;
        } else if (emailChanged) {
          authNote = " Zmiana e-mail została zapisana. Jeśli w Supabase jest włączone potwierdzanie zmian adresu, potwierdź ją z wiadomości e-mail.";
        } else if (passwordChanged) {
          authNote = " Hasło zostało zmienione.";
        }
      }

      if (setAvatar && originalAvatarPath && originalAvatarPath !== avatarPath) {
        await mattDeleteProfileAvatar(originalAvatarPath, session.user.id);
      }

      originalAvatarUrl = avatarUrl;
      originalAvatarPath = avatarPath;
      selectedAvatarFile = null;
      avatarRemovalRequested = false;
      avatarInput.value = "";
      avatarName.textContent = "Nie wybrano nowego zdjęcia";
      resetSensitiveFields();
      setPreview(avatarUrl);

      await mattLoadUserHeader();
      msg.textContent = "Profil został zapisany." + authNote;
    } catch (error) {
      console.error(error);
      msg.textContent = error.message || "Nie udało się zapisać profilu.";
    } finally {
      save.disabled = false;
    }
  };
});
