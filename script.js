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
  kha: { name: "Khá Bảnh", file: "khá bảnh nv.png", rarity: "RARE", category: "CHARACTER", atk: 49, def: 49 },
  jack: { name: "Jack", file: "jack nv.png", rarity: "LEGENDARY", category: "CHARACTER", atk: 97, def: 13 },
  vaoTu: { name: "Vào Tù", file: "Vào Tù Th.png", rarity: "LEGENDARY", category: "SITUATION" },
  muaQuat: { name: "Múa Quạt", file: "mua quat skill.png", rarity: "RARE", category: "SKILL" },
  chuCap5Cu: { name: "Chu Cấp 5 Củ", file: "chu cap 5 cu.png", rarity: "LEGENDARY", category: "SKILL" }
};

const CATEGORY_LABELS = { CHARACTER: "NHÂN VẬT", SKILL: "SKILL", SITUATION: "TÌNH HUỐNG" };

let state = loadState();
let currentUser = null;
let isAdmin = false;
let pendingCard = null;
let activePackIndex = null;
let activePackType = null;
let isTearingPack = false;
let currentAlbumFilter = "ALL";
let toastTimer;

// Trạng thái trận đấu TCG 250 HP & 30s
let battleState = {
  playerHp: 250,
  maxPlayerHp: 250,
  botHp: 250,
  maxBotHp: 250,
  selectedSkill: null,
  selectedCharacter: null,
  selectedSituation: null,
  playerStatType: "ATK",
  playerSubmitted: false,
  timerInterval: null,
  timeLeft: 30
};

function loadState() {
  try {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data && data.users) {
      if (!Array.isArray(data.adminMailbox)) data.adminMailbox = [];
      return data;
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
    return { coins: Infinity, cards: Object.keys(cards), bag: state.adminBag, mailbox: state.adminMailbox, starterOpened: true, avatar: state.adminAvatar, unlockedAvatars: [DEFAULT_AVATAR, "avt2.png", "avt3.png", "avt4.png"] };
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
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2400);
}

function showAuthMessage(message, success = false) {
  $("authMessage").textContent = message;
  $("authMessage").style.color = success ? "#8ef0c1" : "#ff9dbe";
}

function switchPanel(panelId) {
  document.querySelectorAll(".auth-form").forEach(form => form.classList.toggle("hidden", form.id !== panelId));
  document.querySelectorAll(".tab").forEach(tab => tab.classList.toggle("active", tab.dataset.panel === panelId));
  showAuthMessage("");
}

document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => switchPanel(tab.dataset.panel)));
document.querySelectorAll("[data-switch]").forEach(btn => btn.addEventListener("click", () => switchPanel(btn.dataset.switch)));

function createProfile(username, email, password) {
  return { username, email, password, coins: 20, avatar: DEFAULT_AVATAR, unlockedAvatars: [DEFAULT_AVATAR, "avt1.png"], cards: [], bag: [], mailbox: [], starterOpened: false, banned: false };
}

$("registerPanel").addEventListener("submit", async event => {
  event.preventDefault();
  const username = $("registerUsername").value.trim();
  const email = $("registerEmail").value.trim().toLowerCase();
  const password = $("registerPassword").value;
  const key = username.toLowerCase();

  if (state.users[key]) return showAuthMessage("Tên tài khoản đã tồn tại!");
  if (!/^[a-zA-Z0-9_]{3,18}$/.test(username)) return showAuthMessage("Tên tài khoản cần 3–18 ký tự.");
  if (password.length < 6) return showAuthMessage("Mật khẩu cần ít nhất 6 ký tự!");

  try {
    const userCredential = await window.createUserWithEmailAndPassword(window.firebaseAuth, email, password);
    await window.sendEmailVerification(userCredential.user);
    showAuthMessage("Link xác thực đã gửi về email!", true);
    state.users[key] = createProfile(username, email, password);
    saveState();
    setTimeout(() => switchPanel("loginPanel"), 4000);
  } catch (error) {
    showAuthMessage(error.message);
  }
});

$("loginPanel").addEventListener("submit", event => {
  event.preventDefault();
  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;
  const profile = state.users[username];
  if (!profile || profile.password !== password) return showAuthMessage("Sai tài khoản hoặc mật khẩu!");
  if (profile.banned) return showAuthMessage("Tài khoản đã bị khóa!");
  loginAs(username);
});

