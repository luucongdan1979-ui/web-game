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
    id: "jack",
    name: "Jack J97",
    category: "CHARACTER",
    rarity: "LEGENDARY",
    image: "./jack%20nv.png",
    description: "Lá nhân vật huyền thoại trong bộ sưu tập meme CARD ARENA."
  },
  {
    id: "vao-tu",
    name: "Vào Tù",
    category: "SITUATION",
    rarity: "LEGENDARY",
    image: "./V%C3%A0o%20T%C3%B9%20Th.png",
    description: "Lá tình huống huyền thoại trong bộ sưu tập meme CARD ARENA."
  }
];

const PACK_DATA = {
  basic: {
    name: "Basic Pack",
    rarity: "RARE",
    description: "70% cơ hội nhận Rare, 30% cơ hội nhận Legendary.",
    rareRate: 70,
    legendaryRate: 30
  },
  premium: {
    name: "Premium Pack",
    rarity: "LEGENDARY",
    description: "40% cơ hội nhận Rare, 60% cơ hội nhận Legendary.",
    rareRate: 40,
    legendaryRate: 60
  }
};

let currentUser = null;
let authMode = "login";
let albumFilter = "ALL";
let selectedPackId = null;
let starterClaimedThisSession = false;
let toastTimeout = null;

/* ---------- STORAGE ---------- */

function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function createId() {
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2, 9);
}

function normalizePlayer(player) {
  if (!Array.isArray(player.ownedCards)) player.ownedCards = [];
  if (!Array.isArray(player.inventoryPacks)) player.inventoryPacks = [];
  if (!Number.isFinite(player.coins)) player.coins = 17;
  if (typeof player.claimedStarter !== "boolean") {
    player.claimedStarter = false;
  }
  return player;
}

function savePlayer() {
  if (!currentUser || currentUser.isAdmin) return;

  const users = readUsers();
  const index = users.findIndex(user => user.username === currentUser.username);

  if (index !== -1) {
    users[index] = currentUser;
    writeUsers(users);
  }
}

function setSession(username, isAdmin = false) {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ username, isAdmin })
  );
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/* ---------- DOM HELPERS ---------- */

function $(id) {
  return document.getElementById(id);
}

function showModal(id) {
  const modal = $(id);
  if (modal) modal.classList.add("show");
}

function hideModal(id) {
  const modal = $(id);
  if (modal) modal.classList.remove("show");
}

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function setMessage(id, message, isError = false) {
  const element = $(id);
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
    "'": "&#39;"
  })[character]);
}

function getCardById(id) {
  return CARD_DATA.find(card => card.id === id);
}

function getOwnedCards() {
  if (!currentUser) return [];

  return currentUser.ownedCards
    .map(getCardById)
    .filter(Boolean);
}

function isCardOwned(cardId) {
  return Boolean(currentUser?.ownedCards.includes(cardId));
}

/* ---------- AUTH MODAL ---------- */

function setAuthMode(mode) {
  authMode = mode;

  const isRegister = mode === "register";

  $("authTitle").textContent = isRegister ? "ĐĂNG KÝ" : "ĐĂNG NHẬP";
  $("authSubmitBtn").textContent = isRegister ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP";
  $("registerFields").classList.toggle("hidden", !isRegister);
  $("authEmail").required = isRegister;
  $("switchAuthText").textContent = isRegister
    ? "Đã có tài khoản?"
    : "Chưa có tài khoản?";
  $("switchAuthBtn").textContent = isRegister ? "Đăng nhập" : "Đăng ký";

  $("authPassword").autocomplete = isRegister
    ? "new-password"
    : "current-password";

  setMessage("authMessage", "");
}

function openAuth(mode) {
  setAuthMode(mode);
  $("authForm").reset();
  setMessage("authMessage", "");
  showModal("authModal");
  setTimeout(() => $("authUsername").focus(), 100);
}

