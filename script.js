
const STORAGE_KEY = "cardArena_rebuild_v1";

const cards = {
  kha: {
    id: "kha",
    name: "Khá Bảnh",
    rarity: "Rare",
    category: "character",
    image: "khá bảnh nv.png"
  },
  jack: {
    id: "jack",
    name: "Jack",
    rarity: "Legendary",
    category: "character",
    image: "jack nv.png"
  }
};

let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
let currentUser = null;
let selectedPack = null;
let selectedPackId = null;
let selectedAlbumFilter = "all";
let starterStep = 0;

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function message(text) {
  document.getElementById("authMessage").textContent = text;
}

function register() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;

  if (!user || !pass) return message("Vui lòng nhập đầy đủ thông tin!");
  if (user.toLowerCase() === "admin") return message("Tên tài khoản không hợp lệ!");
  if (data[user]) return message("Tài khoản đã tồn tại!");

  data[user] = {
    password: pass,
    coins: 20,
    ownedCards: [],
    bag: [],
    starterClaimed: false
  };

  save();
  currentUser = user;
  enterGame();
  document.getElementById("starterOverlay").classList.remove("hidden");
}

function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;

  if (!data[user] || data[user].password !== pass) {
    return message("Tên tài khoản hoặc mật khẩu không đúng!");
  }

  currentUser = user;
  enterGame();
}

function adminLogin() {
  const code = prompt("Nhập mã Admin:");
  if (code !== "171113") return message("Mã Admin không chính xác!");

  currentUser = "ADMIN";
  enterGame();
  document.getElementById("adminNav").classList.remove("hidden");
}

function enterGame() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");
  document.getElementById("playerName").textContent = currentUser;
  showPage("homePage");
  updateCoins();
  renderBag();
  renderAlbum();

  if (currentUser !== "ADMIN" && !data[currentUser].starterClaimed) {
    document.getElementById("starterOverlay").classList.remove("hidden");
  }
}

function profile() {
  return data[currentUser];
}

function updateCoins() {
  document.getElementById("coins").textContent =
    currentUser === "ADMIN" ? "∞" : profile().coins;
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });
  document.getElementById(pageId).classList.remove("hidden");
  if (pageId === "bagPage") renderBag();
  if (pageId === "albumPage") renderAlbum();
}

function logout() {
  currentUser = null;
  document.getElementById("gameScreen").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("adminNav").classList.add("hidden");
}

function showStarterPack() {
  if (starterStep !== 0) return;
  starterStep = 1;
  document.getElementById("starterChest").classList.add("hidden");
  document.getElementById("starterPack").classList.remove("hidden");
  document.getElementById("starterHint").textContent =
    "Nhấn vào pack để xé và nhận thẻ!";
}

function openStarterPack() {
  if (starterStep !== 1) return;
  starterStep = 2;

  const cardId = Math.random() < 0.6 ? "kha" : "jack";
  profile().ownedCards.push(cardId);
  profile().starterClaimed = true;
  save();

  const card = cards[cardId];
  document.getElementById("starterPack").classList.add("tear-animation");

  setTimeout(() => {
    document.getElementById("starterPack").classList.add("hidden");
    document.getElementById("starterResult").innerHTML =
      `<h3>BẠN NHẬN ĐƯỢC</h3>
       <div class="card-item">
         <div class="card-art">
           <img src="${card.image}" alt="${card.name}"
             onerror="this.style.display='none';this.parentElement.textContent='${card.name}'">
         </div>
         <h3>${card.name}</h3>
         <p class="rarity">${card.rarity}</p>
       </div>`;
    document.getElementById("continueButton").classList.remove("hidden");
    renderAlbum();
  }, 650);
}

function closeStarter() {
  document.getElementById("starterOverlay").classList.add("hidden");
  starterStep = 0;
  document.getElementById("starterResult").innerHTML = "";
  document.getElementById("starterPack").classList.remove("tear-animation");
  document.getElementById("starterPack").classList.add("hidden");
  document.getElementById("starterChest").classList.remove("hidden");
  document.getElementById("continueButton").classList.add("hidden");
}

function buyPack(type) {
  const price = type === "basic" ? 10 : 20;
  if (currentUser !== "ADMIN" && profile().coins < price) {
    alert("Bạn không đủ coin!");
    return;
  }

  if (currentUser !== "ADMIN") {
    profile().coins -= price;
    updateCoins();
  }

  const pack = {
    id: Date.now() + Math.random(),
    type
  };

  if (currentUser !== "ADMIN") {
    profile().bag.push(pack);
    save();
  }

  renderBag();
  alert("Đã thêm pack vào Balo!");
}

