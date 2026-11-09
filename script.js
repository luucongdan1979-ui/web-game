
// MEME CARD ARENA

const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "memeCardArenaDemo_v1";
const ADMIN_CODE = "171113";

const cards = {
  kha: {
    name: "Khá Bảnh",
    file: "khá bảnh nv.png",
    rarity: "LEGENDARY"
  },
  jack: {
    name: "Jack",
    file: "jack nv.png",
    rarity: "LEGENDARY"
  }
};

let state = loadState();
let currentUser = null;
let isAdmin = false;
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

// CHUYỂN TAB ĐĂNG NHẬP / ĐĂNG KÝ / ADMIN

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

// TẠO TÀI KHOẢN

function createProfile(username, email, password) {
  return {
    username,
    email,
    password,
    coins: 30,
    cards: [],
    packsOpened: 0,
    starterOpened: false
  };
}

$("registerPanel").addEventListener("submit", (event) => {
  event.preventDefault();

  const username = $("registerUsername").value.trim();
  const email = $("registerEmail").value.trim().toLowerCase();
  const password = $("registerPassword").value;

  if (state.users[username.toLowerCase()]) {
    return showAuthMessage("Tên tài khoản đã tồn tại.");
  }

  if (!/^[a-zA-Z0-9_]{3,18}$/.test(username)) {
    return showAuthMessage(
      "Tên tài khoản dùng 3–18 ký tự chữ, số hoặc dấu gạch dưới."
    );
  }

  if (password.length < 6) {
    return showAuthMessage("Mật khẩu cần ít nhất 6 ký tự.");
  }

  state.users[username.toLowerCase()] =
    createProfile(username, email, password);

  saveState();

  loginAs(username.toLowerCase(), false);
});

// ĐĂNG NHẬP

$("loginPanel").addEventListener("submit", (event) => {
  event.preventDefault();

  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const profile = state.users[username];

  if (!profile || profile.password !== password) {
    return showAuthMessage(
      "Tên tài khoản hoặc mật khẩu không đúng."
    );
  }

  loginAs(username, false);
});

// ADMIN CODE

$("adminPanel").addEventListener("submit", (event) => {
  event.preventDefault();

  if ($("adminCode").value !== ADMIN_CODE) {
    return showAuthMessage("Mã admin không chính xác.");
  }

  currentUser = null;
  isAdmin = true;

  enterGame("ADMIN");
});

// VÀO GAME

function loginAs(username, admin) {
  currentUser = username;
  isAdmin = admin;

  state.active = username;
  saveState();

  enterGame(state.users[username].username);
}

function enterGame(displayName) {
  $("authScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  $("bottomNav").classList.remove("hidden");

  $("welcomeUser").textContent = isAdmin
    ? "Xin chào, Admin!"
    : `Xin chào, ${displayName}!`;

  $("adminTag").classList.toggle("hidden", !isAdmin);

  renderProfile();
  showScreen("gameScreen");
}

// CHUYỂN MÀN HÌNH

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

  state.active = null;
  saveState();

  $("authScreen").classList.remove("hidden");
  $("gameScreen").classList.add("hidden");
  $("shopScreen").classList.add("hidden");
  $("albumScreen").classList.add("hidden");
  $("bottomNav").classList.add("hidden");

  $("welcomeUser").textContent = "Chào mừng đến đấu trường!";

  $("loginPassword").value = "";

  switchPanel("loginPanel");
});

// HIỂN THỊ THÔNG TIN TÀI KHOẢN

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

  $("openStarterBtn").style.opacity =
    profile?.starterOpened ? ".6" : "1";
}

// RANDOM THẺ BÀI 50/50

function randomCard() {
  return Math.random() < 0.5 ? "kha" : "jack";
}

// THÊM THẺ VÀO ALBUM

function addCard(cardId) {
  const profile = getProfile();

  if (!profile) return;

  profile.cards.push(cardId);
  profile.packsOpened += 1;

  saveState();
  renderProfile();
}

// HIỆN THẺ BÀI NHẬN ĐƯỢC

function reveal(cardId) {
  const card = cards[cardId];

  $("revealedCard").innerHTML = `
    <img
      src="${card.file}"
      alt="${card.name}"
      onerror="this.style.display='none';this.parentElement.insertAdjacentHTML('afterbegin','<div style=&quot;font-size:76px;padding:45px 0&quot;>🃏</div>')"
    >
    <h3>${card.name}</h3>
    <small>${card.rarity}</small>
  `;

  $("revealModal").classList.remove("hidden");
}

// MỞ RƯƠNG TÂN THỦ

$("openStarterBtn").addEventListener("click", () => {
  if (isAdmin) {
    return showToast("Admin có thể thử mở pack trong Shop.");
  }

  const profile = getProfile();

  if (!profile || profile.starterOpened) return;

  profile.starterOpened = true;

  const cardId = randomCard();

  addCard(cardId);
  reveal(cardId);
});

// ĐÓNG MODAL

function closeReveal() {
  $("revealModal").classList.add("hidden");
  renderProfile();
}

$("closeReveal").addEventListener("click", closeReveal);
$("revealDone").addEventListener("click", closeReveal);

$("revealModal").addEventListener("click", (event) => {
  if (event.target === $("revealModal")) {
    closeReveal();
  }
});

// SHOP - MUA PACK

document.querySelectorAll(".buy-btn").forEach(btn => {
  btn.addEventListener("click", () => {

    const price = btn.dataset.pack === "basic"
      ? 10
      : 20;

    if (isAdmin) {
      const cardId = randomCard();
      reveal(cardId);
      return;
    }

    const profile = getProfile();

    if (profile.coins < price) {
      return showToast("Bạn không đủ xu để mua pack!");
    }

    profile.coins -= price;

    const cardId = randomCard();

    addCard(cardId);
    reveal(cardId);
  });
});

// HIỂN THỊ ALBUM

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

    return `
      <article class="owned-card">
        <img
          src="${card.file}"
          alt="${card.name}"
          onerror="this.style.display='none'"
        >
        <h3>${card.name}</h3>
        <small>${card.rarity}</small>
      </article>
    `;
  }).join("");
}

// KHÔI PHỤC PHIÊN ĐĂNG NHẬP

if (state.active && state.users[state.active]) {
  loginAs(state.active, false);
} else {
  switchPanel("loginPanel");
}
