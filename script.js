
"use strict";

/*
  ANIME CARD ARENA
  Lưu ý: phiên bản demo lưu tài khoản trên trình duyệt.
  Không dùng mật khẩu thật.
*/

const STORAGE_KEY = "animeCardArenaUsersV2";
const SESSION_KEY = "animeCardArenaCurrentUserV2";

/* Ảnh lá Khá Bảnh.
   Nếu không tải được ảnh, game sẽ hiển thị biểu tượng thay thế. */
const CARD_IMAGE =
  "https://raw.githubusercontent.com/luucongdan1979-ui/web-game/main/kh%C3%A1%20b%E1%BA%A3nh%20nv.png";

let currentUser = null;
let busy = false;

/* LẤY CÁC PHẦN TỬ HTML */
const $ = (id) => document.getElementById(id);

const welcomeScreen = $("welcomeScreen");
const gameScreen = $("gameScreen");
const gameTaskbar = $("gameTaskbar");
const modal = $("modal");
const modalContent = $("modalContent");

/* LƯU VÀ ĐỌC DỮ LIỆU */
function getUsers() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return data && typeof data === "object" && !Array.isArray(data)
      ? data
      : {};
  } catch (error) {
    return {};
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return true;
  } catch (error) {
    showToast("Không lưu được dữ liệu. Hãy kiểm tra bộ nhớ trình duyệt.");
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
  } catch (error) {
    // Người chơi vẫn có thể tiếp tục trong phiên hiện tại.
  }

  return true;
}

function normalizeUser(user) {
  if (!user || typeof user !== "object") return null;

  if (!Array.isArray(user.cards)) user.cards = [];
  if (typeof user.chestOpened !== "boolean") user.chestOpened = false;
  if (typeof user.packClaimed !== "boolean") user.packClaimed = false;
  if (typeof user.pendingPack !== "boolean") user.pendingPack = false;
  if (!Number.isFinite(user.packsOpened)) user.packsOpened = 0;

  // Tương thích dữ liệu cũ đã mở rương nhưng chưa nhận pack.
  if (user.chestOpened && !user.packClaimed) {
    user.pendingPack = true;
  }

  if (user.packClaimed) {
    user.pendingPack = false;
  }

  return user;
}

/* THÔNG BÁO */
function showToast(message) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2800);
}

/* MODAL */
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
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

/* ĐĂNG KÝ */
function openRegister() {
  openModal(`
    <h2 class="modal-title">Tạo tài khoản ✨</h2>
    <p class="modal-description">
      Đăng ký để lưu thẻ bài và phần thưởng của bạn trên trình duyệt này.
    </p>

    <form id="registerForm">
      <label class="form-field">
        Tên tài khoản
        <input name="username" type="text" minlength="3"
          maxlength="24" autocomplete="username"
          placeholder="Nhập tên tài khoản" required>
      </label>

      <label class="form-field">
        Gmail
        <input name="email" type="email" maxlength="100"
          autocomplete="email" placeholder="example@gmail.com" required>
      </label>

      <label class="form-field">
        Mật khẩu
        <input name="password" type="password" minlength="4"
          maxlength="100" autocomplete="new-password"
          placeholder="Tạo mật khẩu" required>
      </label>

      <button class="primary-btn form-submit" type="submit">
        ĐĂNG KÝ
      </button>
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
      showToast("Tên tài khoản chỉ dùng chữ, số, _ hoặc - (3–24 ký tự).");
      return;
    }

    if (!email.includes("@")) {
      showToast("Vui lòng nhập Gmail hợp lệ.");
      return;
    }

    if (password.length < 4) {
      showToast("Mật khẩu cần ít nhất 4 ký tự.");
      return;
    }

    const users = getUsers();
    const usernameKey = username.toLowerCase();

    const usernameExists = Object.keys(users).some(
      (key) => key.toLowerCase() === usernameKey
    );

    const emailExists = Object.values(users).some(
      (user) => String(user.email || "").toLowerCase() === email
    );

    if (usernameExists) {
      showToast("Tên tài khoản đã tồn tại.");
      return;
    }

    if (emailExists) {
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
    } catch (error) {
      // Tiếp tục trong phiên hiện tại.
    }

    closeModal();
    showGame();
    showToast("Đăng ký thành công! Chào mừng bạn đến game.");
  });
}

/* ĐĂNG NHẬP */
function openLogin() {
  openModal(`
    <h2 class="modal-title">Đăng nhập ⚡</h2>
    <p class="modal-description">
      Đăng nhập để tiếp tục hành trình thu thập thẻ bài.
    </p>

    <form id="loginForm">
      <label class="form-field">
        Tên tài khoản
        <input name="username" type="text" autocomplete="username"
          placeholder="Nhập tên tài khoản" required>
      </label>

      <label class="form-field">
        Mật khẩu
        <input name="password" type="password"
          autocomplete="current-password"
          placeholder="Nhập mật khẩu" required>
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
    const usernameInput = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");

    const users = getUsers();

    const usernameKey = Object.keys(users).find(
      (key) => key.toLowerCase() === usernameInput.toLowerCase()
    );

    const user = usernameKey ? users[usernameKey] : null;

    if (!user || user.password !== password) {
      showToast("Tên tài khoản hoặc mật khẩu không đúng.");
      return;
    }

    currentUser = normalizeUser(user);

    if (!currentUser) {
      showToast("Dữ liệu tài khoản không hợp lệ.");
      return;
    }

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
  } catch (error) {
    // Không ảnh hưởng dữ liệu tài khoản.
  }

  closeModal();
  welcomeScreen.classList.remove("hidden");
  gameScreen.classList.add("hidden");
  gameTaskbar.classList.add("hidden");

  $("playerName").textContent = "Khách";
  $("loginOpen").classList.remove("hidden");
  $("logoutBtn").classList.add("hidden");

  setActiveTab("homeTab");
  showToast("Bạn đã đăng xuất.");
}