$("adminPanel").addEventListener("submit", event => {
  event.preventDefault();
  if ($("adminCode").value !== ADMIN_CODE) return showAuthMessage("Mã Admin không chính xác!");
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
  document.querySelectorAll(".nav-item[data-screen]").forEach(btn => btn.classList.toggle("active", btn.dataset.screen === screenId));

  if (screenId === "backpackScreen") renderBackpack();
  if (screenId === "albumScreen") renderAlbum();
  if (screenId === "mailScreen") renderMailbox();
  if (screenId === "adminSendMailScreen") renderAdminSendMailScreen();
  if (screenId === "adminCheckScreen") renderAdminUserManagement();
}

document.querySelectorAll(".nav-item[data-screen]").forEach(btn => btn.addEventListener("click", () => showScreen(btn.dataset.screen)));

$("logoutBtn").addEventListener("click", () => {
  currentUser = null;
  isAdmin = false;
  state.active = null;
  saveState();
  document.body.classList.remove("logged-in", "starter-active");
  $("authScreen").classList.remove("hidden");
  $("gameScreen").classList.add("hidden");
  if ($("pveBattleScreen")) $("pveBattleScreen").classList.add("hidden");
  $("bottomNav").classList.add("hidden");
  switchPanel("loginPanel");
});

function renderProfile() {
  const profile = getProfile();
  if (!profile) return;
  $("coinCount").textContent = isAdmin ? "∞" : profile.coins;
  const bagCount = profile.bag ? profile.bag.length : 0;
  $("navPackBadge").textContent = bagCount;
  $("navPackBadge").classList.toggle("hidden", bagCount === 0);
  $("starterChest").classList.toggle("opened", !!profile.starterOpened);
  $("openStarterBtn").textContent = profile.starterOpened ? "ĐÃ MỞ RƯƠNG" : "MỞ RƯƠNG NGAY ✦";
  $("openStarterBtn").disabled = !!profile.starterOpened;
}

function hideOldStarterChest() {
  $("arenaCopyChest").classList.add("hidden");
  $("chibiClownHome").classList.remove("hidden");
  $("mainArena").classList.add("chest-completed");
}

function getRandomCardByRarity(rareChance) {
  const rand = Math.random();
  const targetRarity = rand < rareChance ? "RARE" : "LEGENDARY";
  const matchingKeys = Object.keys(cards).filter(key => cards[key].rarity === targetRarity);
  return matchingKeys[Math.floor(Math.random() * matchingKeys.length)];
}

$("openStarterBtn").addEventListener("click", () => {
  const profile = getProfile();
  if (!isAdmin && !profile?.starterOpened) showStarterOverlay();
});

function showStarterOverlay() {
  $("starterOverlay").classList.remove("hidden");
  document.body.classList.add("starter-active");
  $("chestStage").classList.remove("hidden");
  $("packStage").classList.add("hidden");
  $("starterResultStage").classList.add("hidden");
  pendingCard = null;
}

$("starterChestClick").addEventListener("click", () => {
  $("starterChestClick").classList.add("opening");
  setTimeout(() => {
    $("chestStage").classList.add("hidden");
    $("packStage").classList.remove("hidden");
  }, 650);
});

$("starterPackClick").addEventListener("click", () => {
  if (pendingCard) return;
  $("starterPackClick").classList.add("tearing");
  setTimeout(openStarterPack, 850);
});

function openStarterPack() {
  const profile = getProfile();
  if (!profile || profile.starterOpened) return;
  pendingCard = getRandomCardByRarity(0.60);
  const card = cards[pendingCard];
  profile.cards.push(pendingCard);
  profile.starterOpened = true;
  if (!profile.unlockedAvatars.includes("avt1.png")) profile.unlockedAvatars.push("avt1.png");
  profile.avatar = "avt1.png";
  saveState();

  $("packStage").classList.add("hidden");
  $("starterResultStage").classList.remove("hidden");
  $("starterResultImage").src = card.file;
  $("starterResultName").textContent = card.name;
  $("starterResultRarity").textContent = card.rarity;
  $("starterResultCategory").textContent = CATEGORY_LABELS[card.category];
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
    if (!isAdmin && profile.coins < price) return showToast("Không đủ xu!");
    if (!isAdmin) profile.coins -= price;
    profile.bag.push(packType);
    saveState();
    renderProfile();
    showToast("Đã mua pack!");
  });
});

