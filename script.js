
const $ = (id) => document.getElementById(id);

const loginScreen = $("loginScreen");
const homeScreen = $("homeScreen");
const authForm = $("authForm");
const username = $("username");
const email = $("email");
const password = $("password");

let authMode = "login";
let currentUser = "";
let packOpened = false;
let cardCollected = false;
let busy = false;

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => toast.classList.add("hidden"), 2200);
}

function switchScreen(screen) {
  loginScreen.classList.toggle("hidden", screen !== "login");
  homeScreen.classList.toggle("hidden", screen !== "home");
}

function switchAuthMode(mode) {
  authMode = mode;

  const registering = mode === "register";
  $("authTitle").textContent = registering ? "ĐĂNG KÝ" : "ĐĂNG NHẬP";
  $("authSubmit").textContent = registering ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP";
  $("switchAuth").textContent = registering
    ? "Đã có tài khoản? Đăng nhập"
    : "Chưa có tài khoản? Đăng ký";

  email.classList.toggle("hidden", !registering);
  email.required = registering;
  $("authMessage").textContent = "";
}

$("switchAuth").addEventListener("click", () => {
  switchAuthMode(authMode === "login" ? "register" : "login");
});

function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem("memeCardAccounts") || "{}");
  } catch {
    return {};
  }
}

function showHome(name) {
  currentUser = name;
  $("playerName").textContent = name;
  switchScreen("home");
  $("authMessage").textContent = "";
}

authForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = username.value.trim();
  const mail = email.value.trim().toLowerCase();
  const pass = password.value;

  if (!name || !pass) {
    $("authMessage").textContent = "Vui lòng điền đủ thông tin!";
    return;
  }

  const accounts = getAccounts();

  if (authMode === "register") {
    if (!mail) {
      $("authMessage").textContent = "Vui lòng nhập Gmail!";
      return;
    }

    if (pass.length < 4) {
      $("authMessage").textContent = "Mật khẩu cần ít nhất 4 ký tự.";
      return;
    }

    if (accounts[name.toLowerCase()]) {
      $("authMessage").textContent = "Tên tài khoản đã tồn tại!";
      return;
    }

    const duplicateEmail = Object.values(accounts).some(
      account => account.email === mail
    );

    if (duplicateEmail) {
      $("authMessage").textContent = "Gmail này đã được đăng ký!";
      return;
    }

    accounts[name.toLowerCase()] = {
      username: name,
      email: mail,
      password: pass
    };

    try {
      localStorage.setItem("memeCardAccounts", JSON.stringify(accounts));
    } catch {
      $("authMessage").textContent =
        "Không thể lưu tài khoản. Hãy kiểm tra cài đặt trình duyệt.";
      return;
    }

    showToast("🎉 Đăng ký thành công! Vào game thành công!");
    showHome(name);
    return;
  }

  const account = accounts[name.toLowerCase()];

  if (!account || account.password !== pass) {
    $("authMessage").textContent =
      "Tài khoản hoặc mật khẩu không chính xác!";
    return;
  }

  showToast("✨ Đăng nhập thành công! Vào game thành công!");
  showHome(account.username);
});

// Nút TAP TO START
$("startBtn").addEventListener("click", () => {
  if (currentUser) {
    switchScreen("home");
  } else {
    $("authMessage").textContent =
      "Hãy đăng nhập hoặc đăng ký trước nhé!";
    $("authForm").scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

// Đăng xuất
$("logoutBtn").addEventListener("click", () => {
  currentUser = "";
  switchScreen("login");
  switchAuthMode("login");
  username.value = "";
  email.value = "";
  password.value = "";
  showToast("Bạn đã đăng xuất!");
});

// Đóng cửa sổ
document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => {
    $(button.dataset.close).classList.add("hidden");
  });
});

// MỞ RƯƠNG
$("chestBtn").addEventListener("click", () => {
  if (busy) return;

  $("chestModal").classList.remove("hidden");
  $("openedChest").classList.remove("opening");

  void $("openedChest").offsetWidth;
  $("openedChest").classList.add("opening");

  $("chestMessage").textContent = cardCollected
    ? "Bạn đã nhận lá bài Khá Bảnh rồi!"
    : "Một gói bài đang chờ bạn!";
});

// NHẬN PACK
$("getPackBtn").addEventListener("click", () => {
  if (cardCollected) {
    showToast("Bạn đã sưu tầm lá bài Khá Bảnh!");
    return;
  }

  $("chestModal").classList.add("hidden");
  $("packModal").classList.remove("hidden");

  const pack = $("packBtn");
  pack.classList.remove("tearing");
  packOpened = false;
  $("packMessage").textContent = "Nhấn vào gói bài để mở!";
});

// XÉ PACK
$("packBtn").addEventListener("click", () => {
  if (packOpened || busy || cardCollected) return;

  packOpened = true;
  busy = true;

  const pack = $("packBtn");
  pack.classList.add("tearing");
  $("packMessage").textContent = "Đang mở gói bài...";

  setTimeout(() => {
    $("packModal").classList.add("hidden");

    const cardModal = $("cardModal");
    const card = $("cardReveal");

    card.classList.remove("revealed");
    cardModal.classList.remove("hidden");

    void card.offsetWidth;
    card.classList.add("revealed");

    cardCollected = true;
    busy = false;

    $("collection").textContent = "✨ KHÁ BẢNH — LEGENDARY";
    $("getPackBtn").textContent = "ĐÃ NHẬN LÁ BÀI";
  }, 750);
});

// Trở về màn hình chính
$("backHomeBtn").addEventListener("click", () => {
  $("cardModal").classList.add("hidden");
  switchScreen("home");
  showToast("🎉 Đã thêm Khá Bảnh vào bộ sưu tập!");
});

// Mặc định hiện màn hình đăng nhập
switchAuthMode("login");
switchScreen("login");
