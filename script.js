
const $ = id => document.getElementById(id);

const USERS_KEY = "cardArenaInteractiveUsersV1";
const SESSION_KEY = "cardArenaInteractiveSessionV1";

const CARD = {
  id: "kha-banh",
  name: "Khá Bảnh",
  image: "https://raw.githubusercontent.com/luucongdan1979-ui/web-game/main/kh%C3%A1%20b%E1%BA%A3nh%20nv.png"
};

let users = readUsers();
let currentUser = null;
let authMode = "login";
let busy = false;
let toastTimer = null;

function readUsers() {
  try {
    const data = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function saveUsers() {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function savePlayer() {
  if (!currentUser) return;
  users[currentUser.username] = currentUser;
  saveUsers();
}

function normalizeUser(username, user) {
  return {
    username,
    email: user.email || "",
    password: user.password || "",
    cards: Array.isArray(user.cards) ? user.cards : [],
    chestOpened: Boolean(user.chestOpened),
    packClaimed: Boolean(user.packClaimed)
  };
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2600);
}

/* ĐĂNG NHẬP / ĐĂNG KÝ */

function openAuth(mode) {
  authMode = mode;

  $("modalTitle").textContent =
    mode === "register" ? "ĐĂNG KÝ" : "ĐĂNG NHẬP";

  $("modalDescription").textContent =
    mode === "register"
      ? "Tạo tài khoản để bắt đầu sưu tầm thẻ."
      : "Nhập tài khoản để vào game.";

  $("authSubmit").textContent =
    mode === "register" ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP";

  $("emailGroup").classList.toggle("hidden", mode !== "register");
  $("email").required = mode === "register";
  $("password").value = "";
  $("authMessage").textContent = "";
  $("authModal").classList.remove("hidden");
  $("username").focus();
}

function closeAuth() {
  $("authModal").classList.add("hidden");
  $("authForm").reset();
  $("authMessage").textContent = "";
}

function submitAuth(event) {
  event.preventDefault();

  const username = $("username").value.trim();
  const password = $("password").value;
  const email = $("email").value.trim();

  if (username.length < 3) {
    $("authMessage").textContent = "Tên tài khoản cần ít nhất 3 ký tự.";
    return;
  }

  if (password.length < 4) {
    $("authMessage").textContent = "Mật khẩu cần ít nhất 4 ký tự.";
    return;
  }

  if (authMode === "register") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $("authMessage").textContent = "Bạn hãy nhập Gmail hợp lệ.";
      return;
    }

    if (users[username]) {
      $("authMessage").textContent = "Tên tài khoản này đã tồn tại.";
      return;
    }

    const emailExists = Object.values(users).some(
      user => (user.email || "").toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      $("authMessage").textContent = "Gmail này đã được đăng ký.";
      return;
    }

    currentUser = normalizeUser(username, {
      email,
      password,
      cards: [],
      chestOpened: false,
      packClaimed: false
    });

    savePlayer();
  } else {
    const saved = users[username];

    if (!saved || saved.password !== password) {
      $("authMessage").textContent = "Sai tài khoản hoặc mật khẩu.";
      return;
    }

    currentUser = normalizeUser(username, saved);
    savePlayer();
  }

  localStorage.setItem(SESSION_KEY, username);
  closeAuth();
  enterGame();
}

/* VÀO GAME */

