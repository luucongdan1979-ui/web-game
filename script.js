import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDly5plLAysmA-_tRrN4XRhBhCI1A6sgGs",
  authDomain: "memchee-d1cae.firebaseapp.com",
  projectId: "memchee-d1cae",
  storageBucket: "memchee-d1cae.firebasestorage.app",
  messagingSenderId: "638843455684",
  appId: "1:638843455684:web:9e270109251e75de4ca191",
  measurementId: "G-5YCXB2107"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

window.firebaseAuth = auth;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.sendEmailVerification = sendEmailVerification;

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='130' viewBox='0 0 100 130'><rect width='100' height='130' fill='%23111'/><text x='50' y='75' font-size='60' fill='%238ef0c1' text-anchor='middle' dominant-baseline='central'>?</text></svg>";

const $ = id => document.getElementById(id);

const STORAGE_KEY = "memeCardArena_permanent_database";
const ADMIN_CODE = "171113";

const cards = {
  kha: {
    name: "Khá Bảnh",
    file: "khá bảnh nv.png",
    rarity: "RARE",
    category: "CHARACTER",
    atk: 49,
    def: 49
  },
  jack: {
    name: "Jack",
    file: "jack nv.png",
    rarity: "LEGENDARY",
    category: "CHARACTER",
    atk: 97,
    def: 13
  },
  truongGiang: {
    name: "Trường Giang",
    file: "tgnv.png",
    rarity: "MYTHICAL",
    category: "CHARACTER",
    atk: 100,
    def: 50
  },
  vaoTu: {
    name: "Vào Tù",
    file: "Vào Tù Th.png",
    rarity: "LEGENDARY",
    category: "SITUATION"
  },
  boCon: {
    name: "Bỏ Con",
    file: "bỏ con th.png",
    rarity: "LEGENDARY",
    category: "SITUATION"
  },
  hoiChieuTroiMua: {
    name: "Hồi Chiều Trời Mưa",
    file: "tgth.png",
    rarity: "MYTHICAL",
    category: "SITUATION"
  },
  muaQuat: {
    name: "Múa Quạt",
    file: "mua quat skill.png",
    rarity: "RARE",
    category: "SKILL"
  },
  chuCap5Cu: {
    name: "Chu Cấp 5 Củ",
    file: "chu cap 5 cu.png",
    rarity: "LEGENDARY",
    category: "SKILL"
  },
  samSo: {
    name: "Sàm Sỡ",
    file: "tgsk.png",
    rarity: "MYTHICAL",
    category: "SKILL"
  },
  doiTrangThayDen: {
    name: "Đổi Trắng Thay Đen",
    file: "trade.png",
    rarity: "LEGENDARY",
    category: "SKILL"
  }
};

const CATEGORY_LABELS = {
  CHARACTER: "NHÂN VẬT",
  SKILL: "SKILL",
  SITUATION: "TÌNH HUỐNG"
};

let state = loadState();
let currentUser = null;
let isAdmin = false;
let pendingCard = null;
let activePackIndex = null;
let activePackType = null;
let isTearingPack = false;
let currentAlbumFilter = "ALL";
let targetGiftUserKey = null;
let toastTimer;

let battleDeckState = {
  selectedSkill: null,
  selectedCharacter: null,
  selectedSituation: null,
  botSelectedSkill: null,
  botSelectedCharacter: null,
  botSelectedSituation: null,
  botHp: 250,
  maxBotHp: 250,
  playerHp: 250,
  maxPlayerHp: 250,
  playerStatChoice: null,
  botStatChoice: null,
  cardsFlipped: false,
  isResolvingTurn: false,
  timerInterval: null,
  timeLeft: 30,
  playerRainTurnsLeft: 0,
  botRainTurnsLeft: 0
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function loadState() {
  try {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data && data.users) {
      if (!Array.isArray(data.adminMailbox)) data.adminMailbox = [];
      return data;
    }

    const oldKeys = ["memeCardArenaDemo_v7", "memeCardArenaDemo_v6", "memeCardArenaDemo_v5", "memeCardArenaDemo_v4"];
    for (let k of oldKeys) {
      const oldData = JSON.parse(localStorage.getItem(k));
      if (oldData && oldData.users) {
        if (!Array.isArray(oldData.adminMailbox)) oldData.adminMailbox = [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(oldData));
        return oldData;
      }
    }

    return { users: {}, active: null, adminMailbox: [] };
  } catch {
    return { users: {}, active: null, adminMailbox: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getProfile() {
  if (isAdmin) {
    if (!state.adminBag) state.adminBag = [];
    if (!Array.isArray(state.adminMailbox)) state.adminMailbox = [];
    if (!state.adminAvatar) state.adminAvatar = DEFAULT_AVATAR;
    return {
      coins: Infinity,
      cards: Object.keys(cards),
      bag: state.adminBag,
      mailbox: state.adminMailbox,
      starterOpened: true,
      avatar: state.adminAvatar,
      unlockedAvatars: [DEFAULT_AVATAR, "avt2.png", "avt3.png", "avt4.png"]
    };
  }
  const p = currentUser ? state.users[currentUser] : null;
  if (p) {
    if (!Array.isArray(p.bag)) p.bag = [];
    if (!Array.isArray(p.mailbox)) p.mailbox = [];
  }
  return p;
}

function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $("toast").classList.remove("show");
  }, 2400);
}

function showAuthMessage(message, success = false) {
  $("authMessage").textContent = message;
  $("authMessage").style.color = success ? "#8ef0c1" : "#ff9dbe";
}

function switchPanel(panelId) {
  document.querySelectorAll(".auth-form").forEach(form => {
    form.classList.toggle("hidden", form.id !== panelId);
  });

  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.panel === panelId);
  });

  showAuthMessage("");
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => switchPanel(tab.dataset.panel));
});

document.querySelectorAll("[data-switch]").forEach(btn => {
  btn.addEventListener("click", () => switchPanel(btn.dataset.switch));
});

function createProfile(username, email, password) {
  return {
    username,
    email,
    password,
    coins: 20,
    avatar: DEFAULT_AVATAR,
    unlockedAvatars: [DEFAULT_AVATAR, "avt1.png"],
    cards: [],
    bag: [],
    mailbox: [],
    starterOpened: false,
    banned: false
  };
}

$("registerPanel").addEventListener("submit", async event => {
  event.preventDefault();

  const username = $("registerUsername").value.trim();
  const email = $("registerEmail").value.trim().toLowerCase();
  const password = $("registerPassword").value;
  const key = username.toLowerCase();

  if (state.users[key]) {
    return showAuthMessage("Tên tài khoản đã tồn tại!");
  }

  if (!/^[a-zA-Z0-9_]{3,18}$/.test(username)) {
    return showAuthMessage("Tên tài khoản cần 3–18 ký tự chữ, số hoặc dấu gạch dưới.");
  }

  if (password.length < 6) {
    return showAuthMessage("Mật khẩu cần ít nhất 6 ký tự!");
  }

  try {
    const userCredential = await window.createUserWithEmailAndPassword(window.firebaseAuth, email, password);
    await window.sendEmailVerification(userCredential.user);

    showAuthMessage("Link xác thực đã gửi về email, hãy vào email để xác thực!", true);

    state.users[key] = createProfile(username, email, password);
    saveState();

    setTimeout(() => switchPanel("loginPanel"), 4000);
  } catch (error) {
    let msg = "Đăng ký thất bại!";
    if (error.code === "auth/email-already-in-use") {
      msg = "Email này đã được sử dụng bởi tài khoản khác!";
    } else if (error.code === "auth/invalid-email") {
      msg = "Địa chỉ email không hợp lệ!";
    } else {
      msg = error.message;
    }
    showAuthMessage(msg);
  }
});

$("loginPanel").addEventListener("submit", event => {
  event.preventDefault();

  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;
  const profile = state.users[username];

  if (!profile || profile.password !== password) {
    return showAuthMessage("Tên tài khoản hoặc mật khẩu không đúng!");
  }

  if (profile.banned) {
    return showAuthMessage("Tài khoản này đã bị BAN (Khóa) bởi Admin!");
  }

  loginAs(username);
});

$("adminPanel").addEventListener("submit", event => {
  event.preventDefault();

  if ($("adminCode").value !== ADMIN_CODE) {
    return showAuthMessage("Mã Admin không chính xác!");
  }

  currentUser = null;
  isAdmin = true;
  enterGame("ADMIN");
});

function loginAs(username) {
  currentUser = username;
  isAdmin = false;
  state.active = username;
  saveState();
  enterGame(state.users[username].username);
}

function enterGame(displayName) {
  $("authScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  $("bottomNav").classList.remove("hidden");
  document.body.classList.add("logged-in");

  const profile = getProfile();
  const currentAvatar = isAdmin ? (state.adminAvatar || DEFAULT_AVATAR) : (profile?.avatar || DEFAULT_AVATAR);

  if ($("userProfileBadge")) $("userProfileBadge").classList.remove("hidden");
  if ($("userAvatarImg")) $("userAvatarImg").src = currentAvatar;
  $("welcomeUser").textContent = isAdmin ? "Admin" : displayName;

  $("adminTag").classList.toggle("hidden", !isAdmin);
  $("adminCheckNavBtn").classList.toggle("hidden", !isAdmin);
  $("adminSendMailNavBtn").classList.toggle("hidden", !isAdmin);
  if ($("userExportBtn")) $("userExportBtn").classList.toggle("hidden", isAdmin);

  renderProfile();
  showScreen("gameScreen");

  if (isAdmin || getProfile().starterOpened) {
    hideOldStarterChest();
  } else {
    showStarterOverlay();
  }
}

function showScreen(screenId) {
  ["gameScreen", "pveBattleScreen", "shopScreen", "backpackScreen", "albumScreen", "mailScreen", "adminSendMailScreen", "adminCheckScreen"].forEach(id => {
    if ($(id)) $(id).classList.toggle("hidden", id !== screenId);
  });

  document.querySelectorAll(".nav-item[data-screen]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.screen === screenId);
  });

  if (screenId === "backpackScreen") renderBackpack();
  if (screenId === "albumScreen") renderAlbum();
  if (screenId === "mailScreen") renderMailbox();
  if (screenId === "adminSendMailScreen") renderAdminSendMailScreen();
  if (screenId === "adminCheckScreen") renderAdminUserManagement();
}

document.querySelectorAll(".nav-item[data-screen]").forEach(btn => {
  btn.addEventListener("click", () => showScreen(btn.dataset.screen));
});

$("logoutBtn").addEventListener("click", () => {
  currentUser = null;
  isAdmin = false;
  pendingCard = null;

  state.active = null;
  saveState();

  if (battleDeckState.timerInterval) clearInterval(battleDeckState.timerInterval);
  cleanupBattleFxOverlays(true);

  document.body.classList.remove("logged-in", "starter-active");
  $("starterOverlay").classList.add("hidden");
  $("packOpenOverlay").classList.add("hidden");
  $("cardDetailModal").classList.add("hidden");
  $("adminGiftModal").classList.add("hidden");
  if ($("trainingGuideModal")) $("trainingGuideModal").classList.add("hidden");
  if ($("statChoiceModal")) $("statChoiceModal").classList.add("hidden");
  if ($("userExportBtn")) $("userExportBtn").classList.add("hidden");

  $("arenaCopyChest").classList.remove("hidden");
  $("chibiClownHome").classList.add("hidden");
  $("mainArena").classList.remove("chest-completed");

  $("authScreen").classList.remove("hidden");
  $("gameScreen").classList.add("hidden");
  if ($("pveBattleScreen")) $("pveBattleScreen").classList.add("hidden");
  $("shopScreen").classList.add("hidden");
  $("backpackScreen").classList.add("hidden");
  $("albumScreen").classList.add("hidden");
  $("mailScreen").classList.add("hidden");
  $("adminSendMailScreen").classList.add("hidden");
  $("adminCheckScreen").classList.add("hidden");
  $("bottomNav").classList.add("hidden");

  if ($("userProfileBadge")) $("userProfileBadge").classList.add("hidden");
  $("welcomeUser").textContent = "Tài khoản";
  $("loginPassword").value = "";
  $("adminCode").value = "";

  switchPanel("loginPanel");
});

function renderProfile() {
  const profile = getProfile();
  if (!profile) return;

  $("coinCount").textContent = isAdmin ? "∞" : profile.coins;

  const bagCount = profile.bag ? profile.bag.length : 0;
  const badge = $("navPackBadge");
  badge.textContent = bagCount;
  badge.classList.toggle("hidden", bagCount === 0);

  const unclaimedMailCount = (profile.mailbox || []).filter(m => !m.claimed).length;
  const mailBadge = $("navMailBadge");
  mailBadge.textContent = unclaimedMailCount;
  mailBadge.classList.toggle("hidden", unclaimedMailCount === 0);

  $("starterChest").classList.toggle("opened", !!profile.starterOpened);
  $("openStarterBtn").textContent = profile.starterOpened ? "ĐÃ MỞ RƯƠNG" : "MỞ RƯƠNG NGAY ✦";
  $("openStarterBtn").disabled = !!profile.starterOpened;
}

function hideOldStarterChest() {
  const arena = $("mainArena");
  const chestCopy = $("arenaCopyChest");
  const clownHome = $("chibiClownHome");

  if (arena && chestCopy && clownHome) {
    chestCopy.classList.add("hidden");
    clownHome.classList.remove("hidden");
    arena.classList.add("chest-completed");
  }
}

function getRandomStarterCard() {
  const rand = Math.random();
  const targetRarity = rand < 0.60 ? "RARE" : "LEGENDARY";
  const matchingKeys = Object.keys(cards).filter(key => cards[key].rarity === targetRarity);
  return matchingKeys[Math.floor(Math.random() * matchingKeys.length)];
}

