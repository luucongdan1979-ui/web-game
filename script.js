
const USERS_KEY = "cardArenaInteractiveUsersV1";
const SESSION_KEY = "cardArenaInteractiveSessionV1";

const CARDS = [
  {
    id: "kha-banh",
    name: "Khá Bảnh",
    image: "./kh%C3%A1%20b%E1%BA%A3nh%20nv.png"
  },
  {
    id: "jack",
    name: "Jack",
    image: "./jack%20nv.png"
  }
];

let currentUser = null;
let authMode = "login";
let isAnimating = false;
let toastTimer = null;

const $ = (id) => document.getElementById(id);

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
    user => user.username.toLowerCase() === currentUser.username.toLowerCase()
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
    $("authMessage").textContent = "Tên tài khoản cần ít nhất 3 ký tự.";
    return;
  }

  if (password.length < 4) {
    $("authMessage").textContent = "Mật khẩu cần ít nhất 4 ký tự.";
    return;
  }

  if (authMode === "register") {
    if (!email || !$("email").checkValidity()) {
      $("authMessage").textContent = "Vui lòng nhập địa chỉ Gmail hợp lệ.";
      return;
    }

    if (users.some(user =>
      user.username.toLowerCase() === username.toLowerCase()
    )) {
      $("authMessage").textContent = "Tên tài khoản này đã tồn tại.";
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
    showToast("Đăng ký thành công! Chào mừng bạn đến game!");
    return;
  }

  const found = users.find(user =>
    user.username.toLowerCase() === username.toLowerCase() &&
    user.password === password
  );

  if (!found) {
    $("authMessage").textContent = "Sai tên tài khoản hoặc mật khẩu.";
    return;
  }

  currentUser = found;
  localStorage.setItem(SESSION_KEY, found.username);
  closeAuth();
  enterGame();
  showToast("Đăng nhập thành công!");
}

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
  $("sceneHeading").textContent = "RƯƠNG TÂN THỦ";
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

function chooseRandomCard() {
  // Chọn ngẫu nhiên một trong hai lá bài.
  return CARDS[Math.floor(Math.random() * CARDS.length)];
}

function tearPack() {
  if (!currentUser || isAnimating || currentUser.packClaimed) return;

  isAnimating = true;
  $("packBtn").classList.add("tearing");

  setTimeout(() => {
    const card = chooseRandomCard();

    if (!Array.isArray(currentUser.cards)) {
      currentUser.cards = [];
    }

    currentUser.cards.push(card.id);
    currentUser.packClaimed = true;
    savePlayer();

    isAnimating = false;
    hideRewardScene();
    showCardReveal(card);
    updateBagCount();

    showToast("Bạn đã nhận được lá " + card.name + "!");
  }, 650);
}

function showCardReveal(card) {
  $("revealedName").textContent = card.name;
  $("revealMessage").textContent =
    "Chúc mừng! Bạn nhận ngẫu nhiên được lá " + card.name + ".";

  const image = $("revealedImage");
  const fallback = $("imageFallback");

  fallback.classList.add("hidden");
  image.classList.remove("hidden");
  image.alt = card.name;
  image.src = card.image;

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

  $("revealScene").classList.remove("hidden");
}

function continueGame() {
  $("revealScene").classList.add("hidden");
  hideRewardScene();
  updateBagCount();
  showToast("Bạn có thể xem thẻ trong túi đồ!");
}

function updateBagCount() {
  if (!currentUser) {
    $("bagCount").textContent = "0";
    return;
  }

  const cards = Array.isArray(currentUser.cards) ? currentUser.cards : [];
  $("bagCount").textContent = String(cards.length);
}

function openInventory(collectionOnly = false) {
  if (!currentUser) return;

  $("inventoryTitle").textContent = collectionOnly
    ? "BỘ SƯU TẬP"
    : "TÚI ĐỒ";

  const cards = Array.isArray(currentUser.cards) ? currentUser.cards : [];
  $("inventoryCount").textContent =
    "Bạn đang sở hữu " + cards.length + " lá bài";

  const inventory = $("cardInventory");
  inventory.innerHTML = "";

  if (cards.length === 0) {
    inventory.innerHTML =
      '<div class="empty-inventory">Bạn chưa có lá bài nào. Hãy mở rương tân thủ!</div>';
  } else {
    cards.forEach((cardId, index) => {
      const card = CARDS.find(item => item.id === cardId);
      if (!card) return;

      const item = document.createElement("div");
      item.className = "inventory-card";

      const img = document.createElement("img");
      img.src = card.image;
      img.alt = card.name;
      img.onerror = () => {
        img.style.display = "none";
      };

      const name = document.createElement("strong");
      name.textContent = card.name;

      const number = document.createElement("small");
      number.textContent = "Lá bài #" + (index + 1);

      item.append(img, name, number);
      inventory.appendChild(item);
    });
  }

  $("bagModal").classList.remove("hidden");
}

function closeInventory() {
  $("bagModal").classList.add("hidden");
}

function openShop() {
  $("shopModal").classList.remove("hidden");
}

function closeShop() {
  $("shopModal").classList.add("hidden");
}

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

function restoreSession() {
  const username = localStorage.getItem(SESSION_KEY);
  if (!username) return;

  const found = readUsers().find(user => user.username === username);
  if (!found) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  currentUser = found;
  enterGame();
}

/* GẮN SỰ KIỆN CHO CÁC NÚT */
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
$("openBagBtn").addEventListener("click", () => openInventory(false));
$("collectionTab").addEventListener("click", () => openInventory(true));
$("shopTab").addEventListener("click", openShop);
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
  if (event.key === "Escape") {
    closeAuth();
    closeInventory();
    closeShop();
  }
});

restoreSession();
