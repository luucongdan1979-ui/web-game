
"use strict";

/*
 * Card Arena demo.
 * ADMIN code: 171113.
 * Authentication/localStorage in this demo is NOT secure for a public game.
 */

const ADMIN_CODE = "171113";
const USERS_KEY = "cardArenaInteractiveUsersV1";
const SESSION_KEY = "cardArenaInteractiveSessionV1";

/*
 * Đặt ảnh cạnh index.html.
 * Nếu tên file ảnh của bạn khác, hãy sửa image bên dưới cho đúng.
 */
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

/*
 * Các ô trống này để dành cho thẻ bạn thêm sau.
 * Khi có dữ liệu thẻ mới, thêm object vào CARDS và chọn category phù hợp.
 */
const ALBUM_SLOTS = {
  character: 3,
  skill: 3,
  situation: 3
};

let users = readUsers();
let currentUser = null;
let authMode = "login";
let currentAlbumCategory = "character";
let lastRevealedCard = null;
let lastPackType = "pack";

const $ = (id) => document.getElementById(id);

function readUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveUsers() {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
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

function updateMoneyDisplay() {
  const amount = currentUser?.isAdmin
    ? "∞"
    : String(currentUser?.coins ?? 17);

  $("coinAmount").textContent = amount;
  $("shopCoinAmount").textContent = amount;
  $("adminBadge").classList.toggle("hidden", !currentUser?.isAdmin);
  $("greeting").textContent = currentUser?.isAdmin
    ? "👑 CHÀO MỪNG ADMIN"
    : `CHÀO MỪNG ${currentUser?.username || "ĐẾN CARD ARENA"}`;
}

function showModal(id) {
  $(id).classList.remove("hidden");
}

function hideModal(id) {
  $(id).classList.add("hidden");
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
    showToast("Tên ADMIN dành riêng. Hãy dùng mục 👑 ADMIN.");
    return;
  }

  if (authMode === "register") {
    if (users[username]) {
      showToast("Tên tài khoản đã tồn tại.");
      return;
    }

    users[username] = {
      username,
      password,
      email,
      coins: 17,
      claimedStarter: false,
      ownedCards: []
    };

    saveUsers();
    currentUser = users[username];
    saveSession();
    hideModal("authModal");
    enterGame();
    showToast("Tạo tài khoản thành công! Bạn nhận được 17 COIN.");
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
  hideModal("authModal");
  enterGame();
  showToast("👑 Đăng nhập ADMIN thành công!");
}

function submitAdmin(event) {
  event.preventDefault();
  const code = $("adminCodeInput").value.trim();

  if (code !== ADMIN_CODE) {
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

  const chest = $("chest");
  chest.classList.add("chest-opening");
  $("openChestBtn").disabled = true;

  setTimeout(() => {
    chest.classList.remove("chest-opening");
    $("chestArea").classList.add("hidden");
    $("packArea").classList.remove("hidden");
    $("openChestBtn").disabled = false;
    showToast("Bạn nhận được một pack bí ẩn!");
  }, 650);
}

function chooseRandomCard() {
  /*
   * Tỉ lệ ví dụ cho hai thẻ hiện có:
   * Khá Bảnh 40%, Jack 60%.
   * Nếu bạn thêm thẻ mới, có thể mở rộng logic chọn thẻ tại đây.
   */
  const available = CARDS.filter(card => card.category === "character");
  if (available.length === 0) return null;

  if (available.some(card => card.id === "khabanh") &&
      available.some(card => card.id === "jack")) {
    return Math.random() < 0.4
      ? available.find(card => card.id === "khabanh")
      : available.find(card => card.id === "jack");
  }

  return available[Math.floor(Math.random() * available.length)];
}

function buildCardElement(card, className = "trading-card") {
  const element = document.createElement("div");
  element.className = `${className} ${card.rarity.toLowerCase()}`;

  const img = document.createElement("img");
  img.src = card.image;
  img.alt = card.name;
  img.onerror = () => {
    img.replaceWith(makeImageFallback());
  };

  const name = document.createElement("h3");
  name.textContent = card.name;

  const rarity = document.createElement("div");
  rarity.className = "rarity";
  rarity.textContent = card.rarity;

  const description = document.createElement("p");
  description.className = "card-description";
  description.textContent = card.description || "";

  element.append(img, name, rarity, description);
  return element;
}

function makeImageFallback() {
  const fallback = document.createElement("div");
  fallback.className = "card-placeholder";
  fallback.textContent = "🎴";
  return fallback;
}

function tearPack() {
  if (!currentUser) return;

  const card = chooseRandomCard();
  if (!card) {
    showToast("Chưa có dữ liệu thẻ để mở.");
    return;
  }

  lastRevealedCard = card;
  const pack = $("pack");
  pack.classList.add("pack-tearing");
  $("tearPackBtn").disabled = true;

  setTimeout(() => {
    pack.classList.remove("pack-tearing");
    $("packArea").classList.add("hidden");
    showCardReveal(card);

    if (!currentUser.isAdmin) {
      if (!currentUser.ownedCards.includes(card.id)) {
        currentUser.ownedCards.push(card.id);
      }
      currentUser.claimedStarter = true;
      savePlayer();
    } else {
      currentUser.ownedCards = CARDS.map(item => item.id);
    }

    $("tearPackBtn").disabled = false;
    updateMoneyDisplay();
  }, 700);
}

function showCardReveal(card) {
  $("revealedCard").replaceChildren(buildCardElement(card));
  $("revealArea").classList.remove("hidden");
}

function continueGame() {
  $("revealArea").classList.add("hidden");
  $("claimedMessage").classList.remove("hidden");
  updateMoneyDisplay();
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

function renderAlbum(category = currentAlbumCategory) {
  currentAlbumCategory = category;

  document.querySelectorAll(".album-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.category === category);
  });

  const grid = $("albumGrid");
  grid.replaceChildren();

  const allCardsInCategory = CARDS.filter(card => card.category === category);
  const ownedIds = getOwnedCardIds();
  const ownedCount = allCardsInCategory.filter(card => ownedIds.includes(card.id)).length;
  const totalSlots = Math.max(ALBUM_SLOTS[category] || 3, allCardsInCategory.length);

  $("albumProgress").textContent =
    `Đã sở hữu ${ownedCount}/${totalSlots} thẻ trong mục này`;

  for (let index = 0; index < totalSlots; index++) {
    const card = allCardsInCategory[index];
    const owned = card && ownedIds.includes(card.id);
    const slot = document.createElement("button");
    slot.className = `album-card ${owned ? "owned" : ""}`;
    slot.type = "button";
    slot.disabled = !owned;

    if (card && owned) {
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
      const placeholder = makeImageFallback();
      const title = document.createElement("h3");
      title.textContent = card ? "🔒 Chưa sở hữu" : "Ô trống";
      const note = document.createElement("p");
      note.textContent = card ? "Chưa mở khóa" : "Chưa có thẻ";
      slot.append(placeholder, title, note);
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
  $("detailCard").replaceWith(buildCardElement(card));
  $("detailCard").id = "detailCard";
  $("detailDescription").textContent = card.description || "Thẻ trong bộ sưu tập của bạn.";
  showModal("cardDetailModal");
}

function openShop() {
  if (!currentUser) return;
  updateMoneyDisplay();
  showModal("shopModal");
  setActiveTab("shop");
}

function buyItem(item) {
  if (!currentUser) return;

  const prices = { pack: 10, lucky: 15 };
  const price = prices[item];

  if (!price) return;

  if (!currentUser.isAdmin && currentUser.coins < price) {
    showToast("Bạn không đủ COIN để mua vật phẩm này!");
    return;
  }

  if (!currentUser.isAdmin) {
    currentUser.coins -= price;
    savePlayer();
  }

  /*
   * Mua pack cho phép mở pack tiếp theo.
   * ADMIN không bị trừ COIN.
   */
  currentUser.claimedStarter = false;
  if (currentUser.isAdmin) {
    currentUser.ownedCards = CARDS.map(card => card.id);
  } else {
    savePlayer();
  }

  updateMoneyDisplay();
  hideModal("shopModal");
  $("claimedMessage").classList.add("hidden");
  $("chestArea").classList.add("hidden");
  $("revealArea").classList.add("hidden");
  $("packArea").classList.remove("hidden");

  if (item === "lucky") {
    lastPackType = "lucky";
    showToast("Đã mua Lucky Pack! COIN đã được cập nhật.");
  } else {
    lastPackType = "pack";
    showToast("Đã mua Meme Pack! Sẵn sàng xé pack.");
  }
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

/* Nút ở màn hình bắt đầu */
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

/* Nút trong game */
$("openChestBtn").addEventListener("click", openChest);
$("tearPackBtn").addEventListener("click", tearPack);
$("continueBtn").addEventListener("click", continueGame);
$("openAlbumHomeBtn").addEventListener("click", openAlbum);
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

/* Khôi phục phiên đăng nhập gần nhất */
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
