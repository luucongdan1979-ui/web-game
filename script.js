
"use strict";

/* ==============================
   CARD ARENA - GAME LOGIC
   ============================== */

const USERS_KEY = "cardArenaUsersV1";
const SESSION_KEY = "cardArenaSessionV1";
const ADMIN_CODE = "171113";

const CARDS = [
  {
    id: "kha-banh",
    name: "Khá Bảnh",
    image: "./khá bảnh nv.png",
    rarity: "RARE",
    type: "CHARACTER"
  },
  {
    id: "jack",
    name: "Jack",
    image: "./jack nv.png",
    rarity: "LEGENDARY",
    type: "CHARACTER"
  },
  {
    id: "vao-tu",
    name: "Vào Tù",
    image: "./Vào Tù Th.png",
    rarity: "LEGENDARY",
    type: "SITUATION"
  }
];

const PACKS = {
  basic: {
    name: "Basic Pack",
    price: 10,
    rareChance: 70
  },
  premium: {
    name: "Premium Pack",
    price: 20,
    rareChance: 40
  },
  starter: {
    name: "Tân Thủ Pack",
    price: 0,
    rareChance: 60
  }
};

let currentUser = null;
let isAdmin = false;
let authMode = "login";
let albumFilter = "ALL";
let toastTimeout = null;
let currentPack = null;

const $ = (id) => document.getElementById(id);