function renderBackpack() {
  const profile = getProfile();
  const bag = profile?.bag || [];
  $("emptyBackpack").classList.toggle("hidden", bag.length > 0);
  $("backpackGrid").innerHTML = bag.map((type, index) => `
    <div class="bag-item" data-index="${index}" data-type="${type}">
      <div class="foil-pack ${type === "premium" ? "premium-foil" : "basic-foil"}">
        <div class="foil-crimp top"></div><div class="foil-shine"></div>
        <span class="foil-badge">${type === "premium" ? "GOLD" : "STANDARD"}</span>
        <div class="foil-emblem">${type === "premium" ? "✧" : "✦"}</div>
        <div class="foil-title">${type === "premium" ? "PREMIUM" : "BASIC"}</div>
      </div>
      <h4>${type === "premium" ? "Premium" : "Basic"} Pack</h4>
    </div>
  `).join("");

  document.querySelectorAll(".bag-item").forEach(item => {
    item.addEventListener("click", () => openPackZoomModal(Number(item.dataset.index), item.dataset.type));
  });
}

function openPackZoomModal(index, type) {
  activePackIndex = index;
  activePackType = type;
  isTearingPack = false;
  $("zoomPackStage").classList.remove("hidden");
  $("zoomResultStage").classList.add("hidden");
  $("packOpenOverlay").classList.remove("hidden");
}

$("zoomedPackElement").addEventListener("click", () => {
  if (isTearingPack || activePackIndex === null) return;
  isTearingPack = true;
  setTimeout(() => {
    const profile = getProfile();
    profile.bag.splice(activePackIndex, 1);
    const cardId = getRandomCardByRarity(activePackType === "premium" ? 0.40 : 0.60);
    const card = cards[cardId];
    if (!isAdmin) profile.cards.push(cardId);
    saveState();
    renderProfile();
    renderBackpack();
    $("zoomPackStage").classList.add("hidden");
    $("zoomResultStage").classList.remove("hidden");
    $("zoomResultImage").src = card.file;
    $("zoomResultName").textContent = card.name;
    $("zoomResultRarity").textContent = card.rarity;
    $("zoomResultCategory").textContent = CATEGORY_LABELS[card.category];
    activePackIndex = null;
    isTearingPack = false;
  }, 850);
});

$("closePackOverlay").addEventListener("click", () => $("packOpenOverlay").classList.add("hidden"));
$("zoomFinishBtn").addEventListener("click", () => $("packOpenOverlay").classList.add("hidden"));

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
  const filtered = owned.filter(id => currentAlbumFilter === "ALL" || cards[id]?.category === currentAlbumFilter);
  $("emptyAlbum").classList.toggle("hidden", filtered.length > 0);
  $("albumGrid").innerHTML = filtered.map(id => `
    <article class="owned-card" data-card-id="${id}">
      <img src="${cards[id].file}" alt="${cards[id].name}">
      <h3>${cards[id].name}</h3>
      <small>${cards[id].rarity}</small>
    </article>
  `).join("");

  document.querySelectorAll(".owned-card").forEach(el => el.addEventListener("click", () => openCardDetail(el.dataset.cardId)));
}

function openCardDetail(id) {
  const card = cards[id];
  if (!card) return;
  $("detailCategoryBadge").textContent = CATEGORY_LABELS[card.category];
  $("detailCardName").textContent = card.name;
  $("detailRarity").textContent = card.rarity;
  $("detailCardImage").src = card.file;
  $("detailStatsBox").classList.toggle("hidden", card.category !== "CHARACTER");
  if (card.category === "CHARACTER") {
    $("detailAtkValue").textContent = card.atk;
    $("detailDefValue").textContent = card.def;
  }
  $("cardDetailModal").classList.remove("hidden");
}

$("closeCardDetail").addEventListener("click", () => $("cardDetailModal").classList.add("hidden"));

function renderMailbox() {
  const profile = getProfile();
  const mailbox = profile?.mailbox || [];
  $("emptyMail").classList.toggle("hidden", mailbox.length > 0);
  $("mailList").innerHTML = mailbox.map((mail, idx) => `
    <div class="mail-card ${!mail.claimed ? 'unclaimed' : ''}">
      <h3>${mail.title}</h3>
      <p>${mail.body}</p>
      ${!mail.claimed ? `<button class="claim-mail-btn" onclick="claimSingleMail(${idx})">NHẬN QUÀ</button>` : '<span>Đã nhận</span>'}
    </div>
  `).join("");
}

window.claimSingleMail = function(idx) {
  const profile = getProfile();
  const mail = profile?.mailbox[idx];
  if (!mail || mail.claimed) return;
  if (mail.coins) profile.coins += mail.coins;
  if (mail.packs) profile.bag.push(...mail.packs);
  mail.claimed = true;
  saveState();
  renderMailbox();
  showToast("Đã nhận quà!");
};

// ==========================================
// LOGIC SÂN ĐẤU TCG 250 HP & 30 GIÂY
// ==========================================

