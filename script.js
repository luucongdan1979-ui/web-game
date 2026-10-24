
"use strict";

const $ = (selector) => document.querySelector(selector);

const welcomeScreen = $("#welcomeScreen");
const gameScreen = $("#gameScreen");
const modal = $("#modal");
const modalContent = $("#modalContent");
const modalClose = $("#modalClose");
const playerName = $("#playerName");
const loginOpen = $("#loginOpen");
const logoutBtn = $("#logoutBtn");
const startBtn = $("#startBtn");
const registerOpen = $("#registerOpen");
const chestBtn = $("#chestBtn");
const chestEmoji = $("#chestEmoji");
const collection = $("#collection");
const cardCount = $("#cardCount");
const toast = $("#toast");

let currentUser = null;
let cards = [];
let busy = false;
let toastTimer = null;

const CARD_IMAGE =
  "https://raw.githubusercontent.com/luucongdan1979-ui/web-game/main/kh%C3%A1%20b%E1%BA%A3nh%20nv.png";

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function openModal(html) {
  modalContent.innerHTML = html;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  modalContent.innerHTML = "";
  document.body.style.overflow = "";
  busy = false;
  chestBtn.disabled = false;
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("animeCardUsers") || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem("animeCardUsers", JSON.stringify(users));
}

function savePlayer() {
  if (!currentUser) return;
  const users = getUsers();
  if (!users[currentUser]) return;
  users[currentUser].cards = cards;
  saveUsers(users);
}

function updateHeader() {
  playerName.textContent = currentUser || "Khách";
  loginOpen.classList.toggle("hidden", Boolean(currentUser));
  logoutBtn.classList.toggle("hidden", !currentUser);
}

function showWelcome() {
  welcomeScreen.classList.remove("hidden");
  gameScreen.classList.add("hidden");
}

function showGame() {
  if (!currentUser) {
    showToast("Bạn hãy đăng nhập hoặc đăng ký trước nhé!");
    openAuth("login");
    return;
  }

  welcomeScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  renderCollection();
}

function openAuth(mode) {
  const isRegister = mode === "register";

  openModal(`
    <div class="hero-tag">${isRegister ? "CREATE ACCOUNT" : "PLAYER LOGIN"}</div>
    <h2>${isRegister ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP"}</h2>
    <form id="authForm">
      ${isRegister ? `
        <div class="form-field">
          <label for="authName">Tên tài khoản</label>
          <input id="authName" name="username" required minlength="3"
            maxlength="20" autocomplete="username"
            placeholder="Nhập tên tài khoản">
        </div>
        <div class="form-field">
          <label for="authEmail">Gmail</label>
          <input id="authEmail" name="email" type="email" required
            autocomplete="email" placeholder="example@gmail.com">
        </div>
      ` : `
        <div class="form-field">
          <label for="authName">Tên tài khoản</label>
          <input id="authName" name="username" required
            autocomplete="username" placeholder="Tên tài khoản">
        </div>
      `}
      <div class="form-field">
        <label for="authPassword">Mật khẩu</label>
        <input id="authPassword" name="password" type="password"
          required minlength="4" autocomplete="${isRegister ? "new-password" : "current-password"}"
          placeholder="Nhập mật khẩu">
      </div>
      <button class="main-btn form-submit" type="submit">
        ${isRegister ? "ĐĂNG KÝ NGAY" : "ĐĂNG NHẬP"}
      </button>
    </form>
    <div class="form-switch">
      ${isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
      <button type="button" id="switchAuth" class="text-btn">
        ${isRegister ? "Đăng nhập" : "Đăng ký"}
      </button>
    </div>
    <p class="hint">Bản demo lưu tài khoản trên trình duyệt hiện tại, chưa có máy chủ bảo mật.</p>
  `);

  $("#switchAuth").addEventListener("click", () => {
    openAuth(isRegister ? "login" : "register");
  });

  $("#authForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");
    const email = String(formData.get("email") || "").trim().toLowerCase();

    if (!username || !password) {
      showToast("Hãy điền đầy đủ thông tin.");
      return;
    }

    const users = getUsers();

    if (isRegister) {
      if (users[username]) {
        showToast("Tên tài khoản này đã tồn tại!");
        return;
      }

      if (!email) {
        showToast("Hãy nhập Gmail hợp lệ.");
        return;
      }

      users[username] = {
        email,
        password,
        cards: []
      };
      saveUsers(users);
      loginUser(username);
      showToast("Đăng ký thành công! Chào mừng vào game.");
      return;
    }

    if (!users[username] || users[username].password !== password) {
      showToast("Tên tài khoản hoặc mật khẩu chưa đúng.");
      return;
    }

    loginUser(username);
    showToast("Đăng nhập thành công!");
  });
}

