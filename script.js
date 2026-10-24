
const USERS_KEY = "cardArenaInteractiveUsersV1";
const SESSION_KEY = "cardArenaInteractiveSessionV1";

const CARDS = [
  {
    id: "kha-banh",
    name: "Khá Bảnh",
    rarity: "RARE",
    rarityClass: "rare",
    image: "./kh%C3%A1%20b%E1%BA%A3nh%20nv.png"
  },
  {
    id: "jack",
    name: "Jack",
    rarity: "LEGENDARY",
    rarityClass: "legendary",
    image: "./jack%20nv.png"
  }
];

const ALBUM_CARDS = {
  character: [
    CARDS[0],
    CARDS[1],
    { id: "character-03", name: "Chưa khám phá" }
  ],
  skill: [
    { id: "skill-01", name: "Chưa khám phá" },
    { id: "skill-02", name: "Chưa khám phá" },
    { id: "skill-03", name: "Chưa khám phá" }
  ],
  situation: [
    { id: "situation-01", name: "Chưa khám phá" },
    { id: "situation-02", name: "Chưa khám phá" },
    { id: "situation-03", name: "Chưa khám phá" }
  ]
};

const CATEGORY_NAMES = {
  character: "NHÂN VẬT",
  skill: "SKILL",
  situation: "TÌNH HUỐNG"
};

const $ = id => document.getElementById(id);

let currentUser = null;
let authMode = "login";
let isAnimating = false;
let activeAlbumCategory = "character";
let toastTimer = null;

/* ===== LƯU DỮ LIỆU ===== */

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function savePlayer() {
  if (!currentUser) return;

  const users = readUsers();
  const index = users.findIndex(user =>
    user.username.toLowerCase() === currentUser.username.toLowerCase()
  );

  if (index >= 0) {
    users[index] = { ...currentUser };
    saveUsers(users);
  }

  localStorage.setItem(SESSION_KEY, currentUser.username);
}

function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.remove("hidden");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $("toast").classList.add("hidden");
  }, 2600);
}

/* ===== TIỀN ===== */

function updateMoneyDisplay() {
  if (!currentUser) return;

  if (typeof currentUser.coins !== "number") {
    currentUser.coins = 1000;
    savePlayer();
  }

  $("moneyAmount").textContent =
    currentUser.coins.toLocaleString("vi-VN");
}

/* ===== ĐĂNG KÝ VÀ ĐĂNG NHẬP ===== */

function openAuth(mode) {
  authMode = mode;

  $("authTitle").textContent =
    mode === "register" ? "ĐĂNG KÝ TÀI KHOẢN" : "ĐĂNG NHẬP";

  $("authSubmit").textContent =
    mode === "register" ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP";

  $("emailGroup").classList.toggle("hidden", mode !== "register");
  $("email").required = mode === "register";
  $("authMessage").textContent = "";
  $("authForm").reset();
  $("authModal").classList.remove("hidden");
}

function closeAuth() {
  $("authModal").classList.add("hidden");
}

function submitAuth(event) {
  event.preventDefault();

  const username = $("username").value.trim();
  const password = $("password").value;
  const email = $("email").value.trim().toLowerCase();
  const users = readUsers();

  if (username.length < 3) {
    $("authMessage").textContent =
      "Tên tài khoản cần ít nhất 3 ký tự.";
    return;
  }

  if (password.length < 4) {
    $("authMessage").textContent =
      "Mật khẩu cần ít nhất 4 ký tự.";
    return;
  }

  if (authMode === "register") {
    if (!email || !$("email").checkValidity()) {
      $("authMessage").textContent = "Vui lòng nhập Gmail hợp lệ.";
      return;
    }

    if (users.some(user =>
      user.username.toLowerCase() === username.toLowerCase()
    )) {
      $("authMessage").textContent = "Tên tài khoản đã tồn tại.";
      return;
    }

    if (users.some(user => user.email === email)) {
      $("authMessage").textContent = "Gmail này đã được sử dụng.";
      return;
    }

    currentUser = {
      username,
      email,
      password,
      coins: 1000,
      cards: [],
      chestOpened: false,
      packClaimed: false
    };

    users.push(currentUser);
    saveUsers(users);
    localStorage.setItem(SESSION_KEY, username);

    closeAuth();
    enterGame();
    showToast("Đăng ký thành công!");
    return;
  }

  const found = users.find(user =>
    user.username.toLowerCase() === username.toLowerCase() &&
    user.password === password
  );

  if (!found) {
    $("authMessage").textContent =
      "Sai tên tài khoản hoặc mật khẩu.";
    return;
  }

  currentUser = found;

  if (!Array.isArray(currentUser.cards)) {
    currentUser.cards = [];
  }

  if (typeof currentUser.coins !== "number") {
    currentUser.coins = 1000;
  }

  if (typeof currentUser.chestOpened !== "boolean") {
    currentUser.chestOpened = false;
  }

  if (typeof currentUser.packClaimed !== "boolean") {
    currentUser.packClaimed = false;
  }

  savePlayer();
  closeAuth();
  enterGame();
  showToast("Đăng nhập thành công!");
}