function startAdvancedPveBattle() {
  const profile = getProfile();
  const ownedCards = isAdmin ? Object.keys(cards) : (profile?.cards || []);
  if (ownedCards.length === 0) return showToast("Bạn cần có ít nhất 1 thẻ bài trong Album!");

  battleState.playerHp = 250;
  battleState.maxPlayerHp = 250;
  battleState.botHp = 250;
  battleState.maxBotHp = 250;
  battleState.selectedSkill = null;
  battleState.selectedCharacter = null;
  battleState.selectedSituation = null;
  battleState.playerSubmitted = false;

  showScreen("pveBattleScreen");
  $("playerBattleName").textContent = isAdmin ? "Admin" : profile.username;
  $("battleLogBox").innerHTML = `<div style="text-align: left; width: 100%;">[Hệ thống] Trận đấu bắt đầu! Bạn có 30 giây để chọn bài và ấn Hoàn Thành.</div>`;
  $("confirmTurnBtn").disabled = false;

  renderBattleSlots();
  startMatchTimer();
}

function startMatchTimer() {
  battleState.timeLeft = 30;
  $("matchTimer").textContent = battleState.timeLeft;
  clearInterval(battleState.timerInterval);

  battleState.timerInterval = setInterval(() => {
    battleState.timeLeft--;
    $("matchTimer").textContent = battleState.timeLeft;
    if (battleState.timeLeft <= 0) {
      clearInterval(battleState.timerInterval);
      if (!battleState.playerSubmitted) {
        showToast("Hết giờ! Hệ thống tự động khóa bài.");
        confirmPlayerTurn();
      }
    }
  }, 1000);
}

window.openPlayerDeckPicker = function() {
  if (battleState.playerSubmitted) return showToast("Bạn đã khóa bài vòng này rồi!");
  const profile = getProfile();
  const ownedCards = isAdmin ? Object.keys(cards) : (profile?.cards || []);
  const grid = $("deckPickerGrid");

  grid.innerHTML = ownedCards.map(cid => `
    <div onclick="promptCardToBoard('${cid}')" style="background: rgba(0,0,0,0.5); border: 1px solid var(--panel-border); border-radius: 8px; padding: 6px; text-align: center; cursor: pointer;">
      <img src="${cards[cid].file}" alt="${cards[cid].name}" style="width: 100%; height: 75px; object-fit: cover; border-radius: 4px;">
      <strong style="font-size: 10px; display: block; margin-top: 4px;">${cards[cid].name}</strong>
      <small style="font-size: 9px; color: var(--muted);">${CATEGORY_LABELS[cards[cid].category]}</small>
    </div>
  `).join("");

  $("deckPickerModal").classList.remove("hidden");
};

window.closeDeckPicker = function() { $("deckPickerModal").classList.add("hidden"); };

window.promptCardToBoard = function(cardId) {
  const card = cards[cardId];
  if (!card) return;

  if (card.category === "CHARACTER") {
    window.pendingCharChoice = cardId;
    $("choiceCharName").textContent = `Chọn chỉ số cho ${card.name}`;
    $("statChoiceModal").classList.remove("hidden");
    closeDeckPicker();
  } else {
    if (card.category === "SKILL") battleState.selectedSkill = cardId;
    if (card.category === "SITUATION") battleState.selectedSituation = cardId;
    showToast(`Đã đặt [${card.name}] lên sân!`);
    closeDeckPicker();
    renderBattleSlots();
  }
};

window.submitStatChoice = function(statType) {
  battleState.playerStatType = statType;
  battleState.selectedCharacter = window.pendingCharChoice;
  const card = cards[battleState.selectedCharacter];
  showToast(`Đã chọn [${card.name}] hệ ${statType}!`);
  $("statChoiceModal").classList.add("hidden");
  renderBattleSlots();
};

window.clearSlot = function(category) {
  if (battleState.playerSubmitted) return;
  if (category === "SKILL") battleState.selectedSkill = null;
  if (category === "CHARACTER") battleState.selectedCharacter = null;
  if (category === "SITUATION") battleState.selectedSituation = null;
  renderBattleSlots();
};

