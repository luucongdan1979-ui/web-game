
const $ = (id) => document.getElementById(id);

const loginScreen = $("loginScreen");
const gameScreen = $("gameScreen");
const authForm = $("authForm");
const usernameInput = $("username");
const emailInput = $("email");
const emailGroup = $("emailGroup");
const passwordInput = $("password");
const authSubmit = $("authSubmit");
const authNotice = $("authNotice");
const loginTab = $("loginTab");
const registerTab = $("registerTab");
const playerInfo = $("playerInfo");
const logoutBtn = $("logoutBtn");
const modal = $("modal");
const modalContent = $("modalContent");
const modalClose = $("modalClose");
const toast = $("toast");

const CARD_IMAGE =
  "https://raw.githubusercontent.com/luucongdan1979-ui/web-game/main/kh%C3%A1%20b%E1%BA%A3nh%20nv.png";

let authMode = "login";
let currentUser = "";
let busy = false;
let toastTimer;

const getUsers = () => {
  try {
    return JSON.parse(localStorage.getItem("mv_users") || "{}");
  } catch {
    return {};
  }
};

const saveUsers = (users) =>
  localStorage.setItem("mv_users", JSON.stringify(users));

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function setMode(mode) {
  authMode = mode;
  const registering = mode === "register";

  loginTab.classList.toggle("active", !registering);
  registerTab.classList.toggle("active", registering);
  emailGroup.hidden = !registering;
  emailInput.required = registering;
  passwordInput.autocomplete = registering ? "new-password" : "current-password";
  authSubmit.textContent = registering ? "TẠO TÀI KHOẢN ✦" : "ĐĂNG NHẬP ↗";
  authNotice.textContent = registering
    ? "Tạo tài khoản demo để bước vào thế giới ảo ảnh."
    : "Đăng nhập để bước vào thế giới ảo ảnh.";
  authNotice.className = "notice";
}

loginTab.addEventListener("click", () => setMode("login"));
registerTab.addEventListener("click", () => setMode("register"));

authForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const email = emailInput.value.trim().toLowerCase();

  if (username.length < 3 || password.length < 4) {
    authNotice.textContent = "Tên tài khoản cần ít nhất 3 ký tự, mật khẩu ít nhất 4 ký tự.";
    authNotice.className = "notice error";
    return;
  }

  const users = getUsers();

  if (authMode === "register") {
    if (!email) {
      authNotice.textContent = "Vui lòng nhập Gmail.";
      authNotice.className = "notice error";
      return;
    }

    if (users[username]) {
      authNotice.textContent = "Tên tài khoản này đã tồn tại.";
      authNotice.className = "notice error";
      return;
    }

    // Bản demo lưu dữ liệu trên trình duyệt, không phải hệ thống bảo mật.
    users[username] = {
      password,
      email,
      cards: []
    };
    saveUsers(users);

    authNotice.textContent = "Tạo tài khoản thành công! Đang vào game...";
    authNotice.className = "notice success";
  } else {
    if (!users[username] || users[username].password !== password) {
      authNotice.textContent = "Sai tài khoản hoặc mật khẩu.";
      authNotice.className = "notice error";
      return;
    }
  }

  currentUser = username;
  sessionStorage.setItem("mv_session", username);
  setTimeout(showGame, 350);
});

