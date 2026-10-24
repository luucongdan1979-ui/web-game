
"use strict";

const ADMIN_CODE = "171113";
const USERS_KEY = "cardArenaInteractiveUsersV1";
const SESSION_KEY = "cardArenaInteractiveSessionV1";

const CARDS = [
  {
    id: "khabanh",
    name: "Khá Bảnh",
    category: "character",
    rarity: "RARE",
    description: "Thẻ nhân vật Khá Bảnh.",
    image: "./kh%C3%A1%20b%E1%BA%A3nh%20nv.png"
  },
  {
    id: "jack",
    name: "Jack",
    category: "character",
    rarity: "LEGENDARY",
    description: "Thẻ nhân vật Jack.",
    image: "./jack%20nv.png"
  }
];

const ALBUM_SLOTS = { character: 3, skill: 3, situation: 3 };

const PACKS = {
  basic: {
    name: "Basic Pack",
    price: 10,
    rates: { RARE: 70, LEGENDARY: 30 }
  },
  premium: {
    name: "Premium Pack",
    price: 20,
    rates: { RARE: 40, LEGENDARY: 60 }
  }
};

let users = readUsers();
let currentUser = null;
let authMode = "login";
let currentAlbumCategory = "character";
let selectedPack = "basic";
let pendingPurchasedPack = "basic";

const $ = id => document.getElementById(id);

