// Lấy các phần tử HTML
const btnStart = document.getElementById('btn-start');
const authModal = document.getElementById('auth-modal');
const btnClose = document.getElementById('btn-close');

const authChoice = document.getElementById('auth-choice');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');

const btnShowLogin = document.getElementById('btn-show-login');
const btnShowRegister = document.getElementById('btn-show-register');
const linkToReg = document.getElementById('link-to-reg');
const linkToLogin = document.getElementById('link-to-login');

// Khi bấm TAP TO START -> Hiện Modal
btnStart.addEventListener('click', () => {
  authModal.classList.remove('hidden');
  authChoice.classList.remove('hidden');
  formLogin.classList.add('hidden');
  formRegister.classList.add('hidden');
});

// Nút Đóng Modal
btnClose.addEventListener('click', () => {
  authModal.classList.add('hidden');
});

// Chuyển sang Form Đăng Nhập
btnShowLogin.addEventListener('click', () => {
  authChoice.classList.add('hidden');
  formLogin.classList.remove('hidden');
});

// Chuyển sang Form Đăng Ký
btnShowRegister.addEventListener('click', () => {
  authChoice.classList.add('hidden');
  formRegister.classList.remove('hidden');
});

// Chuyển đổi qua lại giữa 2 Form
linkToReg.addEventListener('click', (e) => {
  e.preventDefault();
  formLogin.classList.add('hidden');
  formRegister.classList.remove('hidden');
});

linkToLogin.addEventListener('click', (e) => {
  e.preventDefault();
  formRegister.classList.add('hidden');
  formLogin.classList.remove('hidden');
});