/* ===== VÀO GAME ===== */

function enterGame() {
  $("welcomeScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  $("gameTaskbar").classList.remove("hidden");

  $("revealScene").classList.add("hidden");

  updateMoneyDisplay();
  updateBagCount();

  if (!currentUser.chestOpened) {
    showChest();
  } else if (!currentUser.packClaimed) {
    showPack();
  } else {
    hideRewardScene();
  }

  setActiveTab("homeTab");
}

function showChest() {
  $("sceneOverlay").classList.remove("hidden");
  $("chestScene").classList.remove("hidden");
  $("packScene").classList.add("hidden");
  $("chestBtn").classList.remove("opening");
}

function showPack() {
  $("sceneOverlay").classList.remove("hidden");
  $("chestScene").classList.add("hidden");
  $("packScene").classList.remove("hidden");
  $("packBtn").classList.remove("tearing");
}

function hideRewardScene() {
  $("sceneOverlay").classList.add("hidden");
  $("chestScene").classList.add("hidden");
  $("packScene").classList.add("hidden");
}

/* ===== MỞ RƯƠNG ===== */

function openChest() {
  if (!currentUser || isAnimating || currentUser.chestOpened) return;

  isAnimating = true;
  $("chestBtn").classList.add("opening");

  setTimeout(() => {
    currentUser.chestOpened = true;
    savePlayer();

    $("chestScene").classList.add("hidden");
    $("packScene").classList.remove("hidden");
    $("packBtn").classList.remove("tearing");

    isAnimating = false;
    showToast("Rương đã mở! Hãy xé pack bí ẩn.");
  }, 700);
}

/* ===== RANDOM THẺ: KHÁ BẢNH 40%, JACK 60% ===== */

function chooseRandomCard() {
  return Math.random() * 100 < 40 ? CARDS[0] : CARDS[1];
}

/* ===== XÉ PACK ===== */

function tearPack() {
  if (!currentUser || isAnimating || currentUser.packClaimed) return;

  isAnimating = true;
  $("packBtn").classList.add("tearing");

  setTimeout(() => {
    const card = chooseRandomCard();

    currentUser.cards.push(card.id);
    currentUser.packClaimed = true;

    savePlayer();
    updateBagCount();
    isAnimating = false;

    hideRewardScene();
    showCardReveal(card);
    showToast("Bạn nhận được " + card.name + "!");
  }, 650);
}

/* ===== HIỆN THẺ VỪA NHẬN ===== */

function configureCard(frame, image, fallback, rarityElement, nameElement, card) {
  frame.classList.remove("rarity-rare", "rarity-legendary");
  frame.classList.add("rarity-" + card.rarityClass);

  rarityElement.textContent =
    card.rarity === "LEGENDARY" ? "✦ LEGENDARY ✦" : "◆ RARE ◆";

  rarityElement.classList.remove("rare-rarity", "legendary-rarity");
  rarityElement.classList.add(card.rarityClass + "-rarity");

  nameElement.textContent = card.name;

  fallback.classList.add("hidden");
  fallback.style.display = "";
  image.classList.remove("hidden");
  image.alt = card.name;

  image.onerror = () => {
    image.classList.add("hidden");
    fallback.classList.remove("hidden");
    fallback.style.display = "grid";
  };

  image.onload = () => {
    image.classList.remove("hidden");
    fallback.classList.add("hidden");
    fallback.style.display = "";
  };

  image.src = card.image;
}

function showCardReveal(card) {
  configureCard(
    $("revealedCard"),
    $("revealedImage"),
    $("imageFallback"),
    $("revealedRarity"),
    $("revealedName"),
    card
  );

  $("revealMessage").textContent =
    "Bạn nhận được " + card.name + " — " + card.rarity + "!";

  $("revealScene").classList.remove("hidden");
}

function continueGame() {
  $("revealScene").classList.add("hidden");
  hideRewardScene();
  updateBagCount();
  showToast("Thẻ đã được lưu vào album!");
}

/* ===== ALBUM ===== */

function getOwnedCardIds() {
  return currentUser && Array.isArray(currentUser.cards)
    ? currentUser.cards
    : [];
}

function countOwnedInCategory(category) {
  const owned = getOwnedCardIds();

  return ALBUM_CARDS[category].filter(card =>
    CARDS.some(realCard => realCard.id === card.id) &&
    owned.includes(card.id)
  ).length;
}

function updateAlbumProgress() {
  $("characterProgress").textContent =
    countOwnedInCategory("character") + "/3";

  $("skillProgress").textContent =
    countOwnedInCategory("skill") + "/3";

  $("situationProgress").textContent =
    countOwnedInCategory("situation") + "/3";
}

function renderAlbum(category) {
  activeAlbumCategory = category;

  const owned = getOwnedCardIds();
  const grid = $("cardInventory");

  document.querySelectorAll(".album-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.category === category);
  });

  $("albumCategoryTitle").textContent = CATEGORY_NAMES[category];
  $("albumCurrentProgress").textContent =
    countOwnedInCategory(category) + "/3 THẺ";

  grid.innerHTML = "";

  ALBUM_CARDS[category].forEach((card, index) => {
    const slot = document.createElement("div");
    slot.className = "album-slot";

    const realCard = CARDS.find(item => item.id === card.id);
    const isOwned = realCard && owned.includes(card.id);

    if (isOwned) {
      slot.classList.add("owned", "rarity-" + realCard.rarityClass);
      slot.tabIndex = 0;
      slot.setAttribute("role", "button");
      slot.setAttribute("aria-label", "Xem thẻ " + realCard.name);

      const image = document.createElement("img");
      image.src = realCard.image;
      image.alt = realCard.name;
      image.onerror = () => {
        image.alt = "Không tải được ảnh " + realCard.name;
      };

      const name = document.createElement("div");
      name.className = "album-card-name";
      name.textContent = realCard.name;

      const rarity = document.createElement("div");
      rarity.className =
        "album-card-rarity " + realCard.rarityClass + "-rarity";
      rarity.textContent = realCard.rarity;

      const number = document.createElement("div");
      number.className = "album-slot-number";
      number.textContent = "VỊ TRÍ " + (index + 1);

      slot.append(image, name, rarity, number);

      slot.addEventListener("click", () => showCardDetail(realCard));
      slot.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showCardDetail(realCard);
        }
      });
    } else {
      const empty = document.createElement("div");
      empty.className = "album-empty";

      const lock = document.createElement("div");
      lock.className = "album-lock";
      lock.textContent = "🔒";

      const label = document.createElement("div");
      label.className = "album-empty-label";
      label.textContent = "CHƯA SỞ HỮU";

      empty.append(lock, label);

      const name = document.createElement("div");
      name.className = "album-card-name";
      name.textContent = "Ô trống";

      const number = document.createElement("div");
      number.className = "album-slot-number";
      number.textContent = "VỊ TRÍ " + (index + 1);

      slot.append(empty, name, number);
    }

    grid.appendChild(slot);
  });

  updateAlbumProgress();
}

