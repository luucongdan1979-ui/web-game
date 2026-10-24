
const $ = (id) => document.getElementById(id);

const USERS_KEY = "cardArenaUsersFinalV1";
const SESSION_KEY = "cardArenaSessionFinalV1";

const CARD = {
  id: "kha-banh",
  name: "Khá Bảnh",
  image: "https://raw.githubusercontent.com/luucongdan1979-ui/web-game/main/kh%C3%A1%20b%E1%BA%A3nh%20nv.png"
};

let users = readUsers();
let currentUser = null;
let authMode = "login";
let busy = false;

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

function saveCurrentUser() {
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

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

/* Đăng nhập và đăng ký */

function showAuth(mode) {
  authMode = mode;

  $("modalTitle").textContent =
    mode === "register" ? "ĐĂNG KÝ" : "ĐĂNG NHẬP";

  $("modalDescription").textContent =
    mode === "register"
      ? "Tạo tài khoản để bắt đầu chơi."
      : "Đăng nhập để vào game.";

  $("authSubmit").textContent =
    mode === "register" ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP";

  $("emailGroup").classList.toggle("hidden", mode !== "register");
  $("email").required = mode === "register";
  $("authMessage").textContent = "";
  $("modal").classList.remove("hidden");
}

function closeAuth() {
  $("modal").classList.add("hidden");
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
      $("authMessage").textContent = "Vui lòng nhập Gmail hợp lệ.";
      return;
    }

    if (users[username]) {
      $("authMessage").textContent = "Tên tài khoản đã tồn tại.";
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

    saveCurrentUser();
  } else {
    const savedUser = users[username];

    if (!savedUser || savedUser.password !== password) {
      $("authMessage").textContent = "Sai tài khoản hoặc mật khẩu.";
      return;
    }

    currentUser = normalizeUser(username, savedUser);
    saveCurrentUser();
  }

  localStorage.setItem(SESSION_KEY, username);
  closeAuth();
  enterGame();
}

/* Vào game: chỉ hiện nền, rương và taskbar */

function enterGame() {
  $("welcomeScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  $("gameTaskbar").classList.remove("hidden");

  updateBagCount();

  if (!currentUser.chestOpened) {
    showChest();
  } else if (currentUser.chestOpened && !currentUser.packClaimed) {
    showPack();
  } else {
    hideRewardScene();
  }
}

/* Hiện rương */

function showChest() {
  $("sceneOverlay").classList.remove("hidden");
  $("chestScene").classList.remove("hidden");
  $("revealScene").classList.add("hidden");

  $("sceneHeading").classList.remove("hidden");
  $("sceneHeading").textContent = "✦ STARTER TREASURE ✦";

  $("chestBtn").classList.remove("hidden", "opening");
  $("packBtn").classList.add("hidden");
  $("packBtn").classList.remove("tearing");

  busy = false;
}

/* Mở rương: rương biến mất hẳn, chỉ còn pack */

function openChest() {
  if (!currentUser || busy || currentUser.chestOpened) return;

  busy = true;
  currentUser.chestOpened = true;
  saveCurrentUser();

  $("chestBtn").classList.add("opening");

  setTimeout(() => {
    $("chestBtn").classList.add("hidden");
    $("sceneHeading").classList.add("hidden");

    // Không còn dòng chữ nhận rương.
    $("packBtn").classList.remove("hidden", "tearing");

    busy = false;
  }, 720);
}

/* Hiện pack nếu người chơi tải lại trang giữa chừng */

function showPack() {
  $("sceneOverlay").classList.remove("hidden");
  $("chestScene").classList.remove("hidden");
  $("revealScene").classList.add("hidden");

  $("sceneHeading").classList.add("hidden");
  $("chestBtn").classList.add("hidden");
  $("packBtn").classList.remove("hidden", "tearing");

  busy = false;
}

/* Xé pack và nhận thẻ */

function tearPack() {
  if (!currentUser || busy || currentUser.packClaimed) return;

  busy = true;
  $("packBtn").classList.add("tearing");

  setTimeout(() => {
    const alreadyOwned = currentUser.cards.some(
      card => card.id === CARD.id
    );

    if (!alreadyOwned) {
      currentUser.cards.push({ ...CARD });
    }

    currentUser.packClaimed = true;
    saveCurrentUser();

    // Xóa toàn bộ màn hình rương và pack.
    $("chestScene").classList.add("hidden");

    // Hiện lá bài.
    $("revealScene").classList.remove("hidden");

    updateBagCount();
    busy = false;
  }, 800);
}

/* Sau khi xem bài, không hiện lại rương */

function continueGame() {
  hideRewardScene();
  showToast("Đã nhận thẻ thành công!");
}

function hideRewardScene() {
  $("sceneOverlay").classList.add("hidden");
  $("chestScene").classList.add("hidden");
  $("revealScene").classList.add("hidden");
}

/* Túi thẻ */

function updateBagCount() {
  $("bagCount").textContent = currentUser
    ? String(currentUser.cards.length)
    : "0";
}

function openBag() {
  if (!currentUser) return;

  const inventory = $("cardInventory");
  inventory.innerHTML = "";

  if (currentUser.cards.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-bag";
    empty.textContent = "Túi thẻ đang trống.";
    inventory.appendChild(empty);
  } else {
    currentUser.cards.forEach(card => {
      const item = document.createElement("div");
      item.className = "inventory-card";

      const img = document.createElement("img");
      img.src = card.image || CARD.image;
      img.alt = card.name || "Thẻ bài";
      img.onerror = () => img.remove();

      const name = document.createElement("strong");
      name.textContent = card.name || "Thẻ bài";

      item.append(img, name);
      inventory.appendChild(item);
    });
  }

  $("bagModal").classList.remove("hidden");
}

function closeBag() {
  $("bagModal").classList.add("hidden");
}

/* Taskbar */

function goHome() {
  if (!currentUser) return;

  $("bagModal").classList.add("hidden");

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

  hideRewardScene();
  $("bagModal").classList.add("hidden");
  $("gameScreen").classList.add("hidden");
  $("gameTaskbar").classList.add("hidden");
  $("welcomeScreen").classList.remove("hidden");

  showToast("Đã đăng xuất.");
}

/* Gắn sự kiện */

$("startBtn").addEventListener("click", () => showAuth("login"));
$("loginOpen").addEventListener("click", () => showAuth("login"));
$("registerOpen").addEventListener("click", () => showAuth("register"));

$("modalClose").addEventListener("click", closeAuth);
$("authForm").addEventListener("submit", submitAuth);

$("modal").addEventListener("click", event => {
  if (event.target === $("modal")) closeAuth();
});

$("chestBtn").addEventListener("click", openChest);
$("packBtn").addEventListener("click", tearPack);
$("continueBtn").addEventListener("click", continueGame);

$("homeTab").addEventListener("click", goHome);
$("openBagBtn").addEventListener("click", openBag);
$("collectionTab").addEventListener("click", openBag);
$("shopTab").addEventListener("click", () => {
  showToast("Cửa hàng sẽ được cập nhật sau!");
});

$("bagClose").addEventListener("click", closeBag);
$("bagModal").addEventListener("click", event => {
  if (event.target === $("bagModal")) closeBag();
});

/* Khôi phục tài khoản đã đăng nhập */

function restoreSession() {
  const username = localStorage.getItem(SESSION_KEY);

  if (!username || !users[username]) return;

  currentUser = normalizeUser(username, users[username]);
  saveCurrentUser();
  enterGame();
}

restoreSession();
