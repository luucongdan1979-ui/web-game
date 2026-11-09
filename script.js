// Chuyển Tab Đăng nhập / Đăng ký / Admin
function switchAuthTab(tab) {
    // Ẩn tất cả các form và hủy active tab
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    // Hiển thị form được chọn
    document.getElementById(`form-${tab}`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// Đăng ký
function handleRegister() {
    const user = document.getElementById('reg-user').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();

    if (!user || !email || !pass) {
        alert("⚠️ Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    localStorage.setItem('registeredUser', user);
    localStorage.setItem('registeredPass', pass);
    alert("🎉 Đăng ký thành công! Hãy chuyển sang tab Đăng Nhập.");
    switchAuthTab('login');
}

// Đăng nhập thường
function handleLogin() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    const savedUser = localStorage.getItem('registeredUser');
    const savedPass = localStorage.getItem('registeredPass');

    if ((user && user === savedUser && pass === savedPass) || (user === "admin" && pass === "171113")) {
        enterGame(user);
    } else if (user && pass) {
        // Cho phép vào nếu điền bất kỳ thông tin nào (để test nhanh)
        enterGame(user);
    } else {
        alert("❌ Sai tên tài khoản hoặc mật khẩu!");
    }
}

// Đăng nhập Admin Code (Mã 6 số: 171113)
function handleAdminLogin() {
    const code = document.getElementById('admin-code-input').value.trim();
    if (code === "171113") {
        alert("⚡ Đăng nhập quyền Admin thành công!");
        enterGame("ADMIN");
    } else {
        alert("❌ Mã Admin Code không đúng (Mã đúng: 171113)!");
    }
}

// Chuyển từ màn hình Login sang Màn hình chính
function enterGame(username) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    document.getElementById('display-username').innerText = username;
}

// Mở Rương Tân Thủ (Tỷ lệ 50/50 giữa nv.png và jack.png)
function openChest() {
    document.getElementById('chest-box').style.display = 'none';
    document.getElementById('reward-result').classList.remove('hidden');

    const isKhaBanh = Math.random() < 0.5;
    const rewardImg = document.getElementById('reward-img');
    const rewardName = document.getElementById('reward-name');

    if (isKhaBanh) {
        rewardImg.src = "nv.png"; 
        rewardName.innerText = "Lá Bài: Khá Bảnh";
    } else {
        rewardImg.src = "jack.png"; 
        rewardName.innerText = "Lá Bài: Jack 50/50";
    }
}

// Đóng modal rương tân thủ
function closeChestModal() {
    document.getElementById('beginner-chest-modal').classList.add('hidden');
}

// Chức năng Taskbar
function openShop() {
    alert("🛒 Shop đang cập nhật!");
}

function openAlbum() {
    alert("🃏 Album thẻ bài đang cập nhật!");
}

function logout() {
    location.reload();
}
