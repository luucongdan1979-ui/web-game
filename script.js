
"use strict";

/* =========================================
   ANIME CARD GAME - MAIN SCRIPT
========================================= */

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
const chestPanel = $("#starterChestPanel");
const chestDescription = $("#chestDescription");

const openBagBtn = $("#openBagBtn");
const bagCount = $("#bagCount");
const toast = $("#toast");

const CARD_IMAGE =
  "https://raw.githubusercontent.com/luucongdan1979-ui/web-game/main/kh%C3%A1%20b%E1%BA%A3nh%20nv.png";

let currentUser = null;
let cards = [];
let busy = false;
let toastTimer = null;

/* =========================================
   LƯU DỮ LIỆU
========================================= */

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("animeCardUsers") || "{}");
  } catch (error) {
    console.error(error);
    return {};
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem("animeCardUsers", JSON.stringify(users));
    return true;
  } catch (error) {
    console.error(error);
    showToast("Không lưu được dữ liệu trình duyệt.");
    return false;
  }
}

function savePlayer() {
  if (!currentUser) return;

  const users = getUsers();
  if (!users[currentUser]) return;

  users[currentUser].cards = cards;
  saveUsers(users);
}

/* =========================================
   THÔNG BÁO
========================================= */

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

/* =========================================
   MODAL
========================================= */

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
}

/* =========================================
   GIAO DIỆN CHÍNH
========================================= */

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
    openAuth("login");
    return;
  }

  welcomeScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  updateBagCount();
  updateChestVisibility();
}

function updateBagCount() {
  bagCount.textContent = String(cards.length);
}

/*
  Nếu chưa nhận rương: hiện rương.
  Nếu đã mở nhưng chưa nhận thẻ: cho tiếp tục pack.
  Nếu đã nhận thẻ: ẩn hẳn rương khởi đầu.
*/

function updateChestVisibility() {
  if (!currentUser) return;

  const users = getUsers();
  const user = users[currentUser];

  if (!user) return;

  const opened = user.chestOpened === true;
  const claimed = user.packClaimed === true;

  let resumeButton = $("#resumePackBtn");

  if (claimed) {
    chestPanel.classList.add("hidden");
    return;
  }

  chestPanel.classList.remove("hidden");

  if (!opened) {
    chestBtn.classList.remove("hidden");
    chestBtn.disabled = false;

    if (chestDescription) {
      chestDescription.textContent =
        "Mỗi tài khoản chỉ nhận rương khởi đầu một lần.";
    }

    resumeButton?.remove();
    return;
  }

  chestBtn.classList.add("hidden");

  if (chestDescription) {
    chestDescription.textContent =
      "Bạn còn một pack chưa mở. Hãy tiếp tục để nhận thẻ!";
  }

  if (!resumeButton) {
    resumeButton = document.createElement("button");
    resumeButton.id = "resumePackBtn";
    resumeButton.className = "main-btn form-submit";
    resumeButton.textContent = "TIẾP TỤC MỞ PACK";
    chestPanel.appendChild(resumeButton);
  }

  resumeButton.onclick = showPack;
}

/* =========================================
   ĐĂNG KÝ / ĐĂNG NHẬP
========================================= */

