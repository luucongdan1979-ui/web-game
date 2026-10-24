
"use strict";

const STORAGE_KEY = "animeCardArenaUsersV2";
const SESSION_KEY = "animeCardArenaCurrentUserV2";

const CARD_IMAGE =
  "https://raw.githubusercontent.com/luucongdan1979-ui/web-game/main/kh%C3%A1%20b%E1%BA%A3nh%20nv.png";

let currentUser = null;
let busy = false;

const $ = (id) => document.getElementById(id);

const welcomeScreen = $("welcomeScreen");
const gameScreen = $("gameScreen");
const gameTaskbar = $("gameTaskbar");
const modal = $("modal");
const modalContent = $("modalContent");

function getUsers() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return data && typeof data === "object" && !Array.isArray(data)
      ? data : {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return true;
  } catch {
    showToast("Không lưu được dữ liệu trình duyệt.");
    return false;
  }
}

function savePlayer() {
  if (!currentUser) return false;

  const users = getUsers();
  users[currentUser.username] = currentUser;

  if (!saveUsers(users)) return false;

  try {
    localStorage.setItem(SESSION_KEY, currentUser.username);
  } catch {}

  return true;
}

function normalizeUser(user) {
  if (!user || typeof user !== "object") return null;

  if (!Array.isArray(user.cards)) user.cards = [];
  if (typeof user.chestOpened !== "boolean") user.chestOpened = false;
  if (typeof user.packClaimed !== "boolean") user.packClaimed = false;
  if (typeof user.pendingPack !== "boolean") user.pendingPack = false;
  if (!Number.isFinite(user.packsOpened)) user.packsOpened = 0;

  if (user.chestOpened && !user.packClaimed) {
    user.pendingPack = true;
  }

  if (user.packClaimed) {
    user.pendingPack = false;
  }

  return user;
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2800);
}

function openModal(content) {
  modalContent.innerHTML = content;
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

$("modalClose").addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

/* ĐĂNG KÝ */
function openRegister() {
  openModal(`
    <h2 class="modal-title">Tạo tài khoản ✨</h2>
    <p class="modal-description">Đăng ký để bắt đầu hành trình thẻ bài.</p>

    <form id="registerForm">
      <label class="form-field">Tên tài khoản
        <input name="username" type="text" minlength="3" maxlength="24"
          autocomplete="username" required>
      </label>

      <label class="form-field">Gmail
        <input name="email" type="email" maxlength="100"
          autocomplete="email" required>
      </label>

      <label class="form-field">Mật khẩu
        <input name="password" type="password" minlength="4" maxlength="100"
          autocomplete="new-password" required>
      </label>

      <button class="primary-btn form-submit" type="submit">ĐĂNG KÝ</button>
    </form>

    <div class="auth-switch">
      Đã có tài khoản?
      <button class="text-button" id="switchToLogin" type="button">
        Đăng nhập
      </button>
    </div>
  `);

  $("switchToLogin").addEventListener("click", openLogin);

  $("registerForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");

    if (!/^[a-zA-Z0-9_-]{3,24}$/.test(username)) {
      showToast("Tên tài khoản cần 3–24 ký tự, dùng chữ, số, _ hoặc -.");
      return;
    }

    if (password.length < 4) {
      showToast("Mật khẩu cần ít nhất 4 ký tự.");
      return;
    }

    const users = getUsers();

    if (Object.keys(users).some(
      (key) => key.toLowerCase() === username.toLowerCase()
    )) {
      showToast("Tên tài khoản đã tồn tại.");
      return;
    }

    if (Object.values(users).some(
      (user) => String(user.email || "").toLowerCase() === email
    )) {
      showToast("Gmail này đã được đăng ký.");
      return;
    }

    const newUser = {
      username,
      email,
      password,
      cards: [],
      chestOpened: false,
      packClaimed: false,
      pendingPack: false,
      packsOpened: 0
    };

    users[username] = newUser;

    if (!saveUsers(users)) return;

    currentUser = newUser;

    try {
      localStorage.setItem(SESSION_KEY, username);
    } catch {}

    closeModal();
    showGame();
    showToast("Đăng ký thành công!");
  });
}

/* ĐĂNG NHẬP */
function openLogin() {
  openModal(`
    <h2 class="modal-title">Đăng nhập ⚡</h2>
    <p class="modal-description">Tiếp tục hành trình của bạn.</p>

    <form id="loginForm">
      <label class="form-field">Tên tài khoản
        <input name="username" type="text" autocomplete="username" required>
      </label>

      <label class="form-field">Mật khẩu
        <input name="password" type="password"
          autocomplete="current-password" required>
      </label>

      <button class="primary-btn form-submit" type="submit">
        ĐĂNG NHẬP
      </button>
    </form>

    <div class="auth-switch">
      Chưa có tài khoản?
      <button class="text-button" id="switchToRegister" type="button">
        Đăng ký
      </button>
    </div>
  `);

  $("switchToRegister").addEventListener("click", openRegister);

  $("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");
    const users = getUsers();

    const key = Object.keys(users).find(
      (name) => name.toLowerCase() === username.toLowerCase()
    );

    const user = key ? users[key] : null;

    if (!user || user.password !== password) {
      showToast("Tên tài khoản hoặc mật khẩu không đúng.");
      return;
    }

    currentUser = normalizeUser(user);
    savePlayer();
    closeModal();
    showGame();
    showToast("Đăng nhập thành công!");

    if (currentUser.pendingPack && !currentUser.packClaimed) {
      setTimeout(showPack, 250);
    }
  });
}

