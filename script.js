const $ = id => document.getElementById(id);

const STORAGE_KEY = "memeCardArenaDemo_v6";
const ADMIN_CODE = "171113";

// Danh sách thẻ bài kèm chỉ số ATK & DEF cho nhân vật
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
let toastTimer;

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      users: {},
      active: null
    };
  } catch {
    return { users: {}, active: null };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getProfile() {
  if (isAdmin) {
    if (!state.adminBag) state.adminBag = [];
    return {
      coins: Infinity,
      cards: Object.keys(cards),
      bag: state.adminBag,
      starterOpened: true
    };
  }
  const p = currentUser ? state.users[currentUser] : null;
  if (p && !Array.isArray(p.bag)) p.bag = [];
  return p;
}

// THÔNG BÁO
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

// CHUYỂN TAB ĐĂNG NHẬP
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

// TẠO TÀI KHOẢN MỚI: 20 XU
function createProfile(username, email, password) {
  return {
    username,
    email,
    password,
    coins: 20,
    cards: [],
    bag: [],
    starterOpened: false
  };
}

$("registerPanel").addEventListener("submit", event => {
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

  state.users[key] = createProfile(username, email, password);
  saveState();
  loginAs(key);
});

// ĐĂNG NHẬP
$("loginPanel").addEventListener("submit", event => {
  event.preventDefault();

  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;
  const profile = state.users[username];

  if (!profile || profile.password !== password) {
    return showAuthMessage("Tên tài khoản hoặc mật khẩu không đúng!");
  }

  loginAs(username);
});

// ADMIN
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

  $("welcomeUser").textContent = isAdmin
    ? "Xin chào, Admin!"
    : `Xin chào, ${displayName}!`;

  $("adminTag").classList.toggle("hidden", !isAdmin);

  renderProfile();
  showScreen("gameScreen");

  if (isAdmin || getProfile().starterOpened) {
    hideOldStarterChest();
  } else {
    showStarterOverlay();
  }
}

// ĐIỀU HƯỚNG TASKBAR
function showScreen(screenId) {
  ["gameScreen", "shopScreen", "backpackScreen", "albumScreen"].forEach(id => {
    $(id).classList.toggle("hidden", id !== screenId);
  });

  document.querySelectorAll(".nav-item[data-screen]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.screen === screenId);
  });

  if (screenId === "backpackScreen") renderBackpack();
  if (screenId === "albumScreen") renderAlbum();
}

document.querySelectorAll(".nav-item[data-screen]").forEach(btn => {
  btn.addEventListener("click", () => showScreen(btn.dataset.screen));
});

// ĐĂNG XUẤT
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

  // Khôi phục lại rương tân thủ cho lần đăng nhập sau nếu chưa mở
  $("arenaCopyChest").classList.remove("hidden");
  $("chibiClownHome").classList.add("hidden");
  $("mainArena").classList.remove("chest-completed");

  $("authScreen").classList.remove("hidden");
  $("gameScreen").classList.add("hidden");
  $("shopScreen").classList.add("hidden");
  $("backpackScreen").classList.add("hidden");
  $("albumScreen").classList.add("hidden");
  $("bottomNav").classList.add("hidden");

  $("welcomeUser").textContent = "Chào mừng đến đấu trường!";
  $("loginPassword").value = "";
  $("adminCode").value = "";

  switchPanel("loginPanel");
});

// CẬP NHẬT THÔNG TIN & BADGE BALO
function renderProfile() {
  const profile = getProfile();
  if (!profile) return;

  $("coinCount").textContent = isAdmin ? "∞" : profile.coins;

  const bagCount = profile.bag ? profile.bag.length : 0;
  const badge = $("navPackBadge");
  badge.textContent = bagCount;
  badge.classList.toggle("hidden", bagCount === 0);

  $("starterChest").classList.toggle("opened", !!profile.starterOpened);
  $("openStarterBtn").textContent = profile.starterOpened ? "ĐÃ MỞ RƯƠNG" : "MỞ RƯƠNG NGAY ✦";
  $("openStarterBtn").disabled = !!profile.starterOpened;
}

// Khi đã mở rương xong, ẩn rương đi và hiện chú hề Chibi ở trang chủ
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

// CHỌN LÁ BÀI THEO TỈ LỆ
function getRandomCardByRarity(rareChance) {
  const rand = Math.random();
  const targetRarity = rand < rareChance ? "RARE" : "LEGENDARY";
  const matchingKeys = Object.keys(cards).filter(key => cards[key].rarity === targetRarity);
  return matchingKeys[Math.floor(Math.random() * matchingKeys.length)];
}

// ==========================================
// RƯƠNG TÂN THỦ
// ==========================================
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
  img.onerror = function() { this.style.display = "none"; };

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

// ==========================================
// SHOP -> MUA PACK CẤT VÀO BALO
// ==========================================
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

// ==========================================
// BALO -> PHÓNG TO PACK -> XÉ PACK
// ==========================================
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

    const rareChance = (activePackType === "premium") ? 0.40 : 0.60;
    const cardId = getRandomCardByRarity(rareChance);
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
    img.onerror = function() { this.style.display = "none"; };

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

// ==========================================
// ALBUM & PHÓNG TO XEM CHI TIẾT THẺ BÀI
// ==========================================
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

  $("detailCategoryBadge").textContent = catLabel;
  $("detailCardName").textContent = card.name;
  $("detailRarity").textContent = card.rarity;

  const img = $("detailCardImage");
  img.style.display = "block";
  img.src = card.file;
  img.alt = card.name;
  img.onerror = function() { this.style.display = "none"; };

  $("detailStatsBox").classList.toggle("hidden", !isCharacter);
  $("detailSituationNote").classList.toggle("hidden", isCharacter);

  if (isCharacter) {
    $("detailAtkValue").textContent = card.atk ?? 0;
    $("detailDefValue").textContent = card.def ?? 0;
  }

  $("cardDetailModal").classList.remove("hidden");
}

$("closeCardDetail").addEventListener("click", () => {
  $("cardDetailModal").classList.add("hidden");
});

$("cardDetailModal").addEventListener("click", event => {
  if (event.target === $("cardDetailModal")) {
    $("cardDetailModal").classList.add("hidden");
  }
});

// KHÔI PHỤC ĐĂNG NHẬP
if (state.active && state.users[state.active]) {
  loginAs(state.active);
} else {
  switchPanel("loginPanel");
}