function getRandomCardByPackType(packType) {
  const rand = Math.random();
  let targetRarity = "RARE";

  if (packType === "premium") {
    if (rand < 0.25) {
      targetRarity = "RARE";
    } else if (rand < 0.65) {
      targetRarity = "LEGENDARY";
    } else {
      targetRarity = "MYTHICAL";
    }
  } else {
    if (rand < 0.50) {
      targetRarity = "RARE";
    } else if (rand < 0.80) {
      targetRarity = "LEGENDARY";
    } else {
      targetRarity = "MYTHICAL";
    }
  }

  let matchingKeys = Object.keys(cards).filter(key => cards[key].rarity === targetRarity);
  if (matchingKeys.length === 0) {
    matchingKeys = Object.keys(cards);
  }
  return matchingKeys[Math.floor(Math.random() * matchingKeys.length)];
}

$("openStarterBtn").addEventListener("click", () => {
  const profile = getProfile();
  if (!isAdmin && !profile?.starterOpened) {
    showStarterOverlay();
  }
});

function showStarterOverlay() {
  $("starterOverlay").classList.remove("hidden");
  document.body.classList.add("starter-active");

  $("chestStage").classList.remove("hidden");
  $("packStage").classList.add("hidden");
  $("starterResultStage").classList.add("hidden");

  $("starterTitle").textContent = "RƯƠNG TÂN THỦ";
  $("starterDescription").textContent = "Bạn nhận được một rương tân thủ miễn phí!";

  $("starterChestClick").classList.remove("opening");
  $("starterPackClick").classList.remove("tearing");
  pendingCard = null;
}

$("starterChestClick").addEventListener("click", () => {
  $("starterChestClick").classList.add("opening");
  showToast("Rương đang mở...");

  setTimeout(() => {
    $("chestStage").classList.add("hidden");
    $("packStage").classList.remove("hidden");
    $("starterTitle").textContent = "STARTER PACK";
    $("starterDescription").textContent = "Bạn tìm thấy một gói thẻ bài bí ẩn!";
  }, 650);
});

$("starterPackClick").addEventListener("click", () => {
  if (pendingCard) return;

  $("starterPackClick").classList.add("tearing");
  $("starterTitle").textContent = "ĐANG XÉ PACK...";
  $("starterDescription").textContent = "Ánh sáng đang lóe lên!";

  setTimeout(openStarterPack, 850);
});

function openStarterPack() {
  const profile = getProfile();
  if (!profile || profile.starterOpened) return;

  pendingCard = getRandomStarterCard();
  const card = cards[pendingCard];

  profile.cards.push(pendingCard);
  profile.starterOpened = true;

  if (!profile.unlockedAvatars) profile.unlockedAvatars = [DEFAULT_AVATAR, "avt1.png"];
  if (!profile.unlockedAvatars.includes("avt1.png")) {
    profile.unlockedAvatars.push("avt1.png");
  }
  profile.avatar = "avt1.png";

  saveState();

  $("packStage").classList.add("hidden");
  $("starterResultStage").classList.remove("hidden");

  $("starterTitle").textContent = "CHÚC MỪNG!";
  $("starterDescription").textContent = "Bạn đã nhận được một thẻ bài mới!";

  const img = $("starterResultImage");
  img.style.display = "block";
  img.src = card.file;
  img.alt = card.name;
  img.onerror = function () { this.style.display = "none"; };

  $("starterResultName").textContent = card.name;
  $("starterResultRarity").textContent = card.rarity;
  $("starterResultCategory").textContent = CATEGORY_LABELS[card.category] || card.category;

  renderProfile();
}

$("starterFinish").addEventListener("click", () => {
  if (!pendingCard) return;

  $("starterOverlay").classList.add("hidden");
  document.body.classList.remove("starter-active");
  hideOldStarterChest();

  pendingCard = null;
  renderProfile();
  renderAlbum();
  showToast("Đã thêm thẻ bài vào Album!");
});

document.querySelectorAll(".buy-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const packType = btn.dataset.pack;
    const price = packType === "basic" ? 10 : 20;
    const profile = getProfile();

    if (!isAdmin) {
      if (!profile || profile.coins < price) {
        return showToast("Bạn không đủ xu để mua pack!");
      }
      profile.coins -= price;
    }

    profile.bag.push(packType);
    saveState();
    renderProfile();

    const packName = packType === "basic" ? "Basic Pack" : "Premium Pack";
    showToast(`Đã mua ${packName} và cất vào Balo!`);
  });
});

