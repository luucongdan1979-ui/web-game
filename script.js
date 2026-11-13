
const $ = id => document.getElementById(id);

const STORAGE_KEY = "memeCardArenaDemo_v1";
const ADMIN_CODE = "171113";

const cards = {
  kha: {
    name: "Khá Bảnh",
    file: "khá bảnh nv.png",
    rarity: "RARE",
    category: "CHARACTER"
  },
  jack: {
    name: "Jack",
    file: "jack nv.png",
    rarity: "LEGENDARY",
    category: "CHARACTER"
  }
};

let state = loadState();
let currentUser = null;
let isAdmin = false;
let pendingCard = null;
let toastTimer;

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      users: {},
      active: null
    };
  } catch {
    return { users: {}, active: null };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getProfile() {
  return currentUser ? state.users[currentUser] : null;
}

// THÔNG BÁO

function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    $("toast").classList.remove("show");
  }, 2400);
}

function showAuthMessage(message, success = false) {
  $("authMessage").textContent = message;
  $("authMessage").style.color = success
    ? "#8ef0c1"
    : "#ff9dbe";
}

// CHUYỂN TAB

function switchPanel(panelId) {
  document.querySelectorAll(".auth-form").forEach(form => {
    form.classList.toggle("hidden", form.id !== panelId);
  });

  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.panel === panelId);
  });

  showAuthMessage("");
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    switchPanel(tab.dataset.panel);
  });
});

document.querySelectorAll("[data-switch]").forEach(btn => {
  btn.addEventListener("click", () => {
    switchPanel(btn.dataset.switch);
  });
});

// TẠO TÀI KHOẢN MỚI: 20 XU

function createProfile(username, email, password) {
  return {
    username,
    email,
    password,
    coins: 20,
    cards: [],
    packsOpened: 0,
    starterOpened: false
  };
}

$("registerPanel").addEventListener("submit", event => {
  event.preventDefault();

  const username = $("registerUsername").value.trim();
  const email = $("registerEmail").value.trim().toLowerCase();
  const password = $("registerPassword").value;

  const key = username.toLowerCase();

  if (state.users[key]) {
    return showAuthMessage("Tên tài khoản đã tồn tại!");
  }

  if (!/^[a-zA-Z0-9_]{3,18}$/.test(username)) {
    return showAuthMessage(
      "Tên tài khoản cần 3–18 ký tự chữ, số hoặc dấu gạch dưới."
    );
  }

  if (password.length < 6) {
    return showAuthMessage("Mật khẩu cần ít nhất 6 ký tự!");
  }

  state.users[key] = createProfile(username, email, password);

  saveState();

  loginAs(key);
});

// ĐĂNG NHẬP

$("loginPanel").addEventListener("submit", event => {
  event.preventDefault();

  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const profile = state.users[username];

  if (!profile || profile.password !== password) {
    return showAuthMessage("Tên tài khoản hoặc mật khẩu không đúng!");
  }

  loginAs(username);
});

// ADMIN

$("adminPanel").addEventListener("submit", event => {
  event.preventDefault();

  if ($("adminCode").value !== ADMIN_CODE) {
    return showAuthMessage("Mã Admin không chính xác!");
  }

  currentUser = null;
  isAdmin = true;

  enterGame("ADMIN");
});

// ĐĂNG NHẬP THÀNH CÔNG

function loginAs(username) {
  currentUser = username;
  isAdmin = false;

  state.active = username;
  saveState();

  enterGame(state.users[username].username);
}

