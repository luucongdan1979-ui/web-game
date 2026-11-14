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
  vaoTu: {
    name: "Vào Tù",
    file: "Vào Tù Th.png",
    rarity: "LEGENDARY",
    category: "SITUATION"
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
    return {
      coins: Infinity,
      cards: Object.keys(cards),
      bag: state.adminBag,
      mailbox: state.adminMailbox,
      starterOpened: true
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
    cards: [],
    bag: [],
    mailbox: [],
    starterOpened: false,
    banned: false
  };
}

$("registerPanel").addEventListener("submit", event => {
  event.preventDefault();
  const username = $("registerUsername").value.trim();
  const email = $("registerEmail").value.trim().toLowerCase();
  const password = $("registerPassword").value;
  const key = username.toLowerCase();

  if (state.users[key]) return showAuthMessage("Tên tài khoản đã tồn tại!");
  if (!/^[a-zA-Z0-9_]{3,18}$/.test(username)) return showAuthMessage("Tên tài khoản cần 3–18 ký tự.");
  if (password.length < 6) return showAuthMessage("Mật khẩu cần ít nhất 6 ký tự!");

  state.users[key] = createProfile(username, email, password);
  saveState();
  loginAs(key);
});

$("loginPanel").addEventListener("submit", event => {
  event.preventDefault();
  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;
  const profile = state.users[username];

  if (!profile || profile.password !== password) return showAuthMessage("Tên tài khoản hoặc mật khẩu không đúng!");
  if (profile.banned) return showAuthMessage("Tài khoản này đã bị khóa bởi Admin!");

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

  $("welcomeUser").textContent = isAdmin ? "Xin chào, Admin!" : `Xin chào, ${displayName}!`;
  $("adminTag").classList.toggle("hidden", !isAdmin);
  $("adminCheckNavBtn").classList.toggle("hidden", !isAdmin);
  $("adminSendMailNavBtn").classList.toggle("hidden", !isAdmin);
  if ($("userExportBtn")) $("userExportBtn").classList.remove("hidden");

  renderProfile();
  showScreen("gameScreen");

  if (isAdmin || getProfile().starterOpened) {
    hideOldStarterChest();
  } else {
    showStarterOverlay();
  }
}

function showScreen(screenId) {
  ["gameScreen", "shopScreen", "backpackScreen", "albumScreen", "mailScreen", "adminSendMailScreen", "adminCheckScreen"].forEach(id => {
    $(id).classList.toggle("hidden", id !== screenId);
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

  document.body.classList.remove("logged-in", "starter-active");
  $("starterOverlay").classList.add("hidden");
  $("packOpenOverlay").classList.add("hidden");
  $("cardDetailModal").classList.add("hidden");
  $("adminGiftModal").classList.add("hidden");
  if ($("userExportBtn")) $("userExportBtn").classList.add("hidden");

  $("arenaCopyChest").classList.remove("hidden");
  $("chibiClownHome").classList.add("hidden");
  $("mainArena").classList.remove("chest-completed");

  $("authScreen").classList.remove("hidden");
  $("gameScreen").classList.add("hidden");
  $("shopScreen").classList.add("hidden");
  $("backpackScreen").classList.add("hidden");
  $("albumScreen").classList.add("hidden");
  $("mailScreen").classList.add("hidden");
  $("adminSendMailScreen").classList.add("hidden");
  $("adminCheckScreen").classList.add("hidden");
  $("bottomNav").classList.add("hidden");

  $("welcomeUser").textContent = "Chào mừng đến đấu trường!";
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
  pendingCard = getRandomCardByRarity(0.60);
  const card = cards[pendingCard];
  profile.cards.push(pendingCard);
  profile.starterOpened = true;
  saveState();

  $("packStage").classList.add("hidden");
  $("starterResultStage").classList.remove("hidden");
  $("starterTitle").textContent = "CHÚC MỪNG!";
  $("starterDescription").textContent = "Bạn đã nhận được một thẻ bài mới!";

  const img = $("starterResultImage");
  img.style.display = "block";
  img.src = card.file;
  img.alt = card.name;
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
      if (!profile || profile.coins < price) return showToast("Bạn không đủ xu để mua pack!");
      profile.coins -= price;
    }
    profile.bag.push(packType);
    saveState();
    renderProfile();
    showToast(`Đã mua gói bài và cất vào Balo!`);
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
          <div class="foil-crimp top"></div><div class="foil-shine"></div>
          <span class="foil-badge">${isPremium ? "GOLD EDITION" : "STANDARD"}</span>
          <div class="foil-emblem">${isPremium ? "✧" : "✦"}</div>
          <div class="foil-title">${isPremium ? "PREMIUM<br>PACK" : "BASIC<br>PACK"}</div>
          <div class="foil-sub">MEME ARENA</div><div class="foil-crimp bottom"></div>
        </div>
        <h4>${isPremium ? "Premium Pack" : "Basic Pack"}</h4>
        <span>Nhấn để xem & mở</span>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".bag-item").forEach(item => {
    item.addEventListener("click", () => {
      openPackZoomModal(Number(item.dataset.index), item.dataset.type);
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

  setTimeout(() => {
    const profile = getProfile();
    profile.bag.splice(activePackIndex, 1);
    const rareChance = (activePackType === "premium") ? 0.40 : 0.60;
    const cardId = getRandomCardByRarity(rareChance);
    const card = cards[cardId];
    if (!isAdmin) profile.cards.push(cardId);
    saveState();
    renderProfile();
    renderBackpack();

    $("zoomPackStage").classList.add("hidden");
    $("zoomResultStage").classList.remove("hidden");
    const img = $("zoomResultImage");
    img.style.display = "block";
    img.src = card.file;
    img.alt = card.name;
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
    return `
      <article class="owned-card" data-card-id="${id}">
        <img src="${card.file}" alt="${card.name}">
        <h3>${card.name}</h3>
        <small>${card.rarity} · ${CATEGORY_LABELS[card.category]}</small>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".owned-card").forEach(el => {
    el.addEventListener("click", () => openCardDetail(el.dataset.cardId));
  });
}

function openCardDetail(cardId) {
  const card = cards[cardId];
  if (!card) return;
  const isCharacter = card.category === "CHARACTER";
  $("detailCategoryBadge").textContent = CATEGORY_LABELS[card.category];
  $("detailCardName").textContent = card.name;
  $("detailRarity").textContent = card.rarity;

  const img = $("detailCardImage");
  img.style.display = "block";
  img.src = card.file;
  $("detailStatsBox").classList.toggle("hidden", !isCharacter);
  if (isCharacter) {
    $("detailAtkValue").textContent = card.atk ?? 0;
    $("detailDefValue").textContent = card.def ?? 0;
  }
  $("cardDetailModal").classList.remove("hidden");
}

$("closeCardDetail").addEventListener("click", () => $("cardDetailModal").classList.add("hidden"));

function sendMailToUser(userObj, mailData) {
  if (!Array.isArray(userObj.mailbox)) userObj.mailbox = [];
  const hasRewards = (mailData.coins > 0) || (mailData.packs?.length > 0) || (mailData.cards?.length > 0);
  userObj.mailbox.unshift({
    id: "mail_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    title: mailData.title || "Thư hệ thống",
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
  $("emptyMail").classList.toggle("hidden", mailbox.length > 0);
  const hasUnclaimed = mailbox.some(m => !m.claimed);
  $("claimAllMailBtn").classList.toggle("hidden", !hasUnclaimed);

  $("mailList").innerHTML = mailbox.map((mail, idx) => {
    const basicCount = (mail.packs || []).filter(p => p === "basic").length;
    const premCount = (mail.packs || []).filter(p => p === "premium").length;
    let rewardsHtml = "";
    if (mail.coins > 0) rewardsHtml += `<span class="reward-chip">🪙 +${mail.coins} Xu</span>`;
    if (basicCount > 0) rewardsHtml += `<span class="reward-chip">📦 ${basicCount}x Basic</span>`;
    if (premCount > 0) rewardsHtml += `<span class="reward-chip">👑 ${premCount}x Premium</span>`;
    (mail.cards || []).forEach(cid => {
      rewardsHtml += `<span class="reward-chip">🃏 Thẻ: ${cards[cid]?.name || cid}</span>`;
    });

    return `
      <div class="mail-card ${!mail.claimed ? 'unclaimed' : ''}">
        <div class="mail-card-top">
          <div><h3>${!mail.claimed ? '📩' : '📨'} ${mail.title}</h3><span class="mail-date">${mail.date}</span></div>
          ${!mail.claimed ? `<span class="mgmt-status-badge">MỚI</span>` : ''}
        </div>
        <p class="mail-body-text">${mail.body}</p>
        ${rewardsHtml ? `<div class="mail-attachments">${rewardsHtml}</div>` : ''}
        <div class="mail-card-footer">
          ${!mail.claimed ? `<button class="claim-mail-btn" onclick="claimSingleMail(${idx})">NHẬN QUÀ ✦</button>` : `<span class="claimed-tag">✓ Đã nhận</span>`}
        </div>
      </div>
    `;
  }).join("");
}

window.claimSingleMail = function(index) {
  const profile = getProfile();
  const mail = profile?.mailbox?.[index];
  if (!mail || mail.claimed) return;

  if (!isAdmin && mail.coins > 0) profile.coins += mail.coins;
  if (mail.packs?.length > 0) profile.bag.push(...mail.packs);
  if (mail.cards?.length > 0 && !isAdmin) {
    mail.cards.forEach(cid => {
      if (!profile.cards.includes(cid)) profile.cards.push(cid);
    });
  }
  mail.claimed = true;
  saveState();
  renderProfile();
  renderMailbox();
  showToast("Đã nhận quà thành công!");
};

$("claimAllMailBtn").addEventListener("click", () => {
  const profile = getProfile();
  if (!profile?.mailbox) return;
  profile.mailbox.forEach((mail) => {
    if (!mail.claimed) {
      if (!isAdmin && mail.coins > 0) profile.coins += mail.coins;
      if (mail.packs?.length > 0) profile.bag.push(...mail.packs);
      if (mail.cards?.length > 0 && !isAdmin) {
        mail.cards.forEach(cid => {
          if (!profile.cards.includes(cid)) profile.cards.push(cid);
        });
      }
      mail.claimed = true;
    }
  });
  saveState();
  renderProfile();
  renderMailbox();
  showToast("Đã nhận toàn bộ quà trong hòm thư!");
});

document.querySelectorAll('input[name="recipientMode"]').forEach(radio => {
  radio.addEventListener("change", () => {
    $("recipientChecklistBox").classList.toggle("hidden", radio.value !== "selected");
  });
});

function renderAdminSendMailScreen() {
  if (!isAdmin) return;
  const usersObj = state.users || {};
  const keys = Object.keys(usersObj);
  const checklistBox = $("recipientChecklistBox");

  if (keys.length === 0) {
    checklistBox.innerHTML = `<small style="color: var(--muted);">Chưa có người chơi nào.</small>`;
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
        <div class="gift-card-info"><strong>${c.name}</strong><small>${c.rarity}</small></div>
      </div>
    `;
  }).join("");
}

$("adminSendMailForm").addEventListener("submit", e => {
  e.preventDefault();
  if (!isAdmin) return;
  const mode = document.querySelector('input[name="recipientMode"]:checked').value;
  let targetKeys = mode === "all" ? Object.keys(state.users || {}) : Array.from(document.querySelectorAll('input[name="selectedRecipients"]:checked')).map(cb => cb.value);

  if (targetKeys.length === 0) return showToast("Vui lòng chọn người nhận!");

  const title = $("mailSubjectInput").value.trim();
  const body = $("mailBodyInput").value.trim();
  const coins = Math.max(0, parseInt($("mailAttachCoins").value) || 0);
  const basicQty = Math.max(0, parseInt($("mailAttachBasic").value) || 0);
  const premQty = Math.max(0, parseInt($("mailAttachPremium").value) || 0);
  const packs = [];
  for (let i = 0; i < basicQty; i++) packs.push("basic");
  for (let i = 0; i < premQty; i++) packs.push("premium");
  const selectedCardIds = Array.from(document.querySelectorAll("#mailAttachCardsGrid .gift-card-item.selected")).map(el => el.dataset.cardId);

  targetKeys.forEach(k => {
    if (state.users[k]) {
      sendMailToUser(state.users[k], { title, body, coins, packs, cards: selectedCardIds });
    }
  });

  saveState();
  $("mailSubjectInput").value = "";
  $("mailBodyInput").value = "";
  $("mailAttachCoins").value = "0";
  $("mailAttachBasic").value = "0";
  $("mailAttachPremium").value = "0";
  document.querySelectorAll("#mailAttachCardsGrid .gift-card-item.selected").forEach(el => el.classList.remove("selected"));
  showToast(`Đã gửi thư cho ${targetKeys.length} tài khoản!`);
});

function renderAdminUserManagement() {
  if (!isAdmin) return;
  const usersObj = state.users || {};
  const keys = Object.keys(usersObj);
  const container = $("adminUserManagementList");

  if (keys.length === 0) {
    container.innerHTML = `<p class="empty-state">Chưa có người chơi nào.</p>`;
    return;
  }

  container.innerHTML = keys.map(key => {
    const u = usersObj[key];
    const isBanned = !!u.banned;
    return `
      <div class="admin-mgmt-card ${isBanned ? 'banned-card' : ''}">
        <div class="mgmt-header">
          <strong>👤 ${u.username}</strong>
          <span class="mgmt-status-badge ${isBanned ? 'banned' : ''}">${isBanned ? 'BANNED' : 'ACTIVE'}</span>
        </div>
        <small style="color: var(--muted); font-size: 11px;">📧 ${u.email || 'N/A'}</small>
        <div class="mgmt-stats">
          <span>🪙 Xu: <b>${u.coins}</b></span>
          <span>🃏 Thẻ: <b>${u.cards?.length || 0}</b></span>
          <span>🎒 Pack: <b>${u.bag?.length || 0}</b></span>
        </div>
        <div class="mgmt-actions">
          <div class="mgmt-btn-row">
            <button class="mgmt-btn" onclick="adminAdjustCoins('${key}', 10)">+10 Xu</button>
            <button class="mgmt-btn" onclick="adminAdjustCoins('${key}', -10)">-10 Xu</button>
            <button class="mgmt-btn gift-btn" onclick="openAdminGiftModal('${key}')">🎁 Tặng</button>
          </div>
          <div class="mgmt-btn-row">
            ${isBanned ? `<button class="mgmt-btn unban-btn" onclick="adminToggleBan('${key}')">Gỡ Ban</button>` : `<button class="mgmt-btn ban-btn" onclick="adminToggleBan('${key}')">Ban TK</button>`}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

window.adminAdjustCoins = function(userKey, amount) {
  const u = state.users[userKey];
  if (!u) return;
  u.coins = Math.max(0, u.coins + amount);
  saveState();
  renderAdminUserManagement();
  showToast(`Đã cập nhật xu cho ${u.username}!`);
};

window.adminToggleBan = function(userKey) {
  const u = state.users[userKey];
  if (!u) return;
  u.banned = !u.banned;
  saveState();
  renderAdminUserManagement();
  showToast(u.banned ? `Đã ban tài khoản ${u.username}!` : `Đã gỡ ban ${u.username}!`);
};

window.openAdminGiftModal = function(userKey) {
  targetGiftUserKey = userKey;
  const u = state.users[userKey];
  if (!u) return;
  $("giftModalTitle").textContent = `Tặng quà cho: ${u.username}`;
  $("giftBasicPackQty").value = "0";
  $("giftPremiumPackQty").value = "0";

  const owned = u.cards || [];
  const unowned = Object.keys(cards).filter(id => !owned.includes(id));
  const container = $("giftCardsContainer");

  container.innerHTML = unowned.length === 0 ? `<p class="empty-state" style="grid-column: span 2;">Đã sở hữu mọi thẻ bài!</p>` : unowned.map(id => {
    const c = cards[id];
    return `
      <div class="gift-card-item" data-card-id="${id}" onclick="toggleGiftCardSelect(this)">
        <img src="${c.file}" alt="${c.name}">
        <div class="gift-card-info"><strong>${c.name}</strong><small>${c.rarity}</small></div>
      </div>
    `;
  }).join("");
  $("adminGiftModal").classList.remove("hidden");
};

window.toggleGiftCardSelect = function(el) { el.classList.toggle("selected"); };
$("closeAdminGiftModal").addEventListener("click", () => { $("adminGiftModal").classList.add("hidden"); targetGiftUserKey = null; });

$("confirmGiftBtn").addEventListener("click", () => {
  if (!targetGiftUserKey) return;
  const u = state.users[targetGiftUserKey];
  if (!u) return;
  const basicQty = Math.max(0, parseInt($("giftBasicPackQty").value) || 0);
  const premQty = Math.max(0, parseInt($("giftPremiumPackQty").value) || 0);
  const packs = [];
  for (let i = 0; i < basicQty; i++) packs.push("basic");
  for (let i = 0; i < premQty; i++) packs.push("premium");
  const selectedCardIds = Array.from(document.querySelectorAll("#giftCardsContainer .gift-card-item.selected")).map(el => el.dataset.cardId);

  if (packs.length === 0 && selectedCardIds.length === 0) return showToast("Vui lòng chọn quà để tặng!");

  sendMailToUser(u, { title: "🎁 Quà tặng từ Admin", body: "Bạn có quà tặng mới trong hòm thư!", coins: 0, packs, cards: selectedCardIds });
  saveState();
  $("adminGiftModal").classList.add("hidden");
  renderAdminUserManagement();
  showToast(`Đã gửi quà vào hòm thư ${u.username}!`);
  targetGiftUserKey = null;
});

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
  showToast("Đã xuất file backup thành công!");
};

window.importDataBackup = async function(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  try {
    let mergedUsers = { ...(state.users || {}) };
    let mergedMailbox = [ ...(state.adminMailbox || []) ];
    for (let file of files) {
      const text = await file.text();
      const importedState = JSON.parse(text);
      if (importedState && importedState.users) {
        mergedUsers = { ...mergedUsers, ...importedState.users };
        if (Array.isArray(importedState.adminMailbox)) mergedMailbox = [...mergedMailbox, ...importedState.adminMailbox];
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

if (state.active && state.users[state.active]) {
  loginAs(state.active);
} else {
  switchPanel("loginPanel");
}
