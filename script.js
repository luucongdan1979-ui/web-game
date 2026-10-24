
"use strict";

/* =========================
   CARD ARENA - GAME SCRIPT
   ========================= */

const USERS_KEY = "cardArenaInteractiveUsersV1";
const SESSION_KEY = "cardArenaInteractiveSessionV1";
const ADMIN_CODE = "171113";

const CARD_DATA = [
  {
    id: "kha-banh",
    name: "Khá Bảnh",
    category: "CHARACTER",
    rarity: "RARE",
    image: "./kh%C3%A1%20b%E1%BA%A3nh%20nv.png",
    description: "Một nhân vật trong bộ sưu tập meme CARD ARENA."
  },
  {
    id: "jack-j97",
    name: "Jack J97",
    category: "CHARACTER",
    rarity: "LEGENDARY",
    image: "./jack%20nv.png",
    description: "Một nhân vật nổi bật trong bộ sưu tập meme CARD ARENA."
  },

  ...Array.from({ length: 7 }, (_, i) => ({
    id: `character-${i + 3}`,
    name: `Nhân vật ${i + 3}`,
    category: "CHARACTER",
    rarity: "RARE",
    placeholder: true,
    description: "Ô thẻ nhân vật chưa được mở khóa."
  })),

  ...Array.from({ length: 3 }, (_, i) => ({
    id: `skill-${i + 1}`,
    name: `Skill ${i + 1}`,
    category: "SKILL",
    rarity: "RARE",
    placeholder: true,
    description: "Ô thẻ skill chưa được mở khóa."
  })),

  ...Array.from({ length: 3 }, (_, i) => ({
    id: `situation-${i + 1}`,
    name: `Tình huống ${i + 1}`,
    category: "SITUATION",
    rarity: "RARE",
    placeholder: true,
    description: "Ô thẻ tình huống chưa được mở khóa."
  }))
];

const CATEGORY_LABELS = {
  CHARACTER: "Nhân vật",
  SKILL: "Skill",
  SITUATION: "Tình huống"
};

const CATEGORY_LIMITS = {
  CHARACTER: 9,
  SKILL: 3,
  SITUATION: 3
};

const PACK_DATA = {
  basic: {
    name: "Basic Pack",
    price: 10,
    description: "70% Rare · 30% Legendary",
    rareChance: 0.7
  },
  premium: {
    name: "Premium Pack",
    price: 20,
    description: "40% Rare · 60% Legendary",
    rareChance: 0.4
  }
};

let currentUser = null;
let isRegisterMode = false;
let isAdminMode = false;
let activeFilter = "ALL";
let selectedPackId = null;
let toastTimeout = null;

/* =========================
   STORAGE
   ========================= */

function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveCurrentUser() {
  if (!currentUser || currentUser.isAdmin) return;

  const users = readUsers();
  const index = users.findIndex(
    user => user.username.toLowerCase() === currentUser.username.toLowerCase()
  );

  if (index !== -1) {
    users[index] = currentUser;
    saveUsers(users);
  }
}

function setSession(username) {
  localStorage.setItem(SESSION_KEY, username);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function ensureUserData(user) {
  if (!Number.isFinite(user.coins)) user.coins = 17;
  if (!Array.isArray(user.ownedCards)) user.ownedCards = [];
  if (!Array.isArray(user.inventoryPacks)) user.inventoryPacks = [];
  if (typeof user.starterClaimed !== "boolean") user.starterClaimed = false;
  return user;
}

/* =========================
   ELEMENT HELPERS
   ========================= */

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function showModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("show");
}

function hideModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("show");
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function setMessage(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("error", isError);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

/* =========================
   LOGIN / REGISTER
   ========================= */

function openAuth(registerMode = false) {
  isRegisterMode = registerMode;
  updateAuthForm();
  setMessage($("#authMessage"), "");
  showModal("authModal");
}

function updateAuthForm() {
  $("#authTitle").textContent = isRegisterMode ? "ĐĂNG KÝ" : "ĐĂNG NHẬP";
  $("#authSubmitBtn").textContent = isRegisterMode ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP";
  $("#switchAuthText").textContent = isRegisterMode
    ? "Đã có tài khoản?"
    : "Chưa có tài khoản?";
  $("#switchAuthBtn").textContent = isRegisterMode ? "Đăng nhập" : "Đăng ký";

  $("#registerFields").classList.toggle("hidden", !isRegisterMode);
  $("#authEmail").required = isRegisterMode;
  $("#authPassword").autocomplete = isRegisterMode
    ? "new-password"
    : "current-password";
}

function handleAuthSubmit(event) {
  event.preventDefault();

  const username = $("#authUsername").value.trim();
  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;

  if (username.length < 3) {
    setMessage($("#authMessage"), "Tên tài khoản cần ít nhất 3 ký tự.", true);
    return;
  }

  if (password.length < 4) {
    setMessage($("#authMessage"), "Mật khẩu cần ít nhất 4 ký tự.", true);
    return;
  }

  const users = readUsers();

  if (isRegisterMode) {
    if (!email || !$("#authEmail").checkValidity()) {
      setMessage($("#authMessage"), "Vui lòng nhập địa chỉ email hợp lệ.", true);
      return;
    }

    if (users.some(user =>
      user.username.toLowerCase() === username.toLowerCase()
    )) {
      setMessage($("#authMessage"), "Tên tài khoản đã tồn tại.", true);
      return;
    }

    if (users.some(user =>
      user.email.toLowerCase() === email.toLowerCase()
    )) {
      setMessage($("#authMessage"), "Email này đã được đăng ký.", true);
      return;
    }

    const newUser = {
      username,
      email,
      password,
      coins: 17,
      ownedCards: [],
      inventoryPacks: [],
      starterClaimed: false
    };

    users.push(newUser);
    saveUsers(users);

    currentUser = ensureUserData(newUser);
    setSession(username);
    hideModal("authModal");
    enterGame();

    showToast("Đăng ký thành công! Chào mừng bạn đến CARD ARENA.");
    return;
  }

  const matchedUser = users.find(user =>
    user.username.toLowerCase() === username.toLowerCase() &&
    user.password === password
  );

  if (!matchedUser) {
    setMessage($("#authMessage"), "Tên tài khoản hoặc mật khẩu không đúng.", true);
    return;
  }

  currentUser = ensureUserData(matchedUser);
  saveCurrentUser();
  setSession(currentUser.username);

  hideModal("authModal");
  enterGame();
  showToast("Đăng nhập thành công!");
}

/* =========================
   ADMIN
   ========================= */

function loginAdmin(event) {
  event.preventDefault();

  const code = $("#adminCode").value.trim();

  if (code !== ADMIN_CODE) {
    setMessage($("#adminMessage"), "Mã quản trị không chính xác.", true);
    return;
  }

  isAdminMode = true;
  currentUser = {
    username: "ADMIN",
    isAdmin: true,
    coins: 9999,
    ownedCards: CARD_DATA.filter(card => !card.placeholder).map(card => card.id),
    inventoryPacks: [],
    starterClaimed: true
  };

  hideModal("adminModal");
  enterGame();
  showToast("Đã vào chế độ quản trị.");
}

/* =========================
   GAME NAVIGATION
   ========================= */

function enterGame() {
  $("#welcomeScreen").classList.add("hidden");
  $("#gameScreen").classList.remove("hidden");
  $("#adminBadge").classList.toggle("hidden", !currentUser?.isAdmin);

 function updateCoins() {
  const coinDisplay = $("#coinAmount");

  if (currentUser?.isAdmin) {
    coinDisplay.textContent = "∞";
  } else {
    coinDisplay.textContent = String(currentUser?.coins ?? 0);
  }
}
  renderAlbum();
  renderBag();
  updateStarterPanel();
  navigateTo("home");
}

function navigateTo(pageName) {
  const validPages = ["home", "album", "shop", "bag"];
  if (!validPages.includes(pageName)) pageName = "home";

  $$(".page").forEach(page => page.classList.remove("active"));
  $(`#${pageName}Page`).classList.add("active");

  $$(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });

  if (pageName === "album") renderAlbum();
  if (pageName === "bag") renderBag();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function logout() {
  saveCurrentUser();
  clearSession();

  currentUser = null;
  isAdminMode = false;
  selectedPackId = null;

  $("#gameScreen").classList.add("hidden");
  $("#welcomeScreen").classList.remove("hidden");

  $$(".modal").forEach(modal => modal.classList.remove("show"));
  showToast("Bạn đã đăng xuất.");
}

/* =========================
   COINS
   ========================= */

function updateCoins() {
  $("#coinAmount").textContent = String(currentUser?.coins ?? 0);
}

/* =========================
   ALBUM
   ========================= */

function getOwnedCards() {
  if (!currentUser) return [];

  return CARD_DATA.filter(card =>
    !card.placeholder && currentUser.ownedCards.includes(card.id)
  );
}

function getCategoryCards(category) {
  return CARD_DATA.filter(card => card.category === category);
}

function makeCardElement(card) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "collection-card";

  const rarityClass = card.rarity === "LEGENDARY"
    ? "legendary-tag"
    : "rare-tag";

  const rarityLabel = card.rarity === "LEGENDARY"
    ? "LEGENDARY"
    : "RARE";

  button.innerHTML = `
    <img src="${escapeHTML(card.image)}" alt="${escapeHTML(card.name)}">
    <span class="rarity-tag ${rarityClass}">${rarityLabel}</span>
    <span class="card-name">${escapeHTML(card.name)}</span>
    <span class="card-category">${escapeHTML(CATEGORY_LABELS[card.category])}</span>
  `;

  const image = button.querySelector("img");
  image.addEventListener("error", () => {
    image.alt = "Không tìm thấy ảnh thẻ";
    image.style.display = "none";

    const fallback = document.createElement("div");
    fallback.className = "card-image-fallback";
    fallback.textContent = "🃏";
    image.insertAdjacentElement("afterend", fallback);
  }, { once: true });

  button.addEventListener("click", () => openCardDetail(card));
  return button;
}