function enterGame(displayName) {
  $("authScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  $("bottomNav").classList.remove("hidden");

  document.body.classList.add("logged-in");

  $("welcomeUser").textContent = isAdmin
    ? "Xin chào, Admin!"
    : `Xin chào, ${displayName}!`;

  $("adminTag").classList.toggle("hidden", !isAdmin);

  renderProfile();
  showScreen("gameScreen");

  if (isAdmin || getProfile().starterOpened) {
    hideOldStarterChest();
  } else {
    showStarterOverlay();
  }
}

// ĐIỀU HƯỚNG

function showScreen(screenId) {
  ["gameScreen", "shopScreen", "albumScreen"].forEach(id => {
    $(id).classList.toggle("hidden", id !== screenId);
  });

  document.querySelectorAll(".nav-item[data-screen]").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.screen === screenId
    );
  });

  if (screenId === "albumScreen") {
    renderAlbum();
  }
}

document.querySelectorAll(".nav-item[data-screen]").forEach(btn => {
  btn.addEventListener("click", () => {
    showScreen(btn.dataset.screen);
  });
});

// ĐĂNG XUẤT

$("logoutBtn").addEventListener("click", () => {
  currentUser = null;
  isAdmin = false;
  pendingCard = null;

  state.active = null;
  saveState();

  document.body.classList.remove("logged-in");
  document.body.classList.remove("starter-active");

  $("starterOverlay").classList.add("hidden");

  $("authScreen").classList.remove("hidden");
  $("gameScreen").classList.add("hidden");
  $("shopScreen").classList.add("hidden");
  $("albumScreen").classList.add("hidden");
  $("bottomNav").classList.add("hidden");

  $("welcomeUser").textContent = "Chào mừng đến đấu trường!";

  $("loginPassword").value = "";
  $("adminCode").value = "";

  switchPanel("loginPanel");
});

// CẬP NHẬT THÔNG TIN

function renderProfile() {
  const profile = getProfile();

  $("coinCount").textContent = isAdmin
    ? "∞"
    : profile.coins;

  $("cardCount").textContent = isAdmin
    ? "∞"
    : profile.cards.length;

  $("packCount").textContent = isAdmin
    ? "∞"
    : profile.packsOpened;

  $("starterChest").classList.toggle(
    "opened",
    !!profile?.starterOpened
  );

  $("openStarterBtn").textContent =
    profile?.starterOpened
      ? "ĐÃ MỞ RƯƠNG"
      : "MỞ RƯƠNG NGAY ✦";

  $("openStarterBtn").disabled =
    !!profile?.starterOpened;
}

// ẨN RƯƠNG CŨ TRÊN MÀN HÌNH CHÍNH

function hideOldStarterChest() {
  const oldArena = document.querySelector(".arena");

  if (oldArena) {
    oldArena.classList.add("hidden");
  }
}

// RƯƠNG TÂN THỦ

function showStarterOverlay() {
  $("starterOverlay").classList.remove("hidden");

  document.body.classList.add("starter-active");

  $("chestStage").classList.remove("hidden");
  $("packStage").classList.add("hidden");
  $("starterResultStage").classList.add("hidden");

  $("starterTitle").textContent = "RƯƠNG TÂN THỦ";

  $("starterDescription").textContent =
    "Bạn nhận được một pack tân thủ miễn phí!";

  $("starterChestClick").classList.remove("opening");
  $("starterPackClick").classList.remove("tearing");

  pendingCard = null;
}

// BƯỚC 1: NHẤN RƯƠNG

$("starterChestClick").addEventListener("click", () => {
  $("starterChestClick").classList.add("opening");

  showToast("Rương đang mở...");

  setTimeout(() => {
    $("chestStage").classList.add("hidden");
    $("packStage").classList.remove("hidden");

    $("starterTitle").textContent = "STARTER PACK";

    $("starterDescription").textContent =
      "Bạn tìm thấy một gói thẻ bài bí ẩn!";
  }, 650);
});

// BƯỚC 2: XÉ PACK

$("starterPackClick").addEventListener("click", () => {
  if (pendingCard) return;

  $("starterPackClick").classList.add("tearing");

  $("starterTitle").textContent = "ĐANG MỞ PACK...";

  $("starterDescription").textContent =
    "Một lá bài đang xuất hiện!";

  setTimeout(openStarterPack, 850);
});