function showGame() {
  loginScreen.hidden = true;
  gameScreen.hidden = false;
  playerInfo.textContent = "✦ " + currentUser.toUpperCase();
  logoutBtn.hidden = false;
  renderCollection();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function logout() {
  sessionStorage.removeItem("mv_session");
  currentUser = "";
  gameScreen.hidden = true;
  loginScreen.hidden = false;
  logoutBtn.hidden = true;
  playerInfo.textContent = "CHƯA ĐĂNG NHẬP";
  closeModal();
}

logoutBtn.addEventListener("click", logout);

function userData() {
  const users = getUsers();
  if (!users[currentUser]) return null;
  return users[currentUser];
}

function saveCard(card) {
  const users = getUsers();
  if (!users[currentUser]) return;

  users[currentUser].cards ||= [];
  users[currentUser].cards.push({
    ...card,
    obtainedAt: new Date().toISOString()
  });

  saveUsers(users);
  renderCollection();
}

function renderCollection() {
  const user = userData();
  const cards = user?.cards || [];
  $("cardCount").textContent = cards.length;

  const collection = $("collection");
  collection.innerHTML = "";

  if (!cards.length) {
    collection.innerHTML =
      '<div class="empty-state">✧ Bộ sưu tập đang chờ lá bài đầu tiên ✧</div>';
    return;
  }

  cards.slice().reverse().forEach((card, index) => {
    const item = document.createElement("article");
    item.className = "mini-card";
    item.style.animationDelay = `${index * 0.06}s`;

    const image = document.createElement("img");
    image.src = card.image;
    image.alt = card.name;
    image.loading = "lazy";
    image.onerror = () => {
      image.style.display = "none";
      item.insertAdjacentHTML(
        "afterbegin",
        '<div class="modal-symbol">幻</div>'
      );
    };

    const name = document.createElement("h3");
    name.textContent = card.name;

    const rarity = document.createElement("div");
    rarity.className = "rarity";
    rarity.textContent = card.rarity;

    item.append(image, name, rarity);
    collection.appendChild(item);
  });
}

function openModal(html) {
  modalContent.innerHTML = html;
  modal.classList.remove("modal-hidden");
  modal.setAttribute("aria-hidden", "false");
  modal.style.display = "grid";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  modalContent.innerHTML = "";
  document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeModal);
modal.querySelector(".modal-backdrop").addEventListener("click", closeModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

function burstEffect(element) {
  const burst = document.createElement("div");
  burst.textContent = "✦";
  Object.assign(burst.style, {
    position: "absolute",
    left: "50%",
    top: "50%",
    zIndex: "5",
    color: "#fff",
    fontSize: "48px",
    pointerEvents: "none",
    animation: "burst .7s ease-out forwards",
    textShadow: "0 0 20px #ff56d9"
  });
  element.appendChild(burst);
  setTimeout(() => burst.remove(), 750);
}

function revealCard() {
  const card = {
    name: "KHÁ BẢNH",
    image: CARD_IMAGE,
    rarity: "✦ ULTRA RARE ✦"
  };

  saveCard(card);

  openModal(`
    <div class="eyebrow">✦ DIMENSION SUMMON COMPLETE ✦</div>
    <h2>THẺ HUYỀN THOẠI!</h2>
    <p>Một nhân vật mới đã xuất hiện trong vũ trụ meme.</p>
    <img class="modal-card-image" src="${CARD_IMAGE}" alt="Thẻ Khá Bảnh"
         onerror="this.style.display='none';document.getElementById('fallbackCard').hidden=false">
    <div class="modal-symbol" id="fallbackCard" hidden>幻</div>
    <h2 style="color:#ff82e8">KHÁ BẢNH</h2>
    <div class="rarity">✦ ULTRA RARE ✦</div>
    <button class="loot-btn pink-btn" id="claimBtn">NHẬN THẺ ✦</button>
  `);

  $("claimBtn").addEventListener("click", () => {
    closeModal();
    notify("Đã thêm Khá Bảnh vào bộ sưu tập!");
  });
}

$("startBtn").addEventListener("click", () => {
  $("chestBtn").scrollIntoView({ behavior: "smooth", block: "center" });
  notify("Chọn rương báu hoặc pack bài để bắt đầu!");
});

$("chestBtn").addEventListener("click", async () => {
  if (busy) return;
  busy = true;

  const button = $("chestBtn");
  const art = $("chestArt");
  button.disabled = true;
  button.textContent = "✧ ĐANG MỞ RƯƠNG...";
  art.classList.remove("opening");
  void art.offsetWidth;
  art.classList.add("opening");
  burstEffect(art);

  await new Promise((resolve) => setTimeout(resolve, 1100));

  openModal(`
    <div class="eyebrow">✦ TREASURE UNLOCKED ✦</div>
    <div class="modal-symbol">♜</div>
    <h2>RƯƠNG BÁU ĐÃ MỞ!</h2>
    <p>Ánh sáng huyền bí tràn ra từ chiếc rương.</p>
    <button class="loot-btn" id="chestReward">NHẬN QUÀ ✦</button>
  `);

  $("chestReward").addEventListener("click", () => {
    closeModal();
    notify("Bạn nhận được 100 điểm năng lượng ảo ảnh!");
  });

  button.disabled = false;
  button.textContent = "✧ MỞ RƯƠNG ✧";
  busy = false;
});

$("packBtn").addEventListener("click", async () => {
  if (busy) return;
  busy = true;

  const button = $("packBtn");
  const stage = $("packArt");
  button.disabled = true;
  button.textContent = "✦ ĐANG XÉ PACK...";
  stage.classList.remove("tearing", "torn");
  void stage.offsetWidth;
  stage.classList.add("tearing");

  burstEffect(stage);
  await new Promise((resolve) => setTimeout(resolve, 750));

  stage.classList.add("torn");
  await new Promise((resolve) => setTimeout(resolve, 350));

  revealCard();

  button.disabled = false;
  button.textContent = "✦ XÉ PACK ✦";
  busy = false;

  setTimeout(() => stage.classList.remove("tearing", "torn"), 500);
});

// Tạo sao chuyển động trong nền.
const stars = $("stars");
for (let i = 0; i < 85; i++) {
  const star = document.createElement("span");
  star.className = "star";
  star.style.left = `${Math.random() * 100}%`;
  star.style.top = `${Math.random() * 100}%`;
  star.style.animationDelay = `${Math.random() * 3}s`;
  star.style.animationDuration = `${1.2 + Math.random() * 3}s`;
  stars.appendChild(star);
}

// Khôi phục phiên đăng nhập trong cùng trình duyệt.
const savedSession = sessionStorage.getItem("mv_session");
if (savedSession && getUsers()[savedSession]) {
  currentUser = savedSession;
  showGame();
}
