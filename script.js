
/* =====================================================
   CARD ARENA - MAIN JAVASCRIPT
   Đăng nhập | Đăng ký | Rương | Pack | Album | Shop
   Admin code: 171113
===================================================== */

"use strict";

// ==================== CẤU HÌNH ====================

const ADMIN_CODE = "171113";
const USERS_KEY = "cardArenaInteractiveUsersV1";
const SESSION_KEY = "cardArenaInteractiveSessionV1";

const PACKS = {
  basic: {
    name: "Basic Pack",
    price: 10,
    color: "#9b7aff"
  },
  premium: {
    name: "Premium Pack",
    price: 20,
    color: "#ffbd59"
  }
};

// ==================== DỮ LIỆU THẺ ====================

const CARD_DATA = [
  {
    id: "kha-banh",
    name: "Khá Bảnh",
    type: "CHARACTER",
    rarity: "LEGENDARY",
    image: "./kh%C3%A1%20b%E1%BA%A3nh%20nv.png",
    description: "Nhân vật meme nổi bật trong CARD ARENA."
  },
  {
    id: "jack-j97",
    name: "Jack J97",
    type: "CHARACTER",
    rarity: "EPIC",
    image: "./jack%20nv.png",
    description: "Nhân vật meme của CARD ARENA."
  },
  {
    id: "vao-tu",
    name: "Vào Tù",
    type: "SITUATION",
    rarity: "LEGENDARY",
    image: "./Vào Tù Th.png",
    description: "Lá bài tình huống Legendary."
  },

  // Các ô thẻ mẫu để bạn bổ sung sau
  {
    id: "character-03",
    name: "Nhân vật 03",
    type: "CHARACTER",
    rarity: "RARE",
    image: "",
    locked: true
  },
  {
    id: "character-04",
    name: "Nhân vật 04",
    type: "CHARACTER",
    rarity: "RARE",
    image: "",
    locked: true
  },
  {
    id: "character-05",
    name: "Nhân vật 05",
    type: "CHARACTER",
    rarity: "EPIC",
    image: "",
    locked: true
  },
  {
    id: "character-06",
    name: "Nhân vật 06",
    type: "CHARACTER",
    rarity: "RARE",
    image: "",
    locked: true
  },
  {
    id: "character-07",
    name: "Nhân vật 07",
    type: "CHARACTER",
    rarity: "EPIC",
    image: "",
    locked: true
  },
  {
    id: "character-08",
    name: "Nhân vật 08",
    type: "CHARACTER",
    rarity: "RARE",
    image: "",
    locked: true
  },
  {
    id: "character-09",
    name: "Nhân vật 09",
    type: "CHARACTER",
    rarity: "EPIC",
    image: "",
    locked: true
  },
  {
    id: "skill-01",
    name: "Skill 01",
    type: "SKILL",
    rarity: "RARE",
    image: "",
    locked: true
  },
  {
    id: "skill-02",
    name: "Skill 02",
    type: "SKILL",
    rarity: "EPIC",
    image: "",
    locked: true
  },
  {
    id: "skill-03",
    name: "Skill 03",
    type: "SKILL",
    rarity: "RARE",
    image: "",
    locked: true
  },
  {
    id: "situation-02",
    name: "Tình huống 02",
    type: "SITUATION",
    rarity: "RARE",
    image: "",
    locked: true
  },
  {
    id: "situation-03",
    name: "Tình huống 03",
    type: "SITUATION",
    rarity: "EPIC",
    image: "",
    locked: true
  },
  {
    id: "situation-04",
    name: "Tình huống 04",
    type: "SITUATION",
    rarity: "RARE",
    image: "",
    locked: true
  }
];

// ==================== TRẠNG THÁI GAME ====================

let users = readUsers();
let currentUser = null;
let currentFilter = "ALL";
let selectedPackType = "basic";
let revealedCard = null;

// ==================== TIỆN ÍCH ====================

function $(selector) {
  return document.querySelector(selector);
}