function openAuth(mode) {
  const isRegister = mode === "register";

  openModal(`
    <div class="hero-tag">
      ${isRegister ? "CREATE ACCOUNT" : "PLAYER LOGIN"}
    </div>

    <h2>${isRegister ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP"}</h2>

    <form id="authForm">
      <div class="form-field">
        <label for="authName">Tên tài khoản</label>
        <input id="authName" name="username"
          required minlength="3" maxlength="20"
          autocomplete="username" placeholder="Tên tài khoản">
      </div>

      ${
        isRegister
          ? `
            <div class="form-field">
              <label for="authEmail">Gmail</label>
              <input id="authEmail" name="email"
                type="email" required autocomplete="email"
                placeholder="example@gmail.com">
            </div>
          `
          : ""
      }

      <div class="form-field">
        <label for="authPassword">Mật khẩu</label>
        <input id="authPassword" name="password"
          type="password" required minlength="4"
          autocomplete="${isRegister ? "new-password" : "current-password"}"
          placeholder="Mật khẩu">
      </div>

      <button class="main-btn form-submit" type="submit">
        ${isRegister ? "ĐĂNG KÝ" : "ĐĂNG NHẬP"}
      </button>
    </form>

    <div class="form-switch">
      ${isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
      <button type="button" id="switchAuth" class="text-btn">
        ${isRegister ? "Đăng nhập" : "Đăng ký"}
      </button>
    </div>

    <p class="hint">
      Đây là bản demo lưu dữ liệu trên trình duyệt hiện tại.
    </p>
  `);

  $("#switchAuth").onclick = () => {
    openAuth(isRegister ? "login" : "register");
  };

  $("#authForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const username = String(data.get("username") || "").trim();
    const password = String(data.get("password") || "");
    const email = String(data.get("email") || "").trim().toLowerCase();

    if (!username || !password) {
      showToast("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    const users = getUsers();

    if (isRegister) {
      if (users[username]) {
        showToast("Tên tài khoản đã tồn tại!");
        return;
      }

      if (!email) {
        showToast("Vui lòng nhập Gmail.");
        return;
      }

      users[username] = {
        email: email,
        password: password,
        cards: [],
        chestOpened: false,
        packClaimed: false,
        pendingPack: false
      };

      if (!saveUsers(users)) return;

      loginUser(username);
      showToast("Đăng ký thành công!");
      return;
    }

    if (
      !users[username] ||
      users[username].password !== password
    ) {
      showToast("Tên tài khoản hoặc mật khẩu không đúng.");
      return;
    }

    const user = users[username];

    if (!Array.isArray(user.cards)) user.cards = [];
    if (typeof user.chestOpened !== "boolean") user.chestOpened = false;
    if (typeof user.packClaimed !== "boolean") user.packClaimed = false;
    if (typeof user.pendingPack !== "boolean") {
      user.pendingPack = user.chestOpened && !user.packClaimed;
    }

    if (!saveUsers(users)) return;

    loginUser(username);
    showToast("Đăng nhập thành công!");
  });
}

function loginUser(username) {
  currentUser = username;

  const users = getUsers();
  const user = users[username];

  cards = Array.isArray(user.cards) ? user.cards : [];

  updateHeader();
  closeModal();
  showGame();

  /*
    Nếu người chơi tải lại trang khi pack chưa mở,
    cho họ tiếp tục thay vì mất phần thưởng.
  */
  if (user.pendingPack && !user.packClaimed) {
    showPack();
  }
}

function logout() {
  savePlayer();

  currentUser = null;
  cards = [];
  busy = false;

  updateHeader();
  closeModal();
  showWelcome();
}

/* =========================================
   TÚI THẺ CỦA TÔI
========================================= */

function openCardBag() {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  const cardItems = cards.length
    ? '<div class="bag-grid" id="bagGrid"></div>'
    : `
      <div class="bag-empty">
        <span>🎒</span>
        Túi thẻ của bạn đang trống.<br>
        Mở rương khởi đầu để nhận thẻ nhé!
      </div>
    `;

  openModal(`
    <div class="hero-tag">MY CARD COLLECTION</div>
    <h2>🎒 TÚI THẺ CỦA TÔI</h2>

    <p style="text-align:center;color:#aaa9c5">
      Tổng số thẻ đang sở hữu: ${cards.length}
    </p>

    ${cardItems}

    <button id="bagCloseBtn" class="main-btn form-submit">
      QUAY LẠI GAME
    </button>
  `);

  const grid = $("#bagGrid");

  if (grid) {
    cards.forEach((card) => {
      const tile = document.createElement("div");
      tile.className = "card-tile";

      const img = document.createElement("img");
      img.src = card.image || CARD_IMAGE;
      img.alt = card.name || "Thẻ bài";
      img.onerror = () => {
        img.style.display = "none";
      };

      const name = document.createElement("div");
      name.className = "tile-name";
      name.textContent = card.name || "Thẻ bài";

      const rarity = document.createElement("div");
      rarity.className = "tile-rarity";
      rarity.textContent = card.rarity || "NORMAL";

      tile.append(img, name, rarity);
      grid.appendChild(tile);
    });
  }

  $("#bagCloseBtn").onclick = closeModal;
}

/* =========================================
   RƯƠNG KHỞI ĐẦU
   Mỗi tài khoản chỉ mở một lần
========================================= */

function openChest() {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  if (busy) return;

  const users = getUsers();
  const user = users[currentUser];

  if (!user) return;

  if (user.chestOpened || user.packClaimed) {
    updateChestVisibility();
    showToast("Bạn đã nhận rương khởi đầu rồi!");
    return;
  }

  /*
    Lưu trạng thái ngay trước khi hiện pack.
    Nhấn liên tục không thể mở thêm rương.
  */
  user.chestOpened = true;
  user.pendingPack = true;

  if (!saveUsers(users)) {
    user.chestOpened = false;
    user.pendingPack = false;
    return;
  }

  busy = true;
  chestBtn.disabled = true;
  chestBtn.classList.add("shake");
  chestEmoji.textContent = "✨";

  setTimeout(() => {
    chestBtn.classList.remove("shake");
    chestEmoji.textContent = "📦";

    updateChestVisibility();
    busy = false;
    showPack();
  }, 650);
}

/* =========================================
   HIỆN PACK
========================================= */

function showPack() {
  if (!currentUser || busy) return;

  const users = getUsers();
  const user = users[currentUser];

  if (!user || user.packClaimed || !user.pendingPack) {
    updateChestVisibility();
    return;
  }

  openModal(`
    <div class="hero-tag">STARTER PACK</div>
    <h2>PACK KHỞI ĐẦU</h2>

    <p style="text-align:center;color:#aaa9c5">
      Nhấn vào gói bài để xé và nhận thẻ!
    </p>

    <div class="pack-wrap">
      <button id="packBtn" class="pack" aria-label="Xé pack">
        ✦<br>ANIME<br>CARDS
      </button>
    </div>

    <p style="text-align:center;color:#46d9ff;font-size:12px">
      Mỗi tài khoản chỉ nhận một pack khởi đầu.
    </p>
  `);

  $("#packBtn").onclick = tearPack;
}

/* =========================================
   XÉ PACK VÀ NHẬN THẺ
========================================= */

function tearPack() {
  if (busy || !currentUser) return;

  const users = getUsers();
  const user = users[currentUser];

  if (!user || !user.pendingPack || user.packClaimed) {
    showToast("Pack này đã được nhận hoặc không còn khả dụng.");
    closeModal();
    updateChestVisibility();
    return;
  }

  const pack = $("#packBtn");
  if (!pack) return;

  busy = true;
  pack.disabled = true;
  pack.classList.add("tear");

  setTimeout(() => {
    const latestUsers = getUsers();
    const latestUser = latestUsers[currentUser];

    if (
      !latestUser ||
      !latestUser.pendingPack ||
      latestUser.packClaimed
    ) {
      busy = false;
      closeModal();
      updateChestVisibility();
      return;
    }

    const newCard = {
      id: Date.now(),
      name: "KHÁ BẢNH",
      rarity: "★ LEGENDARY ★",
      image: CARD_IMAGE
    };

    if (!Array.isArray(latestUser.cards)) {
      latestUser.cards = [];
    }

    /*
      Đánh dấu đã nhận trước khi kết thúc thao tác.
      Không thể nhận thêm lá bài từ cùng pack.
    */
    latestUser.packClaimed = true;
    latestUser.pendingPack = false;
    latestUser.cards.push(newCard);

    if (!saveUsers(latestUsers)) {
      busy = false;
      showToast("Lưu thẻ thất bại. Vui lòng thử lại.");
      return;
    }

    cards = latestUser.cards;
    updateBagCount();
    updateChestVisibility();

    showCardReveal(newCard);
  }, 750);
}

/* =========================================
   HIỆN THẺ VỪA NHẬN
========================================= */

function showCardReveal(card) {
  openModal(`
    <div class="hero-tag">NEW CARD UNLOCKED!</div>
    <h2>CHÚC MỪNG!</h2>

    <div class="reveal-card">
      <img id="revealedImage"
        src="${card.image}"
        alt="${card.name}">

      <h3>${card.name}</h3>
      <p>${card.rarity}</p>
    </div>

    <p style="text-align:center;color:#aaa9c5;font-size:12px">
      Thẻ bài đã được lưu vào túi thẻ của bạn!
    </p>

    <button id="viewBagBtn" class="main-btn form-submit">
      🎒 XEM TÚI THẺ CỦA TÔI
    </button>
  `);

  $("#revealedImage").onerror = () => {
    showToast("Không tải được ảnh thẻ. Hãy kiểm tra đường dẫn ảnh.");
  };

  $("#viewBagBtn").onclick = () => {
    busy = false;
    openCardBag();
  };

  busy = false;
}

/* =========================================
   GẮN SỰ KIỆN
========================================= */

startBtn.addEventListener("click", () => {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  showGame();
});

loginOpen.addEventListener("click", () => openAuth("login"));
registerOpen.addEventListener("click", () => openAuth("register"));
logoutBtn.addEventListener("click", logout);
chestBtn.addEventListener("click", openChest);
openBagBtn.addEventListener("click", openCardBag);
modalClose.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target.dataset.close === "true") {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

/* =========================================
   KHỞI ĐỘNG
========================================= */

updateHeader();
showWelcome();
updateBagCount();
