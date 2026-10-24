const screenMain = document.getElementById('screen-main');
const screenRegister = document.getElementById('screen-register');
const screenLobby = document.getElementById('screen-lobby');

const toRegBtn = document.getElementById('to-reg-btn');
const submitRegBtn = document.getElementById('submit-reg-btn');
const usernameInput = document.getElementById('username');
const nameOutput = document.getElementById('name-output');

const chestBox = document.getElementById('chest-box');
const packBox = document.getElementById('pack-box');
const cardBox = document.getElementById('card-box');

// 1. Bấm nút từ trang chính sang trang đăng ký
toRegBtn.addEventListener('click', () => {
  screenMain.classList.add('hidden');
  screenRegister.classList.remove('hidden');
});

// 2. Bấm nút xác nhận đăng ký -> Vào sảnh hiện rương
submitRegBtn.addEventListener('click', () => {
  const nameVal = usernameInput.value.trim();
  nameOutput.textContent = nameVal !== "" ? nameVal : "Tân Thủ";

  screenRegister.classList.add('hidden');
  screenLobby.classList.remove('hidden');
});

// 3. Bấm vào Rương -> Hiển thị Gói Thẻ
chestBox.addEventListener('click', () => {
  chestBox.classList.add('hidden');
  packBox.classList.remove('hidden');
});

// 4. Bấm vào Gói Thẻ -> Mở ra lá bài Khá Bảnh
packBox.addEventListener('click', () => {
  packBox.classList.add('hidden');
  cardBox.classList.remove('hidden');
});
