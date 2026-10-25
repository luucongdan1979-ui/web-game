
const USERS_KEY = "cardArenaInteractiveUsersV1";
const SESSION_KEY = "cardArenaInteractiveSessionV1";
const ADMIN_CODE = "171113";

const CARD_DATA = {
  kha: {
    id: "kha",
    name: "Khá Bảnh",
    rarity: "RARE",
    description: "Lá nhân vật meme Khá Bảnh.",
    image: "./kh%C3%A1%20b%E1%BA%A3nh%20nv.png"
  },
  jack: {
    id: "jack",
    name: "Jack",
    rarity: "LEGENDARY",
    description: "Lá nhân vật Jack - gói đặc biệt.",
    image: "./jack%20nv.png"
  }
};

const PACK_DATA = {
  basic: { name: "Basic Pack", price: 10, icon: "✦" },
  premium: { name: "Premium Pack", price: 20, icon: "✧" }
};

let currentUser = null;
let authMode = "login";
let selectedPackId = null;
let chestUsed = false;
let toastTimer = null;

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveCurrentUser() {
  if (!currentUser || currentUser.isAdmin) return;
  const users = loadUsers();
  const index = users.findIndex(u => u.username === currentUser.username);

  if (index >= 0) {
    users[index] = currentUser;
    saveUsers(users);
  }

  localStorage.setItem(SESSION_KEY, currentUser.username);
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function openAuth(mode) {
  authMode = mode;
  document.getElementById("authTitle").textContent =
    mode === "register" ? "ĐĂNG KÝ" : "ĐĂNG NHẬP";

  document.getElementById("emailGroup").classList.toggle(
    "hidden", mode !== "register"
  );

  document.getElementById("emailInput").required = mode === "register";
  document.getElementById("emailInput").value = "";
  document.getElementById("usernameInput").value = "";
  document.getElementById("passwordInput").value = "";
  document.getElementById("authMessage").textContent = "";

  const switchText = document.getElementById("authSwitch");
  switchText.textContent = mode === "register"
    ? "Đã có tài khoản? Bấm để đăng nhập"
    : "Chưa có tài khoản? Bấm để đăng ký";

  switchText.onclick = () => openAuth(
    authMode === "register" ? "login" : "register"
  );

  document.getElementById("authModal").classList.remove("hidden");
}

function tapToStart() {
  if (currentUser) {
    enterGame();
  } else {
    openAuth("login");
  }
}

document.getElementById("authForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = document.getElementById("usernameInput").value.trim();
  const password = document.getElementById("passwordInput").value;
  const email = document.getElementById("emailInput").value.trim();
  const message = document.getElementById("authMessage");

  const users = loadUsers();

  if (authMode === "register") {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      message.textContent = "Tên tài khoản: 3–20 ký tự, chỉ dùng chữ, số và _.";
      return;
    }

    if (!email || !email.includes("@")) {
      message.textContent = "Vui lòng nhập Gmail hợp lệ.";
      return;
    }

    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      message.textContent = "Tên tài khoản đã tồn tại.";
      return;
    }

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      message.textContent = "Gmail này đã được đăng ký.";
      return;
    }

    const user = {
      username,
      password,
      email,
      coins: 17,
      cards: [],
      inventoryPacks: [],
      chestClaimed: false
    };

    users.push(user);
    saveUsers(users);
    currentUser = user;
    saveCurrentUser();

    closeModal("authModal");
    toast("Đăng ký thành công! Chào mừng bạn đến CARD ARENA!");
    enterGame();
    return;
  }

  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    message.textContent = "Sai tài khoản hoặc mật khẩu.";
    return;
  }

  currentUser = user;
  saveCurrentUser();
  closeModal("authModal");
  toast("Đăng nhập thành công!");
  enterGame();
});

function enterGame() {
  if (!currentUser) return;

  document.getElementById("welcomeScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");
  document.getElementById("adminNav").classList.toggle(
    "hidden", !currentUser.isAdmin
  );

  updateCoins();
  updateAlbum();
  updateBag();
  goPage("home");
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  currentUser = null;

  document.getElementById("gameScreen").classList.add("hidden");
  document.getElementById("welcomeScreen").classList.remove("hidden");

  toast("Bạn đã đăng xuất.");
}