function renderBackpack() {
  const profile = getProfile();
  const bag = profile?.bag || [];

  $("emptyBackpack").classList.toggle("hidden", bag.length > 0);

  $("backpackGrid").innerHTML = bag.map((type, index) => {
    const isPremium = type === "premium";
    return `
      <div class="bag-item" data-index="${index}" data-type="${type}">
        <div class="foil-pack ${isPremium ? "premium-foil" : "basic-foil"}">
          <div class="foil-crimp top"></div>
          <div class="foil-shine"></div>
          <span class="foil-badge">${isPremium ? "GOLD EDITION" : "STANDARD"}</span>
          <div class="foil-emblem">${isPremium ? "✧" : "✦"}</div>
          <div class="foil-title">${isPremium ? "PREMIUM<br>PACK" : "BASIC<br>PACK"}</div>
          <div class="foil-sub">MEME ARENA</div>
          <div class="foil-crimp bottom"></div>
        </div>
        <h4>${isPremium ? "Premium Pack" : "Basic Pack"}</h4>
        <span>Nhấn để xem & mở</span>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".bag-item").forEach(item => {
    item.addEventListener("click", () => {
      const idx = Number(item.dataset.index);
      const type = item.dataset.type;
      openPackZoomModal(idx, type);
    });
  });
}

function openPackZoomModal(index, type) {
  activePackIndex = index;
  activePackType = type;
  isTearingPack = false;

  const isPremium = type === "premium";
  const zoomedEl = $("zoomedPackElement");

  zoomedEl.className = `foil-pack ${isPremium ? "premium-foil" : "basic-foil"} zoomed-pack tearable-pack`;
  $("zoomPackBadge").textContent = isPremium ? "GOLD EDITION" : "STANDARD";
  $("zoomPackEmblem").textContent = isPremium ? "✧" : "✦";
  $("zoomPackTitle").innerHTML = isPremium ? "PREMIUM<br>PACK" : "BASIC<br>PACK";

  $("packOverlayEyebrow").textContent = "UNBOXING";
  $("packOverlayTitle").textContent = isPremium ? "PREMIUM PACK" : "BASIC PACK";
  $("packOverlayDesc").textContent = "Nhấn thêm lần nữa vào gói bài để xé!";

  $("zoomPackStage").classList.remove("hidden");
  $("zoomResultStage").classList.add("hidden");
  $("closePackOverlay").classList.remove("hidden");

  $("packOpenOverlay").classList.remove("hidden");
}

$("zoomedPackElement").addEventListener("click", () => {
  if (isTearingPack || activePackIndex === null) return;
  isTearingPack = true;

  $("closePackOverlay").classList.add("hidden");
  $("zoomedPackElement").classList.add("tearing");
  $("packOverlayTitle").textContent = "ĐANG XÉ PACK...";
  $("packOverlayDesc").textContent = "Thẻ bài bên trong đang lộ diện!";

  setTimeout(() => {
    const profile = getProfile();
    profile.bag.splice(activePackIndex, 1);

    const cardId = getRandomCardByPackType(activePackType);
    const card = cards[cardId];

    if (!isAdmin) {
      profile.cards.push(cardId);
    }

    saveState();
    renderProfile();
    renderBackpack();

    $("zoomPackStage").classList.add("hidden");
    $("zoomResultStage").classList.remove("hidden");

    $("packOverlayEyebrow").textContent = "CONGRATULATIONS!";
    $("packOverlayTitle").textContent = "NHẬN THẺ THÀNH CÔNG";
    $("packOverlayDesc").textContent = "Thẻ bài đã được chuyển vào Album!";

    const img = $("zoomResultImage");
    img.style.display = "block";
    img.src = card.file;
    img.alt = card.name;
    img.onerror = function () { this.style.display = "none"; };

    $("zoomResultName").textContent = card.name;
    $("zoomResultRarity").textContent = card.rarity;
    $("zoomResultCategory").textContent = CATEGORY_LABELS[card.category] || card.category;

    activePackIndex = null;
    isTearingPack = false;
  }, 850);
});

function closePackZoom() {
  if (isTearingPack) return;
  $("packOpenOverlay").classList.add("hidden");
  activePackIndex = null;
}

$("closePackOverlay").addEventListener("click", closePackZoom);
$("zoomFinishBtn").addEventListener("click", closePackZoom);

document.querySelectorAll(".album-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".album-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentAlbumFilter = tab.dataset.filter;
    renderAlbum();
  });
});

function renderAlbum() {
  const profile = getProfile();
  const owned = isAdmin ? Object.keys(cards) : (profile?.cards || []);

  const filtered = owned.filter(id => {
    const card = cards[id];
    if (!card) return false;
    if (currentAlbumFilter === "ALL") return true;
    return card.category === currentAlbumFilter;
  });

  $("emptyAlbum").classList.toggle("hidden", filtered.length > 0);

  $("albumGrid").innerHTML = filtered.map(id => {
    const card = cards[id];
    const catLabel = CATEGORY_LABELS[card.category] || card.category;
    return `
      <article class="owned-card" data-card-id="${id}">
        <img src="${card.file}" alt="${card.name}">
        <h3>${card.name}</h3>
        <small>${card.rarity} · ${catLabel}</small>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".owned-card").forEach(cardEl => {
    cardEl.addEventListener("click", () => {
      const cardId = cardEl.dataset.cardId;
      openCardDetail(cardId);
    });
  });
}

function openCardDetail(cardId) {
  const card = cards[cardId];
  if (!card) return;

  const isCharacter = card.category === "CHARACTER";
  const catLabel = CATEGORY_LABELS[card.category] || card.category;

  if ($("detailCategoryBadge")) $("detailCategoryBadge").textContent = catLabel;
  if ($("detailCardName")) $("detailCardName").textContent = card.name;
  if ($("detailRarity")) $("detailRarity").textContent = card.rarity;

  const img = $("detailCardImage");
  if (img) {
    img.style.display = "block";
    img.src = card.file;
    img.alt = card.name;
    img.onerror = function () { this.style.display = "none"; };
  }

  if ($("detailStatsBox")) {
    $("detailStatsBox").classList.toggle("hidden", !isCharacter);
  }

  if (isCharacter) {
    if ($("detailAtkValue")) $("detailAtkValue").textContent = card.atk ?? 0;
    if ($("detailDefValue")) $("detailDefValue").textContent = card.def ?? 0;
  }

  if ($("cardDetailModal")) {
    $("cardDetailModal").classList.remove("hidden");
  }
}

$("closeCardDetail").addEventListener("click", () => {
  $("cardDetailModal").classList.add("hidden");
});

$("cardDetailModal").addEventListener("click", event => {
  if (event.target === $("cardDetailModal")) {
    $("cardDetailModal").classList.add("hidden");
  }
});

function sendMailToUser(userObj, mailData) {
  if (!Array.isArray(userObj.mailbox)) userObj.mailbox = [];
  const hasRewards = (mailData.coins > 0) || (mailData.packs && mailData.packs.length > 0) || (mailData.cards && mailData.cards.length > 0);
  userObj.mailbox.unshift({
    id: "mail_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    title: mailData.title || "Thư từ Hệ Thống",
    body: mailData.body || "",
    date: new Date().toLocaleString("vi-VN"),
    coins: mailData.coins || 0,
    packs: mailData.packs || [],
    cards: mailData.cards || [],
    claimed: !hasRewards
  });
}

function renderMailbox() {
  const profile = getProfile();
  const mailbox = profile?.mailbox || [];
  const listEl = $("mailList");

  $("emptyMail").classList.toggle("hidden", mailbox.length > 0);

  const hasUnclaimed = mailbox.some(m => !m.claimed);
  $("claimAllMailBtn").classList.toggle("hidden", !hasUnclaimed);

  listEl.innerHTML = mailbox.map((mail, idx) => {
    const basicCount = (mail.packs || []).filter(p => p === "basic").length;
    const premCount = (mail.packs || []).filter(p => p === "premium").length;
    const cardNames = (mail.cards || []).map(cid => cards[cid]?.name || cid);

    let rewardsHtml = "";
    if (mail.coins > 0) rewardsHtml += `<span class="reward-chip">🪙 +${mail.coins} Xu</span>`;
    if (basicCount > 0) rewardsHtml += `<span class="reward-chip">📦 ${basicCount}x Basic Pack</span>`;
    if (premCount > 0) rewardsHtml += `<span class="reward-chip">👑 ${premCount}x Premium Pack</span>`;
    cardNames.forEach(name => {
      rewardsHtml += `<span class="reward-chip">🃏 Thẻ: ${name}</span>`;
    });

    const hasAnyReward = rewardsHtml !== "";

    return `
      <div class="mail-card ${!mail.claimed ? "unclaimed" : ""}">
        <div class="mail-card-top">
          <div>
            <h3>${!mail.claimed ? "📩" : "📨"} ${mail.title}</h3>
            <span class="mail-date">${mail.date}</span>
          </div>
          ${!mail.claimed ? `<span class="mgmt-status-badge">CÓ QUÀ MỚI</span>` : ""}
        </div>
        <p class="mail-body-text">${mail.body}</p>
        ${hasAnyReward ? `<div class="mail-attachments">${rewardsHtml}</div>` : ""}
        <div class="mail-card-footer">
          ${!mail.claimed
            ? `<button class="claim-mail-btn" onclick="claimSingleMail(${idx})">NHẬN QUÀ ✦</button>`
            : (hasAnyReward ? `<span class="claimed-tag">✓ Đã nhận quà</span>` : `<span class="claimed-tag">Đã đọc</span>`)
          }
        </div>
      </div>
    `;
  }).join("");
}

window.claimSingleMail = function (index) {
  const profile = getProfile();
  const mail = profile?.mailbox?.[index];
  if (!mail || mail.claimed) return;

  if (!isAdmin && mail.coins > 0) {
    profile.coins += mail.coins;
  }

  if (Array.isArray(mail.packs) && mail.packs.length > 0) {
    profile.bag.push(...mail.packs);
  }

  if (Array.isArray(mail.cards) && mail.cards.length > 0 && !isAdmin) {
    mail.cards.forEach(cid => {
      if (!profile.cards.includes(cid)) {
        profile.cards.push(cid);
      }
    });
  }

  mail.claimed = true;
  saveState();
  renderProfile();
  renderMailbox();
  showToast("Đã nhận quà và lưu vào Balo / Album!");
};

$("claimAllMailBtn").addEventListener("click", () => {
  const profile = getProfile();
  if (!profile || !profile.mailbox) return;

  let claimedCount = 0;
  profile.mailbox.forEach(mail => {
    if (!mail.claimed) {
      if (!isAdmin && mail.coins > 0) profile.coins += mail.coins;
      if (Array.isArray(mail.packs)) profile.bag.push(...mail.packs);
      if (Array.isArray(mail.cards) && !isAdmin) {
        mail.cards.forEach(cid => {
          if (!profile.cards.includes(cid)) {
            profile.cards.push(cid);
          }
        });
      }
      mail.claimed = true;
      claimedCount++;
    }
  });

  if (claimedCount > 0) {
    saveState();
    renderProfile();
    renderMailbox();
    showToast(`Đã nhận toàn bộ quà từ ${claimedCount} thư!`);
  }
});

document.querySelectorAll('input[name="recipientMode"]').forEach(radio => {
  radio.addEventListener("change", () => {
    const isSelectedMode = radio.value === "selected" && radio.checked;
    $("recipientChecklistBox").classList.toggle("hidden", !isSelectedMode);
  });
});

function renderAdminSendMailScreen() {
  if (!isAdmin) return;

  const usersObj = state.users || {};
  const keys = Object.keys(usersObj);
  const checklistBox = $("recipientChecklistBox");

  if (keys.length === 0) {
    checklistBox.innerHTML = `<small style="color: var(--muted);">Chưa có tài khoản người chơi nào.</small>`;
  } else {
    checklistBox.innerHTML = keys.map(k => `
      <label class="recipient-check-item">
        <input type="checkbox" name="selectedRecipients" value="${k}">
        <span>👤 ${usersObj[k].username}</span>
      </label>
    `).join("");
  }

  $("mailAttachCardsGrid").innerHTML = Object.keys(cards).map(id => {
    const c = cards[id];
    return `
      <div class="gift-card-item" data-card-id="${id}" onclick="toggleGiftCardSelect(this)">
        <img src="${c.file}" alt="${c.name}">
        <div class="gift-card-info">
          <strong>${c.name}</strong>
          <small>${c.rarity}</small>
        </div>
      </div>
    `;
  }).join("");
}

$("adminSendMailForm").addEventListener("submit", e => {
  e.preventDefault();
  if (!isAdmin) return;

  const mode = document.querySelector('input[name="recipientMode"]:checked').value;
  let targetKeys = [];

  if (mode === "all") {
    targetKeys = Object.keys(state.users || {});
    if (targetKeys.length === 0) {
      return showToast("Hiện chưa có tài khoản người chơi nào để gửi!");
    }
  } else {
    targetKeys = Array.from(document.querySelectorAll('input[name="selectedRecipients"]:checked')).map(cb => cb.value);
    if (targetKeys.length === 0) {
      return showToast("Vui lòng tích chọn ít nhất 1 tài khoản nhận thư!");
    }
  }

  const title = $("mailSubjectInput").value.trim();
  const body = $("mailBodyInput").value.trim();
  const coins = Math.max(0, parseInt($("mailAttachCoins").value) || 0);
  const basicQty = Math.max(0, parseInt($("mailAttachBasic").value) || 0);
  const premQty = Math.max(0, parseInt($("mailAttachPremium").value) || 0);

  const packs = [];
  for (let i = 0; i < basicQty; i++) packs.push("basic");
  for (let i = 0; i < premQty; i++) packs.push("premium");

  const selectedCardIds = Array.from(document.querySelectorAll("#mailAttachCardsGrid .gift-card-item.selected"))
    .map(el => el.dataset.cardId);

  targetKeys.forEach(k => {
    const userObj = state.users[k];
    if (userObj) {
      sendMailToUser(userObj, {
        title,
        body,
        coins,
        packs,
        cards: selectedCardIds
      });
    }
  });

  saveState();

  $("mailSubjectInput").value = "";
  $("mailBodyInput").value = "";
  $("mailAttachCoins").value = "0";
  $("mailAttachBasic").value = "0";
  $("mailAttachPremium").value = "0";
  document.querySelectorAll("#mailAttachCardsGrid .gift-card-item.selected").forEach(el => el.classList.remove("selected"));

  showToast(`Đã gửi thư thành công cho ${targetKeys.length} tài khoản!`);
});

function renderAdminUserManagement() {
  if (!isAdmin) return;
  const usersObj = state.users || {};
  const keys = Object.keys(usersObj);
  const container = $("adminUserManagementList");

  if (keys.length === 0) {
    container.innerHTML = `<p class="empty-state">Chưa có người chơi nào đăng ký tài khoản.</p>`;
    return;
  }

  container.innerHTML = keys.map(key => {
    const u = usersObj[key];
    const isBanned = !!u.banned;
    const cardCount = u.cards ? u.cards.length : 0;
    const packCount = u.bag ? u.bag.length : 0;

    return `
      <div class="admin-mgmt-card ${isBanned ? "banned-card" : ""}">
        <div class="mgmt-header">
          <strong>👤 ${u.username}</strong>
          <span class="mgmt-status-badge ${isBanned ? "banned" : ""}">
            ${isBanned ? "ĐÃ BỊ BAN" : "HOẠT ĐỘNG"}
          </span>
        </div>
        <small style="color: var(--muted); font-size: 11px;">📧 ${u.email || "Không có email"}</small>

        <div class="mgmt-stats">
          <span>🪙 Xu: <b>${u.coins}</b></span>
          <span>🃏 Thẻ: <b>${cardCount}</b></span>
          <span>🎒 Pack: <b>${packCount}</b></span>
        </div>

        <div class="mgmt-actions">
          <div class="mgmt-btn-row">
            <button class="mgmt-btn" onclick="adminAdjustCoins('${key}', 10)">+10 Xu</button>
            <button class="mgmt-btn" onclick="adminAdjustCoins('${key}', -10)">-10 Xu</button>
            <button class="mgmt-btn gift-btn" onclick="openAdminGiftModal('${key}')">🎁 Tặng Quà</button>
          </div>
          <div class="mgmt-btn-row">
            ${isBanned
              ? `<button class="mgmt-btn unban-btn" onclick="adminToggleBan('${key}')">Gỡ Ban</button>`
              : `<button class="mgmt-btn ban-btn" onclick="adminToggleBan('${key}')">Ban TK</button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join("");
}

window.adminAdjustCoins = function (userKey, amount) {
  const u = state.users[userKey];
  if (!u) return;
  u.coins = Math.max(0, u.coins + amount);
  saveState();
  renderAdminUserManagement();
  showToast(`Đã cập nhật xu cho ${u.username}!`);
};

window.adminToggleBan = function (userKey) {
  const u = state.users[userKey];
  if (!u) return;
  u.banned = !u.banned;
  saveState();
  renderAdminUserManagement();
  showToast(u.banned ? `Đã ban tài khoản ${u.username}!` : `Đã mở khóa cho ${u.username}!`);
};

window.openAdminGiftModal = function (userKey) {
  targetGiftUserKey = userKey;
  const u = state.users[userKey];
  if (!u) return;

  $("giftModalTitle").textContent = `Tặng quà cho: ${u.username}`;
  $("giftBasicPackQty").value = "0";
  $("giftPremiumPackQty").value = "0";

  const ownedCards = u.cards || [];
  const unownedKeys = Object.keys(cards).filter(id => !ownedCards.includes(id));
  const container = $("giftCardsContainer");

  if (unownedKeys.length === 0) {
    container.innerHTML = `<p class="empty-state" style="grid-column: span 2; padding: 20px;">Người chơi đã sở hữu tất cả thẻ bài!</p>`;
  } else {
    container.innerHTML = unownedKeys.map(id => {
      const card = cards[id];
      return `
        <div class="gift-card-item" data-card-id="${id}" onclick="toggleGiftCardSelect(this)">
          <img src="${card.file}" alt="${card.name}">
          <div class="gift-card-info">
            <strong>${card.name}</strong>
            <small>${card.rarity}</small>
          </div>
        </div>
      `;
    }).join("");
  }

  $("adminGiftModal").classList.remove("hidden");
};

window.toggleGiftCardSelect = function (el) {
  el.classList.toggle("selected");
};

$("closeAdminGiftModal").addEventListener("click", () => {
  $("adminGiftModal").classList.add("hidden");
  if ($("trainingGuideModal")) $("trainingGuideModal").classList.add("hidden");
  targetGiftUserKey = null;
});

$("confirmGiftBtn").addEventListener("click", () => {
  if (!targetGiftUserKey) return;
  const u = state.users[targetGiftUserKey];
  if (!u) return;

  const basicQty = Math.max(0, parseInt($("giftBasicPackQty").value) || 0);
  const premQty = Math.max(0, parseInt($("giftPremiumPackQty").value) || 0);

  const packs = [];
  for (let i = 0; i < basicQty; i++) packs.push("basic");
  for (let i = 0; i < premQty; i++) packs.push("premium");

  const selectedCardIds = Array.from(document.querySelectorAll("#giftCardsContainer .gift-card-item.selected"))
    .map(el => el.dataset.cardId);

  if (packs.length === 0 && selectedCardIds.length === 0) {
    return showToast("Vui lòng chọn ít nhất 1 Pack hoặc Thẻ bài để tặng!");
  }

  sendMailToUser(u, {
    title: "🎁 Quà tặng đặc biệt từ Admin",
    body: "Admin đã gửi tặng bạn phần quà đặc biệt. Hãy nhấn Nhận Quà để cất vào Balo và Album nhé!",
    coins: 0,
    packs,
    cards: selectedCardIds
  });

  saveState();
  $("adminGiftModal").classList.add("hidden");
  if ($("trainingGuideModal")) $("trainingGuideModal").classList.add("hidden");
  renderAdminUserManagement();
  showToast(`Đã gửi quà vào hòm thư của ${u.username}!`);
  targetGiftUserKey = null;
});

window.exportDataBackup = function () {
  const exportPayload = isAdmin ? state : {
    users: currentUser && state.users[currentUser] ? { [currentUser]: state.users[currentUser] } : {},
    active: null,
    adminMailbox: []
  };
  const fileName = isAdmin ? "meme_card_arena_backup.json" : `meme_card_arena_${currentUser || "player"}_backup.json`;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("Đã xuất file backup thành công!");
};

window.importDataBackup = async function (event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  try {
    let mergedUsers = { ...(state.users || {}) };
    let mergedMailbox = [...(state.adminMailbox || [])];

    for (let file of files) {
      const text = await file.text();
      const importedState = JSON.parse(text);

      if (importedState && importedState.users) {
        mergedUsers = { ...mergedUsers, ...importedState.users };
        if (Array.isArray(importedState.adminMailbox)) {
          mergedMailbox = [...mergedMailbox, ...importedState.adminMailbox];
        }
      }
    }

    state.users = mergedUsers;
    state.adminMailbox = mergedMailbox;
    saveState();

    renderAdminUserManagement();
    showToast(`Đã gộp và nhập thành công ${files.length} file backup!`);
  } catch (err) {
    showToast("Lỗi đọc file JSON!");
  }

  event.target.value = "";
};

/* ========================================================================== */
/* HỆ THỐNG CHIẾN ĐẤU: HIỆU ỨNG TỪNG LÁ, ĐỔI TRẮNG THAY ĐEN, CHU CẤP 5M,  */
/* BỎ CON, MÚA QUẠT, SÀM SỠ & HỒI CHIỀU TRỜI MƯA (MƯA RƠI 3 VÒNG)           */
/* ========================================================================== */

let rainOverlayInterval = null;

function ensureRainKeyframes() {
  if ($("arenaRainKeyframesStyle")) return;
  const style = document.createElement("style");
  style.id = "arenaRainKeyframesStyle";
  style.textContent = `
    @keyframes arenaRainFall {
      0% {
        transform: translate3d(0, -30px, 0) rotate(12deg);
        opacity: 0.9;
      }
      100% {
        transform: translate3d(-24px, calc(100vh + 40px), 0) rotate(12deg);
        opacity: 0.25;
      }
    }
  `;
  document.head.appendChild(style);
}

function removeArenaRainOverlay() {
  if (rainOverlayInterval) {
    clearInterval(rainOverlayInterval);
    rainOverlayInterval = null;
  }
  const layer = $("arenaRainWeatherOverlay");
  if (layer) layer.remove();
  const hudBadge = $("arenaRainHudBadge");
  if (hudBadge) hudBadge.remove();
}

function syncArenaRainWeatherOverlay() {
  const hasActiveRain = battleDeckState.playerRainTurnsLeft > 0 || battleDeckState.botRainTurnsLeft > 0;
  if (!hasActiveRain) {
    removeArenaRainOverlay();
    return;
  }

  ensureRainKeyframes();

  let layer = $("arenaRainWeatherOverlay");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "arenaRainWeatherOverlay";
    layer.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9996;
      overflow: hidden;
      background: linear-gradient(180deg, rgba(14, 165, 233, 0.14) 0%, rgba(15, 23, 42, 0.22) 100%);
    `;
    document.body.appendChild(layer);
  }

  if (!rainOverlayInterval) {
    const spawnDrop = () => {
      const currentLayer = $("arenaRainWeatherOverlay");
      if (!currentLayer) return;

      const drop = document.createElement("div");
      const leftPct = Math.random() * 100;
      const durationMs = 550 + Math.random() * 450;
      const heightPx = 18 + Math.random() * 18;
      const delayMs = -(Math.random() * 400);

      drop.style.cssText = `
        position: absolute;
        left: ${leftPct}%;
        top: 0;
        width: 3px;
        height: ${heightPx}px;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(224, 242, 254, 0.95), rgba(56, 189, 248, 0.55));
        box-shadow: 0 0 6px rgba(125, 211, 252, 0.7);
        pointer-events: none;
        animation: arenaRainFall ${durationMs}ms linear ${delayMs}ms infinite;
      `;

      currentLayer.appendChild(drop);
      setTimeout(() => drop.remove(), 4500);
    };

    for (let i = 0; i < 45; i++) {
      spawnDrop();
    }

    rainOverlayInterval = setInterval(() => {
      for (let i = 0; i < 6; i++) spawnDrop();
    }, 120);
  }

  let badge = $("arenaRainHudBadge");
  if (!badge) {
    badge = document.createElement("div");
    badge.id = "arenaRainHudBadge";
    badge.style.cssText = `
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 9997;
      pointer-events: none;
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(2, 132, 199, 0.92);
      border: 1px solid rgba(186, 230, 253, 0.8);
      color: #f0f9ff;
      font-size: 12px;
      font-weight: 700;
    `;
    document.body.appendChild(badge);
  }

  badge.textContent = `🌧️ Trời Mưa — Bạn: ${battleDeckState.playerRainTurnsLeft}v | Bot: ${battleDeckState.botRainTurnsLeft}v`;
}

function cleanupBattleFxOverlays(forceRemoveRain = false) {
  document.querySelectorAll(
    ".screen-floating-number, .zero-def-fx-badge, .jail-cage-overlay, .money-stack-fx, .smoke-cloud-fx, .baby-abandon-fx, .fan-hand-fx, .sam-so-fx-layer, .swap-cards-fx-layer"
  ).forEach(el => el.remove());
  document.querySelectorAll(".card-zoom-active, .card-blink-hit, .card-blown-away").forEach(el => {
    el.classList.remove("card-zoom-active", "card-blink-hit", "card-blown-away");
  });
  if (forceRemoveRain) {
    removeArenaRainOverlay();
  }
}

function ensureBattleScoreHud() {
  const boardMain = document.querySelector(".tcg-board-main");
  if (!boardMain || $("battleCalcHud")) return;

  const hud = document.createElement("div");
  hud.id = "battleCalcHud";
  hud.className = "calc-scoreboard-strip hidden";
  hud.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      <span style="color: #8ef0c1;">ĐIỂM BẠN:</span>
      <span id="playerCalcPill" class="calc-score-pill">
        <span id="playerCalcTotal" class="calc-score-value">0</span>
        <small id="playerCalcFormula" style="color: var(--muted); font-size: 11px;"></small>
      </span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      <span style="color: #ff6b8b;">ĐIỂM BOT:</span>
      <span id="botCalcPill" class="calc-score-pill">
        <span id="botCalcTotal" class="calc-score-value">0</span>
        <small id="botCalcFormula" style="color: var(--muted); font-size: 11px;"></small>
      </span>
    </div>
  `;

  const timerRow = boardMain.children[1] || null;
  if (timerRow) {
    boardMain.insertBefore(hud, timerRow);
  } else {
    boardMain.appendChild(hud);
  }
}

function resetBattleScoreHud(show = false) {
  ensureBattleScoreHud();
  const hud = $("battleCalcHud");
  if (!hud) return;
  hud.classList.toggle("hidden", !show);
  if ($("playerCalcTotal")) $("playerCalcTotal").textContent = "0";
  if ($("playerCalcFormula")) $("playerCalcFormula").textContent = "";
  if ($("botCalcTotal")) $("botCalcTotal").textContent = "0";
  if ($("botCalcFormula")) $("botCalcFormula").textContent = "";
}

function animateScoreNumber(el, startVal, endVal, duration = 420) {
  if (!el) return;
  const startTime = performance.now();
  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const current = Math.round(startVal + (endVal - startVal) * progress);
    el.textContent = String(current);
    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = String(endVal);
    }
  }
  requestAnimationFrame(frame);
}

