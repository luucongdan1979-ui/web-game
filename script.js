
const $ = id => document.getElementById(id);

const IMAGE =
  "https://raw.githubusercontent.com/luucongdan1979-ui/web-game/main/kh%C3%A1%20b%E1%BA%A3nh%20nv.png";

let mode = "login";

$("email").hidden = true;

function getUsers() {
  return JSON.parse(localStorage.getItem("memeUsers") || "{}");
}

function register() {
  const username = $("username").value.trim();
  const password = $("password").value;
  const email = $("email");

  if (email.hidden) {
    email.hidden = false;
    $("message").textContent = "Nhập Gmail rồi bấm Đăng ký lần nữa nhé!";
    return;
  }

  if (!username || !email.value || password.length < 6) {
    $("message").textContent = "Hãy nhập đủ thông tin, mật khẩu ít nhất 6 ký tự.";
    return;
  }

  const users = getUsers();
  const key = username.toLowerCase();

  if (users[key]) {
    $("message").textContent = "Tên tài khoản đã tồn tại!";
    return;
  }

  users[key] = {
    username,
    email: email.value,
    password
  };

  localStorage.setItem("memeUsers", JSON.stringify(users));
  localStorage.setItem("memePlayer", username);
  enterGame(username);
}

function login() {
  const username = $("username").value.trim();
  const password = $("password").value;
  const user = getUsers()[username.toLowerCase()];

  if (!user || user.password !== password) {
    $("message").textContent = "Sai tài khoản hoặc mật khẩu. Hãy đăng ký trước!";
    return;
  }

  localStorage.setItem("memePlayer", user.username);
  enterGame(user.username);
}

function enterGame(username) {
  $("loginScreen").hidden = true;
  $("gameScreen").hidden = false;
  $("player").textContent = username;
  $("message").textContent = "";
  renderCollection();
}

function logout() {
  localStorage.removeItem("memePlayer");
  $("gameScreen").hidden = true;
  $("loginScreen").hidden = false;
}

function openModal(title, body, buttons) {
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = body;
  $("modalButtons").innerHTML = buttons;
  $("modal").hidden = false;
}

function closeModal() {
  $("modal").hidden = true;
}

function openChest() {
  openModal(
    "🎁 RƯƠNG BÁU ĐÃ MỞ!",
    '<div class="emoji">✨🎁✨</div><p>Bạn tìm thấy một gói thẻ bí ẩn!</p>',
    '<button onclick="openPack()">NHẬN GÓI THẺ →</button>'
  );
}

function openPack() {
  openModal(
    "💥 XÉ GÓI THẺ!",
    '<div id="pack" class="emoji">🃏</div><p>Khám phá nhân vật bên trong!</p>',
    '<button onclick="revealCard()">XÉ GÓI NGAY ✦</button>'
  );
}

function revealCard() {
  $("modalBody").innerHTML =
    '<div class="emoji reveal">🌟</div><p>ĐANG TRIỆU HỒI...</p>';

  setTimeout(() => {
    openModal(
      "⭐ THẺ HUYỀN THOẠI!",
      `<div class="owned-card reveal">
        <img src="${IMAGE}" alt="Khá Bảnh"
          onerror="this.alt='Không tải được ảnh';this.style.height='60px'">
        <h3>KHÁ BẢNH</h3>
        <p>✦ MEME LEGEND ✦</p>
      </div>`,
      '<button onclick="saveCard()">LƯU THẺ ✓</button>' +
      '<button onclick="openPack()">MỞ GÓI KHÁC ↻</button>'
    );
  }, 700);
}

function saveCard() {
  const cards = JSON.parse(localStorage.getItem("memeCards") || "[]");

  cards.push({
    name: "Khá Bảnh",
    image: IMAGE,
    rarity: "MEME LEGEND",
    date: new Date().toLocaleDateString("vi-VN")
  });

  localStorage.setItem("memeCards", JSON.stringify(cards));
  closeModal();
  renderCollection();
}

function renderCollection() {
  const cards = JSON.parse(localStorage.getItem("memeCards") || "[]");

  $("count").textContent = cards.length;
  $("collection").innerHTML = cards.map(card => `
    <article class="owned-card">
      <img src="${card.image}" alt="${card.name}">
      <h3>${card.name}</h3>
      <p>✦ ${card.rarity} ✦</p>
      <small>${card.date}</small>
    </article>
  `).join("");
}

const savedPlayer = localStorage.getItem("memePlayer");
if (savedPlayer) enterGame(savedPlayer);