function renderBattleSlots() {
  const skillBox = $("placedSkillContent");
  skillBox.innerHTML = battleState.selectedSkill ? `<img src="${cards[battleState.selectedSkill].file}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 6px;"><strong style="font-size: 9px; display: block; margin-top: 2px;">${cards[battleState.selectedSkill].name}</strong>` : `<small style="color: var(--muted); font-size: 9px;">Trống</small>`;

  const charBox = $("placedCharacterContent");
  charBox.innerHTML = battleState.selectedCharacter ? `<img src="${cards[battleState.selectedCharacter].file}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 6px;"><strong style="font-size: 9px; display: block; margin-top: 2px;">${cards[battleState.selectedCharacter].name} (${battleState.playerStatType})</strong>` : `<small style="color: var(--muted); font-size: 9px;">Trống</small>`;

  const sitBox = $("placedSituationContent");
  sitBox.innerHTML = battleState.selectedSituation ? `<img src="${cards[battleState.selectedSituation].file}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 6px;"><strong style="font-size: 9px; display: block; margin-top: 2px;">${cards[battleState.selectedSituation].name}</strong>` : `<small style="color: var(--muted); font-size: 9px;">Trống</small>`;

  $("botHpText").textContent = `${battleState.botHp} / ${battleState.maxBotHp}`;
  $("playerHpText").textContent = `${battleState.playerHp} / ${battleState.maxPlayerHp}`;
}

window.confirmPlayerTurn = function() {
  if (battleState.playerSubmitted) return;
  if (!battleState.selectedCharacter) return showToast("Bạn phải đặt thẻ Nhân vật lên sân!");

  battleState.playerSubmitted = true;
  clearInterval(battleState.timerInterval);
  $("confirmTurnBtn").disabled = true;

  $("placedSkillContent").innerHTML = `<div style="background:#334155; width:60px; height:80px; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:bold;">🎴 ÚP</div>`;
  $("placedCharacterContent").innerHTML = `<div style="background:#334155; width:60px; height:80px; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:bold;">🎴 ÚP</div>`;
  $("placedSituationContent").innerHTML = `<div style="background:#334155; width:60px; height:80px; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:bold;">🎴 ÚP</div>`;

  appendBattleLog("Bạn đã hoàn thành và úp bộ bài. Bot đang chuẩn bị...");

  setTimeout(botTurnProcess, 1500);
};

function botTurnProcess() {
  const allCards = Object.keys(cards);
  const charKeys = allCards.filter(k => cards[k].category === "CHARACTER");
  const skillKeys = allCards.filter(k => cards[k].category === "SKILL");
  const sitKeys = allCards.filter(k => cards[k].category === "SITUATION");

  const botChar = charKeys[Math.floor(Math.random() * charKeys.length)];
  const botSkill = skillKeys[Math.floor(Math.random() * skillKeys.length)];
  const botSit = sitKeys[Math.floor(Math.random() * sitKeys.length)];
  const botStat = Math.random() > 0.5 ? "ATK" : "DEF";

  $("botSlotSkill").innerHTML = `<span style="font-size:11px; color:#ff5252; font-weight:bold;">🎴 ÚP</span>`;
  $("botSlotChar").innerHTML = `<span style="font-size:11px; color:#ff5252; font-weight:bold;">🎴 ÚP</span>`;
  $("botSlotSit").innerHTML = `<span style="font-size:11px; color:#ff5252; font-weight:bold;">🎴 ÚP</span>`;

  appendBattleLog("Bot đã hoàn thành bộ bài và úp xuống.");
  setTimeout(() => resolveBattlePhase(botChar, botSkill, botSit, botStat), 1500);
}