function getSlotElementByKey(slotKey) {
  const map = {
    P_CHAR: "placedCharacterContent",
    P_SKILL: "placedSkillContent",
    P_SIT: "placedSituationContent",
    B_CHAR: "botPlacedCharacterContent",
    B_SKILL: "botPlacedSkillContent",
    B_SIT: "botPlacedSituationContent"
  };
  const inner = $(map[slotKey]);
  return inner ? inner.closest(".board-slot-vertical") : null;
}

function spawnScreenFloatingNumber(targetSlotEl, text, tone = "pos", offsetY = -12) {
  if (!targetSlotEl) return;
  const rect = targetSlotEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + offsetY;

  const badge = document.createElement("div");
  badge.className = `screen-floating-number ${tone}`;
  badge.style.left = `${centerX}px`;
  badge.style.top = `${centerY}px`;
  badge.textContent = text;

  document.body.appendChild(badge);
  setTimeout(() => badge.remove(), 1180);
}

async function zoomCardAndFloatScore({ slotKey, targetSide, prevScore, nextScore, badgeText, tone = "pos" }) {
  const slotEl = getSlotElementByKey(slotKey);
  const totalEl = $(targetSide === "player" ? "playerCalcTotal" : "botCalcTotal");
  const formulaEl = $(targetSide === "player" ? "playerCalcFormula" : "botCalcFormula");
  const pillEl = $(targetSide === "player" ? "playerCalcPill" : "botCalcPill");

  if (slotEl) {
    slotEl.classList.add("card-zoom-active");
  }
  await sleep(220);

  if (slotEl && badgeText) {
    spawnScreenFloatingNumber(slotEl, badgeText, tone, -10);
  }

  if (pillEl) pillEl.classList.add("bump");
  if (formulaEl && badgeText) {
    formulaEl.textContent = formulaEl.textContent ? `${formulaEl.textContent} ${badgeText}` : badgeText;
  }

  animateScoreNumber(totalEl, prevScore, nextScore, 420);
  await sleep(620);

  if (slotEl) {
    slotEl.classList.remove("card-zoom-active");
  }
  if (pillEl) {
    pillEl.classList.remove("bump");
  }
  await sleep(160);
}