function enterGame() {
  $("welcomeScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  $("gameTaskbar").classList.remove("hidden");

  updateBagCount();
  showToast("Đăng nhập thành công!");

  if (!currentUser.chestOpened) {
    showChest();
  } else if (!currentUser.packClaimed) {
    showPack();
  } else {
    hideRewardScene();
  }
}

/* RƯƠNG */

function showChest() {
  $("sceneOverlay").classList.remove("hidden");
  $("chestScene").classList.remove("hidden");
  $("revealScene").classList.add("hidden");

  $("sceneHeading").classList.remove("hidden");
  $("chestBtn").classList.remove("hidden", "opening");
  $("packBtn").classList.add("hidden");
  $("packBtn").classList.remove("tearing");

  busy = false;
}

function openChest() {
  if (!currentUser || busy || currentUser.chestOpened) return;

  busy = true;
  currentUser.chestOpened = true;
  savePlayer();

  $("chestBtn").classList.add("opening");

  setTimeout(() => {
    $("chestBtn").classList.add("hidden");
    $("sceneHeading").classList.add("hidden");
    $("packBtn").classList.remove("hidden", "tearing");
    busy = false;
  }, 750);
}

/* PACK */

function showPack() {
  $("sceneOverlay").classList.remove("hidden");
  $("chestScene").classList.remove("hidden");
  $("revealScene").classList.add("hidden");

  $("sceneHeading").classList.add("hidden");
  $("chestBtn").classList.add("hidden");
  $("packBtn").classList.remove("hidden", "tearing");

  busy = false;
}

function tearPack() {
  if (!currentUser || busy || currentUser.packClaimed) return;

  busy = true;
  $("packBtn").classList.add("tearing");

  setTimeout(() => {
    const hasCard = currentUser.cards.some(card => card.id === CARD.id);

    if (!hasCard) {
      currentUser.cards.push({ ...CARD });
    }

    currentUser.packClaimed = true;
    savePlayer();
    updateBagCount();

    $("chestScene").classList.add("hidden");
    $("revealScene").classList.remove("hidden");

    // Chạy lại hiệu ứng lật bài.
    const cardElement = $("revealedCard");
    cardElement.style.animation = "none";
    void cardElement.offsetWidth;
    cardElement.style.animation = "";

    busy = false;
  }, 850);
}

function continueGame() {
  hideRewardScene();
  showToast("Đã nhận thẻ thành công!");
}

function hideRewardScene() {
  $("sceneOverlay").classList.add("hidden");
  $("chestScene").classList.add("hidden");
  $("revealScene").classList.add("hidden");
}

/* TÚI THẺ / BỘ SƯU TẬP */

function updateBagCount() {
  $("bagCount").textContent = currentUser
    ? String(currentUser.cards.length)
    : "0";
}

function openInventory(collectionOnly = false) {
  if (!currentUser) return;

  $("inventoryTitle").textContent = collectionOnly
    ? "🃏 BỘ SƯU TẬP"
    : "🎒 TÚI THẺ";

  $("inventoryDescription").textContent = collectionOnly
    ? "Tất cả các lá bài bạn đã sưu tầm"
    : "Những lá bài trong túi của bạn";

  const inventory = $("cardInventory");
  inventory.replaceChildren();

  if (currentUser.cards.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-bag";
    empty.textContent = "Chưa có thẻ nào. Hãy mở rương để nhận lá bài đầu tiên!";
    inventory.appendChild(empty);
  } else {
    currentUser.cards.forEach(card => {
      const item = document.createElement("div");
      item.className = "inventory-card";

      const image = document.createElement("img");
      image.src = card.image || CARD.image;
      image.alt = card.name || "Thẻ bài";
      image.onerror = () => image.remove();

      const name = document.createElement("strong");
      name.textContent = card.name || "Thẻ bài";

      item.append(image, name);
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
  if (!currentUser) return;
  $("shopModal").classList.remove("hidden");
}

function closeShop() {
  $("shopModal").classList.add("hidden");
}

/* TASKBAR */

function goHome() {
  if (!currentUser) return;

  $("bagModal").classList.add("hidden");
  $("shopModal").classList.add("hidden");

  if (!currentUser.chestOpened) {
    showChest();
  } else if (!currentUser.packClaimed) {
    showPack();
  } else {
    hideRewardScene();
  }
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  currentUser = null;
  busy = false;

  hideRewardScene();
  $("bagModal").classList.add("hidden");
  $("shopModal").classList.add("hidden");
  $("gameScreen").classList.add("hidden");
  $("gameTaskbar").classList.add("hidden");
  $("welcomeScreen").classList.remove("hidden");

  showToast("Bạn đã đăng xuất.");
}

/* GẮN SỰ KIỆN CHO TỪNG NÚT */

$("startBtn").addEventListener("click", () => openAuth("login"));
$("loginOpen").addEventListener("click", () => openAuth("login"));
$("registerOpen").addEventListener("click", () => openAuth("register"));

$("modalClose").addEventListener("click", closeAuth);
$("authForm").addEventListener("submit", submitAuth);

$("authModal").addEventListener("click", event => {
  if (event.target === $("authModal")) closeAuth();
});

$("chestBtn").addEventListener("click", openChest);
$("packBtn").addEventListener("click", tearPack);
$("continueBtn").addEventListener("click", continueGame);

$("homeTab").addEventListener("click", goHome);
$("openBagBtn").addEventListener("click", () => openInventory(false));
$("collectionTab").addEventListener("click", () => openInventory(true));
$("shopTab").addEventListener("click", openShop);
$("logoutBtn").addEventListener("click", logout);

$("bagClose").addEventListener("click", closeInventory);
$("bagModal").addEventListener("click", event => {
  if (event.target === $("bagModal")) closeInventory();
});

$("shopClose").addEventListener("click", closeShop);
$("shopModal").addEventListener("click", event => {
  if (event.target === $("shopModal")) closeShop();
});

/* PHÍM ESC ĐỂ ĐÓNG CÁC CỬA SỔ */

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeAuth();
    closeInventory();
    closeShop();
  }
});

/* KHÔI PHỤC PHIÊN ĐĂNG NHẬP */

function restoreSession() {
  const username = localStorage.getItem(SESSION_KEY);
  if (!username || !users[username]) return;

  currentUser = normalizeUser(username, users[username]);
  savePlayer();
  enterGame();
}

restoreSession();
