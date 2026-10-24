
"use strict";

/* ==================================
   ANIME CARD GAME
   Đăng nhập - Rương - Pack - Túi bài
================================== */

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

const toast = $("#toast");
const openBagBtn = $("#openBagBtn");
const bagCount = $("#bagCount");

/* Đường dẫn ảnh lá bài */
const CARD_IMAGE =
  "https://raw.githubusercontent.com/luucongdan1979-ui/web-game/main/kh%C3%A1%20b%E1%BA%A3nh%20nv.png";

/* Trạng thái game */
let currentUser = null;
let cards = [];
let busy = false;
let toastTimer = null;

/* ==================================
   DỮ LIỆU TÀI KHOẢN
================================== */

function getUsers() {
  try {
    return JSON.parse(
      localStorage.getItem("animeCardUsers") || "{}"
    );
  } catch (error) {
    console.error("Không đọc được tài khoản:", error);
    return {};
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem("animeCardUsers", JSON.stringify(users));
  } catch (error) {
    console.error("Không lưu được dữ liệu:", error);
    showToast("Không thể lưu dữ liệu trên trình duyệt.");
  }
}

function savePlayer() {
  if (!currentUser) return;

  const users = getUsers();
  const user = users[currentUser];

  if (!user) return;

  user.cards = cards;
  saveUsers(users);
}

/* ==================================
   THÔNG BÁO
================================== */

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

/* ==================================
   CỬA SỔ POPUP
================================== */

function openModal(html) {
  if (!modal || !modalContent) return;

  modalContent.innerHTML = html;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modal || !modalContent) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  modalContent.innerHTML = "";
  document.body.style.overflow = "";

  busy = false;

  if (chestBtn) {
    chestBtn.disabled = false;
  }
}

/* ==================================
   GIAO DIỆN
================================== */

function updateHeader() {
  if (playerName) {
    playerName.textContent = currentUser || "Khách";
  }

  if (loginOpen) {
    loginOpen.classList.toggle("hidden", Boolean(currentUser));
  }

  if (logoutBtn) {
    logoutBtn.classList.toggle("hidden", !currentUser);
  }
}

function showWelcome() {
  welcomeScreen?.classList.remove("hidden");
  gameScreen?.classList.add("hidden");
}

function showGame() {
  if (!currentUser) {
    showToast("Hãy đăng nhập hoặc đăng ký trước nhé!");
    openAuth("login");
    return;
  }

  welcomeScreen?.classList.add("hidden");
  gameScreen?.classList.remove("hidden");

  updateBagCount();
  updateChestVisibility();
}

function updateBagCount() {
  if (bagCount) {
    bagCount.textContent = String(cards.length);
  }
}

/* Rương ẩn sau khi tài khoản đã mở */
function updateChestVisibility() {
  if (!chestBtn) return;

  if (!currentUser) {
    chestBtn.classList.remove("hidden");
    return;
  }

  const users = getUsers();
  const opened = users[currentUser]?.chestOpened === true;

  chestBtn.classList.toggle("hidden", opened);
}

/* ==================================
   ĐĂNG KÝ / ĐĂNG NHẬP
================================== */

function openAuth(mode) {
  const isRegister = mode === "register";

  openModal(`
    <div class="hero-tag">
      ${isRegister ? "CREATE ACCOUNT" : "PLAYER LOGIN"}
    </div>

    <h2>${isRegister ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP"}</h2>

    <form id="authForm">
      ${
        isRegister
          ? `
            <div class="form-field">
              <label for="authName">Tên tài khoản</label>
              <input id="authName" name="username"
                required minlength="3" maxlength="20"
                autocomplete="username"
                placeholder="Nhập tên tài khoản">
            </div>

            <div class="form-field">
              <label for="authEmail">Gmail</label>
              <input id="authEmail" name="email"
                type="email" required autocomplete="email"
                placeholder="example@gmail.com">
            </div>
          `
          : `
            <div class="form-field">
              <label for="authName">Tên tài khoản</label>
              <input id="authName" name="username"
                required autocomplete="username"
                placeholder="Tên tài khoản">
            </div>
          `
      }

      <div class="form-field">
        <label for="authPassword">Mật khẩu</label>
        <input id="authPassword" name="password"
          type="password" required minlength="4"
          autocomplete="${isRegister ? "new-password" : "current-password"}"
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

    <p class="hint">
      Đây là bản demo. Tài khoản được lưu trên trình duyệt hiện tại.
    </p>
  `);

  $("#switchAuth")?.addEventListener("click", () => {
    openAuth(isRegister ? "login" : "register");
  });

  $("#authForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();

    if (!username || !password) {
      showToast("Vui lòng điền đầy đủ thông tin.");
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
        chestOpened: false
      };

      saveUsers(users);
      loginUser(username);
      showToast("Đăng ký thành công! Chào mừng vào game.");
      return;
    }

    if (
      !users[username] ||
      users[username].password !== password
    ) {
      showToast("Tên tài khoản hoặc mật khẩu không đúng.");
      return;
    }

    /* Bổ sung dữ liệu mặc định cho tài khoản cũ */
    if (!Array.isArray(users[username].cards)) {
      users[username].cards = [];
    }

    if (typeof users[username].chestOpened !== "boolean") {
      users[username].chestOpened = false;
    }

    saveUsers(users);
    loginUser(username);
    showToast("Đăng nhập thành công!");
  });
}

function loginUser(username) {
  currentUser = username;

  const users = getUsers();
  const user = users[username];

  cards = Array.isArray(user?.cards) ? user.cards : [];

  updateHeader();
  closeModal();
  showGame();
  updateBagCount();
  updateChestVisibility();
}

