// Khai báo phần tử HTML
const modalOverlay = document.getElementById('modal-overlay');
const cardLogin = document.getElementById('card-login');
const cardRegister = document.getElementById('card-register');

const btnOpenLogin = document.getElementById('btn-open-login');
const btnOpenRegister = document.getElementById('btn-open-register');
const btnTapStart = document.getElementById('btn-tap-start');

const btnBackLogin = document.getElementById('btn-back-login');
const btnBackReg = document.getElementById('btn-back-reg');

const goToLogin = document.getElementById('go-to-login');
const goToReg = document.getElementById('go-to-reg');

// Mở Đăng Nhập
function showLogin() {
  modalOverlay.classList.remove('hidden');
  cardLogin.classList.remove('hidden');
  cardRegister.classList.add('hidden');
}

// Mở Đăng Ký
function showRegister() {
  modalOverlay.classList.remove('hidden');
  cardRegister.classList.remove('hidden');
  cardLogin.classList.add('hidden');
}

// Tắt Popup Modal
function closeModal() {
  modalOverlay.classList.add('hidden');
  cardLogin.classList.add('hidden');
  cardRegister.classList.add('hidden');
}

// Bấm nút Đăng Nhập / Đăng Ký
btnOpenLogin.addEventListener('click', showLogin);
btnOpenRegister.addEventListener('click', showRegister);
btnTapStart.addEventListener('click', showLogin); // Bấm Tap to start mở Đăng nhập

// Nút mũi tên quay lại
btnBackLogin.addEventListener('click', closeModal);
btnBackReg.addEventListener('click', closeModal);

// Chuyển đổi giữa Đăng Nhập & Đăng Ký trong Form
goToLogin.addEventListener('click', (e) => {
  e.preventDefault();
  showLogin();
});

goToReg.addEventListener('click', (e) => {
  e.preventDefault();
  showRegister();
});
