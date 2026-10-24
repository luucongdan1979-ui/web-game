const screenMain = document.getElementById('screen-main');
const screenRegister = document.getElementById('screen-register');
const screenLogin = document.getElementById('screen-login');
const screenLobby = document.getElementById('screen-game-lobby');

const btnMainLogin = document.getElementById('btn-main-login');
const btnMainReg = document.getElementById('btn-main-reg');
const btnTapStart = document.getElementById('btn-tap-start');

const btnBackFromReg = document.getElementById('btn-back-from-reg');
const btnBackFromLogin = document.getElementById('btn-back-from-login');

const linkRegToLogin = document.getElementById('link-reg-to-login');
const linkLoginToReg = document.getElementById('link-login-to-reg');

const btnSubmitReg = document.getElementById('btn-submit-reg');
const btnSubmitLogin = document.getElementById('btn-submit-login');
const playerNameDisplay = document.getElementById('player-name-display');
const btnLogout = document.getElementById('btn-logout');

// GACHA & POPUP
const btnOpenGacha = document.getElementById('btn-open-gacha');
const gachaModal = document.getElementById('gacha-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const successBanner = document.getElementById('success-banner');

const stepChest = document.getElementById('step-chest');
const stepPack = document.getElementById('step-pack');
const stepCard = document.getElementById('step-card');
const btnCollectCard = document.getElementById('btn-collect-card');

function switchScreen(targetScreen) {
  screenMain.classList.add('hidden');
  screenRegister.classList.add('hidden');
  screenLogin.classList.add('hidden');
  screenLobby.classList.add('hidden');
  targetScreen.classList.remove('hidden');
}

btnMainLogin.addEventListener('click', () => switchScreen(screenLogin));
btnMainReg.addEventListener('click', () => switchScreen(screenRegister));
btnTapStart.addEventListener('click', () => switchScreen(screenLogin));

btnBackFromReg.addEventListener('click', () => switchScreen(screenMain));
btnBackFromLogin.addEventListener('click', () => switchScreen(screenMain));

linkRegToLogin.addEventListener('click', (e) => { e.preventDefault(); switchScreen(screenLogin); });
linkLoginToReg.addEventListener('click', (e) => { e.preventDefault(); switchScreen(screenRegister); });

// --- BẤM NÚT ĐĂNG KÝ (LUÔN ĂN 100%) ---
btnSubmitReg.addEventListener('click', () => {
  const username = document.getElementById('reg-username').value;
  playerNameDisplay.textContent = username || "Tân Thủ";
  
  switchScreen(screenLobby);

  gachaModal.classList.remove('hidden');
  successBanner.classList.remove('hidden');
  stepChest.classList.remove('hidden');
  stepPack.classList.add('hidden');
  stepCard.classList.add('hidden');
});

// --- BẤM NÚT ĐĂNG NHẬP ---
btnSubmitLogin.addEventListener('click', () => {
  const username = document.getElementById('login-username').value;
  playerNameDisplay.textContent = username || "Tân Thủ";
  switchScreen(screenLobby);
});

btnLogout.addEventListener('click', () => switchScreen(screenMain));

btnOpenGacha.addEventListener('click', () => {
  gachaModal.classList.remove('hidden');
  successBanner.classList.add('hidden');
  stepChest.classList.remove('hidden');
  stepPack.classList.add('hidden');
  stepCard.classList.add('hidden');
});

stepChest.addEventListener('click', () => {
  successBanner.classList.add('hidden');
  stepChest.classList.add('hidden');
  stepPack.classList.remove('hidden');
});

stepPack.addEventListener('click', () => {
  stepPack.classList.add('hidden');
  stepCard.classList.remove('hidden');
});

btnCollectCard.addEventListener('click', () => {
  gachaModal.classList.add('hidden');
});

btnCloseModal.addEventListener('click', () => {
  gachaModal.classList.add('hidden');
});