function makeEmptySlot(category, index) {
  const slot = document.createElement("div");

  slot.className = "empty-card-slot";
  slot.setAttribute("aria-label", "Thẻ chưa mở khóa");

  slot.innerHTML = `
    <div class="empty-card-symbol">?</div>
  `;

  return slot;
}

function renderAlbum() {
  if (!currentUser) return;

  const grid = $("#albumGrid");
  const emptyMessage = $("#emptyAlbum");
  const countLabel = $("#collectionCount");

  if (!grid || !countLabel) return;

  grid.innerHTML = "";
  emptyMessage.classList.add("hidden");

  let categories;

  if (activeFilter === "ALL") {
    categories = ["CHARACTER", "SKILL", "SITUATION"];
  } else {
    categories = [activeFilter];
  }

  let totalOwned = 0;
  let totalSlots = 0;

  categories.forEach(category => {
    const categoryCards = getCategoryCards(category);
    const ownedCards = categoryCards.filter(card =>
      !card.placeholder && currentUser.ownedCards.includes(card.id)
    );

    totalOwned += ownedCards.length;
    totalSlots += CATEGORY_LIMITS[category];

    categoryCards.forEach((card, index) => {
      if (card.placeholder) {
        grid.appendChild(makeEmptySlot(category, index));
      } else if (currentUser.ownedCards.includes(card.id)) {
        grid.appendChild(makeCardElement(card));
      } else {
        grid.appendChild(makeEmptySlot(category, index));
      }
    });
  });

  countLabel.textContent = `${totalOwned}/${totalSlots} thẻ`;

  if (totalOwned === 0) {
    emptyMessage.textContent = "Bạn chưa sở hữu thẻ nào trong mục này. Hãy mở pack để sưu tầm nhé!";
    emptyMessage.classList.remove("hidden");
  }
}

function openCardDetail(card) {
  if (!card || card.placeholder) return;

  const content = $("#cardDetailContent");
  const rarityClass = card.rarity === "LEGENDARY"
    ? "legendary-tag"
    : "rare-tag";

  const rarityLabel = card.rarity === "LEGENDARY"
    ? "LEGENDARY"
    : "RARE";

  content.innerHTML = `
    <p class="eyebrow">CARD DETAILS</p>
    <img src="${escapeHTML(card.image)}" alt="${escapeHTML(card.name)}">
    <h2>${escapeHTML(card.name)}</h2>
    <span class="rarity-tag ${rarityClass}">${rarityLabel}</span>
    <p><strong>Loại thẻ:</strong> ${escapeHTML(CATEGORY_LABELS[card.category])}</p>
    <p>${escapeHTML(card.description)}</p>
  `;

  showModal("cardDetailModal");
}

/* =========================
   FILTERS
   ========================= */

function setupAlbumFilters() {
  $$("#albumFilters .filter-btn").forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;

      $$("#albumFilters .filter-btn").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      renderAlbum();
    });
  });
}

/* =========================
   SHOP
   ========================= */

