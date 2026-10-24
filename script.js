
const $ = (id) => document.getElementById(id);

const USERS_KEY = "cardArenaUsersV3";
const SESSION_KEY = "cardArenaCurrentUserV3";

const CARD = {
  id: "kha-banh",
  name: "Khá Bảnh",
  rarity: "RARE",
  image: "https://raw.githubusercontent.com/luucongdan1979-ui/web-game/main/kh%C3%A1%20b%E1%BA%A3nh%20nv.png"
};

let users = readUsers();
let currentUser = null;
let authMode = "login";
let chestOpened = false;
let packClaimed = false;
let busy = false;

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

function saveCurrentUser() {
  if (!currentUser) return;
  users[currentUser.username] = currentUser;
  saveUsers();
}

function normalizeUser(user, username) {
  return {
    username,
    email: user.email || "",
    password: user.password || "",
    cards: Array.isArray(user.cards) ? user.cards : [],
    chestOpened: Boolean(user.chestOpened),
    packClaimed: Boolean(user.packClaimed),
    pendingPack: Boolean(user.pendingPack),
    packsOpened: Number(user.packsOpened) || 0
  };
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2600);
}

function showModal(mode) {
  authMode = mode;
  $("modalTitle").textContent =
    mode === "register" ? "ĐĂNG KÝ" : "ĐĂNG NHẬP";
  $("modalDescription").textContent =
    mode === "register"
      ? "Tạo tài khoản để bắt đầu sưu tầm thẻ!"
      : "Đăng nhập để tiếp tục cuộc phiêu lưu!";
  $("authSubmit").textContent =
    mode === "register" ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP";
  $("emailGroup").classList.toggle("hidden", mode !== "register");
  $("email").required = mode === "register";
  $("authMessage").textContent = "";
  $("modal").classList.remove("hidden");
  $("username").focus();
}

function closeModal() {
  $("modal").classList.add("hidden");
  $("authForm").reset();
  $("authMessage").textContent = "";
}