/* ĐĂNG XUẤT */
function logout() {
  currentUser = null;

  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}

  closeModal();
  welcomeScreen.classList.remove("hidden");
  gameScreen.classList.add("hidden");
  gameTaskbar.classList.add("hidden");

  $("playerName").textContent = "Khách";
  $("loginOpen").classList.remove("hidden");
  $("logoutBtn").classList.add("hidden");

  setActiveTab("homeTab");
}

function requireLogin() {
  if (currentUser) return true;
  openLogin();
  showToast("Bạn cần đăng nhập trước.");
  return false;
}

/* GIAO DIỆN GAME */
function showGame() {
  if (!currentUser) return;

  currentUser = normalizeUser(currentUser);

  welcomeScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameTaskbar.classList.remove("hidden");

  $("playerName").textContent = currentUser.username;
  $("loginOpen").classList.add("hidden");
  $("logoutBtn").classList.remove("hidden");

  updateStats();
  updateChestVisibility();
  setActiveTab("homeTab");
}

function setActiveTab(id) {
  document.querySelectorAll(".taskbar-icon").forEach((button) => {
    button.classList.toggle("active", button.id === id);
  });
}

function goHome() {
  if (!requireLogin()) return;
  closeModal();
  setActiveTab("homeTab");
  showGame();
}

/* TÚI THẺ */
function updateStats() {
  if (!currentUser) return;

  const count = currentUser.cards.length;
  $("bagCount").textContent = String(count);
  $("totalCards").textContent = String(count);
  $("totalPacks").textContent = String(currentUser.packsOpened || 0);
}