function registerAccount(username, email, password) {
  const users = readUsers();

  if (username.length < 3) {
    return "Tên tài khoản phải có ít nhất 3 ký tự.";
  }

  if (password.length < 6) {
    return "Mật khẩu phải có ít nhất 6 ký tự.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Vui lòng nhập địa chỉ email hợp lệ.";
  }

  if (users.some(user =>
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    return "Tên tài khoản này đã tồn tại.";
  }

  if (users.some(user =>
    String(user.email || "").toLowerCase() === email.toLowerCase()
  )) {
    return "Email này đã được đăng ký.";
  }

  const player = normalizePlayer({
    username,
    email,
    password,
    coins: 17,
    ownedCards: [],
    inventoryPacks: [],
    claimedStarter: false,
    createdAt: Date.now()
  });

  users.push(player);
  writeUsers(users);

  return null;
}

function loginAccount(username, password) {
  const users = readUsers();
  const player = users.find(user =>
    user.username.toLowerCase() === username.toLowerCase()
  );

  if (!player || player.password !== password) {
    return null;
  }

  return normalizePlayer(player);
}

$("showLoginBtn").addEventListener("click", () => openAuth("login"));
$("showRegisterBtn").addEventListener("click", () => openAuth("register"));
$("tapStartBtn").addEventListener("click", () => openAuth("login"));

$("switchAuthBtn").addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "register" : "login");
});

$("authForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = $("authUsername").value.trim();
  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;

  if (authMode === "register") {
    const error = registerAccount(username, email, password);

    if (error) {
      setMessage("authMessage", error, true);
      return;
    }

    setMessage("authMessage", "Đăng ký thành công! Đang vào game...");

    currentUser = loginAccount(username, password);
    setSession(currentUser.username);

    setTimeout(() => {
      hideModal("authModal");
      enterGame();
      showToast("🎉 Đăng ký và đăng nhập thành công!");
    }, 500);

    return;
  }

  const player = loginAccount(username, password);

  if (!player) {
    setMessage("authMessage", "Sai tên tài khoản hoặc mật khẩu.", true);
    return;
  }

  currentUser = player;
  setSession(player.username);

  setMessage("authMessage", "Đăng nhập thành công! Đang vào game...");

  setTimeout(() => {
    hideModal("authModal");
    enterGame();
    showToast("🎉 Vào game thành công!");
  }, 450);
});

/* ---------- ADMIN ---------- */

$("adminAccessBtn").addEventListener("click", () => {
  $("adminCode").value = "";
  setMessage("adminMessage", "");
  showModal("adminModal");
});

$("adminForm").addEventListener("submit", event => {
  event.preventDefault();

  if ($("adminCode").value !== ADMIN_CODE) {
    setMessage("adminMessage", "Mã quản trị không chính xác.", true);
    return;
  }

  currentUser = normalizePlayer({
    username: "ADMIN",
    email: "",
    coins: Infinity,
    ownedCards: CARD_DATA.map(card => card.id),
    inventoryPacks: [],
    claimedStarter: true,
    isAdmin: true
  });

  setSession("ADMIN", true);
  hideModal("adminModal");
  enterGame();
  showToast("♛ Đã vào chế độ Admin!");
});

/* ---------- ENTER GAME / NAVIGATION ---------- */

function enterGame() {
  $("welcomeScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");

  currentUser = normalizePlayer(currentUser);

  $("adminBadge").classList.toggle("hidden", !currentUser.isAdmin);
  $("starterPanel").classList.toggle(
    "hidden",
    currentUser.isAdmin || currentUser.claimedStarter
  );

  $("starterMessage").textContent = currentUser.claimedStarter
    ? "Bạn đã nhận quà khởi đầu."
    : "";

  updateCoins();
  renderAlbum();
  renderBag();
  showPage("home");
}

