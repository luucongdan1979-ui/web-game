// Chuyển tab đăng nhập / đăng ký / admin
function switchTab(tabName) {
    document.querySelectorAll('.form-box').forEach(box => box.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    if (tabName === 'login') {
        document.getElementById('login-form').classList.add('active');
        event.target.classList.add('active');
    } else if (tabName === 'register') {
        document.getElementById('register-form').classList.add('active');
        event.target.classList.add('active');
    } else if (tabName === 'admin') {
        document.getElementById('admin-form').classList.add('active');
        event.target.classList.add('active');
    }
}

// Xử lý đăng ký
function handleRegister() {
    const user = document.getElementById('reg-user').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    if (!user || !email || !pass) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }

    localStorage.setItem('registeredUser', user);
    localStorage.setItem('registeredPass', pass);
    alert("Đăng ký thành công! Hãy đăng nhập để nhận rương tân thủ.");
    switchTab('login');
}

// Xử lý đăng nhập thường
function handleLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    if (user === "admin" && pass === "171113") {
        loginSuccess(true);
        return;
    }

    const savedUser = localStorage.getItem('registeredUser');
    const savedPass = localStorage.getItem('registeredPass');

    if ((user === savedUser && pass === savedPass) || (user && pass)) {
        loginSuccess(false);
    } else {
        alert("Sai tài khoản hoặc mật khẩu!");
    }
}

// Xử lý đăng nhập Admin Code (mã 6 số: 171113)
function handleAdminLogin() {
    const code = document.getElementById('admin-code-input').value;
    if (code === "171113") {
        alert("Đăng nhập Admin thành công!");
        loginSuccess(true);
    } else {
        alert("Mã Admin Code không đúng! (Gợi ý: 171113)");
    }
}

// Chuyển sang màn hình chính
function loginSuccess(isAdmin) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
}

// Mở rương tân thủ (50/50 giữa Khá Bảnh và Jack)
function openChest() {
    document.getElementById('chest-box').style.display = 'none';
    document.getElementById('reward-result').classList.remove('hidden');

    // 50/50 tỷ lệ
    const isKhaBanh = Math.random() < 0.5;
    
    const rewardImg = document.getElementById('reward-img');
    const rewardName = document.getElementById('reward-name');

    if (isKhaBanh) {
        rewardImg.src = "nv.png"; // Đảm bảo bạn có file ảnh nv.png cùng thư mục hoặc đúng đường dẫn
        rewardName.innerText = "Lá Bài: Khá Bảnh";
    } else {
        rewardImg.src = "jack.png"; // Đảm bảo bạn có file ảnh jack.png
        rewardName.innerText = "Lá Bài: Jack 50/50";
    }
}

function closeChestModal() {
    document.getElementById('beginner-chest-modal').classList.add('hidden');
}

// Chức năng taskbar
function openShop() {
    alert("Tính năng Shop đang phát triển!");
}

function openAlbum() {
    alert("Tính năng Album thẻ bài đang phát triển!");
}

function logout() {
    location.reload();
}
