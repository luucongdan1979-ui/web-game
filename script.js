
"use strict";

// ===================================
// CARD ARENA - ĐĂNG NHẬP / ĐĂNG KÝ
// ===================================

const USERS_KEY = "cardArenaUsersV1";
const SESSION_KEY = "cardArenaSessionV1";

// Đổi hai giá trị này thành thông tin Admin của bạn.
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "171113";

let authMode = "login";
let users = loadUsers();

// Lấy phần tử HTML theo ID.
const $ = id => document.getElementById(id);

// Đọc danh sách tài khoản đã lưu.
function loadUsers() {
  try {
    const data = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Lưu danh sách tài khoản.
function saveUsers() {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Hiện thông báo.
function showToast(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// Mở modal.
function openModal(id) {
  $(id).classList.remove("hidden");
}

// Đóng modal.
function closeModal(id) {
  $(id).classList.add("hidden");
}

// Chuyển giữa đăng nhập và đăng ký.
function setAuthMode(mode) {
  authMode = mode;

  const isRegister = mode === "register";

  $("authTitle").textContent = isRegister
    ? "ĐĂNG KÝ TÀI KHOẢN"
    : "ĐĂNG NHẬP";

  $("authDescription").textContent = isRegister
    ? "Tạo tài khoản để tham gia CARD ARENA."
    : "Chào mừng trở lại đấu trường!";

  $("submitAuth").textContent = isRegister
    ? "TẠO TÀI KHOẢN"
    : "ĐĂNG NHẬP";

  $("emailGroup").classList.toggle("hidden", !isRegister);
  $("confirmGroup").classList.toggle("hidden", !isRegister);

  $("email").required = isRegister;
  $("confirmPassword").required = isRegister;

  $("switchDescription").textContent = isRegister
    ? "Đã có tài khoản?"
    : "Chưa có tài khoản?";

  $("switchAuthBtn").textContent = isRegister
    ? "Đăng nhập ngay"
    : "Đăng ký ngay";

  $("password").autocomplete = isRegister
    ? "new-password"
    : "current-password";

  $("authForm").reset();

  openModal("authModal");
}

// Đăng ký / đăng nhập tài khoản thường.
function handleAuth(event) {
  event.preventDefault();

  const username = $("username").value.trim();
  const password = $("password").value;
  const email = $("email").value.trim();
  const confirmPassword = $("confirmPassword").value;

  if (username.length < 3) {
    showToast("Tên tài khoản phải có ít nhất 3 ký tự.");
    return;
  }

  if (authMode === "register") {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      showToast("Tên tài khoản chỉ dùng chữ, số và dấu gạch dưới.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Vui lòng nhập địa chỉ Gmail hợp lệ.");
      return;
    }

    if (password.length < 4) {
      showToast("Mật khẩu cần ít nhất 4 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp!");
      return;
    }

    const usernameExists = users.some(user =>
      user.username.toLowerCase() === username.toLowerCase()
    );

    if (usernameExists || username.toLowerCase() === ADMIN_USERNAME) {
      showToast("Tên tài khoản đã được sử dụng!");
      return;
    }

    const emailExists = users.some(user =>
      user.email.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      showToast("Gmail này đã được đăng ký!");
      return;
    }

    const newUser = {
      username,
      email,
      password,
      createdAt: Date.now()
    };

    users.push(newUser);
    saveUsers();

    localStorage.setItem(SESSION_KEY, username);

    closeModal("authModal");

    showToast("Đăng ký thành công! Chào mừng đến CARD ARENA.");

    // Phần màn hình game chính sẽ được bổ sung ở bước tiếp theo.
    showSuccessScreen(username, false);

    return;
  }

  // Đăng nhập.
  const user = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase()
  );

  if (!user || user.password !== password) {
    showToast("Sai tên tài khoản hoặc mật khẩu!");
    return;
  }

  localStorage.setItem(SESSION_KEY, user.username);

  closeModal("authModal");

  showToast("Đăng nhập thành công!");

  // Phần màn hình game chính sẽ được bổ sung ở bước tiếp theo.
  showSuccessScreen(user.username, false);
}

// Đăng nhập Admin riêng.
function handleAdminLogin(event) {
  event.preventDefault();

  const username = $("adminUsername").value.trim();
  const password = $("adminPassword").value;

  if (
    username !== ADMIN_USERNAME ||
    password !== ADMIN_PASSWORD
  ) {
    showToast("Tên Admin hoặc mật khẩu không đúng!");
    return;
  }

  localStorage.setItem(SESSION_KEY, "ADMIN");

  closeModal("adminModal");

  showToast("Đăng nhập Admin thành công!");

  showSuccessScreen(ADMIN_USERNAME, true);
}

// Màn hình xác nhận đăng nhập thành công.
// Bước sau sẽ thay bằng giao diện game chính.
function showSuccessScreen(username, isAdmin) {
  const screen = document.createElement("div");

  screen.id = "successScreen";
  screen.style.cssText = `
    position:fixed;
    inset:0;
    z-index:20;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    gap:18px;
    padding:25px;
    text-align:center;
    background:radial-gradient(ellipse at top,#44216b,#10091e 70%);
  `;

  screen.innerHTML = `
    <div style="font-size:60px">✦</div>
    <h1 style="font-family:Orbitron,sans-serif;color:#d8b4fe">
      ${isAdmin ? "ADMIN ACCESS GRANTED" : "VÀO GAME THÀNH CÔNG"}
    </h1>
    <p>Xin chào, <b></b>!</p>
    <p style="color:#c4b5fd">
      ${isAdmin
        ? "Bạn đã đăng nhập với quyền quản trị viên."
        : "Chúc bạn có những trải nghiệm vui vẻ tại CARD ARENA."}
    </p>
    <button id="continueBtn" style="
      padding:14px 28px;
      border:1px solid #e9d5ff;
      border-radius:12px;
      color:white;
      background:linear-gradient(100deg,#9333ea,#db2777);
      font-weight:bold;
      cursor:pointer;
    ">TIẾP TỤC</button>
    <button id="backWelcomeBtn" style="
      padding:10px 20px;
      border:1px solid #75678c;
      border-radius:10px;
      color:#ddd;
      background:#211331;
      cursor:pointer;
    ">QUAY LẠI MÀN HÌNH ĐẦU</button>
  `;

  screen.querySelector("p b").textContent = username;

  document.body.appendChild(screen);

  $("continueBtn").addEventListener("click", () => {
    showToast("Màn hình game chính sẽ được làm ở phần tiếp theo.");
  });

  $("backWelcomeBtn").addEventListener("click", () => {
    screen.remove();
    localStorage.removeItem(SESSION_KEY);
  });
}

// ===================================
// KẾT NỐI CÁC NÚT
// ===================================

$("loginBtn").addEventListener("click", () => {
  setAuthMode("login");
});

$("registerBtn").addEventListener("click", () => {
  setAuthMode("register");
});

$("tapStartBtn").addEventListener("click", () => {
  setAuthMode("login");
});

$("adminBtn").addEventListener("click", () => {
  $("adminForm").reset();
  openModal("adminModal");
});

$("switchAuthBtn").addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "register" : "login");
});

$("authForm").addEventListener("submit", handleAuth);
$("adminForm").addEventListener("submit", handleAdminLogin);

// Các nút đóng modal.
document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => {
    closeModal(button.dataset.close);
  });
});

// Bấm ra ngoài hộp để đóng modal.
["authModal", "adminModal"].forEach(id => {
  $(id).addEventListener("click", event => {
    if (event.target.id === id) {
      closeModal(id);
    }
  });
});

// Nếu đã đăng nhập từ trước, thông báo phiên đã lưu.
// Chưa tự động chuyển màn hình vì game chính chưa được tạo.
const previousSession = localStorage.getItem(SESSION_KEY);

if (previousSession) {
  console.info("Phiên đăng nhập đã lưu:", previousSession);
}