function loginUser(username) {
  currentUser = username;
  const users = getUsers();
  cards = Array.isArray(users[username]?.cards) ? users[username].cards : [];
  updateHeader();
  closeModal();
  showGame();
}

function logout() {
  currentUser = null;
  cards = [];
  updateHeader();
  closeModal();
  showWelcome();
  showToast("Bạn đã đăng xuất.");
}

function renderCollection() {
  cardCount.textContent = String(cards.length);

  if (!cards.length) {
    collection.innerHTML = `
      <div class="empty-state">
        Chưa có lá bài nào.<br>Mở rương để bắt đầu!
      </div>
    `;
    return;
  }

  collection.innerHTML = "";

  cards.forEach((card) => {
    const tile = document.createElement("div");
    tile.className = "card-tile";

    const image = document.createElement("img");
    image.src = card.image;
    image.alt = card.name;
    image.onerror = () => {
      image.style.display = "none";
    };

    const name = document.createElement("div");
    name.className = "tile-name";
    name.textContent = card.name;

    const rarity = document.createElement("div");
    rarity.className = "tile-rarity";
    rarity.textContent = card.rarity;

    tile.append(image, name, rarity);
    collection.appendChild(tile);
  });
}

function openChest() {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  if (busy) return;
  busy = true;
  chestBtn.disabled = true;
  chestBtn.classList.add("shake");
  chestEmoji.textContent = "✨";

  setTimeout(() => {
    chestBtn.classList.remove("shake");
    chestEmoji.textContent = "📦";

    openModal(`
      <div class="hero-tag">TREASURE UNLOCKED</div>
      <h2>BẠN NHẬN ĐƯỢC PACK!</h2>
      <p style="text-align:center;color:#aaa9c5">
        Một gói thẻ bài bí ẩn đang chờ bạn khám phá.
      </p>
      <div class="pack-wrap">
        <button id="packBtn" class="pack" aria-label="Xé gói thẻ bài">
          ✦<br>ANIME<br>CARDS
        </button>
      </div>
      <p style="text-align:center;color:#46d9ff;font-size:12px">
        NHẤN VÀO GÓI ĐỂ XÉ
      </p>
    `);

    $("#packBtn").addEventListener("click", tearPack);
    busy = false;
  }, 650);
}

function tearPack() {
  if (busy) return;
  busy = true;

  const pack = $("#packBtn");
  if (!pack) {
    busy = false;
    return;
  }

  pack.disabled = true;
  pack.classList.add("tear");

  setTimeout(() => {
    const newCard = {
      id: Date.now(),
      name: "KHÁ BẢNH",
      rarity: "★ LEGENDARY ★",
      image: CARD_IMAGE
    };

    cards.push(newCard);
    savePlayer();
    renderCollection();

    openModal(`
      <div class="hero-tag">NEW CARD UNLOCKED!</div>
      <h2>CHÚC MỪNG!</h2>
      <div class="reveal-card">
        <img id="revealedImage" src="${CARD_IMAGE}" alt="Lá bài Khá Bảnh">
        <h3>KHÁ BẢNH</h3>
        <p>★ LEGENDARY ★</p>
      </div>
      <p style="text-align:center;color:#aaa9c5;font-size:12px">
        Lá bài đã được thêm vào bộ sưu tập của bạn!
      </p>
      <button id="backToGame" class="main-btn form-submit">
        TIẾP TỤC
      </button>
    `);

    $("#revealedImage").addEventListener("error", () => {
      $("#revealedImage").alt = "Không tải được ảnh. Hãy kiểm tra tên file ảnh trên GitHub.";
    });

    $("#backToGame").addEventListener("click", () => {
      closeModal();
      busy = false;
      chestBtn.disabled = false;
    });

    busy = false;
  }, 750);
}

startBtn.addEventListener("click", showGame);
loginOpen.addEventListener("click", () => openAuth("login"));
registerOpen.addEventListener("click", () => openAuth("register"));
logoutBtn.addEventListener("click", logout);
chestBtn.addEventListener("click", openChest);
modalClose.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target.dataset.close === "true") closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

updateHeader();
showWelcome();