function openInventory() {
  if (!currentUser) return;

  $("bagModal").classList.remove("hidden");
  renderAlbum(activeAlbumCategory);
}

function closeInventory() {
  $("bagModal").classList.add("hidden");
}

/* ===== XEM THẺ LỚN ===== */

function showCardDetail(card) {
  if (!card) return;

  configureCard(
    $("detailCardFrame"),
    $("detailImage"),
    $("detailFallback"),
    $("detailRarity"),
    $("detailName"),
    card
  );

  $("detailDescription").textContent =
    "Độ hiếm: " + card.rarity +
    ". Đây là thẻ thuộc bộ sưu tập của bạn.";

  $("cardDetailModal").classList.remove("hidden");
}

function closeCardDetail() {
  $("cardDetailModal").classList.add("hidden");
}

/* ===== CỬA HÀNG ===== */

function openShop() {
  if (!currentUser) return;
  $("shopModal").classList.remove("hidden");
}

function closeShop() {
  $("shopModal").classList.add("hidden");
}

/* ===== THANH ICON ===== */

function updateBagCount() {
  $("bagCount").textContent = getOwnedCardIds().length;
}

function setActiveTab(activeId) {
  ["homeTab", "collectionTab", "shopTab"].forEach(id => {
    $(id).classList.toggle("active", id === activeId);
  });
}

