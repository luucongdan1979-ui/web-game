* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
}

body, html {
  width: 100%;
  height: 100%;
  font-family: 'Montserrat', sans-serif;
  overflow: hidden;
}

/* Nền game lấy từ ảnh bạn tải lên */
.game-background {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: url('bg-game.jpg') no-repeat center center/cover;
  z-index: 1;
}

/* Nút Cài đặt & Âm thanh góc phải */
.top-controls {
  position: absolute;
  top: 20px; right: 25px;
  z-index: 10;
  display: flex;
  gap: 12px;
}

.icon-btn {
  background: rgba(20, 25, 60, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  width: 42px; height: 42px;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  backdrop-filter: blur(5px);
  transition: 0.2s;
}
.icon-btn:hover { transform: scale(1.1); background: rgba(60, 80, 150, 0.8); }

/* Logo & Slogan bên trái */
.logo-container {
  position: absolute;
  top: 30px; left: 40px;
  z-index: 5;
}

.game-logo {
  font-family: 'Caveat', cursive;
  font-size: 64px;
  color: #ffffff;
  text-shadow: 0 0 15px #7a82ff, 0 0 30px #414bff, 3px 3px 5px #000;
  line-height: 0.9;
}

.game-subtitle {
  color: #e0e6ff;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1px;
  margin-top: 5px;
  text-shadow: 1px 1px 3px #000;
}

/* Nút Đăng nhập / Đăng ký góc dưới bên trái */
.left-action-buttons {
  position: absolute;
  bottom: 80px; left: 40px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pill-btn {
  background: rgba(25, 30, 75, 0.65);
  border: 1.5px solid rgba(160, 180, 255, 0.5);
  color: #ffffff;
  padding: 10px 28px;
  border-radius: 30px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  transition: 0.3s;
}

.pill-btn:hover {
  background: rgba(60, 80, 180, 0.85);
  border-color: #8bb2ff;
  transform: translateX(5px);
}

/* Nút TAP TO START */
.tap-start-container {
  position: absolute;
  top: 42%; right: 12%;
  z-index: 5;
}

.tap-start-btn {
  background: linear-gradient(90deg, rgba(40, 60, 160, 0.8), rgba(110, 70, 210, 0.8));
  border-top: 3px solid #bce3ff;
  border-bottom: 3px solid #bce3ff;
  border-left: none;
  border-right: none;
  color: #ffffff;
  font-family: 'Montserrat', sans-serif;
  font-size: 32px;
  font-weight: 800;
  font-style: italic;
  padding: 14px 50px;
  border-radius: 40px;
  cursor: pointer;
  backdrop-filter: blur(6px);
  box-shadow: 0 0 25px rgba(110, 140, 255, 0.7), inset 0 0 15px rgba(255, 255, 255, 0.4);
  animation: pulseButton 1.5s infinite ease-in-out;
  text-shadow: 0 0 10px #ffffff;
}

@keyframes pulseButton {
  0% { transform: scale(1); box-shadow: 0 0 20px rgba(110, 140, 255, 0.6); }
  50% { transform: scale(1.08); box-shadow: 0 0 35px rgba(160, 200, 255, 0.9); }
  100% { transform: scale(1); box-shadow: 0 0 20px rgba(110, 140, 255, 0.6); }
}

/* POPUP FORM MODAL */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(10, 12, 30, 0.6);
  backdrop-filter: blur(6px);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
}

.auth-card {
  background: rgba(235, 240, 255, 0.85);
  border: 3px solid #a2c4ff;
  border-radius: 24px;
  width: 480px;
  padding: 35px 30px 25px 30px;
  position: relative;
  box-shadow: 0 20px 50px rgba(0, 10, 40, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  animation: popIn 0.3s ease-out;
}

@keyframes popIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.back-btn {
  position: absolute;
  top: 15px; left: 20px;
  background: rgba(50, 70, 150, 0.8);
  border: 1px solid #fff;
  color: #fff;
  width: 32px; height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-weight: bold;
}

.card-title {
  text-align: center;
  color: #1a2556;
  font-size: 26px;
  font-weight: 800;
}

.card-sub {
  text-align: center;
  color: #556080;
  font-size: 12px;
  margin-bottom: 25px;
}

/* Input Fields */
.input-field {
  background: rgba(255, 255, 255, 0.9);
  border: 1.5px solid #bdcaff;
  border-radius: 12px;
  padding: 10px 14px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-field input {
  border: none;
  background: transparent;
  width: 100%;
  outline: none;
  font-size: 14px;
  color: #1a2556;
}

.field-icon, .field-end-icon { color: #6b7abb; }

/* Submit Button */
.submit-btn {
  width: 100%;
  padding: 13px;
  border-radius: 30px;
  border: none;
  background: linear-gradient(90deg, #3a62d7, #6c42d7);
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  box-shadow: 0 6px 18px rgba(60, 80, 200, 0.4);
  transition: 0.2s;
}

.submit-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }

.switch-link, .switch-text {
  text-align: center;
  margin-top: 18px;
  font-size: 12px;
  color: #556080;
}

.switch-link a, .switch-text a {
  color: #2b52d2;
  font-weight: 700;
  text-decoration: none;
}

.hidden { display: none !important; }