function resolveBattlePhase(botCharKey, botSkillKey, botSitKey, botStat) {
  appendBattleLog("✨ CẢ HAI BÊN LẬT BÀI (REVEAL)!");

  const pChar = cards[battleState.selectedCharacter];
  const bChar = cards[botCharKey];

  let pVal = battleState.playerStatType === "ATK" ? pChar.atk : pChar.def;
  let bVal = botStat === "ATK" ? bChar.atk : bChar.def;

  let pLog = `Bạn lật [${pChar.name}] hệ ${battleState.playerStatType} (${pVal})`;
  let bLog = `Bot lật [${bChar.name}] hệ ${botStat} (${bVal})`;

  if (battleState.selectedSkill === "muaQuat") {
    if (pChar.name === "Khá Bảnh") {
      pVal *= 2;
      pLog += " | Múa Quạt x2 ATK Khá Bảnh!";
    } else {
      pVal += 20;
      pLog += " | Múa Quạt +20 điểm!";
    }
  }
  if (botSkillKey === "muaQuat") {
    if (bChar.name === "Khá Bảnh") {
      bVal *= 2;
    } else {
      bVal += 20;
    }
  }

  if (battleState.selectedSkill === "chuCap5Cu") {
    if (pChar.name === "Jack") {
      pVal = (pChar.def || 13) * 5;
      pLog += " | Chu Cấp 5 Củ x5 DEF Jack!";
    } else {
      pVal = Math.round((pChar.def || 10) * 1.5);
      pLog += " | Chu Cấp 5 Củ x1.5 DEF!";
    }
    if (botStat === "DEF") {
      bVal = 0;
      bLog += " | Bị Chu Cấp 5 Củ trừ DEF về 0!";
    }
  }
  if (botSkillKey === "chuCap5Cu") {
    if (bChar.name === "Jack") {
      bVal = (bChar.def || 13) * 5;
    } else {
      bVal = Math.round((bChar.def || 10) * 1.5);
    }
    if (battleState.playerStatType === "DEF") {
      pVal = 0;
      pLog += " | Bị Chu Cấp 5 Củ của Bot trừ DEF về 0!";
    }
  }

  if (battleState.selectedSituation === "vaoTu") {
    if (bChar.name === "Khá Bảnh") {
      bVal = Math.max(0, bVal - 15);
      pLog += " | Vào Tù trừ 15 điểm Khá Bảnh đối thủ!";
    }
  }
  if (botSitKey === "vaoTu") {
    if (pChar.name === "Khá Bảnh") {
      pVal = Math.max(0, pVal - 15);
      bLog += " | Vào Tù trừ 15 điểm Khá Bảnh của bạn!";
    }
  }

  appendBattleLog(pLog);
  appendBattleLog(bLog);

  let diff = 0;
  if (pVal > bVal) {
    diff = pVal - bVal;
    battleState.botHp = Math.max(0, battleState.botHp - diff);
    appendBattleLog(`🎉 Bạn thắng lượt này (${pVal} - ${bVal})! Bot mất ${diff} HP.`);
  } else if (bVal > pVal) {
    diff = bVal - pVal;
    battleState.playerHp = Math.max(0, battleState.playerHp - diff);
    appendBattleLog(`💥 Bot thắng lượt này (${bVal} - ${pVal})! Bạn mất ${diff} HP.`);
  } else {
    appendBattleLog(`🤝 Hai bên hòa nhau! Không ai mất HP.`);
  }

  renderBattleSlots();
  $("botSlotSkill").innerHTML = `Skill`;
  $("botSlotChar").innerHTML = `NV`;
  $("botSlotSit").innerHTML = `Tình huống`;

  if (battleState.botHp <= 0) {
    appendBattleLog("🏆 BẠN ĐÃ ĐÁNH BẠI BOT VÀ NHẬN 30 XU!");
    const profile = getProfile();
    if (!isAdmin && profile) {
      profile.coins += 30;
      saveState();
      renderProfile();
    }
    setTimeout(() => quitPveBattle(), 4000);
    return;
  }

  if (battleState.playerHp <= 0) {
    appendBattleLog("💀 BẠN ĐÃ THUA CUỘC TRƯỚC BOT!");
    setTimeout(() => quitPveBattle(), 4000);
    return;
  }

  setTimeout(() => {
    battleState.playerSubmitted = false;
    battleState.selectedSkill = null;
    battleState.selectedCharacter = null;
    battleState.selectedSituation = null;
    $("confirmTurnBtn").disabled = false;
    renderBattleSlots();
    appendBattleLog("--- BẮT ĐẦU VÒNG MỚI (30s) ---");
    startMatchTimer();
  }, 3500);
}

function appendBattleLog(msg) {
  const box = $("battleLogBox");
  if (!box) return;
  box.innerHTML += `<div style="text-align: left; width: 100%; margin-top: 4px;">${msg}</div>`;
  box.scrollTop = box.scrollHeight;
}

window.quitPveBattle = function() {
  clearInterval(battleState.timerInterval);
  showScreen("gameScreen");
};

document.addEventListener("click", event => {
  if (event.target.closest("#startPveBtn")) startAdvancedPveBattle();
  if (event.target.closest("#startTrainingBtn")) $("trainingGuideModal").classList.remove("hidden");
  if (event.target.closest("#closeTrainingGuideModal") || event.target === $("trainingGuideModal")) $("trainingGuideModal").classList.add("hidden");
  if (event.target.closest("#launchPracticeMatchBtn")) {
    $("trainingGuideModal").classList.add("hidden");
    startAdvancedPveBattle();
  }
});

if (state.active && state.users[state.active]) loginAs(state.active);
else switchPanel("loginPanel");

window.openProfileModal = function() {
  const profile = getProfile();
  if (!profile && !isAdmin) return;
  $("modalUsername").textContent = isAdmin ? "Admin" : profile.username;
  $("modalAvatarImg").src = isAdmin ? (state.adminAvatar || DEFAULT_AVATAR) : profile.avatar;
  const avatars = isAdmin ? [DEFAULT_AVATAR, "avt2.png", "avt3.png", "avt4.png"] : (profile.unlockedAvatars || [DEFAULT_AVATAR, "avt1.png"]);
  $("avatarPresetsContainer").innerHTML = avatars.map(avt => `<img src="${avt}" onclick="changeAvatar('${avt}')" style="width: 50px; height: 65px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid var(--panel-border);">`).join("");
  $("profileModal").classList.remove("hidden");
};