/* Hiệu ứng tráo đổi các lá trên bàn cờ khi dùng Đổi Trắng Thay Đen */
async function triggerSwapBoardCardsEffect(pairs) {
  const fxLayer = document.createElement("div");
  fxLayer.className = "swap-cards-fx-layer";
  fxLayer.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9998;
  `;
  document.body.appendChild(fxLayer);

  const flyers = [];

  for (const pair of pairs) {
    const elA = getSlotElementByKey(pair.slotA);
    const elB = getSlotElementByKey(pair.slotB);
    if (!elA || !elB) continue;

    const rA = elA.getBoundingClientRect();
    const rB = elB.getBoundingClientRect();

    if (pair.cardIdA && cards[pair.cardIdA]) {
      const cA = cards[pair.cardIdA];
      const flyA = document.createElement("div");
      flyA.style.cssText = `
        position: fixed;
        left: ${rA.left}px;
        top: ${rA.top}px;
        width: ${rA.width}px;
        height: ${rA.height}px;
        border-radius: 10px;
        overflow: hidden;
        border: 2px solid #facc15;
        background: #0f172a;
        z-index: 9999;
        transition: left 0.65s cubic-bezier(0.22, 1, 0.36, 1), top 0.65s cubic-bezier(0.22, 1, 0.36, 1), transform 0.65s ease;
      `;
      flyA.innerHTML = `<img src="${cA.file}" alt="${cA.name}" style="width:100%;height:100%;object-fit:cover;display:block;">`;
      fxLayer.appendChild(flyA);
      flyers.push({ el: flyA, targetX: rB.left, targetY: rB.top });
    }

    if (pair.cardIdB && cards[pair.cardIdB]) {
      const cB = cards[pair.cardIdB];
      const flyB = document.createElement("div");
      flyB.style.cssText = `
        position: fixed;
        left: ${rB.left}px;
        top: ${rB.top}px;
        width: ${rB.width}px;
        height: ${rB.height}px;
        border-radius: 10px;
        overflow: hidden;
        border: 2px solid #38bdf8;
        background: #0f172a;
        z-index: 9999;
        transition: left 0.65s cubic-bezier(0.22, 1, 0.36, 1), top 0.65s cubic-bezier(0.22, 1, 0.36, 1), transform 0.65s ease;
      `;
      flyB.innerHTML = `<img src="${cB.file}" alt="${cB.name}" style="width:100%;height:100%;object-fit:cover;display:block;">`;
      fxLayer.appendChild(flyB);
      flyers.push({ el: flyB, targetX: rA.left, targetY: rA.top });
    }
  }

  const centerBadge = document.createElement("div");
  centerBadge.style.cssText = `
    position: fixed;
    left: 50%;
    top: 46%;
    transform: translate(-50%, -50%) scale(0.85);
    padding: 8px 16px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.94);
    border: 1.5px solid #facc15;
    color: #fef08a;
    font-size: 13px;
    font-weight: 800;
    z-index: 10000;
    transition: transform 0.3s ease, opacity 0.3s ease;
  `;
  centerBadge.textContent = "🔄 ĐỔI TRẮNG THAY ĐEN";
  fxLayer.appendChild(centerBadge);

  await sleep(90);

  centerBadge.style.transform = "translate(-50%, -50%) scale(1.08)";
  flyers.forEach((item, idx) => {
    const dir = idx % 2 === 0 ? 14 : -14;
    item.el.style.left = `${item.targetX}px`;
    item.el.style.top = `${item.targetY}px`;
    item.el.style.transform = `rotate(${dir}deg) scale(1.06)`;
  });

  await sleep(680);

  renderBattleSlots();

  flyers.forEach(item => {
    item.el.style.opacity = "0";
  });
  centerBadge.style.opacity = "0";

  await sleep(280);
  fxLayer.remove();
}

/* Hiệu ứng Sàm Sỡ: cặp ngực đi tới đối phương và có bàn tay xoa lên mục tiêu */
async function triggerSamSoEffect(sourceSkillSlotKey, opponentCharSlotKey, oppSide, oppStatChoice, prevScore, nextScore, actualDelta) {
  const sourceEl = getSlotElementByKey(sourceSkillSlotKey);
  const targetEl = getSlotElementByKey(opponentCharSlotKey);
  if (!sourceEl || !targetEl) return;

  const sRect = sourceEl.getBoundingClientRect();
  const tRect = targetEl.getBoundingClientRect();

  const startX = sRect.left + sRect.width / 2;
  const startY = sRect.top + sRect.height / 2;
  const endX = tRect.left + tRect.width / 2;
  const endY = tRect.top + tRect.height / 2;

  const fxWrap = document.createElement("div");
  fxWrap.className = "sam-so-fx-layer";
  fxWrap.style.cssText = `
    position: fixed;
    left: ${startX}px;
    top: ${startY}px;
    z-index: 9998;
    pointer-events: none;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 110px;
    height: 70px;
  `;

  fxWrap.innerHTML = `
    <svg viewBox="0 0 140 80" width="104" height="60">
      <defs>
        <radialGradient id="skinShade" cx="42%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ffe4d6"/>
          <stop offset="65%" stop-color="#f7bea5"/>
          <stop offset="100%" stop-color="#df9678"/>
        </radialGradient>
      </defs>
      <circle cx="44" cy="42" r="28" fill="url(#skinShade)" stroke="#c97a5b" stroke-width="2"/>
      <circle cx="96" cy="42" r="28" fill="url(#skinShade)" stroke="#c97a5b" stroke-width="2"/>
      <path d="M 67 24 Q 70 44 67 60" fill="none" stroke="#c97a5b" stroke-width="2" stroke-linecap="round"/>
      <circle cx="42" cy="44" r="6" fill="#d97b74" opacity="0.85"/>
      <circle cx="42" cy="44" r="2.4" fill="#b85650"/>
      <circle cx="98" cy="44" r="6" fill="#d97b74" opacity="0.85"/>
      <circle cx="98" cy="44" r="2.4" fill="#b85650"/>
    </svg>
    <span class="sam-so-hand" style="position:absolute; right:8px; bottom:2px; font-size:34px; transform-origin:center;">✋</span>
  `;

  document.body.appendChild(fxWrap);

  await sleep(120);

  fxWrap.style.transition = "left 0.65s cubic-bezier(0.22, 1, 0.36, 1), top 0.65s cubic-bezier(0.22, 1, 0.36, 1)";
  fxWrap.style.left = `${endX}px`;
  fxWrap.style.top = `${endY}px`;

  await sleep(660);

  const handEl = fxWrap.querySelector(".sam-so-hand");
  if (handEl) {
    handEl.style.transition = "transform 0.22s ease-in-out";
    for (let i = 0; i < 3; i++) {
      handEl.style.transform = "translate(-26px, -8px) rotate(-16deg) scale(1.14)";
      await sleep(220);
      handEl.style.transform = "translate(6px, 6px) rotate(14deg) scale(1.14)";
      await sleep(220);
    }
    handEl.style.transform = "translate(0, 0) rotate(0deg) scale(1)";
  }

  targetEl.classList.add("card-blink-hit");
  spawnScreenFloatingNumber(targetEl, `😳 ${actualDelta} ${oppStatChoice}`, "neg", -18);

  const totalEl = $(oppSide === "player" ? "playerCalcTotal" : "botCalcTotal");
  const formulaEl = $(oppSide === "player" ? "playerCalcFormula" : "botCalcFormula");
  const pillEl = $(oppSide === "player" ? "playerCalcPill" : "botCalcPill");

  if (pillEl) pillEl.classList.add("bump");
  if (formulaEl) {
    formulaEl.textContent = formulaEl.textContent ? `${formulaEl.textContent} (${actualDelta})` : `(${actualDelta})`;
  }
  animateScoreNumber(totalEl, prevScore, nextScore, 420);

  await sleep(550);

  fxWrap.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  fxWrap.style.opacity = "0";
  fxWrap.style.transform = "translate(-50%, -65%) scale(0.8)";
  await sleep(320);

  fxWrap.remove();
  targetEl.classList.remove("card-blink-hit");
  if (pillEl) pillEl.classList.remove("bump");
  await sleep(140);
}

/* Hiệu ứng Trời Mưa kéo dài 3 vòng: mỗi vòng cộng 10 điểm cho bên kích hoạt */
async function applyRainWeatherBonus(side, charSlotKey, currentScore) {
  const isPlayer = side === "player";
  const turnsLeft = isPlayer ? battleDeckState.playerRainTurnsLeft : battleDeckState.botRainTurnsLeft;
  if (turnsLeft <= 0) {
    syncArenaRainWeatherOverlay();
    return currentScore;
  }

  syncArenaRainWeatherOverlay();

  const prevScore = currentScore;
  const nextScore = currentScore + 10;

  if (isPlayer) {
    battleDeckState.playerRainTurnsLeft = Math.max(0, battleDeckState.playerRainTurnsLeft - 1);
  } else {
    battleDeckState.botRainTurnsLeft = Math.max(0, battleDeckState.botRainTurnsLeft - 1);
  }

  const remainingAfter = isPlayer ? battleDeckState.playerRainTurnsLeft : battleDeckState.botRainTurnsLeft;
  const targetEl = getSlotElementByKey(charSlotKey);
  const totalEl = $(isPlayer ? "playerCalcTotal" : "botCalcTotal");
  const formulaEl = $(isPlayer ? "playerCalcFormula" : "botCalcFormula");
  const pillEl = $(isPlayer ? "playerCalcPill" : "botCalcPill");

  if (targetEl) {
    spawnScreenFloatingNumber(targetEl, `🌧️ +10 Mưa (${remainingAfter}v)`, "pos", -22);
  }
  if (pillEl) pillEl.classList.add("bump");
  if (formulaEl) {
    formulaEl.textContent = formulaEl.textContent ? `${formulaEl.textContent} +10(🌧️)` : "+10(🌧️)";
  }
  animateScoreNumber(totalEl, prevScore, nextScore, 420);

  logAdvancedBattle(
    isPlayer
      ? `🌧️ [Trời Mưa] Cộng +10 điểm cho Bạn (còn ${remainingAfter} vòng hiệu lực) -> ${nextScore}`
      : `🌧️ [Trời Mưa] Cộng +10 điểm cho Bot (còn ${remainingAfter} vòng hiệu lực) -> ${nextScore}`
  );

  await sleep(620);
  if (pillEl) pillEl.classList.remove("bump");

  syncArenaRainWeatherOverlay();

  await sleep(140);

  return nextScore;
}

/* 1. HIỆU ỨNG CHU CẤP 5 TRIỆU */
async function triggerFiveMillionMoneyEffect(sourceSkillSlotKey, opponentCharSlotKey, oppSide, prevScore, nextScore, zeroDefApplied) {
  const sourceEl = getSlotElementByKey(sourceSkillSlotKey);
  const targetEl = getSlotElementByKey(opponentCharSlotKey);
  if (!sourceEl || !targetEl) return;

  const sRect = sourceEl.getBoundingClientRect();
  const tRect = targetEl.getBoundingClientRect();

  const startX = sRect.left + sRect.width / 2;
  const startY = sRect.top + sRect.height / 2;
  const endX = tRect.left + tRect.width / 2;
  const endY = tRect.top + tRect.height / 2;

  const moneyEl = document.createElement("div");
  moneyEl.className = "money-stack-fx";
  moneyEl.innerHTML = `<span class="money-bill-icon">💵</span><span class="money-bill-text">5 TRIỆU</span>`;
  moneyEl.style.left = `${startX}px`;
  moneyEl.style.top = `${startY}px`;
  document.body.appendChild(moneyEl);

  await sleep(140);

  moneyEl.style.transition = "left 0.65s cubic-bezier(0.22, 1, 0.36, 1), top 0.65s cubic-bezier(0.22, 1, 0.36, 1), transform 0.65s ease";
  moneyEl.style.left = `${endX}px`;
  moneyEl.style.top = `${endY}px`;
  moneyEl.style.transform = "translate(-50%, -50%) scale(1.22) rotate(8deg)";

  await sleep(660);

  moneyEl.remove();
  const smokeEl = document.createElement("div");
  smokeEl.className = "smoke-cloud-fx";
  smokeEl.style.left = `${endX}px`;
  smokeEl.style.top = `${endY}px`;
  smokeEl.innerHTML = `<span>💨</span><span>☁️</span><span>💨</span>`;
  document.body.appendChild(smokeEl);
  setTimeout(() => smokeEl.remove(), 950);

  targetEl.classList.add("card-blink-hit");

  if (zeroDefApplied) {
    const totalEl = $(oppSide === "player" ? "playerCalcTotal" : "botCalcTotal");
    const formulaEl = $(oppSide === "player" ? "playerCalcFormula" : "botCalcFormula");
    const pillEl = $(oppSide === "player" ? "playerCalcPill" : "botCalcPill");

    const zeroBadge = document.createElement("div");
    zeroBadge.className = "zero-def-fx-badge";
    zeroBadge.style.left = `${endX}px`;
    zeroBadge.style.top = `${endY - 26}px`;
    zeroBadge.textContent = "⚡ DEF = 0!";
    document.body.appendChild(zeroBadge);
    setTimeout(() => zeroBadge.remove(), 1200);

    if (pillEl) pillEl.classList.add("bump");
    if (formulaEl) {
      formulaEl.textContent = formulaEl.textContent ? `${formulaEl.textContent} (DEF->0)` : "(DEF->0)";
    }
    animateScoreNumber(totalEl, prevScore, nextScore, 420);
  }

  await sleep(950);
  targetEl.classList.remove("card-blink-hit");
  const pillEl = $(oppSide === "player" ? "playerCalcPill" : "botCalcPill");
  if (pillEl) pillEl.classList.remove("bump");
  await sleep(140);
}

/* 2. HIỆU ỨNG MÚA QUẠT */
async function triggerFanBlowAwayEffect(sourceSkillSlotKey, opponentCharSlotKey) {
  const sourceEl = getSlotElementByKey(sourceSkillSlotKey);
  const targetEl = getSlotElementByKey(opponentCharSlotKey);
  if (!sourceEl || !targetEl) return;

  const sRect = sourceEl.getBoundingClientRect();
  const fanHand = document.createElement("div");
  fanHand.className = "fan-hand-fx";
  fanHand.style.left = `${sRect.left + sRect.width / 2}px`;
  fanHand.style.top = `${sRect.top + sRect.height / 2}px`;
  fanHand.innerHTML = `<span class="fan-hand-emoji">🤚🪭</span><span class="fan-wind-gust">🌬️💨</span>`;
  document.body.appendChild(fanHand);

  await sleep(550);

  targetEl.classList.add("card-blown-away");
  spawnScreenFloatingNumber(targetEl, "💨 THỔI BAY!", "neg", -14);

  await sleep(1000);

  targetEl.classList.remove("card-blown-away");
  fanHand.remove();
  await sleep(220);
}

/* 3. HIỆU ỨNG BỎ CON */
async function triggerAbandonBabyEffect(sourceSitSlotKey, opponentCharSlotKey, oppSide, oppStatChoice, prevScore, nextScore, actualDelta) {
  const sourceEl = getSlotElementByKey(sourceSitSlotKey);
  const targetEl = getSlotElementByKey(opponentCharSlotKey);
  if (!sourceEl || !targetEl) return;

  const sRect = sourceEl.getBoundingClientRect();
  const tRect = targetEl.getBoundingClientRect();

  const startX = sRect.left + sRect.width / 2;
  const startY = sRect.top + sRect.height / 2;
  const endX = tRect.left + tRect.width / 2;
  const endY = tRect.top + tRect.height / 2;

  const babyWrap = document.createElement("div");
  babyWrap.className = "baby-abandon-fx";
  babyWrap.style.left = `${startX}px`;
  babyWrap.style.top = `${startY}px`;
  babyWrap.innerHTML = `
    <span class="baby-emoji">👶</span>
    <span class="baby-red-x">❌</span>
  `;
  document.body.appendChild(babyWrap);

  await sleep(120);

  babyWrap.style.transition = "left 0.6s cubic-bezier(0.22, 1, 0.36, 1), top 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
  babyWrap.style.left = `${endX}px`;
  babyWrap.style.top = `${endY}px`;

  await sleep(620);

  const redX = babyWrap.querySelector(".baby-red-x");
  if (redX) redX.classList.add("stamp-in");

  const totalEl = $(oppSide === "player" ? "playerCalcTotal" : "botCalcTotal");
  const formulaEl = $(oppSide === "player" ? "playerCalcFormula" : "botCalcFormula");
  const pillEl = $(oppSide === "player" ? "playerCalcPill" : "botCalcPill");

  const labelText = `${actualDelta} ${oppStatChoice}`;
  spawnScreenFloatingNumber(targetEl, labelText, "neg", -16);
  if (pillEl) pillEl.classList.add("bump");
  if (formulaEl) {
    formulaEl.textContent = formulaEl.textContent ? `${formulaEl.textContent} (${actualDelta})` : `(${actualDelta})`;
  }
  animateScoreNumber(totalEl, prevScore, nextScore, 420);

  await sleep(550);

  babyWrap.classList.add("vanish-out");
  await sleep(420);
  babyWrap.remove();

  if (pillEl) pillEl.classList.remove("bump");
  await sleep(140);
}

/* 4. HIỆU ỨNG VÀO TÙ */
async function triggerJailCageOnOpponentChar(opponentCharSlotKey, oppSide, prevScore, nextScore, delta) {
  const oppCharEl = getSlotElementByKey(opponentCharSlotKey);
  const totalEl = $(oppSide === "player" ? "playerCalcTotal" : "botCalcTotal");
  const formulaEl = $(oppSide === "player" ? "playerCalcFormula" : "botCalcFormula");
  const pillEl = $(oppSide === "player" ? "playerCalcPill" : "botCalcPill");

  let cageEl = null;
  if (oppCharEl) {
    const rect = oppCharEl.getBoundingClientRect();
    cageEl = document.createElement("div");
    cageEl.className = "jail-cage-overlay";
    cageEl.style.left = `${rect.left}px`;
    cageEl.style.top = `${rect.top}px`;
    cageEl.style.width = `${rect.width}px`;
    cageEl.style.height = `${rect.height}px`;
    cageEl.innerHTML = `<span class="jail-cage-label">🔒 VÀO TÙ</span>`;
    document.body.appendChild(cageEl);

    spawnScreenFloatingNumber(oppCharEl, `${delta} (Bị nhốt)`, "neg", -14);
  }

  if (pillEl) pillEl.classList.add("bump");
  if (formulaEl) {
    formulaEl.textContent = formulaEl.textContent ? `${formulaEl.textContent} ${delta}` : `${delta}`;
  }

  animateScoreNumber(totalEl, prevScore, nextScore, 420);
  await sleep(900);

  if (pillEl) pillEl.classList.remove("bump");
  if (cageEl) {
    cageEl.style.transition = "opacity 0.35s ease";
    cageEl.style.opacity = "0";
    setTimeout(() => cageEl.remove(), 360);
  }
  await sleep(180);
}

function startAdvancedPveBattle() {
  const profile = getProfile();
  const ownedCards = isAdmin ? Object.keys(cards) : (profile?.cards || []);

  if (ownedCards.length === 0) {
    return showToast("Bạn cần có ít nhất 1 thẻ bài trong Album để vào sân đấu!");
  }

  cleanupBattleFxOverlays(true);

  battleDeckState.botHp = 250;
  battleDeckState.maxBotHp = 250;
  battleDeckState.playerHp = 250;
  battleDeckState.maxPlayerHp = 250;
  battleDeckState.selectedSkill = null;
  battleDeckState.selectedCharacter = null;
  battleDeckState.selectedSituation = null;
  battleDeckState.botSelectedSkill = null;
  battleDeckState.botSelectedCharacter = null;
  battleDeckState.botSelectedSituation = null;
  battleDeckState.cardsFlipped = false;
  battleDeckState.isResolvingTurn = false;
  battleDeckState.playerStatChoice = null;
  battleDeckState.botStatChoice = null;
  battleDeckState.timeLeft = 30;
  battleDeckState.playerRainTurnsLeft = 0;
  battleDeckState.botRainTurnsLeft = 0;

  showScreen("pveBattleScreen");
  resetBattleScoreHud(false);

  const playerName = isAdmin ? "Admin" : profile.username;
  const currentAvatar = isAdmin ? (state.adminAvatar || DEFAULT_AVATAR) : (profile?.avatar || DEFAULT_AVATAR);

  if ($("playerBattleName")) $("playerBattleName").textContent = playerName;
  if ($("battlePlayerAvatarImg")) $("battlePlayerAvatarImg").src = currentAvatar;

  if ($("battleLogBox")) {
    $("battleLogBox").innerHTML = "[Hệ thống] Bắt đầu trận đấu (Mỗi người 250 HP)! Bạn có 30s để chọn bài và nhấn hoàn thành.";
  }

  const allCardIds = Object.keys(cards);
  const botChars = allCardIds.filter(id => cards[id].category === "CHARACTER");
  const botSkills = allCardIds.filter(id => cards[id].category === "SKILL");
  const botSits = allCardIds.filter(id => cards[id].category === "SITUATION");

  battleDeckState.botSelectedCharacter = botChars[Math.floor(Math.random() * botChars.length)];
  battleDeckState.botSelectedSkill = botSkills.length > 0 ? botSkills[Math.floor(Math.random() * botSkills.length)] : null;
  battleDeckState.botSelectedSituation = botSits.length > 0 ? botSits[Math.floor(Math.random() * botSits.length)] : null;
  battleDeckState.botStatChoice = Math.random() < 0.5 ? "ATK" : "DEF";

  renderBattleSlots();
  startTurnTimer();
}

function startTurnTimer() {
  if (battleDeckState.timerInterval) clearInterval(battleDeckState.timerInterval);
  battleDeckState.timeLeft = 30;
  if ($("turnTimerDisplay")) $("turnTimerDisplay").textContent = `${battleDeckState.timeLeft}s`;

  battleDeckState.timerInterval = setInterval(() => {
    if (battleDeckState.isResolvingTurn) return;
    battleDeckState.timeLeft--;
    if ($("turnTimerDisplay")) $("turnTimerDisplay").textContent = `${battleDeckState.timeLeft}s`;

    if (battleDeckState.timeLeft <= 0) {
      clearInterval(battleDeckState.timerInterval);
      if (!battleDeckState.selectedCharacter) {
        const allCardIds = Object.keys(cards);
        const chars = allCardIds.filter(id => cards[id].category === "CHARACTER");
        battleDeckState.selectedCharacter = chars[Math.floor(Math.random() * chars.length)];
        renderBattleSlots();
      }
      showToast("Hết 30 giây! Tự động hoàn thành lượt đấu.");
      submitStatChoice(battleDeckState.playerStatChoice || "ATK");
    }
  }, 1000);
}

/* ========================================================================== */
/* BỐC BÀI CHIA THÀNH 3 PHẦN: NHÂN VẬT / SKILL / TÌNH HUỐNG                   */
/* ========================================================================== */

window.openPlayerDeckPicker = function () {
  if (battleDeckState.isResolvingTurn || battleDeckState.cardsFlipped) return;
  const profile = getProfile();
  const ownedCards = isAdmin ? Object.keys(cards) : (profile?.cards || []);
  const grid = $("deckPickerGrid");

  if (!grid) return;

  const sections = [
    { key: "CHARACTER", title: "⚔️ NHÂN VẬT", accent: "#ffd700" },
    { key: "SKILL", title: "✨ SKILL", accent: "#8ef0c1" },
    { key: "SITUATION", title: "🎭 TÌNH HUỐNG", accent: "#38bdf8" }
  ];

  grid.innerHTML = sections.map(sec => {
    const groupIds = ownedCards.filter(cid => cards[cid] && cards[cid].category === sec.key);

    const cardsHtml = groupIds.length > 0
      ? groupIds.map(cid => {
          const card = cards[cid];
          const isSelected =
            (sec.key === "CHARACTER" && battleDeckState.selectedCharacter === cid) ||
            (sec.key === "SKILL" && battleDeckState.selectedSkill === cid) ||
            (sec.key === "SITUATION" && battleDeckState.selectedSituation === cid);

          const statLine = sec.key === "CHARACTER"
            ? `ATK ${card.atk ?? 0} · DEF ${card.def ?? 0}`
            : card.rarity;

          return `
            <div onclick="pickCardToBoard('${cid}')" style="background: rgba(0,0,0,0.55); border: 1.5px solid ${isSelected ? sec.accent : "var(--panel-border)"}; border-radius: 8px; padding: 6px; text-align: center; cursor: pointer; transition: transform 0.15s;">
              <img src="${card.file}" alt="${card.name}" style="width: 100%; height: 82px; object-fit: cover; border-radius: 4px; display: block; margin: 0 auto;">
              <strong style="font-size: 10px; display: block; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${card.name}</strong>
              <small style="font-size: 9px; color: var(--muted); display: block;">${statLine}</small>
            </div>
          `;
        }).join("")
      : `<div style="grid-column: 1 / -1; font-size: 11px; color: var(--muted); padding: 6px 4px;">Chưa có thẻ thuộc nhóm này</div>`;

    return `
      <div style="grid-column: 1 / -1; margin-top: 6px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.12); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; font-weight: 800; color: ${sec.accent}; letter-spacing: 0.4px;">${sec.title}</span>
        <small style="font-size: 10px; color: var(--muted);">${groupIds.length} thẻ</small>
      </div>
      ${cardsHtml}
    `;
  }).join("");

  $("deckPickerModal").classList.remove("hidden");
};

window.closeDeckPicker = function () {
  $("deckPickerModal").classList.add("hidden");
};

window.pickCardToBoard = function (cardId) {
  const card = cards[cardId];
  if (!card) return;

  if (card.category === "SKILL") {
    battleDeckState.selectedSkill = cardId;
    showToast(`Đã đưa [${card.name}] vào ô Skill!`);
  } else if (card.category === "CHARACTER") {
    battleDeckState.selectedCharacter = cardId;
    showToast(`Đã đưa [${card.name}] vào ô Nhân vật!`);
  } else if (card.category === "SITUATION") {
    battleDeckState.selectedSituation = cardId;
    showToast(`Đã đưa [${card.name}] vào ô Tình huống!`);
  }

  closeDeckPicker();
  renderBattleSlots();
};

window.clearSlot = function (category) {
  if (battleDeckState.cardsFlipped || battleDeckState.isResolvingTurn) return;

  if (category === "SKILL" && battleDeckState.selectedSkill) {
    battleDeckState.selectedSkill = null;
    showToast("Đã gỡ thẻ khỏi ô Skill!");
  } else if (category === "CHARACTER" && battleDeckState.selectedCharacter) {
    battleDeckState.selectedCharacter = null;
    showToast("Đã gỡ thẻ khỏi ô Nhân vật!");
  } else if (category === "SITUATION" && battleDeckState.selectedSituation) {
    battleDeckState.selectedSituation = null;
    showToast("Đã gỡ thẻ khỏi ô Tình huống!");
  }
  renderBattleSlots();
};

function renderBattleSlots() {
  const isFlipped = battleDeckState.cardsFlipped;

  const skillBox = $("placedSkillContent");
  if (skillBox) {
    if (battleDeckState.selectedSkill) {
      if (isFlipped) {
        const c = cards[battleDeckState.selectedSkill];
        skillBox.innerHTML = `
          <img src="${c.file}" alt="${c.name}" class="placed-card-img">
          <div class="placed-card-caption">${c.name}</div>
        `;
      } else {
        skillBox.innerHTML = `<div class="facedown-card-cover" style="background: #1e293b; border: 1px solid #8ef0c1;"><span>🎴</span><small style="font-size: 10px; color: #8ef0c1;">Đã úp</small></div>`;
      }
    } else {
      skillBox.innerHTML = `<small style="color: var(--muted); font-size: 11px;">Trống</small>`;
    }
  }

  const charBox = $("placedCharacterContent");
  if (charBox) {
    if (battleDeckState.selectedCharacter) {
      if (isFlipped) {
        const c = cards[battleDeckState.selectedCharacter];
        charBox.innerHTML = `
          <img src="${c.file}" alt="${c.name}" class="placed-card-img">
          <div class="placed-card-caption">${c.name}</div>
        `;
      } else {
        charBox.innerHTML = `<div class="facedown-card-cover" style="background: #1e293b; border: 1px solid #ffd700;"><span>🎴</span><small style="font-size: 10px; color: #ffd700;">Đã úp</small></div>`;
      }
    } else {
      charBox.innerHTML = `<small style="color: var(--muted); font-size: 11px;">Trống</small>`;
    }
  }

  const sitBox = $("placedSituationContent");
  if (sitBox) {
    if (battleDeckState.selectedSituation) {
      if (isFlipped) {
        const c = cards[battleDeckState.selectedSituation];
        sitBox.innerHTML = `
          <img src="${c.file}" alt="${c.name}" class="placed-card-img">
          <div class="placed-card-caption">${c.name}</div>
        `;
      } else {
        sitBox.innerHTML = `<div class="facedown-card-cover" style="background: #1e293b; border: 1px solid #00d2ff;"><span>🎴</span><small style="font-size: 10px; color: #00d2ff;">Đã úp</small></div>`;
      }
    } else {
      sitBox.innerHTML = `<small style="color: var(--muted); font-size: 11px;">Trống</small>`;
    }
  }

  const botSkillBox = $("botPlacedSkillContent");
  if (botSkillBox) {
    if (battleDeckState.botSelectedSkill) {
      if (isFlipped) {
        const c = cards[battleDeckState.botSelectedSkill];
        botSkillBox.innerHTML = `
          <img src="${c.file}" alt="${c.name}" class="placed-card-img">
          <div class="placed-card-caption">${c.name}</div>
        `;
      } else {
        botSkillBox.innerHTML = `<div class="facedown-card-cover" style="background: #334155; border: 1px solid #ff5252;"><span>🎴</span></div>`;
      }
    } else {
      botSkillBox.innerHTML = `<small style="color: var(--muted); font-size: 11px;">Trống</small>`;
    }
  }

  const botCharBox = $("botPlacedCharacterContent");
  if (botCharBox) {
    if (battleDeckState.botSelectedCharacter) {
      if (isFlipped) {
        const c = cards[battleDeckState.botSelectedCharacter];
        botCharBox.innerHTML = `
          <img src="${c.file}" alt="${c.name}" class="placed-card-img">
          <div class="placed-card-caption">${c.name}</div>
        `;
      } else {
        botCharBox.innerHTML = `<div class="facedown-card-cover" style="background: #334155; border: 1px solid #ff5252;"><span>🎴</span></div>`;
      }
    } else {
      botCharBox.innerHTML = `<small style="color: var(--muted); font-size: 11px;">Trống</small>`;
    }
  }

  const botSitBox = $("botPlacedSituationContent");
  if (botSitBox) {
    if (battleDeckState.botSelectedSituation) {
      if (isFlipped) {
        const c = cards[battleDeckState.botSelectedSituation];
        botSitBox.innerHTML = `
          <img src="${c.file}" alt="${c.name}" class="placed-card-img">
          <div class="placed-card-caption">${c.name}</div>
        `;
      } else {
        botSitBox.innerHTML = `<div class="facedown-card-cover" style="background: #334155; border: 1px solid #ff5252;"><span>🎴</span></div>`;
      }
    } else {
      botSitBox.innerHTML = `<small style="color: var(--muted); font-size: 11px;">Trống</small>`;
    }
  }

  if ($("botHpText")) $("botHpText").textContent = `${battleDeckState.botHp} / ${battleDeckState.maxBotHp}`;
  if ($("playerHpText")) $("playerHpText").textContent = `${battleDeckState.playerHp} / ${battleDeckState.maxPlayerHp}`;
}

window.executeBattleTurn = function () {
  if (battleDeckState.isResolvingTurn || battleDeckState.botHp <= 0 || battleDeckState.playerHp <= 0) return;

  if (!battleDeckState.selectedCharacter) {
    return showToast("Bạn phải đặt thẻ Nhân vật vào sân trước khi hoàn thành!");
  }

  if (battleDeckState.timerInterval) clearInterval(battleDeckState.timerInterval);

  battleDeckState.cardsFlipped = false;
  renderBattleSlots();

  $("statChoiceModal").classList.remove("hidden");
};

window.submitStatChoice = function (choice) {
  if (battleDeckState.isResolvingTurn) return;
  battleDeckState.isResolvingTurn = true;
  battleDeckState.playerStatChoice = choice;
  $("statChoiceModal").classList.add("hidden");

  battleDeckState.cardsFlipped = true;
  renderBattleSlots();
  resetBattleScoreHud(true);
  syncArenaRainWeatherOverlay();

  logAdvancedBattle(`[Hệ thống] Bạn chọn điểm ${choice}. Cả bộ bài của bạn và Bot đã lật lên! Bắt đầu tính điểm từng lá...`);

  setTimeout(() => {
    resolveBattleClash();
  }, 550);
};

async function resolveBattleClash() {
  let pCharKey = battleDeckState.selectedCharacter;
  let pSkillKey = battleDeckState.selectedSkill;
  let pSitKey = battleDeckState.selectedSituation;
  const pChoice = battleDeckState.playerStatChoice;

  let bCharKey = battleDeckState.botSelectedCharacter;
  let bSkillKey = battleDeckState.botSelectedSkill;
  let bSitKey = battleDeckState.botSelectedSituation;
  const bChoice = battleDeckState.botStatChoice;

  let pChar = cards[pCharKey];
  let bChar = cards[bCharKey];

  let pAtk = pChar.atk ?? 50;
  let pDef = pChar.def ?? 50;
  let bAtk = bChar.atk ?? 50;
  let bDef = bChar.def ?? 50;

  let pScore = pChoice === "ATK" ? pAtk : pDef;
  let bScore = bChoice === "ATK" ? bAtk : bDef;

  await zoomCardAndFloatScore({
    slotKey: "P_CHAR",
    targetSide: "player",
    prevScore: 0,
    nextScore: pScore,
    badgeText: `${pChoice}: ${pScore}`,
    tone: "gold"
  });

  await zoomCardAndFloatScore({
    slotKey: "B_CHAR",
    targetSide: "bot",
    prevScore: 0,
    nextScore: bScore,
    badgeText: `${bChoice}: ${bScore}`,
    tone: "gold"
  });

  if (pSkillKey) {
    const prevP = pScore;
    let skillBadge = "+0";

    if (pSkillKey === "doiTrangThayDen") {
      skillBadge = "🔄 ĐỔI BÀN";
      logAdvancedBattle(`🔄 [Đổi Trắng Thay Đen] Tráo đổi các lá trên sân giữa Bạn và Bot!`);
    } else if (pSkillKey === "muaQuat") {
      if (pChoice === "ATK") {
        pAtk = pCharKey === "kha" ? pAtk * 2 : pAtk + 20;
        pScore = pAtk;
        const delta = pScore - prevP;
        skillBadge = delta >= 0 ? `+${delta} ATK` : `${delta} ATK`;
        logAdvancedBattle(
          pCharKey === "kha"
            ? `✨ [Múa Quạt] x2 điểm ATK cho Khá Bảnh -> ${pScore}`
            : `✨ [Múa Quạt] +20 điểm ATK -> ${pScore}`
        );
      } else {
        skillBadge = "ATK Only";
      }
    } else if (pSkillKey === "chuCap5Cu") {
      if (pChoice === "DEF") {
        const isJack = pCharKey === "jack";
        pDef = isJack ? pDef * 5 : Math.round(pDef * 1.5);
        pScore = pDef;
        skillBadge = isJack ? "x5 DEF" : "x1.5 DEF";
        logAdvancedBattle(
          isJack
            ? `👑 [Chu Cấp 5 Triệu] x5 điểm DEF cho Jack -> ${pScore}`
            : `👑 [Chu Cấp 5 Triệu] x1.5 điểm DEF cho ${pChar.name} -> ${pScore}`
        );
      } else {
        skillBadge = "DEF Only";
      }
    } else if (pSkillKey === "samSo") {
      skillBadge = bCharKey === "truongGiang" ? "-50 OPP" : "-25 OPP";
    }

    await zoomCardAndFloatScore({
      slotKey: "P_SKILL",
      targetSide: "player",
      prevScore: prevP,
      nextScore: pScore,
      badgeText: skillBadge,
      tone: "pos"
    });

    if (pSkillKey === "doiTrangThayDen") {
      const swapPairs = [
        { slotA: "P_CHAR", slotB: "B_CHAR", cardIdA: pCharKey, cardIdB: bCharKey },
        { slotA: "P_SIT", slotB: "B_SIT", cardIdA: pSitKey, cardIdB: bSitKey }
      ];

      const tempChar = pCharKey;
      pCharKey = bCharKey;
      bCharKey = tempChar;

      const tempSit = pSitKey;
      pSitKey = bSitKey;
      bSitKey = tempSit;

      const tempBotSkill = bSkillKey;
      bSkillKey = null;
      if (tempBotSkill) {
        swapPairs.push({ slotA: "P_SKILL", slotB: "B_SKILL", cardIdA: pSkillKey, cardIdB: tempBotSkill });
      }

      battleDeckState.selectedCharacter = pCharKey;
      battleDeckState.botSelectedCharacter = bCharKey;
      battleDeckState.selectedSituation = pSitKey;
      battleDeckState.botSelectedSituation = bSitKey;
      battleDeckState.botSelectedSkill = null;

      await triggerSwapBoardCardsEffect(swapPairs);

      pChar = cards[pCharKey];
      bChar = cards[bCharKey];
      pAtk = pChar.atk ?? 50;
      pDef = pChar.def ?? 50;
      bAtk = bChar.atk ?? 50;
      bDef = bChar.def ?? 50;

      pScore = pChoice === "ATK" ? pAtk : pDef;
      bScore = bChoice === "ATK" ? bAtk : bDef;

      if ($("playerCalcTotal")) $("playerCalcTotal").textContent = String(pScore);
      if ($("botCalcTotal")) $("botCalcTotal").textContent = String(bScore);
      if ($("playerCalcFormula")) $("playerCalcFormula").textContent = `🔄 ${pChoice}: ${pScore}`;
      if ($("botCalcFormula")) $("botCalcFormula").textContent = `🔄 ${bChoice}: ${bScore}`;

      logAdvancedBattle(`🔄 Sau tráo đổi: Bạn có [${pChar.name}] (${pChoice}: ${pScore}) vs Bot có [${bChar.name}] (${bChoice}: ${bScore}).`);
    } else if (pSkillKey === "chuCap5Cu") {
      const prevB = bScore;
      const zeroDefApplied = bChoice === "DEF";
      if (zeroDefApplied) {
        bDef = 0;
        bScore = 0;
        logAdvancedBattle(`💵 [Chu Cấp 5 Triệu] Xấp tiền 5 triệu bay tới đối phương tan thành khói & đưa DEF của Bot về 0!`);
      } else {
        logAdvancedBattle(`💵 [Chu Cấp 5 Triệu] Xấp tiền 5 triệu bay tới làm đối phương nhấp nháy & tan thành khói!`);
      }
      await triggerFiveMillionMoneyEffect("P_SKILL", "B_CHAR", "bot", prevB, bScore, zeroDefApplied);
    } else if (pSkillKey === "muaQuat") {
      logAdvancedBattle(`🪭 [Múa Quạt] Thổi bay lá Nhân vật của Bot trong 1 giây!`);
      await triggerFanBlowAwayEffect("P_SKILL", "B_CHAR");
    } else if (pSkillKey === "samSo") {
      const prevB = bScore;
      const penalty = bCharKey === "truongGiang" ? 50 : 25;
      if (bChoice === "ATK") {
        bAtk = Math.max(0, bAtk - penalty);
        bScore = bAtk;
      } else {
        bDef = Math.max(0, bDef - penalty);
        bScore = bDef;
      }
      const actualDelta = bScore - prevB;
      logAdvancedBattle(
        bCharKey === "truongGiang"
          ? `😳 [Sàm Sỡ] Đối phương là Trường Giang -> trừ 50 điểm ${bChoice} của Bot (${actualDelta}) -> ${bScore}`
          : `😳 [Sàm Sỡ] Đối phương không phải Trường Giang (${bChar.name}) -> trừ 25 điểm ${bChoice} của Bot (${actualDelta}) -> ${bScore}`
      );
      await triggerSamSoEffect("P_SKILL", "B_CHAR", "bot", bChoice, prevB, bScore, actualDelta);
    }
  }

  if (bSkillKey) {
    const prevB = bScore;
    let botSkillBadge = "+0";

    if (bSkillKey === "doiTrangThayDen") {
      botSkillBadge = "🔄 ĐỔI BÀN";
      logAdvancedBattle(`🔄 Bot kích hoạt [Đổi Trắng Thay Đen] — tráo đổi các lá trên sân!`);
    } else if (bSkillKey === "muaQuat") {
      if (bChoice === "ATK") {
        bAtk = bCharKey === "kha" ? bAtk * 2 : bAtk + 20;
        bScore = bAtk;
        const delta = bScore - prevB;
        botSkillBadge = delta >= 0 ? `+${delta} ATK` : `${delta} ATK`;
        logAdvancedBattle(`✨ Bot kích hoạt [Múa Quạt] -> Điểm Bot: ${bScore}`);
      } else {
        botSkillBadge = "ATK Only";
      }
    } else if (bSkillKey === "chuCap5Cu") {
      if (bChoice === "DEF") {
        const isJack = bCharKey === "jack";
        bDef = isJack ? bDef * 5 : Math.round(bDef * 1.5);
        bScore = bDef;
        botSkillBadge = isJack ? "x5 DEF" : "x1.5 DEF";
        logAdvancedBattle(
          isJack
            ? `👑 Bot dùng [Chu Cấp 5 Triệu] x5 DEF cho Jack -> ${bScore}`
            : `👑 Bot dùng [Chu Cấp 5 Triệu] x1.5 DEF cho ${bChar.name} -> ${bScore}`
        );
      } else {
        botSkillBadge = "DEF Only";
      }
    } else if (bSkillKey === "samSo") {
      botSkillBadge = pCharKey === "truongGiang" ? "-50 OPP" : "-25 OPP";
    }

    await zoomCardAndFloatScore({
      slotKey: "B_SKILL",
      targetSide: "bot",
      prevScore: prevB,
      nextScore: bScore,
      badgeText: botSkillBadge,
      tone: "pos"
    });

    if (bSkillKey === "doiTrangThayDen") {
      const swapPairs = [
        { slotA: "P_CHAR", slotB: "B_CHAR", cardIdA: pCharKey, cardIdB: bCharKey },
        { slotA: "P_SIT", slotB: "B_SIT", cardIdA: pSitKey, cardIdB: bSitKey }
      ];

      const tempChar = pCharKey;
      pCharKey = bCharKey;
      bCharKey = tempChar;

      const tempSit = pSitKey;
      pSitKey = bSitKey;
      bSitKey = tempSit;

      const tempPlayerSkill = pSkillKey;
      pSkillKey = null;
      if (tempPlayerSkill) {
        swapPairs.push({ slotA: "P_SKILL", slotB: "B_SKILL", cardIdA: tempPlayerSkill, cardIdB: bSkillKey });
      }

      battleDeckState.selectedCharacter = pCharKey;
      battleDeckState.botSelectedCharacter = bCharKey;
      battleDeckState.selectedSituation = pSitKey;
      battleDeckState.botSelectedSituation = bSitKey;
      battleDeckState.selectedSkill = null;

      await triggerSwapBoardCardsEffect(swapPairs);

      pChar = cards[pCharKey];
      bChar = cards[bCharKey];
      pAtk = pChar.atk ?? 50;
      pDef = pChar.def ?? 50;
      bAtk = bChar.atk ?? 50;
      bDef = bChar.def ?? 50;

      pScore = pChoice === "ATK" ? pAtk : pDef;
      bScore = bChoice === "ATK" ? bAtk : bDef;

      if ($("playerCalcTotal")) $("playerCalcTotal").textContent = String(pScore);
      if ($("botCalcTotal")) $("botCalcTotal").textContent = String(bScore);
      if ($("playerCalcFormula")) $("playerCalcFormula").textContent = `🔄 ${pChoice}: ${pScore}`;
      if ($("botCalcFormula")) $("botCalcFormula").textContent = `🔄 ${bChoice}: ${bScore}`;
    } else if (bSkillKey === "chuCap5Cu") {
      const prevP = pScore;
      const zeroDefApplied = pChoice === "DEF";
      if (zeroDefApplied) {
        pDef = 0;
        pScore = 0;
        logAdvancedBattle(`💵 Bot dùng [Chu Cấp 5 Triệu] đưa điểm DEF của bạn về 0!`);
      } else {
        logAdvancedBattle(`💵 Bot dùng [Chu Cấp 5 Triệu] làm lá Nhân vật của bạn nhấp nháy & tan thành khói!`);
      }
      await triggerFiveMillionMoneyEffect("B_SKILL", "P_CHAR", "player", prevP, pScore, zeroDefApplied);
    } else if (bSkillKey === "muaQuat") {
      logAdvancedBattle(`🪭 Bot dùng [Múa Quạt] thổi bay lá Nhân vật của bạn trong 1 giây!`);
      await triggerFanBlowAwayEffect("B_SKILL", "P_CHAR");
    } else if (bSkillKey === "samSo") {
      const prevP = pScore;
      const penalty = pCharKey === "truongGiang" ? 50 : 25;
      if (pChoice === "ATK") {
        pAtk = Math.max(0, pAtk - penalty);
        pScore = pAtk;
      } else {
        pDef = Math.max(0, pDef - penalty);
        pScore = pDef;
      }
      const actualDelta = pScore - prevP;
      logAdvancedBattle(
        pCharKey === "truongGiang"
          ? `😳 Bot dùng [Sàm Sỡ] lên Trường Giang -> trừ 50 điểm ${pChoice} của bạn (${actualDelta}) -> ${pScore}`
          : `😳 Bot dùng [Sàm Sỡ] lên ${pChar.name} -> trừ 25 điểm ${pChoice} của bạn (${actualDelta}) -> ${pScore}`
      );
      await triggerSamSoEffect("B_SKILL", "P_CHAR", "player", pChoice, prevP, pScore, actualDelta);
    }
  }

  if (pSitKey) {
    const prevP = pScore;
    let pSitBadge = cards[pSitKey].name;

    if (pSitKey === "hoiChieuTroiMua") {
      const bonus = pCharKey === "truongGiang" ? 30 : 15;
      if (pChoice === "ATK") {
        pAtk += bonus;
        pScore = pAtk;
      } else {
        pDef += bonus;
        pScore = pDef;
      }
      battleDeckState.playerRainTurnsLeft = 3;
      syncArenaRainWeatherOverlay();
      pSitBadge = `+${bonus} ${pChoice} & Mưa 3v`;
      logAdvancedBattle(
        pCharKey === "truongGiang"
          ? `🌧️ [Hồi Chiều Trời Mưa] Cộng +30 ${pChoice} cho Trường Giang -> ${pScore} & kích hoạt Trời Mưa 3 vòng (+10 điểm/vòng)!`
          : `🌧️ [Hồi Chiều Trời Mưa] Cộng +15 ${pChoice} cho ${pChar.name} -> ${pScore} & kích hoạt Trời Mưa 3 vòng (+10 điểm/vòng)!`
      );
    }

    await zoomCardAndFloatScore({
      slotKey: "P_SIT",
      targetSide: "player",
      prevScore: prevP,
      nextScore: pScore,
      badgeText: pSitBadge,
      tone: "pos"
    });

    if (pSitKey === "vaoTu") {
      const prevB = bScore;
      bScore = Math.max(0, bScore - 15);
      const delta = bScore - prevB;
      logAdvancedBattle(`🔒 [Vào Tù] Nhốt nhân vật Bot vào lồng sắt, trừ điểm Bot (${delta}) -> ${bScore}`);
      await triggerJailCageOnOpponentChar("B_CHAR", "bot", prevB, bScore, delta);
    } else if (pSitKey === "boCon") {
      const prevB = bScore;
      const basePenalty = bCharKey === "jack" ? 30 : 20;
      if (bChoice === "ATK") {
        bAtk = Math.max(0, bAtk - basePenalty);
        bScore = bAtk;
      } else {
        bDef = Math.max(0, bDef - basePenalty);
        bScore = bDef;
      }
      const actualDelta = bScore - prevB;
      logAdvancedBattle(
        bCharKey === "jack"
          ? `👶❌ [Bỏ Con] Đối phương là Jack -> trừ 30 điểm ${bChoice} (${actualDelta}) -> ${bScore}`
          : `👶❌ [Bỏ Con] Đối phương không phải Jack (${bChar.name}) -> trừ 20 điểm ${bChoice} (${actualDelta}) -> ${bScore}`
      );
      await triggerAbandonBabyEffect("P_SIT", "B_CHAR", "bot", bChoice, prevB, bScore, actualDelta);
    }
  }

  if (bSitKey) {
    const prevB = bScore;
    let bSitBadge = cards[bSitKey].name;

    if (bSitKey === "hoiChieuTroiMua") {
      const bonus = bCharKey === "truongGiang" ? 30 : 15;
      if (bChoice === "ATK") {
        bAtk += bonus;
        bScore = bAtk;
      } else {
        bDef += bonus;
        bScore = bDef;
      }
      battleDeckState.botRainTurnsLeft = 3;
      syncArenaRainWeatherOverlay();
      bSitBadge = `+${bonus} ${bChoice} & Mưa 3v`;
      logAdvancedBattle(
        bCharKey === "truongGiang"
          ? `🌧️ Bot dùng [Hồi Chiều Trời Mưa] cộng +30 ${bChoice} cho Trường Giang -> ${bScore} & kích hoạt Trời Mưa 3 vòng!`
          : `🌧️ Bot dùng [Hồi Chiều Trời Mưa] cộng +15 ${bChoice} cho ${bChar.name} -> ${bScore} & kích hoạt Trời Mưa 3 vòng!`
      );
    }

    await zoomCardAndFloatScore({
      slotKey: "B_SIT",
      targetSide: "bot",
      prevScore: prevB,
      nextScore: bScore,
      badgeText: bSitBadge,
      tone: "pos"
    });

    if (bSitKey === "vaoTu") {
      const prevP = pScore;
      pScore = Math.max(0, pScore - 15);
      const delta = pScore - prevP;
      logAdvancedBattle(`🔒 Bot dùng [Vào Tù] nhốt nhân vật của bạn vào lồng sắt (${delta}) -> ${pScore}`);
      await triggerJailCageOnOpponentChar("P_CHAR", "player", prevP, pScore, delta);
    } else if (bSitKey === "boCon") {
      const prevP = pScore;
      const basePenalty = pCharKey === "jack" ? 30 : 20;
      if (pChoice === "ATK") {
        pAtk = Math.max(0, pAtk - basePenalty);
        pScore = pAtk;
      } else {
        pDef = Math.max(0, pDef - basePenalty);
        pScore = pDef;
      }
      const actualDelta = pScore - prevP;
      logAdvancedBattle(
        pCharKey === "jack"
          ? `👶❌ Bot dùng [Bỏ Con] lên Jack -> trừ 30 điểm ${pChoice} (${actualDelta}) -> ${pScore}`
          : `👶❌ Bot dùng [Bỏ Con] lên ${pChar.name} (không phải Jack) -> trừ 20 điểm ${pChoice} (${actualDelta}) -> ${pScore}`
      );
      await triggerAbandonBabyEffect("B_SIT", "P_CHAR", "player", pChoice, prevP, pScore, actualDelta);
    }
  }

  pScore = await applyRainWeatherBonus("player", "P_CHAR", pScore);
  bScore = await applyRainWeatherBonus("bot", "B_CHAR", bScore);

  if ($("playerCalcTotal")) $("playerCalcTotal").textContent = String(pScore);
  if ($("botCalcTotal")) $("botCalcTotal").textContent = String(bScore);

  logAdvancedBattle(`📊 Điểm số so tài: Bạn (${pChoice}: ${pScore}) vs Bot (${bChoice}: ${bScore})`);

  if (pScore >= bScore) {
    let diff = pScore - bScore;
    battleDeckState.botHp = Math.max(0, battleDeckState.botHp - diff);
    logAdvancedBattle(`⚔️ Bạn thắng vòng này! Lấy ${pScore} - ${bScore} = ${diff} sát thương vào HP Bot.`);
  } else {
    let diff = bScore - pScore;
    battleDeckState.playerHp = Math.max(0, battleDeckState.playerHp - diff);
    logAdvancedBattle(`💥 Bot thắng vòng này! Lấy ${bScore} - ${pScore} = ${diff} sát thương vào HP của bạn.`);
  }

  renderBattleSlots();

  if (battleDeckState.botHp <= 0) {
    logAdvancedBattle("🎉 CHIẾN THẮNG TUYỆT ĐỐI! Bạn đã hạ gục Bot và nhận 30 Xu thưởng!");
    const profile = getProfile();
    if (!isAdmin && profile) {
      profile.coins += 30;
      saveState();
      renderProfile();
    }
    setTimeout(() => {
      battleDeckState.isResolvingTurn = false;
      quitPveBattle();
    }, 3500);
    return;
  }

  if (battleDeckState.playerHp <= 0) {
    logAdvancedBattle("💥 THẤT BẠI! Bạn đã hết HP.");
    setTimeout(() => {
      battleDeckState.isResolvingTurn = false;
      quitPveBattle();
    }, 3500);
    return;
  }

  setTimeout(() => {
    cleanupBattleFxOverlays(false);
    syncArenaRainWeatherOverlay();
    battleDeckState.selectedSkill = null;
    battleDeckState.selectedCharacter = null;
    battleDeckState.selectedSituation = null;
    battleDeckState.cardsFlipped = false;
    battleDeckState.isResolvingTurn = false;
    resetBattleScoreHud(false);

    const allCardIds = Object.keys(cards);
    const botChars = allCardIds.filter(id => cards[id].category === "CHARACTER");
    const botSkills = allCardIds.filter(id => cards[id].category === "SKILL");
    const botSits = allCardIds.filter(id => cards[id].category === "SITUATION");

    battleDeckState.botSelectedCharacter = botChars[Math.floor(Math.random() * botChars.length)];
    battleDeckState.botSelectedSkill = botSkills.length > 0 ? botSkills[Math.floor(Math.random() * botSkills.length)] : null;
    battleDeckState.botSelectedSituation = botSits.length > 0 ? botSits[Math.floor(Math.random() * botSits.length)] : null;
    battleDeckState.botStatChoice = Math.random() < 0.5 ? "ATK" : "DEF";

    renderBattleSlots();
    logAdvancedBattle("[Hệ thống] Lượt đấu mới bắt đầu! Hãy chọn bài và có 30s để hoàn thành.");
    startTurnTimer();
  }, 2400);
}

function logAdvancedBattle(msg) {
  const box = $("battleLogBox");
  if (!box) return;
  box.innerHTML += `<br>${msg}`;
  box.scrollTop = box.scrollHeight;
}

window.quitPveBattle = function () {
  if (battleDeckState.timerInterval) clearInterval(battleDeckState.timerInterval);
  cleanupBattleFxOverlays(true);
  battleDeckState.isResolvingTurn = false;
  resetBattleScoreHud(false);
  showScreen("gameScreen");
};

document.addEventListener("click", event => {
  if (event.target.closest("#startPveBtn")) {
    startAdvancedPveBattle();
  }

  if (event.target.closest("#startTrainingBtn")) {
    if ($("trainingGuideModal")) {
      $("trainingGuideModal").classList.remove("hidden");
    }
  }

  if (event.target.closest("#closeTrainingGuideModal") || event.target === $("trainingGuideModal")) {
    if ($("trainingGuideModal")) {
      $("trainingGuideModal").classList.add("hidden");
    }
  }

  if (event.target.closest("#launchPracticeMatchBtn")) {
    if ($("trainingGuideModal")) {
      $("trainingGuideModal").classList.add("hidden");
    }
    startAdvancedPveBattle();
  }
});

if (state.active && state.users[state.active]) {
  loginAs(state.active);
} else {
  switchPanel("loginPanel");
}

window.openProfileModal = function () {
  const profile = getProfile();
  if (!profile && !isAdmin) return;

  const currentName = isAdmin ? "Admin" : profile.username;
  const currentAvatar = isAdmin ? (state.adminAvatar || DEFAULT_AVATAR) : (profile.avatar || DEFAULT_AVATAR);

  $("modalUsername").textContent = currentName;
  if ($("editUsernameInput")) $("editUsernameInput").value = isAdmin ? "" : currentName;
  if ($("modalAvatarImg")) $("modalAvatarImg").src = currentAvatar;

  const avatars = isAdmin ? [DEFAULT_AVATAR, "avt2.png", "avt3.png", "avt4.png"] : (profile.unlockedAvatars || [DEFAULT_AVATAR, "avt1.png"]);
  const container = $("avatarPresetsContainer");
  if (container) {
    container.innerHTML = avatars.map(avt => {
      return `<img src="${avt}" class="preset-avt" onclick="changeAvatar('${avt}')" title="Avatar" style="width: 50px; height: 65px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid var(--panel-border);">`;
    }).join("");
  }

  $("profileModal").classList.remove("hidden");
};

window.closeProfileModal = function () {
  $("profileModal").classList.add("hidden");
};

window.changeAvatar = function (avatarSrc) {
  const profile = getProfile();
  if (!profile && !isAdmin) return;

  if (isAdmin) {
    state.adminAvatar = avatarSrc;
  } else {
    profile.avatar = avatarSrc;
  }
  saveState();

  if ($("userAvatarImg")) $("userAvatarImg").src = avatarSrc;
  if ($("modalAvatarImg")) $("modalAvatarImg").src = avatarSrc;
  if ($("battlePlayerAvatarImg")) $("battlePlayerAvatarImg").src = avatarSrc;
  showToast("Đã đổi avatar thành công!");
};

window.saveProfileInfo = function () {
  if (isAdmin) {
    showToast("Không thể sửa thông tin của Admin!");
    return;
  }
  const newName = $("editUsernameInput").value.trim();
  if (!/^[a-zA-Z0-9_]{3,18}$/.test(newName)) {
    return showToast("Tên mới cần 3-18 ký tự chữ, số hoặc dấu gạch dưới!");
  }

  if (state.users[newName.toLowerCase()] && newName.toLowerCase() !== currentUser) {
    return showToast("Tên tài khoản này đã được sử dụng!");
  }

  const profile = state.users[currentUser];
  if (newName.toLowerCase() !== currentUser) {
    state.users[newName.toLowerCase()] = profile;
    delete state.users[currentUser];
    currentUser = newName.toLowerCase();
    state.active = currentUser;
  }

  profile.username = newName;
  saveState();

  $("welcomeUser").textContent = newName;
  $("modalUsername").textContent = newName;
  if ($("playerBattleName")) $("playerBattleName").textContent = newName;
  showToast("Đã lưu thông tin cá nhân thành công!");
  closeProfileModal();
};

window.switchProfileTab = function (tabId, btn) {
  document.querySelectorAll(".profile-tab-pane").forEach(pane => {
    pane.classList.toggle("hidden", pane.id !== tabId);
  });
  document.querySelectorAll(".profile-tab").forEach(b => {
    b.style.background = "transparent";
    b.style.color = "var(--muted)";
  });
  btn.style.background = "var(--panel-border)";
  btn.style.color = "var(--text)";
};

window.redeemGiftCode = function () {
  if (isAdmin) {
    return showToast("Admin không cần nhập code nhận quà!");
  }
  const input = $("redeemCodeInput");
  const code = input ? input.value.trim().toUpperCase() : "";

  if (code !== "HAPPYBIRTHDAY") {
    return showToast("Mã code không chính xác hoặc đã hết hạn!");
  }

  const profile = getProfile();
  if (!profile) return;

  if (!profile.redeemedCodes) profile.redeemedCodes = [];
  if (profile.redeemedCodes.includes("HAPPYBIRTHDAY")) {
    return showToast("Bạn đã nhập mã code này rồi!");
  }

  profile.redeemedCodes.push("HAPPYBIRTHDAY");

  profile.bag.push("premium", "premium", "basic", "basic");
  saveState();
  renderProfile();

  input.value = "";
  showToast("🎁 Nhập code thành công! Đã nhận 2 Premium Pack & 2 Basic Pack vào Balo!");
  closeProfileModal();
};