function buyPack(packType) {
  if (!currentUser) return;

  if (currentUser.isAdmin) {
  const pack = {
    id: `pack-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: packType,
    purchasedAt: Date.now()
  };

  currentUser.inventoryPacks.push(pack);

  renderBag();
  navigateTo("bag");

  showToast("ADMIN đã nhận pack miễn phí!");
  return;
}

  const packInfo = PACK_DATA[packType];
  if (!packInfo) return;

  if (currentUser.coins < packInfo.price) {
    setMessage($("#shopMessage"), "Bạn không đủ COIN để mua pack này.", true);
    return;
  }

  currentUser.coins -= packInfo.price;

  const pack = {
    id: `pack-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: packType,
    purchasedAt: Date.now()
  };

  currentUser.inventoryPacks.push(pack);
  saveCurrentUser();

  updateCoins();
  renderBag();
  setMessage($("#shopMessage"), `Mua ${packInfo.name} thành công! Pack đã được chuyển vào Balo.`);

  navigateTo("bag");
  showToast(`${packInfo.name} đã được thêm vào Balo.`);
}

/* =========================
   BAG
   ========================= */

function makePackArt(packType, isDetail = false) {
  const isPremium = packType === "premium";
  const name = isPremium ? "PREMIUM" : "BASIC";
  const subtitle = isPremium ? "LEGEND PACK" : "CARD PACK";
  const symbol = isPremium ? "✧" : "✦";
  const artClass = isPremium ? "premium-art" : "basic-art";

  return `
    <div class="pack-art ${artClass} ${isDetail ? "detail-pack-art" : ""}">
      <div class="pack-shine"></div>
      <span class="pack-top-label">CARD ARENA</span>
      <div class="pack-symbol">${symbol}</div>
      <strong>${name}</strong>
      <small>${subtitle}</small>
    </div>
  `;
}

function renderBag() {
  if (!currentUser) return;

  const grid = $("#bagGrid");
  const empty = $("#emptyBag");
  const packs = currentUser.inventoryPacks || [];

  grid.innerHTML = "";
  $("#bagCount").textContent = `${packs.length} pack`;
  empty.classList.toggle("hidden", packs.length > 0);

  packs.forEach(pack => {
    const info = PACK_DATA[pack.type];
    if (!info) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "bag-pack";

    button.innerHTML = `
      ${makePackArt(pack.type)}
      <span class="bag-pack-name">${escapeHTML(info.name)}</span>
      <span class="bag-pack-hint">NHẤN ĐỂ MỞ ✨</span>
    `;

    button.addEventListener("click", () => openPackDetails(pack.id));
    grid.appendChild(button);
  });
}

function openPackDetails(packId) {
  const pack = currentUser.inventoryPacks.find(item => item.id === packId);
  if (!pack) {
    showToast("Không tìm thấy pack này.");
    return;
  }

  selectedPackId = packId;

  const info = PACK_DATA[pack.type];
  $("#detailPackTitle").textContent = info.name.toUpperCase();
  $("#detailPackDescription").textContent = info.description;

  $("#detailPackArt").outerHTML = `
    <div id="detailPackArt">
      ${makePackArt(pack.type, true)}
    </div>
  `;

  showModal("packDetailModal");
}

function chooseCardFromPack(packType) {
  const info = PACK_DATA[packType];
  const roll = Math.random();
  const targetRarity = roll < info.rareChance ? "RARE" : "LEGENDARY";

  let pool = CARD_DATA.filter(card =>
    !card.placeholder && card.rarity === targetRarity
  );

  if (pool.length === 0) {
    pool = CARD_DATA.filter(card => !card.placeholder);
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function openSelectedPack() {
  if (!currentUser || !selectedPackId) return;

  const packIndex = currentUser.inventoryPacks.findIndex(
    pack => pack.id === selectedPackId
  );

  if (packIndex === -1) {
    showToast("Pack không còn trong Balo.");
    hideModal("packDetailModal");
    return;
  }

  const pack = currentUser.inventoryPacks[packIndex];
  const card = chooseCardFromPack(pack.type);

  if (!card) {
    showToast("Chưa có thẻ thật phù hợp để mở pack.");
    return;
  }

  // Chỉ tiêu thụ pack khi người chơi bấm mở.
  currentUser.inventoryPacks.splice(packIndex, 1);

  const isNewCard = !currentUser.ownedCards.includes(card.id);

  if (isNewCard) {
    currentUser.ownedCards.push(card.id);
  }

  saveCurrentUser();
  renderBag();
  renderAlbum();

  hideModal("packDetailModal");
  showReveal(card, isNewCard);
  selectedPackId = null;
}

function showReveal(card, isNewCard) {
  const revealTitle = $("#revealTitle");
  const revealCard = $("#revealedCard");
  const tearEffect = $("#tearEffect");

  revealTitle.textContent = isNewCard
    ? "BẠN NHẬN ĐƯỢC THẺ MỚI!"
    : "BẠN NHẬN ĐƯỢC THẺ!";

  revealCard.innerHTML = "";
  revealCard.appendChild(makeCardElement(card));

  tearEffect.classList.remove("tear-animate");
  void tearEffect.offsetWidth;
  tearEffect.classList.add("tear-animate");

  showModal("revealModal");
}

/* =========================
   STARTER CHEST
   ========================= */

function updateStarterPanel() {
  const button = $("#openChestBtn");
  const message = $("#starterMessage");

  if (!currentUser) return;

  if (currentUser.starterClaimed) {
    button.disabled = true;
    button.textContent = "ĐÃ NHẬN RƯƠNG";
    button.style.opacity = "0.6";
    message.textContent = "Bạn đã nhận phần quà khởi đầu.";
  } else {
    button.disabled = false;
    button.textContent = "MỞ RƯƠNG ✨";
    button.style.opacity = "1";
    message.textContent = "";
  }
}

function openStarterChest() {
  if (!currentUser) return;

  if (currentUser.starterClaimed) {
    showToast("Bạn đã nhận rương khởi đầu rồi.");
    return;
  }

  showModal("chestModal");
}

function claimStarterPack() {
  if (!currentUser || currentUser.starterClaimed) {
    hideModal("chestModal");
    return;
  }

  currentUser.starterClaimed = true;

  const pack = {
    id: `pack-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: "basic",
    purchasedAt: Date.now(),
    starter: true
  };

  currentUser.inventoryPacks.push(pack);
  saveCurrentUser();

  updateStarterPanel();
  renderBag();

  hideModal("chestModal");
  navigateTo("bag");
  openPackDetails(pack.id);

  showToast("Bạn nhận được một Basic Pack miễn phí!");
}

/* =========================
   EVENT LISTENERS
   ========================= */

function setupEventListeners() {
  $("#showLoginBtn").addEventListener("click", () => openAuth(false));
  $("#showRegisterBtn").addEventListener("click", () => openAuth(true));
  $("#tapStartBtn").addEventListener("click", () => openAuth(false));

  $("#switchAuthBtn").addEventListener("click", () => {
    isRegisterMode = !isRegisterMode;
    updateAuthForm();
    setMessage($("#authMessage"), "");
  });

  $("#authForm").addEventListener("submit", handleAuthSubmit);
  $("#adminAccessBtn").addEventListener("click", () => {
    $("#adminCode").value = "";
    setMessage($("#adminMessage"), "");
    showModal("adminModal");
  });

  $("#adminForm").addEventListener("submit", loginAdmin);
  $("#logoutBtn").addEventListener("click", logout);
  $("#goShopBtn").addEventListener("click", () => navigateTo("shop"));

  $("#openChestBtn").addEventListener("click", openStarterChest);
  $("#claimStarterBtn").addEventListener("click", claimStarterPack);
  $("#openSelectedPackBtn").addEventListener("click", openSelectedPack);

  $("#revealDoneBtn").addEventListener("click", () => {
    hideModal("revealModal");
    navigateTo("album");
  });

  $$("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      navigateTo(button.dataset.page);
    });
  });

  $$("[data-buy]").forEach(button => {
    button.addEventListener("click", () => {
      buyPack(button.dataset.buy);
    });
  });

  $$("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
      hideModal(button.dataset.close);
    });
  });

  $$(".modal").forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) {
        modal.classList.remove("show");
      }
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      $$(".modal.show").forEach(modal => modal.classList.remove("show"));
    }
  });

  setupAlbumFilters();
}

/* =========================
   RESTORE SESSION
   ========================= */

function restoreSession() {
  const username = localStorage.getItem(SESSION_KEY);
  if (!username) return;

  const user = readUsers().find(item =>
    item.username.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    clearSession();
    return;
  }

  currentUser = ensureUserData(user);
  saveCurrentUser();
  enterGame();
}

/* =========================
   START
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  restoreSession();
});