function goHome() {
  if (!currentUser) return;

  closeInventory();
  closeShop();
  closeCardDetail();
  $("revealScene").classList.add("hidden");

  if (!currentUser.chestOpened) {
    showChest();
  } else if (!currentUser.packClaimed) {
    showPack();
  } else {
    hideRewardScene();
  }

  setActiveTab("homeTab");
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  currentUser = null;
  isAnimating = false;

  [
    "gameScreen", "gameTaskbar", "authModal", "bagModal",
    "shopModal", "cardDetailModal", "revealScene"
  ].forEach(id => $(id).classList.add("hidden"));

  $("welcomeScreen").classList.remove("hidden");
  showToast("Bạn đã đăng xuất.");
}

/* ===== KẾT NỐI NÚT ===== */

$("loginOpen").addEventListener("click", () => openAuth("login"));
$("registerOpen").addEventListener("click", () => openAuth("register"));
$("startBtn").addEventListener("click", () => {
  if (currentUser) enterGame();
  else openAuth("login");
});

$("authForm").addEventListener("submit", submitAuth);
$("authClose").addEventListener("click", closeAuth);
$("chestBtn").addEventListener("click", openChest);
$("packBtn").addEventListener("click", tearPack);
$("continueBtn").addEventListener("click", continueGame);

$("homeTab").addEventListener("click", goHome);

$("collectionTab").addEventListener("click", () => {
  closeShop();
  closeCardDetail();
  setActiveTab("collectionTab");
  openInventory();
});

$("shopTab").addEventListener("click", () => {
  closeInventory();
  closeCardDetail();
  setActiveTab("shopTab");
  openShop();
});

$("logoutBtn").addEventListener("click", logout);
$("bagClose").addEventListener("click", closeInventory);
$("shopClose").addEventListener("click", closeShop);
$("cardDetailClose").addEventListener("click", closeCardDetail);

document.querySelectorAll(".album-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    renderAlbum(tab.dataset.category);
  });
});

$("bagModal").addEventListener("click", event => {
  if (event.target === $("bagModal")) closeInventory();
});

$("shopModal").addEventListener("click", event => {
  if (event.target === $("shopModal")) closeShop();
});

$("cardDetailModal").addEventListener("click", event => {
  if (event.target === $("cardDetailModal")) closeCardDetail();
});

$("authModal").addEventListener("click", event => {
  if (event.target === $("authModal")) closeAuth();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeAuth();
    closeInventory();
    closeShop();
    closeCardDetail();
  }
});

/* ===== KHÔI PHỤC PHIÊN ĐĂNG NHẬP ===== */

function restoreSession() {
  const username = localStorage.getItem(SESSION_KEY);
  if (!username) return;

  const user = readUsers().find(item => item.username === username);

  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  currentUser = user;

  if (!Array.isArray(currentUser.cards)) currentUser.cards = [];
  if (typeof currentUser.coins !== "number") currentUser.coins = 1000;
  if (typeof currentUser.chestOpened !== "boolean") currentUser.chestOpened = false;
  if (typeof currentUser.packClaimed !== "boolean") currentUser.packClaimed = false;

  savePlayer();
  enterGame();
}

restoreSession();