function readUsers() {
  try {
    const value = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function saveUsers() {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function savePlayer() {
  if (!currentUser || currentUser.isAdmin) return;
  users[currentUser.username] = currentUser;
  saveUsers();
}

function saveSession() {
  if (!currentUser) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    username: currentUser.username,
    isAdmin: Boolean(currentUser.isAdmin)
  }));
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function showModal(id) {
  $(id).classList.remove("hidden");
}

function hideModal(id) {
  $(id).classList.add("hidden");
}

function updateMoneyDisplay() {
  $("coinAmount").textContent = currentUser?.isAdmin
    ? "∞"
    : String(currentUser?.coins ?? 17);

  $("adminBadge").classList.toggle("hidden", !currentUser?.isAdmin);
  $("greeting").textContent = currentUser?.isAdmin
    ? "👑 CHÀO MỪNG ADMIN"
    : `CHÀO MỪNG ${currentUser?.username || "ĐẾN CARD ARENA"}`;
}

function openAuth(mode) {
  authMode = mode;
  $("authTitle").textContent = mode === "register" ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP";
  $("authSubmitBtn").textContent = mode === "register" ? "ĐĂNG KÝ" : "ĐĂNG NHẬP";
  $("emailGroup").classList.toggle("hidden", mode !== "register");
  $("emailInput").required = mode === "register";
  $("authForm").reset();
  showModal("authModal");
}

function submitAuth(event) {
  event.preventDefault();

  const username = $("usernameInput").value.trim();
  const password = $("passwordInput").value;
  const email = $("emailInput").value.trim();

  if (!username || !password) {
    showToast("Vui lòng nhập đủ thông tin.");
    return;
  }

  if (username.toLowerCase() === "admin") {
    showToast("Tên ADMIN dành riêng. Hãy dùng mục ADMIN.");
    return;
  }

  if (authMode === "register") {
    if (users[username]) {
      showToast("Tên tài khoản đã tồn tại.");
      return;
    }

    currentUser = {
      username,
      password,
      email,
      coins: 17,
      claimedStarter: false,
      ownedCards: []
    };

    users[username] = currentUser;
    saveUsers();
    saveSession();
    hideModal("authModal");
    enterGame();
    showToast("Tạo tài khoản thành công! +17 COIN");
    return;
  }

  const account = users[username];
  if (!account || account.password !== password) {
    showToast("Tên tài khoản hoặc mật khẩu không đúng.");
    return;
  }

  currentUser = account;
  if (!Array.isArray(currentUser.ownedCards)) currentUser.ownedCards = [];
  if (typeof currentUser.coins !== "number") currentUser.coins = 17;
  if (typeof currentUser.claimedStarter !== "boolean") currentUser.claimedStarter = false;

  savePlayer();
  saveSession();
  hideModal("authModal");
  enterGame();
  showToast("Đăng nhập thành công!");
}

function enterAdmin() {
  currentUser = {
    username: "ADMIN",
    isAdmin: true,
    coins: Infinity,
    claimedStarter: true,
    ownedCards: CARDS.map(card => card.id)
  };

  saveSession();
  hideModal("adminModal");
  enterGame();
  showToast("👑 ADMIN đăng nhập thành công!");
}

function submitAdmin(event) {
  event.preventDefault();

  if ($("adminCodeInput").value.trim() !== ADMIN_CODE) {
    showToast("Mã ADMIN không chính xác!");
    $("adminCodeInput").select();
    return;
  }

  $("adminForm").reset();
  enterAdmin();
}

function enterGame() {
  $("welcomeScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  updateMoneyDisplay();
  setActiveTab("home");

  $("chestArea").classList.add("hidden");
  $("packArea").classList.add("hidden");
  $("revealArea").classList.add("hidden");
  $("claimedMessage").classList.add("hidden");

  if (!currentUser.claimedStarter) {
    $("chestArea").classList.remove("hidden");
  } else {
    $("claimedMessage").classList.remove("hidden");
  }
}

function openChest() {
  if (!currentUser) return;

  $("chest").classList.add("chest-opening");
  $("openChestBtn").disabled = true;

  setTimeout(() => {
    $("chest").classList.remove("chest-opening");
    $("chestArea").classList.add("hidden");
    selectedPack = "basic";
    showActivePack(selectedPack);
    $("packArea").classList.remove("hidden");
    $("openChestBtn").disabled = false;
    showToast("Bạn đã nhận được Basic Pack!");
  }, 600);
}

function setActiveTab(page) {
  document.querySelectorAll(".nav-btn[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });
}

function getOwnedCardIds() {
  if (!currentUser) return [];
  if (currentUser.isAdmin) return CARDS.map(card => card.id);
  return currentUser.ownedCards || [];
}

function chooseRandomCard(packType) {
  const pack = PACKS[packType] || PACKS.basic;
  const roll = Math.random() * 100;
  const targetRarity = roll < pack.rates.LEGENDARY ? "LEGENDARY" : "RARE";

  let candidates = CARDS.filter(card => card.rarity === targetRarity);

  // Nếu chưa có thẻ thuộc độ hiếm được quay, chọn thẻ có sẵn.
  if (candidates.length === 0) {
    candidates = CARDS;
  }
  if (candidates.length === 0) return null;

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function makeImageFallback() {
  const fallback = document.createElement("div");
  fallback.className = "card-placeholder";
  fallback.textContent = "🎴";
  return fallback;
}

function buildCardElement(card, className = "trading-card") {
  const element = document.createElement("div");
  element.className = `${className} ${card.rarity.toLowerCase()}`;

  const img = document.createElement("img");
  img.src = card.image;
  img.alt = card.name;
  img.onerror = () => img.replaceWith(makeImageFallback());

  const title = document.createElement("h3");
  title.textContent = card.name;

  const rarity = document.createElement("div");
  rarity.className = "rarity";
  rarity.textContent = card.rarity;

  const description = document.createElement("p");
  description.className = "card-description";
  description.textContent = card.description || "";

  element.append(img, title, rarity, description);
  return element;
}

function showActivePack(packType) {
  selectedPack = packType;
  const pack = PACKS[packType];
  const display = $("activePackDisplay");
  display.replaceChildren();

  const wrapper = document.createElement("div");
  wrapper.className = `pack-product active-pack-card ${packType === "premium" ? "premium-product" : "basic-product"}`;

  const art = document.createElement("div");
  art.className = `product-art ${packType === "premium" ? "premium-art" : "basic-art"}`;

  const stars = document.createElement("div");
  stars.className = "pack-stars";
  stars.textContent = "✦ · ✧ · ✦";

  const emblem = document.createElement("div");
  emblem.className = "pack-emblem";
  emblem.textContent = "CA";

  const name = document.createElement("div");
  name.className = "pack-name";
  name.innerHTML = packType === "premium" ? "PREMIUM<br>PACK" : "BASIC<br>PACK";

  const ribbon = document.createElement("div");
  ribbon.className = "pack-ribbon";
  ribbon.textContent = packType === "premium" ? "LEGENDARY COLLECTION" : "MEME COLLECTION";

  art.append(stars, emblem, name, ribbon);
  wrapper.appendChild(art);

  const caption = document.createElement("p");
  caption.className = "active-pack-caption";
  caption.textContent = `${pack.name} • ${packType === "premium" ? "40% Rare / 60% Legendary" : "70% Rare / 30% Legendary"}`;
  wrapper.appendChild(caption);

  display.appendChild(wrapper);
}

function tearPack() {
  if (!currentUser) return;

  const card = chooseRandomCard(selectedPack);
  if (!card) {
    showToast("Chưa có thẻ nào trong dữ liệu game.");
    return;
  }

  $("tearPackBtn").disabled = true;
  $("activePackDisplay").classList.add("pack-tearing");

  setTimeout(() => {
    $("activePackDisplay").classList.remove("pack-tearing");
    $("packArea").classList.add("hidden");
    $("revealedCard").replaceChildren(buildCardElement(card));
    $("revealArea").classList.remove("hidden");

    if (!currentUser.ownedCards.includes(card.id)) {
      currentUser.ownedCards.push(card.id);
    }
    currentUser.claimedStarter = true;
    savePlayer();
    updateMoneyDisplay();
    $("tearPackBtn").disabled = false;
    showToast(`Bạn nhận được ${card.name}!`);
  }, 700);
}

function continueGame() {
  $("revealArea").classList.add("hidden");
  $("claimedMessage").classList.remove("hidden");
  updateMoneyDisplay();
}

function renderAlbum(category = "character") {
  currentAlbumCategory = category;

  document.querySelectorAll(".album-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.category === category);
  });

  const grid = $("albumGrid");
  grid.replaceChildren();

  const cards = CARDS.filter(card => card.category === category);
  const ownedIds = getOwnedCardIds();
  const ownedCount = cards.filter(card => ownedIds.includes(card.id)).length;
  const totalSlots = Math.max(ALBUM_SLOTS[category] || 3, cards.length);

  $("albumProgress").textContent = `Đã sở hữu ${ownedCount}/${totalSlots} thẻ trong mục này`;

  for (let i = 0; i < totalSlots; i++) {
    const card = cards[i];
    const owned = card && ownedIds.includes(card.id);
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = `album-card ${owned ? "owned" : ""}`;
    slot.disabled = !owned;

    if (owned) {
      const img = document.createElement("img");
      img.src = card.image;
      img.alt = card.name;
      img.onerror = () => img.replaceWith(makeImageFallback());

      const title = document.createElement("h3");
      title.textContent = card.name;

      const rarity = document.createElement("p");
      rarity.textContent = card.rarity;

      slot.append(img, title, rarity);
      slot.addEventListener("click", () => showCardDetail(card));
    } else {
      slot.appendChild(makeImageFallback());

      const title = document.createElement("h3");
      title.textContent = card ? "🔒 Chưa sở hữu" : "Ô trống";

      const note = document.createElement("p");
      note.textContent = card ? "Chưa mở khóa" : "Chưa có thẻ";

      slot.append(title, note);
    }

    grid.appendChild(slot);
  }
}

function openAlbum() {
  if (!currentUser) return;
  renderAlbum("character");
  showModal("albumModal");
  setActiveTab("album");
}

function showCardDetail(card) {
  const oldCard = $("detailCard");
  const newCard = buildCardElement(card);
  newCard.id = "detailCard";
  oldCard.replaceWith(newCard);
  $("detailDescription").textContent = card.description || "Thẻ trong bộ sưu tập của bạn.";
  showModal("cardDetailModal");
}

function openShop() {
  if (!currentUser) return;
  showModal("shopModal");
  setActiveTab("shop");
}

function buyItem(item) {
  if (!currentUser) return;

  const pack = PACKS[item];
  if (!pack) return;

  if (!currentUser.isAdmin && currentUser.coins < pack.price) {
    showToast("Bạn không đủ COIN để mua gói này!");
    return;
  }

  if (!currentUser.isAdmin) {
    currentUser.coins -= pack.price;
    savePlayer();
  }

  pendingPurchasedPack = item;
  selectedPack = item;
  currentUser.claimedStarter = false;
  savePlayer();
  saveSession();
  updateMoneyDisplay();
  hideModal("shopModal");

  $("claimedMessage").classList.add("hidden");
  $("chestArea").classList.add("hidden");
  $("revealArea").classList.add("hidden");

  showActivePack(item);
  $("packArea").classList.remove("hidden");
  setActiveTab("home");

  showToast(`${pack.name} đã sẵn sàng!`);
}

function goHome() {
  setActiveTab("home");
  if (!currentUser) return;

  $("chestArea").classList.add("hidden");
  $("packArea").classList.add("hidden");
  $("revealArea").classList.add("hidden");
  $("claimedMessage").classList.remove("hidden");
}

function logout() {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  $("gameScreen").classList.add("hidden");
  $("welcomeScreen").classList.remove("hidden");
  document.querySelectorAll(".modal").forEach(modal => modal.classList.add("hidden"));
  showToast("Bạn đã đăng xuất.");
}

$("startBtn").addEventListener("click", () => {
  if (currentUser) enterGame();
  else openAuth("login");
});
$("loginBtn").addEventListener("click", () => openAuth("login"));
$("registerBtn").addEventListener("click", () => openAuth("register"));
$("adminBtn").addEventListener("click", () => {
  $("adminCodeInput").value = "";
  showModal("adminModal");
});
$("authForm").addEventListener("submit", submitAuth);
$("adminForm").addEventListener("submit", submitAdmin);
$("openChestBtn").addEventListener("click", openChest);
$("tearPackBtn").addEventListener("click", tearPack);
$("continueBtn").addEventListener("click", continueGame);
$("openAlbumHomeBtn").addEventListener("click", openAlbum);
$("openShopHomeBtn").addEventListener("click", openShop);
$("logoutBtn").addEventListener("click", logout);

document.querySelectorAll(".nav-btn[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.page === "home") goHome();
    if (button.dataset.page === "album") openAlbum();
    if (button.dataset.page === "shop") openShop();
  });
});

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => hideModal(button.dataset.close));
});

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) modal.classList.add("hidden");
  });
});

document.querySelectorAll(".album-tab").forEach(button => {
  button.addEventListener("click", () => renderAlbum(button.dataset.category));
});

document.querySelectorAll(".buy-btn").forEach(button => {
  button.addEventListener("click", () => buyItem(button.dataset.item));
});

function restoreSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (!session) return;

    if (session.isAdmin) {
      enterAdmin();
      return;
    }

    const account = users[session.username];
    if (account) {
      currentUser = account;
      if (!Array.isArray(currentUser.ownedCards)) currentUser.ownedCards = [];
      if (typeof currentUser.coins !== "number") currentUser.coins = 17;
      if (typeof currentUser.claimedStarter !== "boolean") currentUser.claimedStarter = false;
      enterGame();
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }
}

restoreSession();