function renderBag() {
  const container = document.getElementById("bagItems");
  if (currentUser === "ADMIN") {
    container.innerHTML = "<p>Admin có quyền mở pack miễn phí.</p>";
    return;
  }

  const bag = profile().bag;
  if (!bag.length) {
    container.innerHTML = "<p>Balo đang trống. Hãy đến Shop mua pack nhé!</p>";
    return;
  }

  container.innerHTML = bag.map(pack => `
    <div class="pack-card">
      <div class="pack ${pack.type === "basic" ? "basic-pack" : "premium-pack"}"
        onclick="selectPack('${pack.id}')">
        ${pack.type.toUpperCase()}<br>PACK
      </div>
      <p>Nhấn để xem pack</p>
    </div>
  `).join("");
}

function selectPack(id) {
  selectedPackId = id;
  selectedPack = profile().bag.find(p => String(p.id) === String(id));
  if (!selectedPack) return;

  const preview = document.getElementById("packPreview");
  const packElement = document.getElementById("previewPack");

  packElement.className = "pack preview-pack " +
    (selectedPack.type === "basic" ? "basic-pack" : "premium-pack");

  packElement.innerHTML = selectedPack.type.toUpperCase() + "<br>PACK";
  document.getElementById("previewTitle").textContent =
    selectedPack.type === "basic" ? "BASIC PACK" : "PREMIUM PACK";

  preview.classList.remove("hidden");
}

function closePreview() {
  document.getElementById("packPreview").classList.add("hidden");
}

function tearPack() {
  if (!selectedPack) return;

  const button = document.getElementById("tearButton");
  button.disabled = true;
  const packElement = document.getElementById("previewPack");
  packElement.classList.add("tear-animation");

  setTimeout(() => {
    const cardId = selectedPack.type === "basic"
      ? (Math.random() < 0.7 ? "kha" : "jack")
      : (Math.random() < 0.4 ? "kha" : "jack");

    profile().ownedCards.push(cardId);
    profile().bag = profile().bag.filter(
      p => String(p.id) !== String(selectedPackId)
    );

    save();
    closePreview();
    button.disabled = false;
    packElement.classList.remove("tear-animation");

    selectedPack = null;
    selectedPackId = null;

    const card = cards[cardId];
    alert("Bạn nhận được: " + card.name + " (" + card.rarity + ")");
    renderBag();
    renderAlbum();
  }, 700);
}

function filterAlbum(filter) {
  selectedAlbumFilter = filter;
  renderAlbum();
}

function renderAlbum() {
  const container = document.getElementById("albumItems");
  if (currentUser === "ADMIN") {
    container.innerHTML = Object.values(cards).map(card => cardHTML(card)).join("");
    return;
  }

  const owned = profile().ownedCards;
  const unique = [...new Set(owned)].map(id => cards[id]).filter(Boolean);

  const filtered = selectedAlbumFilter === "all"
    ? unique
    : unique.filter(card => card.category === selectedAlbumFilter);

  container.innerHTML = filtered.length
    ? filtered.map(card => cardHTML(card)).join("")
    : "<p>Chưa có thẻ bài trong mục này.</p>";
}

function cardHTML(card) {
  return `
    <div class="card-item">
      <div class="card-art">
        <img src="${card.image}" alt="${card.name}"
          onerror="this.style.display='none';this.parentElement.textContent='${card.name}'">
      </div>
      <h3>${card.name}</h3>
      <p class="rarity">${card.rarity}</p>
      <small>Nhân vật</small>
    </div>
  `;
}

function addCoins() {
  if (currentUser !== "ADMIN") return;
  const user = prompt("Nhập tên tài khoản muốn cộng coin:");
  if (!data[user]) return alert("Không tìm thấy tài khoản!");

  data[user].coins += 1000;
  save();
  alert("Đã cộng 1000 coin!");
}

function addAllCards() {
  if (currentUser !== "ADMIN") return;
  const user = prompt("Nhập tên tài khoản:");
  if (!data[user]) return alert("Không tìm thấy tài khoản!");

  data[user].ownedCards = Object.keys(cards);
  save();
  alert("Đã mở khóa các thẻ hiện có!");
}

function resetGame() {
  if (currentUser !== "ADMIN") return;
  if (!confirm("Bạn có chắc muốn xóa toàn bộ dữ liệu game?")) return;

  localStorage.removeItem(STORAGE_KEY);
  data = {};
  alert("Đã reset dữ liệu. Hãy tải lại trang.");
  location.reload();
}