// BƯỚC 3: RANDOM THẺ

function openStarterPack() {
  const profile = getProfile();

  if (!profile || profile.starterOpened) return;

  // 60% Khá Bảnh, 40% Jack.
  pendingCard = Math.random() < 0.6 ? "kha" : "jack";

  const card = cards[pendingCard];

  // Chỉ thêm đúng thẻ được mở.
  profile.cards.push(pendingCard);
  profile.packsOpened += 1;
  profile.starterOpened = true;

  saveState();

  $("packStage").classList.add("hidden");
  $("starterResultStage").classList.remove("hidden");

  $("starterTitle").textContent = "CHÚC MỪNG!";

  $("starterDescription").textContent =
    "Bạn đã nhận được một thẻ bài mới!";

  $("starterResultImage").style.display = "block";
  $("starterResultImage").src = card.file;
  $("starterResultImage").alt = card.name;

  $("starterResultImage").onerror = function() {
    this.style.display = "none";
  };

  $("starterResultName").textContent = card.name;
  $("starterResultRarity").textContent = card.rarity;
  $("starterResultCategory").textContent = card.category;

  renderProfile();
}

// BƯỚC 4: NHẬN THẺ

$("starterFinish").addEventListener("click", () => {
  if (!pendingCard) return;

  $("starterOverlay").classList.add("hidden");

  document.body.classList.remove("starter-active");

  hideOldStarterChest();

  pendingCard = null;

  renderProfile();
  renderAlbum();

  showToast("Đã thêm thẻ bài vào Album!");
});

// SHOP - MUA PACK

document.querySelectorAll(".buy-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const price = btn.dataset.pack === "basic" ? 10 : 20;

    if (isAdmin) {
      return showToast("Admin có thể thử pack miễn phí!");
    }

    const profile = getProfile();

    if (!profile || profile.coins < price) {
      return showToast("Bạn không đủ xu để mua pack!");
    }

    profile.coins -= price;

    // Tỉ lệ thẻ của pack: Khá Bảnh 60%, Jack 40%.
    const cardId = Math.random() < 0.6 ? "kha" : "jack";

    profile.cards.push(cardId);
    profile.packsOpened += 1;

    saveState();
    renderProfile();

    showShopCard(cardId);
  });
});

// HIỆN THẺ SHOP

function showShopCard(cardId) {
  const card = cards[cardId];

  $("revealedCard").innerHTML = `
    <img src="${card.file}" alt="${card.name}">
    <h3>${card.name}</h3>
    <small>${card.rarity} · ${card.category}</small>
  `;

  $("revealModal").classList.remove("hidden");
}

function closeReveal() {
  $("revealModal").classList.add("hidden");
  renderProfile();
}

$("closeReveal").addEventListener("click", closeReveal);
$("revealDone").addEventListener("click", closeReveal);

$("revealModal").addEventListener("click", event => {
  if (event.target === $("revealModal")) {
    closeReveal();
  }
});

// ALBUM - CHỈ HIỆN THẺ ĐÃ SỞ HỮU

function renderAlbum() {
  const profile = getProfile();

  const owned = isAdmin
    ? ["kha", "jack"]
    : (profile?.cards || []);

  $("emptyAlbum").classList.toggle(
    "hidden",
    owned.length > 0
  );

  $("albumGrid").innerHTML = owned.map(id => {
    const card = cards[id];

    if (!card) return "";

    return `
      <article class="owned-card">
        <img src="${card.file}" alt="${card.name}">
        <h3>${card.name}</h3>
        <small>${card.rarity} · ${card.category}</small>
      </article>
    `;
  }).join("");
}

// KHÔI PHỤC ĐĂNG NHẬP

if (state.active && state.users[state.active]) {
  loginAs(state.active);
} else {
  switchPanel("loginPanel");
}