window.closeProfileModal = function() { $("profileModal").classList.add("hidden"); };
window.changeAvatar = function(src) {
  if (isAdmin) state.adminAvatar = src;
  else getProfile().avatar = src;
  saveState();
  $("userAvatarImg").src = src;
  $("modalAvatarImg").src = src;
  showToast("Đã đổi avatar!");
};

window.saveProfileInfo = function() {
  if (isAdmin) return showToast("Không đổi tên Admin!");
  const newName = $("editUsernameInput").value.trim();
  if (!/^[a-zA-Z0-9_]{3,18}$/.test(newName)) return showToast("Tên không hợp lệ!");
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
  showToast("Đã đổi tên!");
  closeProfileModal();
};

window.switchProfileTab = function(tabId, btn) {
  document.querySelectorAll('.profile-tab-pane').forEach(p => p.classList.toggle('hidden', p.id !== tabId));
  document.querySelectorAll('.profile-tab').forEach(b => { b.style.background = 'transparent'; b.style.color = 'var(--muted)'; });
  btn.style.background = 'var(--panel-border)';
  btn.style.color = 'var(--text)';
};

window.redeemGiftCode = function() {
  if (isAdmin) return;
  const code = $("redeemCodeInput").value.trim().toUpperCase();
  if (code !== "HAPPYBIRTHDAY") return showToast("Mã code không đúng!");
  const profile = getProfile();
  if (profile.redeemedCodes?.includes("HAPPYBIRTHDAY")) return showToast("Đã nhập rồi!");
  if (!profile.redeemedCodes) profile.redeemedCodes = [];
  profile.redeemedCodes.push("HAPPYBIRTHDAY");
  profile.bag.push("premium", "premium", "basic", "basic");
  saveState();
  renderProfile();
  showToast("Nhận code thành công!");
  closeProfileModal();
};

// ==========================================
// TÍNH NĂNG GỬI THƯ & TẶNG QUÀ ADMIN
// ==========================================

window.toggleRecipientMode = function() {
  const mode = document.querySelector('input[name="recipientMode"]:checked').value;
  const checklistBox = $("recipientChecklistBox");
  if (mode === "selected") {
    checklistBox.classList.remove("hidden");
    const usersObj = state.users || {};
    checklistBox.innerHTML = Object.keys(usersObj).map(key => `
      <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 12px; cursor: pointer;">
        <input type="checkbox" name="selectedUser" value="${key}"> 👤 ${usersObj[key].username}
      </label>
    `).join("");
  } else {
    checklistBox.classList.add("hidden");
  }
};

$("adminSendMailForm")?.addEventListener("submit", event => {
  event.preventDefault();
  if (!isAdmin) return;

  const mode = document.querySelector('input[name="recipientMode"]:checked').value;
  const title = $("mailSubjectInput").value.trim();
  const body = $("mailBodyInput").value.trim();
  const coins = Number($("adminGiftCoins").value) || 0;
  const pack = $("adminGiftPack").value;

  const mailObj = {
    title,
    body,
    coins,
    packs: pack ? [pack] : [],
    claimed: false
  };

  if (mode === "all") {
    Object.keys(state.users).forEach(key => {
      if (!Array.isArray(state.users[key].mailbox)) state.users[key].mailbox = [];
      state.users[key].mailbox.push({ ...mailObj });
    });
    showToast("Đã gửi thư & tặng quà tới TẤT CẢ người chơi!");
  } else {
    const checkedUsers = Array.from(document.querySelectorAll('input[name="selectedUser"]:checked')).map(el => el.value);
    if (checkedUsers.length === 0) return showToast("Vui lòng chọn ít nhất 1 người nhận!");
    checkedUsers.forEach(key => {
      if (state.users[key]) {
        if (!Array.isArray(state.users[key].mailbox)) state.users[key].mailbox = [];
        state.users[key].mailbox.push({ ...mailObj });
      }
    });
    showToast(`Đã gửi thư & tặng quà tới ${checkedUsers.length} người chơi!`);
  }

  saveState();
  $("adminSendMailForm").reset();
  toggleRecipientMode();
});

let selectedUserForQuickGift = null;

window.openAdminGiftModal = function(usernameKey) {
  selectedUserForQuickGift = usernameKey;
  const u = state.users[usernameKey];
  if (!u) return;
  $("targetGiftUsername").textContent = `Người nhận: ${u.username}`;
  $("quickGiftCoins").value = 10;
  $("quickGiftPack").value = "";
  $("adminGiftModal").classList.remove("hidden");
};

