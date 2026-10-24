const screenMain = document.getElementById('screen-main');
const screenRegister = document.getElementById('screen-register');
const screenLogin = document.getElementById('screen-login');

const btnToLogin = document.getElementById('btn-to-login');
const btnToRegister = document.getElementById('btn-to-register');
const btnTapStart = document.getElementById('btn-tap-start');

const btnBackFromReg = document.getElementById('btn-back-from-reg');
const btnBackFromLogin = document.getElementById('btn-back-from-login');

const linkRegToLogin = document.getElementById('link-reg-to-login');
const linkLoginToReg = document.getElementById('link-login-to-reg');

// Hàm chuyển đổi màn hình
function showScreen(screenToShow) {
  screenMain.classList.add('hidden');
  screenRegister.classList.add('hidden');
  screenLogin.classList.add('hidden');
  
  screenToShow.classList.remove('hidden');
}

// Gán sự kiện bấm nút
btnToLogin.addEventListener('click', () => showScreen(screenLogin));
btnTapStart.addEventListener('click', () => showScreen(screenLogin));
btnToRegister.addEventListener('click', () => showScreen(screenRegister));

btnBackFromReg.addEventListener('click', () => showScreen(screenMain));
btnBackFromLogin.addEventListener('click', () => showScreen(screenMain));

linkRegToLogin.addEventListener('click', () => showScreen(screenLogin));
linkLoginToReg.addEventListener('click', () => showScreen(screenRegister));
