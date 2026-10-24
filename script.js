
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Roboto:wght@400;700&display=swap');

:root {
  --purple: #a855f7;
  --pink: #ff4fd8;
  --blue: #38bdf8;
  --bg: #080718;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  color: white;
  font-family: Roboto, sans-serif;
  background:
    radial-gradient(ellipse at 50% 35%, #32205f 0%, transparent 48%),
    radial-gradient(ellipse at 80% 90%, #20104a 0%, transparent 45%),
    var(--bg);
  overflow-x: hidden;
}

button, input { font: inherit; }
button { cursor: pointer; }

.hidden { display: none !important; }

.screen {
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.login-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 28px 16px;
  text-align: center;
}

.logo {
  font: 900 clamp(38px, 8vw, 72px) Orbitron, sans-serif;
  letter-spacing: 4px;
  text-shadow: 0 0 15px var(--purple), 0 0 40px var(--pink);
}

.logo span, .small-logo span { color: var(--pink); }

.subtitle, .eyebrow {
  color: #d7b5ff;
  letter-spacing: 3px;
  font-size: 12px;
}

.auth-box {
  width: min(100%, 390px);
  padding: 28px;
  margin-top: 22px;
  border: 1px solid #a855f788;
  border-radius: 22px;
  background: #120d2ce8;
  box-shadow: 0 0 35px #8b5cf633, inset 0 0 25px #a855f70d;
  backdrop-filter: blur(12px);
}

h2, h1, .small-logo {
  font-family: Orbitron, sans-serif;
}

.auth-box h2 { font-size: 21px; }

#authForm {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

input {
  width: 100%;
  padding: 14px;
  color: white;
  border: 1px solid #5b4b8e;
  border-radius: 10px;
  background: #09071b;
  outline: none;
}

input:focus {
  border-color: var(--pink);
  box-shadow: 0 0 12px #ff4fd855;
}

.main-btn {
  border: 0;
  border-radius: 10px;
  padding: 14px 18px;
  color: white;
  font-weight: 900;
  background: linear-gradient(100deg, #8b5cf6, #ec4899);
  box-shadow: 0 0 18px #a855f755;
  transition: .2s;
}

.main-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 26px #ec489988;
}

.text-btn {
  color: #d9baff;
  border: 0;
  background: none;
  margin-top: 15px;
}

#authMessage {
  color: #86efac;
  min-height: 18px;
  font-size: 13px;
}

.tap-btn {
  margin-top: 25px;
  padding: 16px 32px;
  border: 1px solid #e9d5ff;
  border-radius: 50px;
  color: white;
  background: linear-gradient(90deg, #7c3aed, #db2777);
  font: 900 16px Orbitron, sans-serif;
  box-shadow: 0 0 25px #c084fc99;
  animation: pulse 1.2s infinite alternate;
}

.hint { font-size: 12px; color: #b9aed2; }

@keyframes pulse {
  from { transform: scale(1); filter: brightness(.85); }
  to { transform: scale(1.09); filter: brightness(1.3); }
}

.topbar {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 18px clamp(15px, 5vw, 60px);
  border-bottom: 1px solid #a855f744;
  background: #09071bbf;
}

.small-logo { font-weight: 900; font-size: 19px; }
.player { margin-left: auto; color: #e9d5ff; }
.logout-btn {
  padding: 8px 13px;
  color: white;
  border: 1px solid #6d5a99;
  border-radius: 8px;
  background: #211638;
}

.home-content {
  text-align: center;
  padding: 55px 15px;
}

.home-content h1 {
  font-size: clamp(23px, 5vw, 40px);
  text-shadow: 0 0 20px #a855f7;
}

.description { color: #c4b5fd; }

.chest-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 40px auto;
  padding: 15px;
  border: 0;
  background: transparent;
  color: white;
}

.chest-glow {
  position: absolute;
  width: 190px;
  height: 190px;
  border-radius: 50%;
  background: #a855f744;
  filter: blur(40px);
  animation: pulse 1.5s infinite alternate;
}

.chest-emoji {
  position: relative;
  font-size: 125px;
  filter: drop-shadow(0 0 22px #facc15aa);
  animation: float 2s ease-in-out infinite;
}

.chest-label {
  position: relative;
  padding: 10px 24px;
  border: 1px solid #facc15;
  border-radius: 30px;
  background: #251541;
  font: 700 12px Orbitron, sans-serif;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.inventory {
  width: min(100%, 600px);
  margin: 30px auto 0;
  padding: 20px;
  border: 1px solid #7051a6;
  border-radius: 15px;
  background: #120d2cbb;
}

#collection { color: #c4b5fd; margin-top: 12px; }

.modal {
  position: fixed;
  inset: 0;
  z-index: 5;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow-y: auto;
  background: #03020cdd;
  backdrop-filter: blur(10px);
}

.modal-panel {
  position: relative;
  width: min(100%, 440px);
  padding: 32px 22px;
  text-align: center;
  border: 1px solid #c084fc;
  border-radius: 22px;
  background: linear-gradient(150deg, #241442, #0d0922);
  box-shadow: 0 0 45px #a855f744;
  animation: appear .35s ease-out;
}

@keyframes appear {
  from { opacity: 0; transform: scale(.75) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 14px;
  color: white;
  border: 0;
  background: none;
  font-size: 20px;
}

.opened-chest {
  font-size: 120px;
  margin: 20px;
}

.opened-chest.opening { animation: chestOpen .6s ease-in-out; }

@keyframes chestOpen {
  0%, 100% { transform: rotate(0) scale(1); }
  25% { transform: rotate(-10deg) scale(1.1); }
  50% { transform: rotate(10deg) scale(1.2); filter: brightness(2); }
  75% { transform: rotate(-5deg) scale(1.1); }
}

.pack-btn {
  width: 180px;
  height: 250px;
  margin: 20px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  color: white;
  border: 3px solid #e9d5ff;
  border-radius: 14px 22px 12px 20px;
  background: linear-gradient(135deg, #f472b6, #7c3aed 55%, #1e1b4b);
  box-shadow: 0 0 30px #c084fc88, inset 0 0 20px #fff3;
  transform: rotate(-2deg);
  transition: .3s;
}

.pack-btn span { font-size: 35px; }
.pack-btn strong { font: 900 24px Orbitron, sans-serif; }
.pack-btn small { font-size: 10px; letter-spacing: 2px; }

.pack-btn:hover { transform: rotate(2deg) scale(1.06); }

.pack-btn.tearing { animation: tear .65s forwards; }

@keyframes tear {
  0% { transform: rotate(-2deg) scale(1); opacity: 1; }
  35% { transform: rotate(12deg) scale(1.1); filter: brightness(2); }
  70% { transform: rotate(-16deg) scale(1.12); }
  100% { transform: scale(1.7) rotate(20deg); opacity: 0; }
}

.card-panel { width: min(100%, 470px); }

.card-reveal {
  position: relative;
  width: min(100%, 310px);
  margin: 22px auto;
  padding: 12px;
  border: 3px solid #facc15;
  border-radius: 16px;
  background: linear-gradient(150deg, #713f12, #30134c 65%, #11112b);
  box-shadow: 0 0 18px #facc15aa;
  opacity: 0;
  transform: scale(.3) rotateY(90deg);
}

.card-reveal.revealed {
  animation: cardReveal .9s forwards;
}

@keyframes cardReveal {
  60% { opacity: 1; transform: scale(1.1) rotateY(0); }
  100% { opacity: 1; transform: scale(1) rotateY(0); }
}

.legendary {
  margin: 4px 0 12px;
  color: #fde047;
  font: 900 13px Orbitron, sans-serif;
  letter-spacing: 2px;
}

#khaBanhCard {
  display: block;
  width: 100%;
  max-height: 310px;
  object-fit: contain;
  border-radius: 8px;
  background: #0b071a;
}

.card-reveal h3 {
  margin: 12px 0 5px;
  font: 900 23px Orbitron, sans-serif;
  color: #fde047;
}

.card-type { color: #e9d5ff; font-size: 11px; letter-spacing: 1px; }
.image-error { padding: 25px 8px; color: #fda4af; }

.toast {
  position: fixed;
  z-index: 10;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 90%;
  padding: 14px 20px;
  border: 1px solid #86efac;
  border-radius: 12px;
  color: white;
  background: #14532d;
  box-shadow: 0 0 20px #22c55e55;
  text-align: center;
}

@media (max-width: 480px) {
  .auth-box { padding: 22px 17px; }
  .topbar { flex-wrap: wrap; }
  .home-content { padding-top: 35px; }
}