function readUsers() {
  try {
    const saved = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveUsers() {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveCurrentUser() {
  if (!currentUser) return;

  const index = users.findIndex(
    user => user.username === currentUser.username
  );

  if (index !== -1) {
    users[index] = currentUser;
  } else {
    users.push(currentUser);
  }

  saveUsers();
  localStorage.setItem(SESSION_KEY, currentUser.username);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function showToast(message) {
  let toast = $("#gameToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "gameToast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = "game-toast show";

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function rarityLabel(rarity) {
  return {
    COMMON: "Common",
    RARE: "Rare",
    EPIC: "Epic",
    LEGENDARY: "Legendary"
  }[rarity] || rarity;
}

function typeLabel(type) {
  return {
    CHARACTER: "Nhân vật",
    SKILL: "Skill",
    SITUATION: "Tình huống"
  }[type] || type;
}

function ownedCardIds() {
  return currentUser?.ownedCards || [];
}

function isOwned(cardId) {
  return ownedCardIds().includes(cardId);
}

// ==================== KHỞI TẠO TÀI KHOẢN ====================

function createUser(username, email, password, isAdmin = false) {
  return {
    username,
    email,
    password,
    isAdmin,
    coins: isAdmin ? 0 : 100,
    ownedCards: [],
    inventoryPacks: [],
    starterClaimed: false,
    createdAt: Date.now()
  };
}

// ==================== KHỞI TẠO GIAO DIỆN ====================

function addGameStyles() {
  if ($("#cardArenaGeneratedStyles")) return;

  const style = document.createElement("style");
  style.id = "cardArenaGeneratedStyles";

  style.textContent = `
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: #f7f2ff;
      background:
        radial-gradient(ellipse at top, #30205a 0%, transparent 55%),
        linear-gradient(145deg, #100b20, #080711 70%);
      font-family: Arial, sans-serif;
    }
    button, input { font: inherit; }
    button { cursor: pointer; }
    .ca-app { min-height: 100vh; }
    .ca-header {
      position: sticky; top: 0; z-index: 10;
      display: flex; justify-content: space-between;
      align-items: center; gap: 12px; flex-wrap: wrap;
      padding: 16px 5%;
      background: #100b20ed;
      border-bottom: 1px solid #59418b;
    }
    .ca-logo {
      font-size: 25px; font-weight: 900;
      letter-spacing: 2px; color: #d9b8ff;
      text-shadow: 0 0 18px #a45cff;
    }
    .ca-coins { color: #ffe18b; font-weight: bold; }
    .ca-nav { display: flex; gap: 8px; flex-wrap: wrap; }
    .ca-btn {
      padding: 11px 16px; border: 1px solid #7250a9;
      border-radius: 12px; color: white;
      background: linear-gradient(135deg, #523080, #291946);
      transition: .2s;
    }
    .ca-btn:hover { transform: translateY(-2px); filter: brightness(1.2); }
    .ca-btn.primary {
      background: linear-gradient(135deg, #bb6cff, #7543e8);
      border-color: #d8b4ff;
    }
    .ca-btn.gold {
      background: linear-gradient(135deg, #f6c968, #a85d20);
      color: #1c1022;
    }
    .ca-main { width: min(1100px, 92%); margin: 30px auto; }
    .ca-panel {
      padding: 24px; border: 1px solid #59418b;
      border-radius: 20px; background: #171025dc;
      box-shadow: 0 12px 35px #0005;
    }
    .ca-title { font-size: clamp(25px, 5vw, 40px); margin: 0 0 12px; }
    .ca-muted { color: #bcb1d4; line-height: 1.6; }
    .ca-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
      gap: 15px; margin-top: 22px;
    }
    .ca-card {
      min-height: 230px; padding: 12px;
      border: 1px solid #63458f; border-radius: 15px;
      background: linear-gradient(155deg, #32204d, #15101f);
      text-align: center; overflow: hidden;
    }
    .ca-card.legendary {
      border-color: #ffcf6e;
      box-shadow: 0 0 18px #e5a83436;
    }
    .ca-card-art {
      display: flex; align-items: center; justify-content: center;
      width: 100%; height: 145px; margin-bottom: 10px;
      overflow: hidden; border-radius: 10px;
      background: #09090d;
    }
    .ca-card-art img { width: 100%; height: 100%; object-fit: contain; }
    .ca-card-name { font-weight: bold; margin: 8px 0; }
    .ca-rarity { font-size: 12px; color: #f6d17c; }
    .ca-locked {
      display: flex; align-items: center; justify-content: center;
      width: 100%; height: 145px; background: #000;
      color: #fff; font-size: 65px; font-weight: bold;
      border-radius: 10px; margin-bottom: 10px;
    }
    .ca-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 15px 0; }
    .ca-form { display: grid; gap: 12px; max-width: 420px; }
    .ca-input {
      width: 100%; padding: 13px; color: white;
      border: 1px solid #63458f; border-radius: 10px;
      background: #0d0917;
    }
    .ca-center { text-align: center; }
    .ca-welcome {
      min-height: 80vh; display: grid; place-content: center;
      text-align: center; padding: 25px;
    }
    .ca-welcome .ca-logo { font-size: clamp(36px, 8vw, 72px); }
    .ca-tap {
      margin: 25px auto; padding: 18px 35px;
      border-radius: 16px; border: 1px solid #edceff;
      background: linear-gradient(120deg, #d67aff, #7345ed);
      color: white; font-weight: 900; letter-spacing: 2px;
      animation: caPulse 1.2s ease-in-out infinite;
    }
    @keyframes caPulse {
      0%,100% { transform: scale(1); box-shadow: 0 0 12px #a45cff66; }
      50% { transform: scale(1.08); box-shadow: 0 0 30px #a45cffcc; }
    }
    .ca-modal {
      position: fixed; inset: 0; z-index: 50;
      display: grid; place-items: center; padding: 18px;
      background: #05030bdc;
    }
    .ca-modal-box {
      width: min(470px, 100%); padding: 24px;
      border-radius: 20px; border: 1px solid #8a60bb;
      background: #191027; max-height: 90vh; overflow-y: auto;
    }
    .ca-pack {
      display: inline-grid; place-items: center;
      width: 170px; height: 230px; border-radius: 18px;
      margin: 20px; padding: 12px;
      border: 2px solid #e6c4ff;
      background: linear-gradient(140deg, #a15cff, #31135c 60%, #0d0920);
      box-shadow: 0 0 25px #a45cff66;
      font-size: 22px; font-weight: 900;
      transition: transform .5s;
    }
    .ca-pack.premium {
      background: linear-gradient(140deg, #ffe58c, #9a541d 60%, #25100a);
      border-color: #ffe7a5;
    }
    .ca-pack.tearing { animation: caTear .65s ease-in forwards; }
    @keyframes caTear {
      0% { transform: rotate(0) scale(1); }
      35% { transform: rotate(-10deg) scale(1.08); }
      100% { transform: rotate(25deg) scale(.1); opacity: 0; }
    }
    .ca-toast {
      position: fixed; z-index: 100; bottom: 25px; left: 50%;
      transform: translate(-50%, 20px); opacity: 0;
      padding: 13px 20px; border-radius: 12px;
      background: #eee0ff; color: #24113d;
      font-weight: bold; transition: .25s; pointer-events: none;
    }
    .ca-toast.show { opacity: 1; transform: translate(-50%, 0); }
    .ca-hidden { display: none !important; }
    @media(max-width: 520px) {
      .ca-header { justify-content: center; }
      .ca-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .ca-panel { padding: 17px; }
    }
  `;

  document.head.appendChild(style);
}

function buildGameShell() {
  document.body.innerHTML = `
    <div class="ca-app">
      <section id="caWelcome" class="ca-welcome">
        <div class="ca-logo">CARD ARENA</div>
        <p class="ca-muted">COLLECT • OPEN PACKS • BUILD YOUR COLLECTION</p>
        <button class="ca-tap" id="caTapStart">TAP TO START</button>
        <div>
          <button class="ca-btn primary" id="caShowLogin">ĐĂNG NHẬP</button>
          <button class="ca-btn" id="caShowRegister">ĐĂNG KÝ</button>
        </div>
      </section>

      <div id="caGame" class="ca-hidden">
        <header class="ca-header">
          <div class="ca-logo">CARD ARENA</div>
          <div>Xin chào, <b id="caUsername"></b></div>
          <div class="ca-coins">🪙 Xu: <span id="caCoins">0</span></div>
          <nav class="ca-nav">
            <button class="ca-btn" data-page="home">Trang chủ</button>
            <button class="ca-btn" data-page="album">Album</button>
            <button class="ca-btn" data-page="shop">Shop</button>
            <button class="ca-btn" data-page="bag">Túi đồ</button>
            <button class="ca-btn" data-page="admin" id="caAdminNav">Admin</button>
            <button class="ca-btn" id="caLogout">Đăng xuất</button>
          </nav>
        </header>
        <main class="ca-main" id="caPage"></main>
      </div>
      <div id="caModalRoot"></div>
      <div id="gameToast" class="ca-toast"></div>
    </div>
  `;
}

function updateCoins() {
  const display = $("#caCoins");
  if (!display) return;
  display.textContent = currentUser?.isAdmin
    ? "∞"
    : String(currentUser?.coins ?? 0);
}

// ==================== ĐĂNG KÝ / ĐĂNG NHẬP ====================

function showAuthModal(mode = "login") {
  const isRegister = mode === "register";

  $("#caModalRoot").innerHTML = `
    <div class="ca-modal">
      <div class="ca-modal-box">
        <h2>${isRegister ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP"}</h2>
        <p class="ca-muted">
          ${isRegister
            ? "Điền thông tin để bắt đầu chơi CARD ARENA."
            : "Đăng nhập để tiếp tục bộ sưu tập của bạn."}
        </p>
        <form id="caAuthForm" class="ca-form">
          <input class="ca-input" name="username" placeholder="Tên tài khoản" required minlength="3" autocomplete="username">
          ${isRegister
            ? '<input class="ca-input" name="email" type="email" placeholder="Địa chỉ Gmail" required autocomplete="email">'
            : ""}
          <input class="ca-input" name="password" type="password" placeholder="Mật khẩu" required minlength="4" autocomplete="${isRegister ? "new-password" : "current-password"}">
          ${isRegister
            ? '<input class="ca-input" name="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" required minlength="4" autocomplete="new-password">'
            : ""}
          <button class="ca-btn primary" type="submit">
            ${isRegister ? "ĐĂNG KÝ NGAY" : "ĐĂNG NHẬP"}
          </button>
          <button class="ca-btn" type="button" id="caSwitchAuth">
            ${isRegister ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
          </button>
          <button class="ca-btn" type="button" id="caCloseModal">Đóng</button>
        </form>
      </div>
    </div>
  `;

  $("#caAuthForm").addEventListener("submit", event => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");
    const email = String(form.get("email") || "").trim();
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (isRegister) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        showToast("Tên tài khoản: 3–20 ký tự, chỉ dùng chữ, số và _.");
        return;
      }

      if (!email || !email.includes("@")) {
        showToast("Vui lòng nhập Gmail hợp lệ.");
        return;
      }

      if (password.length < 4) {
        showToast("Mật khẩu phải có ít nhất 4 ký tự.");
        return;
      }

      if (password !== confirmPassword) {
        showToast("Mật khẩu nhập lại không khớp!");
        return;
      }

      if (users.some(user =>
        user.username.toLowerCase() === username.toLowerCase()
      )) {
        showToast("Tên tài khoản đã tồn tại!");
        return;
      }

      if (users.some(user =>
        user.email.toLowerCase() === email.toLowerCase()
      )) {
        showToast("Gmail này đã được đăng ký!");
        return;
      }

      currentUser = createUser(username, email, password);
      currentUser.inventoryPacks.push({
        id: `pack-${Date.now()}`,
        type: "basic",
        purchasedAt: Date.now()
      });

      saveCurrentUser();
      $("#caModalRoot").innerHTML = "";
      enterGame();
      showToast("Đăng ký thành công! Bạn nhận được 1 Basic Pack.");
      return;
    }

    const user = users.find(item =>
      item.username.toLowerCase() === username.toLowerCase()
    );

    if (!user || user.password !== password) {
      showToast("Tên tài khoản hoặc mật khẩu không đúng!");
      return;
    }

    currentUser = user;
    saveCurrentUser();
    $("#caModalRoot").innerHTML = "";
    enterGame();
    showToast("Đăng nhập thành công!");
  });

  $("#caSwitchAuth").addEventListener("click", () => {
    showAuthModal(isRegister ? "login" : "register");
  });

  $("#caCloseModal").addEventListener("click", () => {
    $("#caModalRoot").innerHTML = "";
  });
}

function enterGame() {
  $("#caWelcome").classList.add("ca-hidden");
  $("#caGame").classList.remove("ca-hidden");
  $("#caUsername").textContent = currentUser.username;
  $("#caAdminNav").classList.toggle("ca-hidden", !currentUser.isAdmin);
  updateCoins();
  navigateTo("home");
}

function logout() {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  $("#caGame").classList.add("ca-hidden");
  $("#caWelcome").classList.remove("ca-hidden");
  $("#caModalRoot").innerHTML = "";
  showToast("Bạn đã đăng xuất.");
}

// ==================== ĐIỀU HƯỚNG ====================

function navigateTo(page) {
  if (!currentUser) {
    showAuthModal("login");
    return;
  }

  const root = $("#caPage");

  if (page === "home") renderHome(root);
  else if (page === "album") renderAlbum(root);
  else if (page === "shop") renderShop(root);
  else if (page === "bag") renderBag(root);
  else if (page === "admin") renderAdmin(root);
  else renderHome(root);
}

// ==================== TRANG CHỦ ====================

function renderHome(root) {
  root.innerHTML = `
    <section class="ca-panel">
      <h1 class="ca-title">Chào mừng đến CARD ARENA!</h1>
      <p class="ca-muted">
        Mở pack, sưu tầm nhân vật, khám phá Skill và thẻ Tình huống.
      </p>
      <div class="ca-grid">
        <div class="ca-card">
          <div class="ca-card-art">🎁</div>
          <h3>Rương khởi đầu</h3>
          <p class="ca-muted">Nhận một Basic Pack miễn phí.</p>
          <button class="ca-btn gold" id="caOpenChest">MỞ RƯƠNG</button>
        </div>
        <div class="ca-card">
          <div class="ca-card-art">🃏</div>
          <h3>Album thẻ bài</h3>
          <p class="ca-muted">Xem những thẻ bạn đã sở hữu.</p>
          <button class="ca-btn primary" id="caGoAlbum">MỞ ALBUM</button>
        </div>
        <div class="ca-card">
          <div class="ca-card-art">🛍️</div>
          <h3>Cửa hàng</h3>
          <p class="ca-muted">Dùng xu để mua thêm pack.</p>
          <button class="ca-btn" id="caGoShop">ĐẾN SHOP</button>
        </div>
      </div>
    </section>
  `;

  $("#caOpenChest").addEventListener("click", openChest);
  $("#caGoAlbum").addEventListener("click", () => navigateTo("album"));
  $("#caGoShop").addEventListener("click", () => navigateTo("shop"));
}

// ==================== RƯƠNG ====================

function openChest() {
  if (currentUser.starterClaimed) {
    showToast("Bạn đã mở rương khởi đầu rồi!");
    return;
  }

  currentUser.starterClaimed = true;
  currentUser.inventoryPacks.push({
    id: `starter-${Date.now()}`,
    type: "basic",
    purchasedAt: Date.now()
  });

  saveCurrentUser();
  showToast("Rương đã mở! Bạn nhận được 1 Basic Pack.");

  const root = $("#caPage");
  root.innerHTML = `
    <section class="ca-panel ca-center">
      <h1 class="ca-title">🎉 RƯƠNG ĐÃ MỞ!</h1>
      <p class="ca-muted">Bạn nhận được một Basic Pack.</p>
      <div class="ca-pack">🎴<br>BASIC PACK</div>
      <div>
        <button class="ca-btn primary" id="caOpenStarterPack">MỞ PACK</button>
        <button class="ca-btn" id="caBackHome">Về trang chủ</button>
      </div>
    </section>
  `;

  $("#caOpenStarterPack").addEventListener("click", () => navigateTo("bag"));
  $("#caBackHome").addEventListener("click", () => navigateTo("home"));
}

// ==================== SHOP ====================

function renderShop(root) {
  root.innerHTML = `
    <section class="ca-panel">
      <h1 class="ca-title">SHOP PACK</h1>
      <p class="ca-muted">Chọn pack bạn muốn mua.</p>
      <div class="ca-grid">
        <div class="ca-card">
          <div class="ca-pack">🎴<br>BASIC</div>
          <h3>Basic Pack</h3>
          <p class="ca-muted">Giá: ${PACKS.basic.price} xu</p>
          <button class="ca-btn primary" id="caBuyBasic">MUA BASIC PACK</button>
        </div>
        <div class="ca-card">
          <div class="ca-pack premium">✨<br>PREMIUM</div>
          <h3>Premium Pack</h3>
          <p class="ca-muted">Giá: ${PACKS.premium.price} xu</p>
          <button class="ca-btn gold" id="caBuyPremium">MUA PREMIUM PACK</button>
        </div>
      </div>
    </section>
  `;

  $("#caBuyBasic").addEventListener("click", () => buyPack("basic"));
  $("#caBuyPremium").addEventListener("click", () => buyPack("premium"));
}

function buyPack(packType) {
  const packInfo = PACKS[packType];
  if (!packInfo || !currentUser) return;

  if (!currentUser.isAdmin && currentUser.coins < packInfo.price) {
    showToast("Bạn không đủ xu để mua pack!");
    return;
  }

  if (!currentUser.isAdmin) {
    currentUser.coins -= packInfo.price;
  }

  currentUser.inventoryPacks.push({
    id: `pack-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: packType,
    purchasedAt: Date.now()
  });

  saveCurrentUser();
  updateCoins();
  showToast(currentUser.isAdmin
    ? "ADMIN đã nhận pack miễn phí!"
    : `Mua ${packInfo.name} thành công!`);

  navigateTo("bag");
}

// ==================== TÚI ĐỒ ====================

function renderBag(root) {
  const packs = currentUser.inventoryPacks || [];

  root.innerHTML = `
    <section class="ca-panel">
      <h1 class="ca-title">TÚI ĐỒ CỦA BẠN</h1>
      <p class="ca-muted">Số pack hiện có: ${packs.length}</p>
      <div id="caBagGrid" class="ca-grid"></div>
    </section>
  `;

  const grid = $("#caBagGrid");

  if (packs.length === 0) {
    grid.innerHTML = '<p class="ca-muted">Túi đồ đang trống. Hãy đến Shop mua pack nhé!</p>';
    return;
  }

  packs.forEach((pack, index) => {
    const info = PACKS[pack.type] || PACKS.basic;
    const item = document.createElement("div");
    item.className = "ca-card";

    item.innerHTML = `
      <div class="ca-pack ${pack.type === "premium" ? "premium" : ""}">
        🎴<br>${escapeHTML(info.name)}
      </div>
      <h3>${escapeHTML(info.name)}</h3>
      <button class="ca-btn primary" data-open-pack="${escapeHTML(pack.id)}">
        XÉ PACK
      </button>
    `;

    grid.appendChild(item);
  });

  grid.querySelectorAll("[data-open-pack]").forEach(button => {
    button.addEventListener("click", () => {
      openPack(button.getAttribute("data-open-pack"));
    });
  });
}

// ==================== MỞ PACK ====================

function chooseCardFromPack(packType) {
  // Tỉ lệ Legendary thấp; Premium có cơ hội cao hơn.
  const random = Math.random();

  let rarity;

  if (packType === "premium") {
    if (random < 0.15) rarity = "LEGENDARY";
    else if (random < 0.45) rarity = "EPIC";
    else if (random < 0.80) rarity = "RARE";
    else rarity = "COMMON";
  } else {
    if (random < 0.05) rarity = "LEGENDARY";
    else if (random < 0.20) rarity = "EPIC";
    else if (random < 0.60) rarity = "RARE";
    else rarity = "COMMON";
  }

  let candidates = CARD_DATA.filter(card =>
    !card.locked && card.rarity === rarity
  );

  // Nếu độ hiếm đã chọn chưa có thẻ thật, tìm độ hiếm khác.
  if (candidates.length === 0) {
    candidates = CARD_DATA.filter(card => !card.locked);
  }

  if (candidates.length === 0) {
    return null;
  }

  // Bảo đảm thẻ Vào Tù có cơ hội xuất hiện trong pack.
  // Tỉ lệ 5% trong Basic, 10% trong Premium.
  const specialChance = packType === "premium" ? 0.10 : 0.05;
  const specialCard = CARD_DATA.find(card => card.id === "vao-tu");

  if (specialCard && Math.random() < specialChance) {
    return specialCard;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function openPack(packId) {
  const packIndex = currentUser.inventoryPacks.findIndex(
    pack => pack.id === packId
  );

  if (packIndex === -1) {
    showToast("Không tìm thấy pack này!");
    return;
  }

  const pack = currentUser.inventoryPacks[packIndex];
  const card = chooseCardFromPack(pack.type);

  if (!card) {
    showToast("Chưa có thẻ bài để mở. Hãy thêm thẻ vào CARD_DATA.");
    return;
  }

  // Trừ pack khỏi túi đồ sau khi tìm được thẻ.
  currentUser.inventoryPacks.splice(packIndex, 1);

  const isDuplicate = currentUser.ownedCards.includes(card.id);

  if (!isDuplicate) {
    currentUser.ownedCards.push(card.id);
  } else if (!currentUser.isAdmin) {
    currentUser.coins += pack.type === "premium" ? 5 : 2;
  }

  saveCurrentUser();
  updateCoins();

  showPackReveal(card, isDuplicate, pack.type);
}

function showPackReveal(card, isDuplicate, packType) {
  revealedCard = card;

  const imageHTML = card.image
    ? `<img src="${escapeHTML(card.image)}" alt="${escapeHTML(card.name)}"
         onerror="this.style.display='none';this.parentElement.innerHTML='<span>🃏</span>'">`
    : "<span style='font-size:65px'>🃏</span>";

  $("#caModalRoot").innerHTML = `
    <div class="ca-modal">
      <div class="ca-modal-box ca-center">
        <h2 id="caRevealTitle">PACK ĐANG ĐƯỢC XÉ...</h2>
        <div id="caPackAnimation" class="ca-pack ${packType === "premium" ? "premium" : ""}">
          🎴<br>${escapeHTML(PACKS[packType].name)}
        </div>
        <div id="caRevealResult" class="ca-hidden">
          <div class="ca-card ${card.rarity === "LEGENDARY" ? "legendary" : ""}">
            <div class="ca-card-art">${imageHTML}</div>
            <div class="ca-card-name">${escapeHTML(card.name)}</div>
            <div class="ca-rarity">${escapeHTML(rarityLabel(card.rarity))}</div>
            <p class="ca-muted">${escapeHTML(typeLabel(card.type))}</p>
          </div>
          <p>${isDuplicate
            ? "Bạn đã sở hữu thẻ này! Bạn nhận được xu bù."
            : "🎉 Chúc mừng! Thẻ đã được thêm vào Album."}</p>
          <button class="ca-btn primary" id="caRevealAlbum">XEM ALBUM</button>
          <button class="ca-btn" id="caRevealClose">ĐÓNG</button>
        </div>
      </div>
    </div>
  `;

  const packElement = $("#caPackAnimation");

  setTimeout(() => {
    packElement.classList.add("tearing");
  }, 250);

  setTimeout(() => {
    $("#caRevealTitle").textContent = "🎉 BẠN NHẬN ĐƯỢC THẺ!";
    packElement.classList.add("ca-hidden");
    $("#caRevealResult").classList.remove("ca-hidden");

    $("#caRevealAlbum").addEventListener("click", () => {
      $("#caModalRoot").innerHTML = "";
      navigateTo("album");
    });

    $("#caRevealClose").addEventListener("click", () => {
      $("#caModalRoot").innerHTML = "";
      navigateTo("bag");
    });
  }, 950);
}

// ==================== ALBUM ====================

function renderAlbum(root) {
  root.innerHTML = `
    <section class="ca-panel">
      <h1 class="ca-title">ALBUM THẺ BÀI</h1>
      <p class="ca-muted">
        Đã sở hữu ${ownedCardIds().length}/${CARD_DATA.length} thẻ.
        Thẻ chưa sở hữu sẽ hiện ô đen với dấu hỏi.
      </p>
      <div class="ca-tabs">
        <button class="ca-btn" data-filter="ALL">Tất cả</button>
        <button class="ca-btn" data-filter="CHARACTER">Nhân vật</button>
        <button class="ca-btn" data-filter="SKILL">Skill</button>
        <button class="ca-btn" data-filter="SITUATION">Tình huống</button>
      </div>
      <div class="ca-grid" id="caAlbumGrid"></div>
    </section>
  `;

  root.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      renderAlbumCards();
    });
  });

  renderAlbumCards();
}

function renderAlbumCards() {
  const grid = $("#caAlbumGrid");
  if (!grid) return;

  const cards = CARD_DATA.filter(card =>
    currentFilter === "ALL" || card.type === currentFilter
  );

  grid.innerHTML = "";

  cards.forEach(card => {
    const owned = isOwned(card.id);
    const item = document.createElement("div");
    item.className = `ca-card ${owned && card.rarity === "LEGENDARY" ? "legendary" : ""}`;

    if (!owned) {
      item.innerHTML = `
        <div class="ca-locked">?</div>
        <div class="ca-card-name">Chưa sở hữu</div>
        <div class="ca-rarity">${escapeHTML(typeLabel(card.type))}</div>
      `;
    } else {
      const art = card.image
        ? `<img src="${escapeHTML(card.image)}" alt="${escapeHTML(card.name)}"
             onerror="this.style.display='none';this.parentElement.innerHTML='<span style=&quot;font-size:55px&quot;>🃏</span>'">`
        : '<span style="font-size:55px">🃏</span>';

      item.innerHTML = `
        <div class="ca-card-art">${art}</div>
        <div class="ca-card-name">${escapeHTML(card.name)}</div>
        <div class="ca-rarity">${escapeHTML(rarityLabel(card.rarity))}</div>
        <div class="ca-muted">${escapeHTML(typeLabel(card.type))}</div>
        <button class="ca-btn" data-detail="${escapeHTML(card.id)}">Chi tiết</button>
      `;
    }

    grid.appendChild(item);
  });

  grid.querySelectorAll("[data-detail]").forEach(button => {
    button.addEventListener("click", () => {
      showCardDetails(button.dataset.detail);
    });
  });
}

function showCardDetails(cardId) {
  const card = CARD_DATA.find(item => item.id === cardId);
  if (!card || !isOwned(cardId)) return;

  $("#caModalRoot").innerHTML = `
    <div class="ca-modal">
      <div class="ca-modal-box ca-center">
        <h2>${escapeHTML(card.name)}</h2>
        <p class="ca-rarity">${escapeHTML(rarityLabel(card.rarity))}</p>
        <p>${escapeHTML(typeLabel(card.type))}</p>
        <p class="ca-muted">${escapeHTML(card.description || "Chưa có mô tả.")}</p>
        <button class="ca-btn primary" id="caCloseDetail">Đóng</button>
      </div>
    </div>
  `;

  $("#caCloseDetail").addEventListener("click", () => {
    $("#caModalRoot").innerHTML = "";
  });
}

// ==================== ADMIN ====================

function renderAdmin(root) {
  if (!currentUser?.isAdmin) {
    root.innerHTML = `
      <section class="ca-panel">
        <h1 class="ca-title">KHU VỰC ADMIN</h1>
        <p class="ca-muted">Nhập mã admin để mở quyền quản trị.</p>
        <form id="caAdminForm" class="ca-form">
          <input class="ca-input" id="caAdminCode" type="password"
            placeholder="Mã admin" required>
          <button class="ca-btn primary" type="submit">XÁC NHẬN</button>
        </form>
      </section>
    `;

    $("#caAdminForm").addEventListener("submit", event => {
      event.preventDefault();

      if ($("#caAdminCode").value !== ADMIN_CODE) {
        showToast("Mã admin không đúng!");
        return;
      }

      currentUser.isAdmin = true;
      saveCurrentUser();
      $("#caAdminNav").classList.remove("ca-hidden");
      updateCoins();
      showToast("Đã bật quyền ADMIN.");
      renderAdmin($("#caPage"));
    });

    return;
  }

  root.innerHTML = `
    <section class="ca-panel">
      <h1 class="ca-title">⚡ ADMIN PANEL</h1>
      <p class="ca-muted">
        Admin có xu vô hạn và có thể nhận pack miễn phí.
      </p>
      <div class="ca-tabs">
        <button class="ca-btn primary" id="caAdminBasic">Nhận Basic Pack miễn phí</button>
        <button class="ca-btn gold" id="caAdminPremium">Nhận Premium Pack miễn phí</button>
        <button class="ca-btn" id="caAdminAddCoins">+1000 xu cho tài khoản thường</button>
      </div>
      <h3>Danh sách tài khoản</h3>
      <div id="caUserList"></div>
    </section>
  `;

  $("#caAdminBasic").addEventListener("click", () => buyPack("basic"));
  $("#caAdminPremium").addEventListener("click", () => buyPack("premium"));

  $("#caAdminAddCoins").addEventListener("click", () => {
    const target = prompt("Nhập tên tài khoản cần cộng 1000 xu:");
    if (!target) return;

    const user = users.find(item =>
      item.username.toLowerCase() === target.trim().toLowerCase()
    );

    if (!user) {
      showToast("Không tìm thấy tài khoản.");
      return;
    }

    if (user.isAdmin) {
      showToast("Tài khoản này là admin.");
      return;
    }

    user.coins += 1000;
    saveUsers();
    showToast(`Đã cộng 1000 xu cho ${user.username}.`);
    renderAdmin($("#caPage"));
  });

  const userList = $("#caUserList");
  userList.innerHTML = users.map(user => `
    <div class="ca-card" style="min-height:0;margin:8px 0;text-align:left">
      <b>${escapeHTML(user.username)}</b>
      <div class="ca-muted">${escapeHTML(user.email || "")}</div>
      <div>Xu: ${user.isAdmin ? "∞" : Number(user.coins || 0)}</div>
      <div>Thẻ đã sở hữu: ${(user.ownedCards || []).length}</div>
    </div>
  `).join("");
}

// ==================== GẮN SỰ KIỆN ====================

function bindMainEvents() {
  $("#caTapStart").addEventListener("click", () => {
    showAuthModal("login");
  });

  $("#caShowLogin").addEventListener("click", () => {
    showAuthModal("login");
  });

  $("#caShowRegister").addEventListener("click", () => {
    showAuthModal("register");
  });

  $("#caLogout").addEventListener("click", logout);

  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      navigateTo(button.dataset.page);
    });
  });
}

// ==================== CHẠY GAME ====================

function initCardArena() {
  addGameStyles();
  buildGameShell();
  bindMainEvents();

  // Đăng nhập lại phiên gần nhất trên cùng trình duyệt.
  const savedUsername = localStorage.getItem(SESSION_KEY);

  if (savedUsername) {
    const user = users.find(item => item.username === savedUsername);

    if (user) {
      currentUser = user;
      enterGame();
      return;
    }
  }
}

// Chạy sau khi HTML được tải xong.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCardArena);
} else {
  initCardArena();
}