function readUsers() {
  try {
    const data = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveCurrentUser() {
  if (!currentUser || isAdmin) return;

  const users = readUsers();
  const index = users.findIndex(
    user => user.username.toLowerCase() === currentUser.username.toLowerCase()
  );

  if (index !== -1) {
    users[index] = currentUser;
    saveUsers(users);
  }
}

function setSession(value) {
  if (value) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function showModal(id) {
  $(id)?.classList.remove("hidden");
}

function hideModal(id) {
  $(id)?.classList.add("hidden");
}

/* ==============================
   ĐĂNG NHẬP / ĐĂNG KÝ
   ============================== */

function setAuthMode(mode) {
  authMode = mode;

  const registering = mode === "register";
  $("authTitle").textContent = registering ? "ĐĂNG KÝ" : "ĐĂNG NHẬP";
  $("authDescription").textContent = registering
    ? "Tạo tài khoản CARD ARENA của bạn"
    : "Chào mừng trở lại CARD ARENA";

  $("submitAuth").textContent = registering ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP";
  $("emailGroup").classList.toggle("hidden", !registering);
  $("confirmGroup").classList.toggle("hidden", !registering);

  $("email").required = registering;
  $("confirmPassword").required = registering;

  $("switchDescription").textContent = registering
    ? "Đã có tài khoản?"
    : "Chưa có tài khoản?";

  $("switchAuthBtn").textContent = registering
    ? "Đăng nhập ngay"
    : "Đăng ký ngay";

  showModal("authModal");
}

function handleAuth(event) {
  event.preventDefault();

  const username = $("username").value.trim();
  const password = $("password").value;
  const email = $("email").value.trim();
  const confirmPassword = $("confirmPassword").value;
  const users = readUsers();

  if (username.length < 3) {
    showToast("Tên tài khoản phải có ít nhất 3 ký tự.");
    return;
  }

  if (password.length < 4) {
    showToast("Mật khẩu phải có ít nhất 4 ký tự.");
    return;
  }

  if (authMode === "register") {
    if (!/^[^\s@]+@gmail\.com$/i.test(email)) {
      showToast("Vui lòng nhập địa chỉ Gmail hợp lệ.");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Hai mật khẩu không khớp.");
      return;
    }

    if (users.some(user =>
      user.username.toLowerCase() === username.toLowerCase()
    )) {
      showToast("Tên tài khoản đã tồn tại.");
      return;
    }

    if (users.some(user =>
      user.email.toLowerCase() === email.toLowerCase()
    )) {
      showToast("Gmail này đã được sử dụng.");
      return;
    }

    currentUser = {
      username,
      email,
      password,
      coins: 17,
      ownedCards: [],
      packs: [],
      starterClaimed: false
    };

    users.push(currentUser);
    saveUsers(users);
    setSession({ username: currentUser.username });

    hideModal("authModal");
    enterMainScreen();
    showToast("Đăng ký thành công! Bạn nhận được 17 COIN.");
    return;
  }

  const foundUser = users.find(user =>
    user.username.toLowerCase() === username.toLowerCase() &&
    user.password === password
  );

  if (!foundUser) {
    showToast("Sai tên tài khoản hoặc mật khẩu.");
    return;
  }

  currentUser = foundUser;
  setSession({ username: currentUser.username });
  hideModal("authModal");
  enterMainScreen();
  showToast("Đăng nhập thành công!");
}

function loginAsAdmin() {
  isAdmin = true;
  currentUser = {
    username: "ADMIN",
    coins: Infinity,
    ownedCards: [],
    packs: [],
    starterClaimed: true
  };

  setSession({ admin: true });
  hideModal("adminModal");
  enterMainScreen();
  showToast("Đã vào chế độ Admin.");
}

function logout() {
  currentUser = null;
  isAdmin = false;
  currentPack = null;
  setSession(null);

  $("gameScreen").classList.add("hidden");
  $("welcomeScreen").classList.remove("hidden");
  $("overlayRoot").innerHTML = "";
  showToast("Đã đăng xuất.");
}

/* ==============================
   MÀN HÌNH CHÍNH
   ============================== */

function enterMainScreen() {
  $("welcomeScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  $("adminBadge").classList.toggle("hidden", !isAdmin);

  if (isAdmin) {
    $("adminPage").classList.remove("hidden");
    showPage("admin");
  } else {
    $("adminPage").classList.add("hidden");
    showPage("home");
  }

  updateUI();

  if (!isAdmin && !currentUser.starterClaimed) {
    setTimeout(openStarterChest, 450);
  }
}

function showPage(pageName) {
  if (!currentUser) return;

  const pageNames = ["home", "album", "shop", "bag", "admin"];

  if (pageName === "admin" && !isAdmin) return;

  pageNames.forEach(name => {
    const page = $(name + "Page");
    if (page) page.classList.toggle("hidden", name !== pageName);
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });

  if (pageName === "album") renderAlbum();
  if (pageName === "bag") renderBag();
  if (pageName === "home") renderHome();
  if (pageName === "admin") renderAdmin();
}

function updateUI() {
  if (!currentUser) return;

  $("coinAmount").textContent = isAdmin ? "∞" : currentUser.coins;
  $("statsCoins").textContent = isAdmin ? "∞" : currentUser.coins;
  $("cardCount").textContent = isAdmin ? "∞" : currentUser.ownedCards.length;
  $("starterStatus").textContent = isAdmin
    ? "Admin"
    : currentUser.starterClaimed ? "Đã mở" : "Chưa mở";

  $("starterPreview").classList.toggle(
    "hidden",
    isAdmin || currentUser.starterClaimed
  );

  renderHome();
  renderAdmin();
}

function renderHome() {
  if (!currentUser) return;

  const recent = $("recentCards");
  if (!recent) return;

  if (isAdmin) {
    recent.innerHTML = `<div class="empty-message">Chế độ Admin đang bật.</div>`;
    return;
  }

  const cards = currentUser.ownedCards
    .map(id => CARDS.find(card => card.id === id))
    .filter(Boolean)
    .slice(-4)
    .reverse();

  recent.innerHTML = cards.length
    ? cards.map(card => cardTile(card)).join("")
    : `<div class="empty-message">Bạn chưa có thẻ nào. Hãy mở rương tân thủ nhé!</div>`;
}

function renderAdmin() {
  if (!$("adminUserCount")) return;
  $("adminUserCount").textContent = readUsers().length;
  $("adminCardCount").textContent = CARDS.length;
}

/* ==============================
   BỘ SƯU TẬP
   ============================== */

function cardTile(card) {
  const rarityClass = card.rarity === "RARE" ? "rarity-rare" : "rarity-legendary";
  const rarityName = card.rarity === "RARE" ? "RARE" : "LEGENDARY";

  return `
    <article class="card-tile">
      <img src="${card.image}" alt="${escapeHTML(card.name)}"
        onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden')">
      <div class="card-placeholder hidden">?</div>
      <h3>${escapeHTML(card.name)}</h3>
      <p class="card-rarity ${rarityClass}">${rarityName}</p>
    </article>
  `;
}

function emptyCardTile() {
  return `
    <article class="card-tile empty">
      <div class="card-placeholder">?</div>
      <h3>Chưa có thẻ</h3>
      <p class="card-rarity">???</p>
    </article>
  `;
}

function renderAlbum() {
  if (!currentUser || isAdmin) return;

  const owned = currentUser.ownedCards
    .map(id => CARDS.find(card => card.id === id))
    .filter(Boolean);

  const filtered = albumFilter === "ALL"
    ? owned
    : owned.filter(card => card.type === albumFilter);

  const slots = albumFilter === "ALL" ? 9 : 3;
  const html = filtered.map(card => cardTile(card));

  while (html.length < slots) html.push(emptyCardTile());

  $("albumGrid").innerHTML = html.join("");
  $("albumCount").textContent = `${filtered.length} thẻ trong mục này`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

/* ==============================
   RƯƠNG TÂN THỦ
   ============================== */

function openStarterChest() {
  if (!currentUser || isAdmin || currentUser.starterClaimed) return;

  $("overlayRoot").innerHTML = `
    <div class="fx-overlay" id="starterOverlay">
      <div class="fx-panel">
        <button class="close-btn fx-close" id="closeStarterFx" aria-label="Đóng">✕</button>
        <p class="eyebrow">YOUR FIRST REWARD</p>
        <h2>RƯƠNG TÂN THỦ</h2>
        <p>Chạm vào rương để nhận Tân Thủ Pack miễn phí!</p>
        <div class="gift-stage">
          <div id="giftBox" class="gift-box" role="button" tabindex="0" aria-label="Mở rương">🎁</div>
        </div>
        <button id="openGiftBtn" class="btn btn-primary full-width">MỞ RƯƠNG ✦</button>
      </div>
    </div>
  `;

  $("openGiftBtn").addEventListener("click", claimStarterPack);
  $("giftBox").addEventListener("click", claimStarterPack);
  $("giftBox").addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") claimStarterPack();
  });

  $("closeStarterFx").addEventListener("click", () => {
    $("overlayRoot").innerHTML = "";
  });
}

function claimStarterPack() {
  if (!currentUser || isAdmin || currentUser.starterClaimed) return;

  currentUser.starterClaimed = true;
  currentUser.packs.push({
    id: createId(),
    type: "starter",
    name: "Tân Thủ Pack"
  });

  saveCurrentUser();
  updateUI();

  const gift = $("giftBox");
  if (gift) gift.classList.add("opening");

  setTimeout(() => {
    showPackOpening(currentUser.packs[currentUser.packs.length - 1]);
  }, 650);
}

/* ==============================
   SHOP VÀ BALO
   ============================== */

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function buyPack(type) {
  if (!currentUser) return;

  const packInfo = PACKS[type];
  if (!packInfo || type === "starter") return;

  if (!isAdmin && currentUser.coins < packInfo.price) {
    showToast("Bạn không đủ COIN để mua pack.");
    return;
  }

  if (!isAdmin) {
    currentUser.coins -= packInfo.price;
  }

  const pack = {
    id: createId(),
    type,
    name: packInfo.name
  };

  currentUser.packs.push(pack);
  saveCurrentUser();
  updateUI();
  showToast(`${packInfo.name} đã được thêm vào Balo.`);
}

function renderBag() {
  if (!currentUser || isAdmin) return;

  const bag = $("bagGrid");

  if (!currentUser.packs.length) {
    bag.innerHTML = `<div class="empty-message">Balo đang trống. Ghé Shop để mua pack nhé!</div>`;
    return;
  }

  bag.innerHTML = currentUser.packs.map(pack => {
    const premium = pack.type === "premium";
    const artClass = premium ? "premium-art" : "basic-art";
    const label = pack.type === "starter" ? "TÂN THỦ" :
      premium ? "PREMIUM" : "BASIC";

    return `
      <article class="bag-item">
        <div class="pack-art ${artClass}" role="button" tabindex="0"
          data-open-pack="${pack.id}" aria-label="Mở ${escapeHTML(pack.name)}">
          <span>CA</span><b>${label}</b><small>CARD PACK</small>
        </div>
        <h3>${escapeHTML(pack.name)}</h3>
        <button class="btn btn-primary full-width"
          data-open-pack="${pack.id}">MỞ PACK</button>
      </article>
    `;
  }).join("");
}

function showPackOpening(pack) {
  if (!pack) return;

  currentPack = pack;

  const isStarter = pack.type === "starter";
  const isPremium = pack.type === "premium";
  const artClass = isPremium ? "premium" : "";

  $("overlayRoot").innerHTML = `
    <div class="fx-overlay" id="packOverlay">
      <div class="fx-panel">
        <button class="close-btn fx-close" id="closePackFx" aria-label="Đóng">✕</button>
        <p class="eyebrow">${isStarter ? "STARTER REWARD" : "PACK OPENING"}</p>
        <h2>${escapeHTML(pack.name).toUpperCase()}</h2>
        <p>Nhấn vào gói bài để xé pack và khám phá lá bài bên trong.</p>
        <div id="largePack" class="pack-large ${artClass}" role="button"
          tabindex="0" aria-label="Xé pack">
          <span>CA</span>
          <b>${isStarter ? "TÂN THỦ" : isPremium ? "PREMIUM" : "BASIC"}</b>
          <small>CARD PACK</small>
        </div>
        <button id="tearPackBtn" class="btn btn-primary full-width">✂ XÉ PACK</button>
      </div>
    </div>
  `;

  $("tearPackBtn").addEventListener("click", tearPack);
  $("largePack").addEventListener("click", tearPack);
  $("largePack").addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") tearPack();
  });

  $("closePackFx").addEventListener("click", () => {
    $("overlayRoot").innerHTML = "";
    currentPack = null;
    renderBag();
  });
}

function tearPack() {
  if (!currentPack) return;

  const pack = currentPack;
  currentPack = null;

  const packElement = $("largePack");
  if (!packElement) return;

  packElement.classList.add("tearing");
  $("tearPackBtn").disabled = true;

  setTimeout(() => {
    const index = currentUser.packs.findIndex(item => item.id === pack.id);
    if (index !== -1) {
      currentUser.packs.splice(index, 1);
      saveCurrentUser();
    }

    const card = randomCard(pack.type);
    if (!isAdmin && !currentUser.ownedCards.includes(card.id)) {
      currentUser.ownedCards.push(card.id);
    }

    saveCurrentUser();
    updateUI();
    renderAlbum();
    renderBag();
    showCardReveal(card, pack);
  }, 750);
}

/* ==============================
   TỈ LỆ NHẬN THẺ
   ============================== */

function randomCard(packType) {
  const rareChance = PACKS[packType]?.rareChance ?? 60;

  if (Math.random() * 100 < rareChance) {
    return CARDS.find(card => card.rarity === "RARE");
  }

  const legendaryCards = CARDS.filter(card => card.rarity === "LEGENDARY");
  return legendaryCards[Math.floor(Math.random() * legendaryCards.length)];
}

function showCardReveal(card, pack) {
  const rarityClass = card.rarity === "RARE" ? "rare" : "legendary";

  $("overlayRoot").innerHTML = `
    <div class="fx-overlay" id="revealOverlay">
      <div class="fx-panel">
        <p class="eyebrow">CARD DISCOVERED</p>
        <h2>CHÚC MỪNG!</h2>
        <p>Bạn đã mở thành công ${escapeHTML(pack.name)}.</p>
        <div class="reveal-card ${rarityClass}">
          <img src="${card.image}" alt="${escapeHTML(card.name)}"
            onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden')">
          <div class="card-placeholder hidden">?</div>
        </div>
        <div class="reveal-name">${escapeHTML(card.name)}</div>
        <div class="reveal-rarity ${card.rarity === "RARE" ? "rarity-rare" : "rarity-legendary"}">
          ${card.rarity}
        </div>
        <p>${isAdmin ? "Chế độ Admin: thẻ xem thử, không lưu vào tài khoản." : "Thẻ đã được thêm vào Bộ sưu tập nếu bạn chưa sở hữu."}</p>
        <button id="finishRevealBtn" class="btn btn-primary full-width">TIẾP TỤC</button>
      </div>
    </div>
  `;

  $("finishRevealBtn").addEventListener("click", () => {
    $("overlayRoot").innerHTML = "";
    updateUI();
    renderAlbum();
    renderBag();
    showPage("home");
    showToast(`Bạn nhận được thẻ ${card.name}!`);
  });
}

/* ==============================
   SỰ KIỆN
   ============================== */

function init() {
  $("loginBtn").addEventListener("click", () => setAuthMode("login"));
  $("registerBtn").addEventListener("click", () => setAuthMode("register"));
  $("tapStartBtn").addEventListener("click", () => setAuthMode("login"));

  $("switchAuthBtn").addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "register" : "login");
  });

  $("closeAuthBtn").addEventListener("click", () => hideModal("authModal"));
  $("authForm").addEventListener("submit", handleAuth);

  $("adminBtn").addEventListener("click", () => {
    $("adminCode").value = "";
    showModal("adminModal");
  });

  $("closeAdminBtn").addEventListener("click", () => hideModal("adminModal"));

  $("adminForm").addEventListener("submit", event => {
    event.preventDefault();

    if ($("adminCode").value === ADMIN_CODE) {
      loginAsAdmin();
    } else {
      showToast("Mã Admin không chính xác.");
    }
  });

  $("logoutBtn").addEventListener("click", logout);

  $("adminBackBtn").addEventListener("click", () => showPage("home"));

  $("goStarterBtn").addEventListener("click", openStarterChest);

  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.page));
  });

  document.querySelectorAll("[data-go-page]").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.goPage));
  });

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      albumFilter = button.dataset.filter;

      document.querySelectorAll("[data-filter]").forEach(filterButton => {
        filterButton.classList.toggle("active", filterButton === button);
      });

      renderAlbum();
    });
  });

  document.querySelectorAll(".buy-pack").forEach(button => {
    button.addEventListener("click", () => buyPack(button.dataset.pack));
  });

  document.addEventListener("click", event => {
    const packButton = event.target.closest("[data-open-pack]");
    if (!packButton || !currentUser || isAdmin) return;

    const pack = currentUser.packs.find(item =>
      item.id === packButton.dataset.openPack
    );

    if (pack) showPackOpening(pack);
  });

  const session = getSession();

  if (session?.admin) {
    loginAsAdmin();
    return;
  }

  if (session?.username) {
    const user = readUsers().find(item =>
      item.username.toLowerCase() === session.username.toLowerCase()
    );

    if (user) {
      currentUser = user;
      enterMainScreen();
    } else {
      setSession(null);
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