/* ĐỔI MÀN HÌNH */
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

function setActiveTab(tabId) {
  document.querySelectorAll(".taskbar-item").forEach((button) => {
    button.classList.toggle("active", button.id === tabId);
  });
}

function requireLogin() {
  if (currentUser) return true;

  openLogin();
  showToast("Bạn cần đăng nhập trước.");
  return false;
}

/* THỐNG KÊ VÀ TÚI THẺ */
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

  const cards = currentUser.cards;

  let cardsHTML = "";

  if (cards.length === 0) {
    cardsHTML = `
      <div class="bag-empty">
        <div style="font-size:42px">🎒</div>
        <strong>Túi thẻ của bạn đang trống!</strong>
        <p>Hãy mở rương khởi đầu để nhận lá bài đầu tiên.</p>
      </div>
    `;
  } else {
    cardsHTML = cards.map((card, index) => {
      const safeName = escapeHTML(card.name || "Thẻ chưa đặt tên");
      const safeRarity = escapeHTML(card.rarity || "NORMAL");
      const safeImage = escapeHTML(card.image || "");

      return `
        <article class="card-tile">
          <div class="card-art">
            ${
              safeImage
                ? `<img src="${safeImage}" alt="${safeName}"
                    onerror="this.style.display='none';
                    this.nextElementSibling.classList.remove('hidden')">
                   <span class="card-art-fallback hidden">🃏</span>`
                : `<span class="card-art-fallback">🃏</span>`
            }
          </div>
          <div class="tile-info">
            <div class="tile-name">${safeName}</div>
            <span class="tile-rarity">${safeRarity}</span>
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
      <h2>🎒 Túi thẻ bài của tôi</h2>
      <p>Bạn đang sở hữu ${cards.length} thẻ bài.</p>
    </div>
    <div class="bag-grid">${cardsHTML}</div>
  `);
}

/* CHUYỂN TRANG CHÍNH */
function goHome() {
  if (!requireLogin()) return;

  closeModal();
  setActiveTab("homeTab");
  showGame();
}

/* CÁC MỤC DÀNH CHO TÍNH NĂNG SAU */
function showComingSoon(title, icon) {
  if (!requireLogin()) return;

  openModal(`
    <div class="pack-stage">
      <div style="font-size:55px;margin-bottom:15px">${icon}</div>
      <h2>${escapeHTML(title)}</h2>
      <p>Tính năng này sẽ được bổ sung trong bản cập nhật sau.</p>
      <button class="primary-btn" id="comingSoonClose" type="button">
        ĐÃ HIỂU
      </button>
    </div>
  `);

  $("comingSoonClose").addEventListener("click", closeModal);
}

/* RƯƠNG KHỞI ĐẦU */
function updateChestVisibility() {
  if (!currentUser) return;

  const claimed = currentUser.packClaimed;
  const pending = currentUser.pendingPack && !claimed;
  const opened = currentUser.chestOpened;

  $("chestBtn").classList.toggle("hidden", opened);
  $("resumePackBtn").classList.toggle("hidden", !pending);
  $("claimedMessage").classList.toggle("hidden", !claimed);
  $("chestDescription").classList.toggle("hidden", claimed || pending);

  if (claimed) {
    $("chestDescription").textContent = "Bạn đã nhận phần thưởng khởi đầu.";
  }

  $("starterChestPanel").classList.remove("hidden");
}

function openChest() {
  if (!requireLogin() || busy) return;

  if (currentUser.chestOpened || currentUser.packClaimed) {
    updateChestVisibility();
    showToast("Rương khởi đầu chỉ được nhận một lần!");
    return;
  }

  // Đánh dấu ngay trước khi hiển thị pack để chặn bấm nhiều lần.
  currentUser.chestOpened = true;
  currentUser.pendingPack = true;
  currentUser.packClaimed = false;

  if (!savePlayer()) {
    currentUser.chestOpened = false;
    currentUser.pendingPack = false;
    return;
  }

  updateChestVisibility();
  showToast("Bạn đã mở rương khởi đầu!");

  setTimeout(() => {
    if (currentUser && currentUser.pendingPack && !currentUser.packClaimed) {
      showPack();
    }
  }, 350);
}

/* HIỆN PACK */
function showPack() {
  if (!currentUser || busy) return;

  if (!currentUser.pendingPack || currentUser.packClaimed) {
    showToast("Bạn không có pack nào đang chờ mở.");
    return;
  }

  openModal(`
    <div class="pack-stage">
      <h2>✨ Starter Pack</h2>
      <p>Pack khởi đầu của bạn đã sẵn sàng.<br>
      Nhấn nút bên dưới để xé pack và khám phá lá bài!</p>

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

/* XÉ PACK VÀ NHẬN THẺ */
function tearPack() {
  if (!currentUser || busy) return;

  if (!currentUser.pendingPack || currentUser.packClaimed) {
    showToast("Pack này đã được nhận rồi.");
    closeModal();
    return;
  }

  busy = true;

  const tearButton = $("tearPackBtn");
  const packArt = $("packArt");

  if (tearButton) tearButton.disabled = true;
  if (packArt) packArt.classList.add("tear-animation");

  setTimeout(() => {
    if (!currentUser) {
      busy = false;
      closeModal();
      return;
    }

    // Kiểm tra lại trước khi cấp thẻ.
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
    currentUser.packsOpened = (currentUser.packsOpened || 0) + 1;

    if (!savePlayer()) {
      // Nếu lưu thất bại, không tiếp tục cấp thêm thẻ.
      currentUser.cards.pop();
      currentUser.packClaimed = false;
      currentUser.pendingPack = true;
      currentUser.packsOpened = Math.max(
        0,
        currentUser.packsOpened - 1
      );

      busy = false;
      showPackSaveError();
      return;
    }

    updateStats();
    updateChestVisibility();
    showCardReveal();
    busy = false;
  }, 650);
}

function showPackSaveError() {
  openModal(`
    <div class="pack-stage">
      <h2>Không lưu được pack</h2>
      <p>Trình duyệt không lưu được phần thưởng. Hãy kiểm tra bộ nhớ rồi thử lại.</p>
      <button class="primary-btn" id="retryPackBtn" type="button">
        THỬ LẠI
      </button>
    </div>
  `);

  $("retryPackBtn").addEventListener("click", showPack);
}

/* HIỆU ỨNG LẬT THẺ */
function showCardReveal() {
  openModal(`
    <div class="pack-stage">
      <h2>🎉 Bạn nhận được thẻ mới!</h2>
      <p>Lá bài đã được thêm vào túi thẻ của bạn.</p>

      <article class="reveal-card">
        <div class="reveal-art">
          <img
            src="${CARD_IMAGE}"
            alt="Thẻ Khá Bảnh"
            onerror="this.style.display='none';
              this.nextElementSibling.classList.remove('hidden')"
          >
          <span class="card-art-fallback hidden">🃏</span>
        </div>
        <div class="reveal-info">
          <h3>Khá Bảnh</h3>
          <span>✦ STARTER CARD ✦</span>
        </div>
      </article>

      <button class="primary-btn" id="revealOpenBag" type="button">
        🎒 XEM TRONG TÚI THẺ
      </button>
    </div>
  `);

  $("revealOpenBag").addEventListener("click", openCardBag);
}

/* CHỐNG CHÈN HTML TỪ TÊN TÀI KHOẢN / THẺ */
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return replacements[char];
  });
}

/* GẮN SỰ KIỆN NÚT */
$("startBtn").addEventListener("click", () => {
  if (currentUser) {
    showGame();
  } else {
    openLogin();
  }
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

/* KHÔI PHỤC PHIÊN ĐĂNG NHẬP */
function restoreSession() {
  let username = "";

  try {
    username = localStorage.getItem(SESSION_KEY) || "";
  } catch (error) {
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
