
const USERS_KEY = "cardArenaInteractiveUsersV1";
const SESSION_KEY = "cardArenaInteractiveSessionV1";

/* ===== DỮ LIỆU THẺ BÀI ===== */

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

/* Mỗi mục album có đúng 3 vị trí */
const ALBUM_CARDS = {
  character: [
    CARDS[0],
    CARDS[1],
    { id: "character-03", name: "Ô trống" }
  ],
  skill: [
    { id: "skill-01", name: "Ô trống" },
    { id: "skill-02", name: "Ô trống" },
    { id: "skill-03", name: "Ô trống" }
  ],
  situation: [
    { id: "situation-01", name: "Ô trống" },
    { id: "situation-02", name: "Ô trống" },
    { id: "situation-03", name: "Ô trống" }
  ]
};

const ALBUM_TITLES = {
  character: "NHÂN VẬT",
  skill: "SKILL",
  situation: "TÌNH HUỐNG"
};

let currentUser = null;
let authMode = "login";
let isAnimating = false;
let toastTimer = null;
let activeAlbumCategory = "character";

const $ = id => document.getElementById(id);

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

  if (index !== -1) {
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

/* ===== ĐĂNG NHẬP / ĐĂNG KÝ ===== */

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

  localStorage.setItem(SESSION_KEY, found.username);

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

  updateBagCount();

  if (!currentUser.chestOpened) {
    showChest();
  } else if (!currentUser.packClaimed) {
    showPack();
  } else {
    hideRewardScene();
  }
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

/* ===== MỞ RƯƠNG TÂN THỦ ===== */

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

/* ===== RANDOM: KHÁ BẢNH 40%, JACK 60% ===== */

function chooseRandomCard() {
  const randomNumber = Math.random() * 100;

  if (randomNumber < 40) {
    return CARDS[0];
  }

  return CARDS[1];
}

/* ===== XÉ PACK ===== */

function tearPack() {
  if (!currentUser || isAnimating || currentUser.packClaimed) return;

  isAnimating = true;
  $("packBtn").classList.add("tearing");

  setTimeout(() => {
    const card = chooseRandomCard();

    if (!Array.isArray(currentUser.cards)) {
      currentUser.cards = [];
    }

    // Lưu ID thẻ, cho phép sưu tầm nhiều bản sao.
    currentUser.cards.push(card.id);
    currentUser.packClaimed = true;

    savePlayer();
    updateBagCount();

    isAnimating = false;
    hideRewardScene();
    showCardReveal(card);

    showToast("Nhận được " + card.name + " — " + card.rarity + "!");
  }, 650);
}

/* ===== HIỆN THẺ VỪA NHẬN ===== */

function showCardReveal(card) {
  const image = $("revealedImage");
  const fallback = $("imageFallback");
  const frame = $("revealedCard");
  const rarity = $("revealedRarity");

  $("revealedName").textContent = card.name;
  $("revealMessage").textContent =
    "Bạn nhận được " + card.name + " — " + card.rarity + "!";

  frame.classList.remove("rarity-rare", "rarity-legendary");
  frame.classList.add("rarity-" + card.rarityClass);

  rarity.textContent =
    card.rarity === "RARE" ? "◆ RARE ◆" : "✦ LEGENDARY ✦";

  rarity.classList.remove("rare-rarity", "legendary-rarity");
  rarity.classList.add(card.rarityClass + "-rarity");

  fallback.classList.add("hidden");
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
  $("revealScene").classList.remove("hidden");
}

function continueGame() {
  $("revealScene").classList.add("hidden");
  hideRewardScene();
  updateBagCount();
  showToast("Thẻ đã được lưu vào album!");
}

/* ===== ALBUM BỘ SƯU TẬP ===== */

function getOwnedCardIds() {
  if (!currentUser || !Array.isArray(currentUser.cards)) {
    return [];
  }

  return currentUser.cards;
}

function countOwnedInCategory(category) {
  const owned = getOwnedCardIds();

  // Chỉ đếm các thẻ thực sự có trong album.
  return ALBUM_CARDS[category].filter(card =>
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

  const cards = ALBUM_CARDS[category];
  const owned = getOwnedCardIds();
  const grid = $("cardInventory");

  document.querySelectorAll(".album-tab").forEach(tab => {
    tab.classList.toggle(
      "active",
      tab.dataset.category === category
    );
  });

  $("albumCategoryTitle").textContent = ALBUM_TITLES[category];

  $("albumCurrentProgress").textContent =
    countOwnedInCategory(category) + "/3 THẺ";

  grid.innerHTML = "";

  cards.forEach((card, index) => {
    const slot = document.createElement("div");
    slot.className = "album-slot";

    const isRealCard = CARDS.some(item => item.id === card.id);
    const isOwned = isRealCard && owned.includes(card.id);

    if (isOwned) {
      slot.classList.add("owned", "rarity-" + card.rarityClass);

      const img = document.createElement("img");
      img.src = card.image;
      img.alt = card.name;

      img.onerror = () => {
        img.style.visibility = "hidden";
      };

      const name = document.createElement("div");
      name.className = "album-card-name";
      name.textContent = card.name;

      const rarity = document.createElement("div");
      rarity.className =
        "album-card-rarity " + card.rarityClass + "-rarity";
      rarity.textContent = card.rarity;

      const number = document.createElement("div");
      number.className = "album-slot-number";
      number.textContent = "VỊ TRÍ " + (index + 1);

      slot.append(img, name, rarity, number);
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

/* ===== CỬA HÀNG ===== */

function openShop() {
  $("shopModal").classList.remove("hidden");
}

function closeShop() {
  $("shopModal").classList.add("hidden");
}

/* ===== THANH CÔNG CỤ ===== */

function setActiveTab(activeId) {
  ["homeTab", "collectionTab", "shopTab"].forEach(id => {
    $(id).classList.toggle("active", id === activeId);
  });
}

function goHome() {
  if (!currentUser) return;

  closeInventory();
  closeShop();
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

  $("gameScreen").classList.add("hidden");
  $("gameTaskbar").classList.add("hidden");
  $("authModal").classList.add("hidden");
  $("bagModal").classList.add("hidden");
  $("shopModal").classList.add("hidden");
  $("revealScene").classList.add("hidden");
  $("welcomeScreen").classList.remove("hidden");

  showToast("Bạn đã đăng xuất.");
}

/* ===== GẮN CÁC NÚT ===== */

$("loginOpen").addEventListener("click", () => openAuth("login"));
$("registerOpen").addEventListener("click", () => openAuth("register"));

$("startBtn").addEventListener("click", () => {
  if (currentUser) {
    enterGame();
  } else {
    openAuth("login");
  }
});

$("authForm").addEventListener("submit", submitAuth);
$("authClose").addEventListener("click", closeAuth);

$("chestBtn").addEventListener("click", openChest);
$("packBtn").addEventListener("click", tearPack);
$("continueBtn").addEventListener("click", continueGame);

$("homeTab").addEventListener("click", goHome);

$("collectionTab").addEventListener("click", () => {
  setActiveTab("collectionTab");
  openInventory();
});

$("shopTab").addEventListener("click", () => {
  setActiveTab("shopTab");
  openShop();
});

$("logoutBtn").addEventListener("click", logout);

$("bagClose").addEventListener("click", closeInventory);
$("shopClose").addEventListener("click", closeShop);

/* Chuyển giữa Nhân vật, Skill và Tình huống */
document.querySelectorAll(".album-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    renderAlbum(tab.dataset.category);
  });
});

/* Bấm ra ngoài hộp để đóng */
$("bagModal").addEventListener("click", event => {
  if (event.target === $("bagModal")) closeInventory();
});

$("shopModal").addEventListener("click", event => {
  if (event.target === $("shopModal")) closeShop();
});

$("authModal").addEventListener("click", event => {
  if (event.target === $("authModal")) closeAuth();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeAuth();
    closeInventory();
    closeShop();
  }
});

/* ===== KHÔI PHỤC ĐĂNG NHẬP ===== */

function restoreSession() {
  const username = localStorage.getItem(SESSION_KEY);
  if (!username) return;

  const found = readUsers().find(user => user.username === username);

  if (!found) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  currentUser = found;

  if (!Array.isArray(currentUser.cards)) {
    currentUser.cards = [];
  }

  // Đảm bảo tài khoản cũ có đủ trạng thái rương.
  if (typeof currentUser.chestOpened !== "boolean") {
    currentUser.chestOpened = false;
  }

  if (typeof currentUser.packClaimed !== "boolean") {
    currentUser.packClaimed = false;
  }

  enterGame();
}

restoreSession();