function goPage(page) {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  const pages = ["home", "album", "shop", "bag", "admin"];

  if (page === "admin" && !currentUser.isAdmin) {
    toast("Bạn không có quyền Admin.");
    return;
  }

  pages.forEach(name => {
    const el = document.getElementById(name + "Page");
    if (el) el.classList.toggle("hidden", name !== page);
  });

  document.querySelectorAll(".nav-btn[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  if (page === "album") updateAlbum();
  if (page === "bag") updateBag();
}

function updateCoins() {
  document.getElementById("coinAmount").textContent =
    currentUser?.isAdmin ? "∞" : (currentUser?.coins ?? 0);
}

function buyPack(type) {
  if (!currentUser) return;

  const pack = PACK_DATA[type];
  if (!pack) return;

  if (!currentUser.isAdmin && currentUser.coins < pack.price) {
    toast("Bạn không đủ COIN để mua pack!");
    return;
  }

  if (!currentUser.isAdmin) {
    currentUser.coins -= pack.price;
  }

  if (!currentUser.inventoryPacks) currentUser.inventoryPacks = [];

  currentUser.inventoryPacks.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    type,
    name: pack.name
  });

  saveCurrentUser();
  updateCoins();
  updateBag();

  toast("Mua " + pack.name + " thành công! Pack đã vào Balo.");
}

function updateBag() {
  if (!currentUser) return;

  const grid = document.getElementById("bagGrid");
  const packs = currentUser.inventoryPacks || [];

  document.getElementById("bagCount").textContent = packs.length + " PACK";

  if (!packs.length) {
    grid.innerHTML = `
      <div class="empty-state">
        🎒 Balo đang trống.<br>
        Vào Shop để mua pack đầu tiên nhé!
      </div>`;
    return;
  }

  grid.innerHTML = packs.map(pack => {
    const info = PACK_DATA[pack.type] || PACK_DATA.basic;
    const premium = pack.type === "premium" ? "premium" : "";

    return `
      <button class="bag-item" onclick="openBagPack('${pack.id}')">
        <div class="mini-pack ${premium}">${info.icon}</div>
        <b>${info.name}</b>
        <small>Nhấn để xem pack</small>
      </button>`;
  }).join("");
}

function openBagPack(packId) {
  const packs = currentUser?.inventoryPacks || [];
  const pack = packs.find(item => item.id === packId);

  if (!pack) {
    toast("Không tìm thấy pack.");
    updateBag();
    return;
  }

  selectedPackId = packId;
  const info = PACK_DATA[pack.type] || PACK_DATA.basic;

  document.getElementById("selectedPackName").textContent = info.name;
  document.getElementById("selectedPackArt").textContent = info.icon;
  document.getElementById("selectedPackArt").classList.toggle(
    "premium", pack.type === "premium"
  );

  document.getElementById("openSelectedPackBtn").onclick = openSelectedPack;
  document.getElementById("packModal").classList.remove("hidden");
}

function openSelectedPack() {
  if (!currentUser || !selectedPackId) return;

  const packs = currentUser.inventoryPacks || [];
  const index = packs.findIndex(pack => pack.id === selectedPackId);

  if (index < 0) {
    closeModal("packModal");
    toast("Pack không còn trong Balo.");
    updateBag();
    return;
  }

  const [pack] = packs.splice(index, 1);
  const cardId = Math.random() < (
    pack.type === "premium" ? 0.6 : 0.3
  ) ? "jack" : "kha";

  const card = CARD_DATA[cardId];

  if (!currentUser.cards) currentUser.cards = [];
  currentUser.cards.push({
    id: card.id,
    obtainedAt: Date.now()
  });

  saveCurrentUser();
  selectedPackId = null;
  closeModal("packModal");
  updateBag();
  updateAlbum();

  const revealCard = document.getElementById("revealCard");
  revealCard.className = "trading-card rarity-" + card.rarity.toLowerCase();

  document.getElementById("revealRarity").textContent = card.rarity;
  document.getElementById("revealName").textContent = card.name;
  document.getElementById("revealImage").src = card.image;
  document.getElementById("revealDescription").textContent =
    card.description + " Thẻ đã được thêm vào Album.";

  document.getElementById("revealModal").classList.remove("hidden");
}