function openCardBag() {
  if (!requireLogin()) return;

  setActiveTab("openBagBtn");

  let html = "";

  if (currentUser.cards.length === 0) {
    html = `
      <div class="bag-empty">
        <div style="font-size:42px">🎒</div>
        <strong>Túi thẻ đang trống!</strong>
        <p>Mở rương khởi đầu để nhận lá bài đầu tiên.</p>
      </div>
    `;
  } else {
    html = currentUser.cards.map((card, index) => {
      const name = escapeHTML(card.name || "Thẻ bài");
      const rarity = escapeHTML(card.rarity || "NORMAL");
      const image = escapeHTML(card.image || "");

      return `
        <article class="card-tile">
          <div class="card-art">
            ${
              image
                ? `<img src="${image}" alt="${name}"
                    onerror="this.style.display='none';
                    this.nextElementSibling.classList.remove('hidden')">
                   <span class="card-art-fallback hidden">🃏</span>`
                : `<span class="card-art-fallback">🃏</span>`
            }
          </div>
          <div class="tile-info">
            <div class="tile-name">${name}</div>
            <span class="tile-rarity">${rarity}</span>
            <div style="margin-top:7px;color:#aaa9c5;font-size:10px">
              Thẻ #${index + 1}
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  openModal(`
    <div class="bag-header">
      <h2>🎒 Túi thẻ bài</h2>
      <p>Số thẻ đang sở hữu: ${currentUser.cards.length}</p>
    </div>
    <div class="bag-grid">${html}</div>
  `);
}

/* RƯƠNG KHỞI ĐẦU: CHỈ NHẬN MỘT LẦN */
function updateChestVisibility() {
  if (!currentUser) return;

  const claimed = currentUser.packClaimed;
  const pending = currentUser.pendingPack && !claimed;
  const opened = currentUser.chestOpened;

  $("chestBtn").classList.toggle("hidden", opened);
  $("resumePackBtn").classList.toggle("hidden", !pending);
  $("claimedMessage").classList.toggle("hidden", !claimed);
  $("chestDescription").classList.toggle("hidden", claimed || pending);
}

function openChest() {
  if (!requireLogin() || busy) return;

  if (currentUser.chestOpened || currentUser.packClaimed) {
    updateChestVisibility();
    showToast("Rương khởi đầu chỉ nhận được một lần!");
    return;
  }

  currentUser.chestOpened = true;
  currentUser.pendingPack = true;
  currentUser.packClaimed = false;

  if (!savePlayer()) {
    currentUser.chestOpened = false;
    currentUser.pendingPack = false;
    return;
  }

  updateChestVisibility();

  setTimeout(() => {
    if (currentUser && currentUser.pendingPack &&
        !currentUser.packClaimed) {
      showPack();
    }
  }, 350);
}

/* PACK */
function showPack() {
  if (!currentUser || busy) return;

  if (!currentUser.pendingPack || currentUser.packClaimed) {
    showToast("Không có pack đang chờ mở.");
    return;
  }

  openModal(`
    <div class="pack-stage">
      <h2>✨ Starter Pack</h2>
      <p>Nhấn nút bên dưới để xé pack và khám phá lá bài!</p>

      <div class="pack-art" id="packArt">
        <span>🎴</span>
        <span>STARTER PACK</span>
      </div>

      <button class="primary-btn" id="tearPackBtn" type="button">
        ✂️ XÉ PACK
      </button>
    </div>
  `);

  $("tearPackBtn").addEventListener("click", tearPack);
}

function tearPack() {
  if (!currentUser || busy) return;

  if (!currentUser.pendingPack || currentUser.packClaimed) {
    closeModal();
    showToast("Pack này đã được nhận.");
    return;
  }

  busy = true;

  $("tearPackBtn").disabled = true;
  $("packArt").classList.add("tear-animation");

  setTimeout(() => {
    if (!currentUser) {
      busy = false;
      closeModal();
      return;
    }

    if (!currentUser.pendingPack || currentUser.packClaimed) {
      busy = false;
      closeModal();
      return;
    }

    currentUser.cards.push({
      id: "starter-kha-banh",
      name: "Khá Bảnh",
      rarity: "STARTER",
      image: CARD_IMAGE
    });

    currentUser.packClaimed = true;
    currentUser.pendingPack = false;
    currentUser.packsOpened += 1;

    if (!savePlayer()) {
      currentUser.cards.pop();
      currentUser.packClaimed = false;
      currentUser.pendingPack = true;
      currentUser.packsOpened = Math.max(0, currentUser.packsOpened - 1);
      busy = false;
      showPack();
      return;
    }

    updateStats();
    updateChestVisibility();
    showCardReveal();
    busy = false;
  }, 650);
}

function showCardReveal() {
  openModal(`
    <div class="pack-stage">
      <h2>🎉 Bạn nhận được thẻ mới!</h2>
      <p>Lá bài đã được thêm vào túi thẻ của bạn.</p>

      <article class="reveal-card">
        <div class="reveal-art">
          <img src="${CARD_IMAGE}" alt="Thẻ Khá Bảnh"
            onerror="this.style.display='none';
            this.nextElementSibling.classList.remove('hidden')">
          <span class="card-art-fallback hidden">🃏</span>
        </div>
        <div class="reveal-info">
          <h3>Khá Bảnh</h3>
          <span>✦ STARTER CARD ✦</span>
        </div>
      </article>

      <button class="primary-btn" id="revealOpenBag" type="button">
        🎒 XEM THẺ
      </button>
    </div>
  `);

  $("revealOpenBag").addEventListener("click", openCardBag);
}

/* CÁC ICON DÀNH CHO TƯƠNG LAI */
function showComingSoon(title, icon) {
  if (!requireLogin()) return;

  openModal(`
    <div class="pack-stage">
      <div style="font-size:55px">${icon}</div>
      <h2>${escapeHTML(title)}</h2>
      <p>Tính năng sẽ được bổ sung trong bản cập nhật sau.</p>
      <button class="primary-btn" id="comingSoonClose" type="button">
        ĐÓNG
      </button>
    </div>
  `);

  $("comingSoonClose").addEventListener("click", closeModal);
}

/* NÚT */
$("startBtn").addEventListener("click", () => {
  if (currentUser) showGame();
  else openLogin();
});

$("registerOpen").addEventListener("click", openRegister);
$("loginOpen").addEventListener("click", openLogin);
$("logoutBtn").addEventListener("click", logout);
$("chestBtn").addEventListener("click", openChest);
$("resumePackBtn").addEventListener("click", showPack);
$("openBagBtn").addEventListener("click", openCardBag);
$("homeTab").addEventListener("click", goHome);

$("collectionTab").addEventListener("click", () => {
  setActiveTab("collectionTab");
  showComingSoon("Bộ sưu tập", "🃏");
});

$("shopTab").addEventListener("click", () => {
  setActiveTab("shopTab");
  showComingSoon("Cửa hàng", "🛒");
});

$("logoHome").addEventListener("click", (event) => {
  event.preventDefault();

  if (currentUser) {
    goHome();
  } else {
    welcomeScreen.classList.remove("hidden");
    gameScreen.classList.add("hidden");
    gameTaskbar.classList.add("hidden");
  }
});

/* KHÔI PHỤC ĐĂNG NHẬP */
function restoreSession() {
  let username = "";

  try {
    username = localStorage.getItem(SESSION_KEY) || "";
  } catch {
    return;
  }

  if (!username) return;

  const users = getUsers();
  const key = Object.keys(users).find(
    (name) => name.toLowerCase() === username.toLowerCase()
  );

  if (!key || !users[key]) return;

  currentUser = normalizeUser(users[key]);
  savePlayer();
  showGame();
}

restoreSession();