function logout() {
  savePlayer();

  currentUser = null;
  cards = [];
  busy = false;

  updateHeader();
  closeModal();
  showWelcome();

  showToast("Bạn đã đăng xuất.");
}

/* ==================================
   TÚI THẺ BÀI
================================== */

function openCardBag() {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  const cardItems = cards.length
    ? `<div class="bag-grid" id="bagGrid"></div>`
    : `
      <div class="bag-empty">
        <span>🎒</span>
        Túi của bạn đang trống.<br>
        Hãy mở rương để nhận thẻ bài nhé!
      </div>
    `;

  openModal(`
    <div class="hero-tag">YOUR COLLECTION</div>
    <h2>🎒 TÚI THẺ BÀI</h2>

    <p style="text-align:center;color:#aaa9c5">
      Bạn đang có ${cards.length} lá bài.
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

  $("#bagCloseBtn")?.addEventListener("click", closeModal);
}

/* ==================================
   MỞ RƯƠNG - CHỈ MỘT LẦN
================================== */

function openChest() {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  if (busy) return;

  const users = getUsers();
  const user = users[currentUser];

  if (!user) {
    showToast("Không tìm thấy tài khoản.");
    return;
  }

  if (user.chestOpened === true) {
    updateChestVisibility();
    showToast("Bạn đã mở rương này rồi!");
    return;
  }

  busy = true;

  if (chestBtn) {
    chestBtn.disabled = true;
    chestBtn.classList.add("shake");
  }

  if (chestEmoji) {
    chestEmoji.textContent = "✨";
  }

  setTimeout(() => {
    if (chestBtn) {
      chestBtn.classList.remove("shake");
    }

    if (chestEmoji) {
      chestEmoji.textContent = "📦";
    }

    /*
      Đánh dấu đã mở và lưu ngay.
      Rương sẽ biến mất khi tài khoản này mở xong.
    */
    const latestUsers = getUsers();

    if (!latestUsers[currentUser]) {
      busy = false;
      return;
    }

    latestUsers[currentUser].chestOpened = true;
    saveUsers(latestUsers);
    updateChestVisibility();

    openModal(`
      <div class="hero-tag">TREASURE UNLOCKED</div>
      <h2>BẠN NHẬN ĐƯỢC PACK!</h2>

      <p style="text-align:center;color:#aaa9c5">
        Nhấn vào gói để khám phá lá bài bí ẩn.
      </p>

      <div class="pack-wrap">
        <button id="packBtn" class="pack"
          aria-label="Xé gói thẻ bài">
          ✦<br>ANIME<br>CARDS
        </button>
      </div>

      <p style="text-align:center;color:#46d9ff;font-size:12px">
        NHẤN VÀO GÓI ĐỂ XÉ
      </p>
    `);

    $("#packBtn")?.addEventListener("click", tearPack);
    busy = false;
  }, 650);
}

/* ==================================
   XÉ PACK - NHẬN THẺ
================================== */

function tearPack() {
  if (busy) return;

  if (!currentUser) {
    closeModal();
    openAuth("login");
    return;
  }

  const users = getUsers();
  const user = users[currentUser];

  if (!user || user.chestOpened !== true) {
    showToast("Bạn cần mở rương trước!");
    return;
  }

  /*
    Không cho nhận nhiều lá từ một pack
    bằng cách nhấn liên tục.
  */
  if (user.packClaimed === true) {
    showToast("Bạn đã nhận thẻ từ pack này rồi!");
    return;
  }

  busy = true;

  const pack = $("#packBtn");

  if (!pack) {
    busy = false;
    return;
  }

  pack.disabled = true;
  pack.classList.add("tear");

  setTimeout(() => {
    const latestUsers = getUsers();
    const latestUser = latestUsers[currentUser];

    if (!latestUser || latestUser.packClaimed === true) {
      busy = false;
      closeModal();
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

    latestUser.cards.push(newCard);
    latestUser.packClaimed = true;

    cards = latestUser.cards;
    saveUsers(latestUsers);

    updateBagCount();

    openModal(`
      <div class="hero-tag">NEW CARD UNLOCKED!</div>
      <h2>CHÚC MỪNG!</h2>

      <div class="reveal-card">
        <img id="revealedImage"
          src="${CARD_IMAGE}"
          alt="Lá bài Khá Bảnh">

        <h3>KHÁ BẢNH</h3>
        <p>★ LEGENDARY ★</p>
      </div>

      <p style="text-align:center;color:#aaa9c5;font-size:12px">
        Lá bài đã được thêm vào 🎒 Túi thẻ bài!
      </p>

      <button id="backToGame" class="main-btn form-submit">
        TIẾP TỤC
      </button>
    `);

    $("#revealedImage")?.addEventListener("error", () => {
      showToast("Không tải được ảnh. Hãy kiểm tra đường dẫn ảnh.");
    });

    $("#backToGame")?.addEventListener("click", () => {
      closeModal();
      busy = false;
      updateChestVisibility();
    });

    busy = false;
  }, 750);
}

/* ==================================
   GẮN SỰ KIỆN NÚT
================================== */

startBtn?.addEventListener("click", showGame);

loginOpen?.addEventListener("click", () => {
  openAuth("login");
});

registerOpen?.addEventListener("click", () => {
  openAuth("register");
});

logoutBtn?.addEventListener("click", logout);

chestBtn?.addEventListener("click", openChest);

openBagBtn?.addEventListener("click", openCardBag);

modalClose?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event) => {
  if (event.target?.dataset?.close === "true") {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    modal &&
    !modal.classList.contains("hidden")
  ) {
    closeModal();
  }
});

/* ==================================
   KHỞI ĐỘNG
================================== */

updateHeader();
showWelcome();
updateBagCount();