function updateAlbum() {
  if (!currentUser) return;

  const grid = document.getElementById("albumGrid");
  const cards = currentUser.cards || [];

  document.getElementById("albumCount").textContent = cards.length + " THẺ";

  if (!cards.length && !currentUser.isAdmin) {
    grid.innerHTML = `
      <div class="empty-state">
        🃏 Bạn chưa có lá bài nào.<br>
        Mua pack tại Shop rồi mở trong Balo nhé!
      </div>`;
    return;
  }

  const owned = cards.map(item => CARD_DATA[item.id]).filter(Boolean);
  const displayCards = currentUser.isAdmin
    ? Object.values(CARD_DATA)
    : owned;

  if (!displayCards.length) {
    grid.innerHTML = '<div class="empty-state">Album chưa có thẻ.</div>';
    return;
  }

  grid.innerHTML = displayCards.map((card, index) => `
    <article class="trading-card album-card rarity-${card.rarity.toLowerCase()}"
      onclick="showCardDetail('${card.id}')">
      <div class="rarity">${card.rarity}</div>
      <div class="card-image-wrap">
        <img src="${card.image}" alt="${card.name}"
          onerror="this.style.display='none';this.parentElement.innerHTML='🃏'">
      </div>
      <h2>${card.name}</h2>
      <p>${card.description}</p>
    </article>
  `).join("");
}

function showCardDetail(cardId) {
  const card = CARD_DATA[cardId];
  if (!card) return;

  const detail = document.getElementById("detailCard");
  detail.className = "trading-card rarity-" + card.rarity.toLowerCase();

  document.getElementById("detailRarity").textContent = card.rarity;
  document.getElementById("detailName").textContent = card.name;
  document.getElementById("detailImage").src = card.image;
  document.getElementById("detailDescription").textContent = card.description;
  document.getElementById("cardModal").classList.remove("hidden");
}

function openChest() {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  document.getElementById("chestDescription").textContent =
    currentUser.chestClaimed
      ? "Bạn đã nhận quà khởi đầu rồi."
      : "Nhận một Basic Pack miễn phí!";

  const button = document.getElementById("claimChestBtn");
  button.disabled = !!currentUser.chestClaimed;
  button.textContent = currentUser.chestClaimed ? "ĐÃ NHẬN QUÀ" : "MỞ RƯƠNG";

  document.getElementById("chestModal").classList.remove("hidden");
}

function claimChest() {
  if (!currentUser || currentUser.chestClaimed) {
    toast("Bạn đã nhận quà khởi đầu rồi!");
    return;
  }

  if (!currentUser.inventoryPacks) currentUser.inventoryPacks = [];

  currentUser.inventoryPacks.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    type: "basic",
    name: "Basic Pack"
  });

  currentUser.chestClaimed = true;
  saveCurrentUser();
  updateBag();
  closeModal("chestModal");
  toast("🎁 Nhận Basic Pack miễn phí! Hãy vào Balo.");
}

function openAdmin() {
  document.getElementById("adminCode").value = "";
  document.getElementById("adminMessage").textContent = "";
  document.getElementById("adminModal").classList.remove("hidden");
}

function loginAdmin() {
  const code = document.getElementById("adminCode").value;

  if (code !== ADMIN_CODE) {
    document.getElementById("adminMessage").textContent = "Mã Admin không chính xác.";
    return;
  }

  currentUser = {
    username: "ADMIN",
    isAdmin: true,
    coins: Infinity,
    cards: [],
    inventoryPacks: [],
    chestClaimed: true
  };

  closeModal("adminModal");
  enterGame();
  toast("👑 Đăng nhập Admin thành công!");
}

function addAdminCoins() {
  if (!currentUser?.isAdmin) return;
  toast("Admin đã có quyền sử dụng COIN không giới hạn.");
}

function restoreSession() {
  const username = localStorage.getItem(SESSION_KEY);
  if (!username) return;

  const user = loadUsers().find(item => item.username === username);
  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  currentUser = user;
  enterGame();
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    ["authModal", "adminModal", "packModal", "revealModal", "cardModal", "chestModal"]
      .forEach(closeModal);
  }
});

restoreSession();