window.submitQuickGift = function() {
  if (!selectedUserForQuickGift || !state.users[selectedUserForQuickGift]) return;
  const u = state.users[selectedUserForQuickGift];
  const coins = Number($("quickGiftCoins").value) || 0;
  const pack = $("quickGiftPack").value;

  if (coins > 0) u.coins += coins;
  if (pack) {
    if (!Array.isArray(u.bag)) u.bag = [];
    u.bag.push(pack);
  }

  if (!Array.isArray(u.mailbox)) u.mailbox = [];
  u.mailbox.push({
    title: "🎁 Quà từ Admin",
    body: `Admin đã gửi tặng bạn ${coins} xu${pack ? ' và 1 ' + pack + ' pack' : ''}!`,
    coins,
    packs: pack ? [pack] : [],
    claimed: true
  });

  saveState();
  showToast(`Đã tặng quà thành công cho ${u.username}!`);
  $("adminGiftModal").classList.add("hidden");
  renderAdminUserManagement();
};

function renderAdminUserManagement() {
  if (!isAdmin) return;
  const usersObj = state.users || {};
  const keys = Object.keys(usersObj);
  const container = $("adminUserManagementList");
  if (!container) return;
  if (keys.length === 0) {
    container.innerHTML = `<p class="empty-state">Chưa có người chơi nào đăng ký tài khoản.</p>`;
    return;
  }
  container.innerHTML = keys.map(key => {
    const u = usersObj[key];
    const isBanned = !!u.banned;
    return `
      <div class="admin-mgmt-card ${isBanned ? 'banned-card' : ''}" style="background: rgba(0,0,0,0.4); border: 1px solid var(--panel-border); padding: 12px; border-radius: 10px; margin-bottom: 10px;">
        <div class="mgmt-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong>👤 ${u.username}</strong>
          <span class="mgmt-status-badge ${isBanned ? 'banned' : ''}" style="font-size: 10px; padding: 2px 8px; border-radius: 4px; background: ${isBanned ? '#ff5252' : '#8ef0c1'}; color: #000; font-weight: bold;">${isBanned ? 'BANNED' : 'ACTIVE'}</span>
        </div>
        <small style="color: var(--muted); font-size: 11px; display: block; margin-bottom: 8px;">📧 ${u.email || 'Không có'}</small>
        <div class="mgmt-stats" style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 10px;">
          <span>🪙 Xu: <b>${u.coins}</b></span>
          <span>🃏 Thẻ: <b>${u.cards ? u.cards.length : 0}</b></span>
          <span>🎒 Pack: <b>${u.bag ? u.bag.length : 0}</b></span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="primary-btn" onclick="openAdminGiftModal('${key}')" style="flex: 1; padding: 6px; font-size: 11px; background: #00d2ff; color: #000; font-weight: bold;">🎁 Tặng quà</button>
          <button class="primary-btn" onclick="toggleBanUser('${key}')" style="flex: 1; padding: 6px; font-size: 11px; background: ${isBanned ? '#8ef0c1' : '#ff5252'}; color: #000; font-weight: bold;">${isBanned ? 'Mở khóa' : 'Khóa TK'}</button>
        </div>
      </div>
    `;
  }).join("");
}

window.toggleBanUser = function(key) {
  const u = state.users[key];
  if (!u) return;
  u.banned = !u.banned;
  saveState();
  renderAdminUserManagement();
  showToast(`Đã ${u.banned ? 'khóa' : 'mở khóa'} tài khoản ${u.username}!`);
};

window.exportDataBackup = function() {
  const exportPayload = isAdmin ? state : {
    users: currentUser && state.users[currentUser] ? { [currentUser]: state.users[currentUser] } : {},
    active: null,
    adminMailbox: []
  };
  const fileName = isAdmin ? "meme_card_arena_backup.json" : `meme_card_arena_${currentUser || "player"}_backup.json`;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("Đã xuất file backup!");
};

window.importDataBackup = async function(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  try {
    let mergedUsers = { ...(state.users || {}) };
    for (let file of files) {
      const text = await file.text();
      const importedState = JSON.parse(text);
      if (importedState && importedState.users) {
        mergedUsers = { ...mergedUsers, ...importedState.users };
      }
    }
    state.users = mergedUsers;
    saveState();
    renderAdminUserManagement();
    showToast(`Nhập thành công ${files.length} file backup!`);
  } catch (err) {
    showToast("Lỗi đọc file JSON!");
  }
  event.target.value = "";
};