function showPage(pageName) {
  const validPages = ["home", "album", "shop", "bag"];
  if (!validPages.includes(pageName)) return;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const page = $(pageName + "Page");
  if (page) page.classList.add("active");

  document.querySelectorAll(".nav-btn[data-page]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageName
    );
  });

  if (pageName === "album") renderAlbum();
  if (pageName === "bag") renderBag();
  if (pageName === "home") updateStarterPanel();
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

$("goShopBtn").addEventListener("click", () => showPage("shop"));

$("logoutBtn").addEventListener("click", () => {
  currentUser = null;
  clearSession();

  $("gameScreen").classList.add("hidden");
  $("welcomeScreen").classList.remove("hidden");

  document.querySelectorAll(".modal").forEach(modal => {
    modal.classList.remove("show");
  });

  showToast("Đã đăng xuất.");
});

/* ---------- COINS ---------- */

function updateCoins() {
  if (!currentUser) return;

  $("coinAmount").textContent = currentUser.isAdmin
    ? "∞"
    : String(currentUser.coins);
}

/* ---------- ALBUM ---------- */

function renderAlbum() {
  if (!currentUser) return;

  const grid = $("albumGrid");
  grid.innerHTML = "";

  const ownedCards = getOwnedCards();
  const filteredCards = ownedCards.filter(card =>
    albumFilter === "ALL" || card.category === albumFilter
  );

  $("collectionCount").textContent = `${ownedCards.length} thẻ`;
  $("emptyAlbum").classList.toggle("hidden", filteredCards.length > 0);

  filteredCards.forEach(card => {
    grid.appendChild(makeCardElement(card));
  });
}

function makeCardElement(card) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "collection-card";

  const rarityClass = card.rarity === "LEGENDARY"
    ? "legendary-tag"
    : "rare-tag";

  const rarityText = card.rarity === "LEGENDARY"
    ? "LEGENDARY"
    : "RARE";

  button.innerHTML = `
    <img src="${card.image}" alt="${escapeHTML(card.name)}"
         onerror="this.style.display='none'">
    <span class="rarity-tag ${rarityClass}">${rarityText}</span>
    <span class="card-name">${escapeHTML(card.name)}</span>
    <span class="card-category">${categoryName(card.category)}</span>
  `;

  button.addEventListener("click", () => openCardDetail(card));
  return button;
}

function categoryName(category) {
  const names = {
    CHARACTER: "Nhân vật",
    SKILL: "Skill",
    SITUATION: "Tình huống"
  };

  return names[category] || category;
}

$("albumFilters").addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;

  albumFilter = button.dataset.filter;

  document.querySelectorAll(".filter-btn").forEach(filterButton => {
    filterButton.classList.toggle("active", filterButton === button);
  });

  renderAlbum();
});

function openCardDetail(card) {
  const rarityText = card.rarity === "LEGENDARY" ? "LEGENDARY" : "RARE";

  $("cardDetailContent").innerHTML = `
    <img src="${card.image}" alt="${escapeHTML(card.name)}"
         onerror="this.style.display='none'">
    <h2>${escapeHTML(card.name)}</h2>
    <p><span class="rarity-tag ${card.rarity === "LEGENDARY" ? "legendary-tag" : "rare-tag"}">${rarityText}</span></p>
    <p>Loại thẻ: ${categoryName(card.category)}</p>
    <p>${escapeHTML(card.description)}</p>
  `;

  showModal("cardDetailModal");
}

/* ---------- SHOP -> BAG ---------- */

document.querySelectorAll("[data-buy]").forEach(button => {
  button.addEventListener("click", () => buyItem(button.dataset.buy));
});

function buyItem(itemType) {
  if (!currentUser) return;

  const pack = PACK_DATA[itemType];
  if (!pack) return;

  const price = itemType === "premium" ? 20 : 10;

  if (!currentUser.isAdmin && currentUser.coins < price) {
    setMessage("shopMessage", "Bạn không đủ COIN để mua pack.", true);
    showToast("❌ Không đủ COIN!");
    return;
  }

  if (!currentUser.isAdmin) {
    currentUser
