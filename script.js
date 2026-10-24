
const USERS_KEY = "cardArenaInteractiveUsersV1";
const SESSION_KEY = "cardArenaInteractiveSessionV1";

const CARDS = [
  {
    id: "kha-banh",
    name: "Khá Bảnh",
    rarity: "RARE",
    rarityClass: "rare",
    chance: 40,
    image: "./kh%C3%A1%20b%E1%BA%A3nh%20nv.png"
  },
  {
    id: "jack",
    name: "Jack",
    rarity: "LEGENDARY",
    rarityClass: "legendary",
    chance: 60,
    image: "./jack%20nv.png"
  }
];

let currentUser = null;
let authMode = "login";
let isAnimating = false;
let toastTimer = null;

const $ = id => document.getElementById(id);

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
  const index = users.findIndex(
    user => user.username.toLowerCase() ===
      currentUser.username.toLowerCase()
  );

  if (index !== -1) {
    users[index] = { ...users[index], ...currentUser };
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

/* ĐĂNG NHẬP / ĐĂNG KÝ */

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
      $("authMessage").textContent =
        "Vui lòng nhập địa chỉ Gmail hợp lệ.";
      return;
    }

    if (users.some(user =>
      user.username.toLowerCase() === username.toLowerCase()
    )) {
      $("authMessage").textContent =
        "Tên tài khoản này đã tồn tại.";
      return;
    }

    if (users.some(user => user.email === email)) {
      $("authMessage").textContent =
        "Gmail này đã được sử dụng.";
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
    showToast("Đăng ký thành công! Chào mừng bạn!");
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
  localStorage.setItem(SESSION_KEY, found.username);

  closeAuth();
  enterGame();
  showToast("Đăng nhập thành công!");
}

/* VÀO GAME */

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

/* MỞ RƯƠNG */

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
    showToast("Rương đã mở! Bạn nhận được một pack bí ẩn.");
  }, 700);
}

/* RANDOM THẺ BÀI: KHÁ BẢNH 40%, JACK 60% */

function chooseRandomCard() {
  const roll = Math.random() * 100;

  if (roll < 40) {
    return CARDS.find(card => card.id === "kha-banh");
  }

  return CARDS.find(card => card.id === "jack");
}

/* XÉ PACK */

function tearPack() {
  if (!currentUser || isAnimating || currentUser.packClaimed) return;

  isAnimating = true;
  $("packBtn").classList.add("tearing");

  setTimeout(() => {
    const card = chooseRandomCard();

    if (!Array.isArray(currentUser.cards)) {
      currentUser.cards = [];
    }

    // Lưu ID thẻ nhận được; có thể nhận trùng ở những pack sau.
    currentUser.cards.push(card.id);
    currentUser.packClaimed = true;

    savePlayer();
    updateBagCount();

    isAnimating = false;
    hideRewardScene();
    showCardReveal(card);

    showToast(
      "Bạn đã nhận được " + card.name +
      " — " + card.rarity + "!"
    );
  }, 650);
}

/* HIỆN THẺ VỪA NHẬN */

function showCardReveal(card) {
  const image = $("revealedImage");
  const fallback = $("imageFallback");
  const cardFrame = $("revealedCard");
  const rarity = $("revealedRarity");

  $("revealedName").textContent = card.name;
  $("revealMessage").textContent =
    "Bạn nhận được " + card.name + " — " + card.rarity + "!";

  // Đổi màu khung theo độ hiếm.
  cardFrame.classList.remove("rarity-rare", "rarity-legendary");
  cardFrame.classList.add("rarity-" + card.rarityClass);

  rarity.textContent =
    card.rarity === "RARE" ? "◆ RARE ◆" : "✦ LEGENDARY ✦";

  rarity.classList.remove("rare-rarity", "legendary-rarity");
  rarity.classList.add(card.rarityClass + "-rarity");

  fallback.classList.add("hidden");
  fallback.style.display = "";
  image.classList.remove("hidden");
  image.alt = card.name;

  // Xử lý lỗi nếu đường dẫn ảnh không tồn tại.
  image.onerror = () => {
    image.classList.add("hidden");
    fallback.classList.remove("hidden");
    fallback.style.display = "grid";
    fallback.textContent = "🃏";
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
  showToast("Thẻ bài đã được lưu vào bộ sưu tập!");
}

/* BỘ SƯU TẬP */

function updateBagCount() {
  const cards = currentUser && Array.isArray(currentUser.cards)
    ? currentUser.cards
    : [];

  $("bagCount").textContent = String(cards.length);
}

function openInventory() {
  if (!currentUser) return;

  const cards = Array.isArray(currentUser.cards)
    ? currentUser.cards
    : [];

  $("inventoryCount").textContent =
    "Bạn đang sở hữu " + cards.length + " lá bài";

  const inventory = $("cardInventory");
  inventory.innerHTML = "";

  if (cards.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-inventory";
    empty.textContent =
      "Bạn chưa có lá bài nào. Hãy mở rương tân thủ!";
    inventory.appendChild(empty);
  } else {
    cards.forEach((cardId, index) => {
      const card = CARDS.find(item => item.id === cardId);
      if (!card) return;

      const item = document.createElement("div");
      item.className =
        "inventory-card rarity-" + card.rarityClass;

      const img = document.createElement("img");
      img.src = card.image;
      img.alt = card.name;

      img.onerror = () => {
        img.style.display = "none";
      };

      const name = document.createElement("strong");
      name.textContent = card.name;

      const rarity = document.createElement("span");
      rarity.className = "inventory-rarity " +
        (card.rarityClass === "rare"
          ? "legend-rare"
          : "legend-legendary");
      rarity.textContent = card.rarity;

      const number = document.createElement("small");
      number.textContent = "Lá bài #" + (index + 1);

      item.append(img, name, rarity, number);
      inventory.appendChild(item);
    });
  }

  $("bagModal").classList.remove("hidden");
}

function closeInventory() {
  $("bagModal").classList.add("hidden");
}

/* CỬA HÀNG */

function openShop() {
  $("shopModal").classList.remove("hidden");
}

function closeShop() {
  $("shopModal").classList.add("hidden");
}

/* TRANG CHỦ / ĐĂNG XUẤT */

function goHome() {
  if (!currentUser) return;

  $("bagModal").classList.add("hidden");
  $("shopModal").classList.add("hidden");
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

function setActiveTab(activeId) {
  ["homeTab", "collectionTab", "shopTab"].forEach(id => {
    $(id).classList.toggle("active", id === activeId);
  });
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

/* ĐÓNG MODAL */

function closeAllModals() {
  closeAuth();
  closeInventory();
  closeShop();
}

/* GẮN SỰ KIỆN */

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
  if (event.key === "Escape") closeAllModals();
});

/* KHÔI PHỤC PHIÊN ĐĂNG NHẬP */

function restoreSession() {
  const username = localStorage.getItem(SESSION_KEY);
  if (!username) return;

  const found = readUsers().find(user => user.username === username);

  if (!found) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  currentUser = found;

  // Đảm bảo dữ liệu cũ không làm lỗi bộ sưu tập.
  if (!Array.isArray(currentUser.cards)) {
    currentUser.cards = [];
  }

  enterGame();
}

restoreSession();