function showGame() {
  $("welcomeScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  $("gameTaskbar").classList.remove("hidden");
  $("playerName")?.remove();
  updateBagCount();

  if (currentUser.pendingPack && !currentUser.packClaimed) {
    showChestScene(true);
  } else if (!currentUser.chestOpened) {
    showChestScene(false);
  } else {
    hideChestScene();
  }
}

function enterGame() {
  closeModal();
  $("welcomeScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  $("gameTaskbar").classList.remove("hidden");

  showToast("Đăng nhập thành công! Chào mừng vào game!");

  if (currentUser.pendingPack && !currentUser.packClaimed) {
    showChestScene(true);
  } else if (!currentUser.chestOpened) {
    showChestScene(false);
  } else {
    hideChestScene();
  }

  updateBagCount();
}

function showChestScene(showPack) {
  $("sceneOverlay").classList.remove("hidden");
  $("chestScene").classList.remove("hidden");
  $("revealScene").classList.add("hidden");

  $("chestBtn").classList.toggle("hidden", showPack);
  $("packBtn").classList.toggle("hidden", !showPack);

  $("sceneHint").textContent = showPack
    ? "Gói thẻ đặc biệt đang chờ bạn. Nhấn để xé pack!"
    : "Rương bí ẩn đang chứa một gói thẻ đặc biệt.";

  $("chestBtn").classList.remove("opening");
  $("packBtn").classList.remove("tearing");
  busy = false;
}

function hideChestScene() {
  $("sceneOverlay").classList.add("hidden");
  $("chestScene").classList.add("hidden");
  $("revealScene").classList.add("hidden");
}

function openChest() {
  if (!currentUser || busy || currentUser.chestOpened) return;

  busy = true;
  currentUser.chestOpened = true;
  currentUser.pendingPack = true;
  saveCurrentUser();

  $("chestBtn").classList.add("opening");
  $("sceneHint").textContent = "Rương đang mở...";

  setTimeout(() => {
    $("chestBtn").classList.add("hidden");
    $("packBtn").classList.remove("hidden");
    $("sceneHint").textContent = "Bạn tìm thấy một gói thẻ! Nhấn vào pack để xé.";
    busy = false;
  }, 720);
}

function tearPack() {
  if (!currentUser || busy || currentUser.packClaimed) return;

  busy = true;
  $("packBtn").classList.add("tearing");
  $("sceneHint").textContent = "Đang xé pack...";

  setTimeout(() => {
    const alreadyOwned = currentUser.cards.some(card => card.id === CARD.id);

    if (!alreadyOwned) {
      currentUser.cards.push({ ...CARD });
    }

    currentUser.packClaimed = true;
    currentUser.pendingPack = false;
    currentUser.packsOpened += 1;
    saveCurrentUser();
    updateBagCount();

    $("chestScene").classList.add("hidden");
    $("revealScene").classList.remove("hidden");
    $("revealedCard").classList.remove("card-pop");
    void $("revealedCard").offsetWidth;
    $("revealedCard").classList.add("card-pop");

    showToast(alreadyOwned
      ? "Bạn đã mở pack thành công!"
      : "Chúc mừng! Bạn nhận được lá Khá Bảnh!");

    busy = false;
  }, 800);
}

function updateBagCount() {
  if (!currentUser) {
    $("bagCount").textContent = "0";
    return;
  }
  $("bagCount").textContent = String(currentUser.cards.length);
}

function openBag() {
  if (!currentUser) return;

  const inventory = $("cardInventory");
  inventory.innerHTML = "";

  if (currentUser.cards.length === 0) {
    inventory.innerHTML = '<div class="empty-bag">Túi thẻ đang trống.<br>Hãy mở rương để nhận thẻ đầu tiên!</div>';
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

function closeBag() {
  $("bagModal").classList.add("hidden");
}

function goHome() {
  if (!currentUser) return;
  $("revealScene").classList.add("hidden");

  if (currentUser.pendingPack && !currentUser.packClaimed) {
    showChestScene(true);
  } else if (!currentUser.chestOpened) {
    showChestScene(false);
  } else {
    hideChestScene();
  }
}

function submitAuth(event) {
  event.preventDefault();

  const username = $("username").value.trim();
  const email = $("email").value.trim();
  const password = $("password").value;

  if (username.length < 3) {
    $("authMessage").textContent = "Tên tài khoản cần ít nhất 3 ký tự.";
    return;
  }

  if (password.length < 4) {
    $("authMessage").textContent = "Mật khẩu cần ít nhất 4 ký tự.";
    return;
  }

  if (authMode === "register") {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $("authMessage").textContent = "Vui lòng nhập địa chỉ email hợp lệ.";
      return;
    }

    if (users[username]) {
      $("authMessage").textContent = "Tên tài khoản đã tồn tại.";
      return;
    }

    const emailExists = Object.values(users).some(
      user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      $("authMessage").textContent = "Gmail này đã được đăng ký.";
      return;
    }

    currentUser = normalizeUser({
      email,
      password,
      cards: [],
      chestOpened: false,
      packClaimed: false,
      pendingPack: false,
      packsOpened: 0
    }, username);

    saveCurrentUser();
  } else {
    const user = users[username];

    if (!user || user.password !== password) {
      $("authMessage").textContent = "Tên tài khoản hoặc mật khẩu không đúng.";
      return;
    }

    currentUser = normalizeUser(user, username);
    saveCurrentUser();
  }

  localStorage.setItem(SESSION_KEY, username);
  enterGame();
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  currentUser = null;
  chestOpened = false;
  packClaimed = false;

  hideChestScene();
  $("gameScreen").classList.add("hidden");
  $("gameTaskbar").classList.add("hidden");
  $("welcomeScreen").classList.remove("hidden");
  $("bagModal").classList.add("hidden");

  showToast("Bạn đã đăng xuất.");
}

/* Sự kiện giao diện */

$("startBtn").addEventListener("click", () => {
  showModal("login");
});

$("loginOpen").addEventListener("click", () => {
  showModal("login");
});

$("registerOpen").addEventListener("click", () => {
  showModal("register");
});

$("modalClose").addEventListener("click", closeModal);
$("authForm").addEventListener("submit", submitAuth);

$("modal").addEventListener("click", event => {
  if (event.target === $("modal")) closeModal();
});

$("chestBtn").addEventListener("click", openChest);
$("packBtn").addEventListener("click", tearPack);
$("continueBtn").addEventListener("click", () => {
  $("revealScene").classList.add("hidden");
  hideChestScene();
});

$("openBagBtn").addEventListener("click", openBag);
$("bagClose").addEventListener("click", closeBag);
$("bagModal").addEventListener("click", event => {
  if (event.target === $("bagModal")) closeBag();
});

$("homeTab").addEventListener("click", goHome);

$("collectionTab").addEventListener("click", () => {
  openBag();
});

$("shopTab").addEventListener("click", () => {
  showToast("Cửa hàng sẽ được thêm trong phiên bản tiếp theo!");
});

/* Khôi phục phiên đăng nhập nếu đã đăng nhập trước đó */

function restoreSession() {
  const username = localStorage.getItem(SESSION_KEY);

  if (!username || !users[username]) return;

  currentUser = normalizeUser(users[username], username);
  saveCurrentUser();
  showGame();
}

restoreSession();
