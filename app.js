// ใส่ URL Web App ที่ได้จาก Google Apps Script ที่นี่
// ==========================================
// 1. ตั้งค่าพื้นฐาน (Configuration)
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxTHBDk2j--fcL4tnQo5YH8KRlm0SMvjDK6YqKMhkZPk5GCWOXM8g8xeoeQtxw3ns__zA/exec";
// ==========================================

// ตัวแปรระบบ
let currentEvents = [];
let currentSongs = [];
let activeEvent = null;
let selectedSongId = null;

// ตัวแปรระบุตัวตน (Authentication)
let userUUID = localStorage.getItem('delia_uuid') || "";
let userName = localStorage.getItem('delia_username') || "";
let isAdminLoggedIn = false;

// โหลดข้อมูลเมื่อเปิดหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
  updateUserUI();
  loadEvents();
});

// ==========================================
// 2. ระบบระบุตัวตน (Authentication & UI)
// ==========================================
function updateUserUI() {
  const greeting = document.getElementById('user-greeting');
  const btnLogin = document.getElementById('btn-user-login');
  
  if (isAdminLoggedIn) {
    greeting.innerText = "👑 Admin Mode";
    greeting.classList.remove('hidden');
    btnLogin.classList.add('hidden');
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    document.getElementById('btn-admin-login').classList.add('hidden');
  } else if (userUUID && userName) {
    greeting.innerText = `👋 สวัสดี, ${userName}`;
    greeting.classList.remove('hidden');
    btnLogin.classList.add('hidden');
  } else {
    greeting.classList.add('hidden');
    btnLogin.classList.remove('hidden');
  }
}

function executeUserLogin() {
  const nameInput = document.getElementById('login-username').value.trim();
  if (!nameInput) return showToast("ข้อผิดพลาด", "กรุณากรอกชื่อผู้ใช้งาน", "error");
  
  const btn = document.getElementById('btn-user-login-submit');
  btn.innerText = "กำลังเข้าสู่ระบบ..."; btn.disabled = true;

  fetchAPI("userAuth", { username: nameInput }, res => {
    userUUID = res.uuid;
    userName = res.username;
    localStorage.setItem('delia_uuid', userUUID);
    localStorage.setItem('delia_username', userName);
    
    updateUserUI();
    closeModal('userLoginModal');
    showToast("เข้าสู่ระบบสำเร็จ", `ยินดีต้อนรับ ${userName}`, "success");
    btn.innerText = "เข้าสู่ระบบ"; btn.disabled = false;
  }, () => {
    btn.innerText = "เข้าสู่ระบบ"; btn.disabled = false;
  });
}

function handleLogin() {
  const u = document.getElementById('admin-user').value;
  const p = document.getElementById('admin-pass').value;
  const btn = document.getElementById('btn-login-submit');
  
  btn.innerText = "กำลังตรวจสอบ..."; btn.disabled = true;
  fetchAPI("adminLogin", { username: u, password: p }, res => {
    if (res.auth) {
      isAdminLoggedIn = true;
      updateUserUI();
      closeModal('adminLoginModal');
      showToast("เข้าสู่ระบบสำเร็จ", "คุณอยู่ในโหมด Admin", "success");
    }
    btn.innerText = "เข้าสู่ระบบ"; btn.disabled = false;
  }, () => {
    btn.innerText = "เข้าสู่ระบบ"; btn.disabled = false;
  });
}

// ==========================================
// 3. ระบบเชื่อมต่อฐานข้อมูล (API Fetcher)
// ==========================================
function fetchAPI(action, payload, onSuccess, onError) {
  fetch(apiURL, {
    method: "POST",
    body: JSON.stringify({ action: action, payload: payload })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) { onSuccess(data.data); } 
    else { 
      showToast("เกิดข้อผิดพลาด", data.message, "error"); 
      if (onError) onError(); 
    }
  })
  .catch(err => {
    console.error(err);
    showToast("การเชื่อมต่อล้มเหลว", "โปรดตรวจสอบอินเทอร์เน็ต", "error");
    if (onError) onError();
  });
}

// ==========================================
// 4. ระบบการแสดงผล UI & แจ้งเตือน (Views & Modals)
// ==========================================
function showView(viewId) {
  document.getElementById('view-calendar').classList.add('hidden');
  document.getElementById('view-songs').classList.add('hidden');
  document.getElementById('view-playlist').classList.add('hidden');
  document.getElementById('view-' + viewId).classList.remove('hidden');
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function showToast(title, message, type = "success") {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-xmark"></i>';
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-body"><h4>${title}</h4><p>${message}</p></div>
  `;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'slideInRight 0.3s reverse forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ระบบ Custom Confirm แทน alert/confirm
let confirmCallback = null;
function showCustomConfirm(title, message, callback) {
  document.getElementById('custom-confirm-title').innerText = title;
  document.getElementById('custom-confirm-message').innerText = message;
  confirmCallback = callback;
  openModal('customConfirmModal');
}
document.getElementById('btn-custom-confirm-ok').addEventListener('click', () => {
  if (confirmCallback) confirmCallback();
  closeModal('customConfirmModal');
});

// ==========================================
// 5. ระบบอีเวนต์ปฏิทิน (Calendar)
// ==========================================
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function loadEvents() {
  document.getElementById('calendar-grid').innerHTML = `<div class="loader"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;
  fetchAPI("getEvents", {}, res => { currentEvents = res; renderCalendar(); }, () => {
    document.getElementById('calendar-grid').innerHTML = `<p class="text-center text-muted">โหลดข้อมูลไม่สำเร็จ</p>`;
  });
}

function renderCalendar() {
  const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  document.getElementById('month-year-display').innerText = `${months[currentMonth]} ${currentYear + 543}`;
  
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';
  
  const filteredEvents = currentEvents.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  if (filteredEvents.length === 0) {
    grid.innerHTML = `<p class="text-center text-muted" style="grid-column: 1/-1; padding: 30px;">ไม่มีกำหนดการในเดือนนี้</p>`;
    return;
  }

  filteredEvents.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(e => {
    const card = document.createElement('div');
    card.className = `event-card ${e.status === 'Closed' ? 'closed' : ''}`;
    const dateObj = new Date(e.date);
    const dateStr = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear() + 543}`;
    
    card.innerHTML = `
      <div class="event-date">${dateStr} ${e.status === 'Closed' ? '<span style="color:red; font-size:0.8rem;">(ปิดรับเพลง)</span>' : ''}</div>
      <div class="event-title">${e.name}</div>
      <div class="event-loc"><i class="fa-solid fa-location-dot"></i> ${e.location}</div>
    `;
    card.onclick = () => openEventIntro(e);
    grid.appendChild(card);
  });
}

function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  else if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
}

function openEventIntro(event) {
  activeEvent = event;
  const d = new Date(event.date);
  const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  
  document.getElementById('intro-title').innerText = event.name;
  document.getElementById('intro-date').innerText = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  document.getElementById('intro-loc').innerText = event.location;
  document.getElementById('intro-time').innerText = `${event.openTime} - ${event.closeTime}`;
  document.getElementById('intro-det').innerText = event.details || "-";
  
  openModal('eventIntroModal');
}

// ==========================================
// 6. ระบบเพลง (Songs & Voting)
// ==========================================
function enterSongList() {
  closeModal('eventIntroModal');
  document.getElementById('view-event-title').innerText = activeEvent.name;
  
  if (activeEvent.status === 'Closed') {
    document.getElementById('view-event-status').innerHTML = '<span style="color:var(--danger)"><i class="fa-solid fa-lock"></i> ปิดรับขอเพลงแล้ว (โหวตได้อย่างเดียว)</span>';
    document.getElementById('btn-add-song-main').classList.add('hidden');
  } else {
    document.getElementById('view-event-status').innerHTML = '<span style="color:var(--success)"><i class="fa-solid fa-lock-open"></i> กำลังเปิดรับขอเพลงและโหวต</span>';
    document.getElementById('btn-add-song-main').classList.remove('hidden');
  }

  showView('songs');
  loadSongs();
}

function goBackToCalendar() { showView('calendar'); }

function loadSongs() {
  const content = document.getElementById('song-list-content');
  content.innerHTML = `<div class="loader"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;
  
  fetchAPI("getSongs", { eventId: activeEvent.id }, res => {
    currentSongs = res;
    filterSongs();
  }, () => { content.innerHTML = `<p class="text-center text-muted">โหลดข้อมูลไม่สำเร็จ</p>`; });
}

function filterSongs() {
  const q = document.getElementById('search-bar').value.toLowerCase();
  const filtered = currentSongs.filter(s => s.name.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
  renderSongs(filtered);
}

function renderSongs(songs) {
  const container = document.getElementById('song-list-content');
  container.innerHTML = '';
  
  if (songs.length === 0) {
    container.innerHTML = `<p class="text-center text-muted" style="padding: 40px 0;">ยังไม่มีเพลงในรายการ<br>เป็นคนแรกที่ขอเพลงสิ!</p>`;
    return;
  }

  songs.forEach(s => {
    const card = document.createElement('div');
    
    let statusClass = '';
    if(s.status === 'Approved') statusClass = 'status-approved';
    else if(s.status === 'Played') statusClass = 'status-played';
    card.className = `song-card ${statusClass}`;
    
    let tagsHTML = '';
    if (s.gender === 'M') tagsHTML += `<span class="tag tag-m">ชาย</span>`;
    else if (s.gender === 'F') tagsHTML += `<span class="tag tag-f">หญิง</span>`;
    else tagsHTML += `<span class="tag">ผสม</span>`;
    
    if (s.isBreakdance === 'Yes' || s.isBreakdance === true) tagsHTML += `<span class="tag tag-bd">Breakdance</span>`;

    let votedClass = "";
    if (userUUID && s.voters && s.voters.includes(userUUID)) votedClass = "background: var(--primary); color: white;";

    card.innerHTML = `
      <div class="song-info-main">
        <div class="song-title">${s.name}</div>
        <div class="song-artist">${s.artist}</div>
        <div class="song-tags">${tagsHTML}</div>
      </div>
      <div class="song-vote-box" style="${votedClass}">
        <span class="vote-count">${s.votes}</span>
        <span class="vote-label">VOTES</span>
      </div>
    `;
    card.onclick = () => openSongDetail(s.id);
    container.appendChild(card);
  });
}

function openSongDetail(id) {
  const s = currentSongs.find(song => song.id === id);
  if (!s) return;
  selectedSongId = id;

  document.getElementById('det-title').innerText = s.name;
  document.getElementById('det-artist').innerText = s.artist;
  document.getElementById('det-time').innerText = `${s.start} - ${s.end}`;
  document.getElementById('det-votes').innerText = `${s.votes} โหวต`;
  
  let tagText = s.gender === 'M' ? 'ศิลปินชาย' : (s.gender === 'F' ? 'ศิลปินหญิง' : 'วงผสม');
  if (s.isBreakdance === 'Yes' || s.isBreakdance === true) tagText += ' + Breakdance';
  document.getElementById('det-tag').innerText = tagText;
  
  const linkBtn = document.getElementById('det-link');
  if (s.link) { linkBtn.href = s.link; linkBtn.classList.remove('hidden'); } 
  else { linkBtn.classList.add('hidden'); }

  // เช็กสิทธิ์ปุ่มโหวต
  const voteBtn = document.getElementById('btn-toggle-vote');
  if (userUUID && s.creator === userUUID) {
    voteBtn.innerHTML = `<i class="fa-solid fa-ban"></i> เพลงของคุณเอง (โหวตไม่ได้)`;
    voteBtn.className = "btn btn-outline btn-full";
    voteBtn.disabled = true;
  } else if (userUUID && s.voters && s.voters.includes(userUUID)) {
    voteBtn.innerHTML = `<i class="fa-solid fa-heart-crack"></i> ยกเลิกโหวต`;
    voteBtn.className = "btn btn-danger btn-full";
    voteBtn.disabled = false;
  } else {
    voteBtn.innerHTML = `<i class="fa-solid fa-heart"></i> โหวตเพลงนี้`;
    voteBtn.className = "btn btn-primary btn-full";
    voteBtn.disabled = false;
  }

  // ระบบตรวจสอบสิทธิ์การแก้ไข (ถ้าเป็นคนแอด หรือเป็น Admin ถึงจะแก้ได้)
  const editMySongBtn = document.getElementById('btn-edit-mysong');
  if (isAdminLoggedIn || (userUUID && s.creator === userUUID)) {
    editMySongBtn.classList.remove('hidden');
  } else {
    editMySongBtn.classList.add('hidden');
  }

  if (isAdminLoggedIn) document.getElementById('admin-song-controls').classList.remove('hidden');
  else document.getElementById('admin-song-controls').classList.add('hidden');

  openModal('songDetailModal');
}

// โหวตเพลง (บังคับ Login)
function handleVote() {
  if (!userUUID) {
    closeModal('songDetailModal');
    return openModal('userLoginModal'); // ให้ไปล็อกอินก่อน
  }
  
  const btn = document.getElementById('btn-toggle-vote');
  btn.disabled = true; btn.innerHTML = "กำลังประมวลผล...";
  
  fetchAPI("voteSong", { eventId: activeEvent.id, songId: selectedSongId, uuid: userUUID }, res => {
    currentSongs = res;
    filterSongs();
    openSongDetail(selectedSongId); 
  }, () => { btn.disabled = false; });
}

// ==========================================
// 7. ระบบดึงชื่อจาก Youtube & แมปปิ้งเพศ
// ==========================================
async function processYoutubeLink(inputId, nameId, artistId, genderId) {
  const url = document.getElementById(inputId).value;
  if (!url.includes('youtu')) return;
  
  const btnId = inputId === 'song-link' ? 'btn-song-submit' : 'btn-song-edit-submit';
  const btn = document.getElementById(btnId);
  if(btn) { btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> กำลังวิเคราะห์...`; btn.disabled = true; }

  try {
    const res = await fetch(`https://noembed.com/embed?dataType=json&url=${url}`);
    const data = await res.json();
    if(data && data.title) {
      // ส่งไปให้ระบบสมองกลหลังบ้านแยกชื่อและเพศ
      fetchAPI("aiProcess", { title: data.title, author: data.author_name }, dbRes => {
        document.getElementById(nameId).value = dbRes.song;
        document.getElementById(artistId).value = dbRes.artist;
        
        // อัปเดต Dropdown เพศอัตโนมัติ
        const genderSelect = document.getElementById(genderId);
        if(genderSelect) {
            if(dbRes.gender === "M" || dbRes.gender === "F") genderSelect.value = dbRes.gender;
            else genderSelect.value = "Mix";
        }
        
        showToast("ดึงข้อมูลสำเร็จ!", `ระบุ: ${dbRes.vibe}`, "success");
        if(btn) { btn.innerText = inputId === 'song-link' ? "ส่งข้อมูล" : "บันทึกการแก้ไข"; btn.disabled = false; }
      }, () => {
        if(btn) { btn.innerText = inputId === 'song-link' ? "ส่งข้อมูล" : "บันทึกการแก้ไข"; btn.disabled = false; }
      });
    }
  } catch(e) { 
    if(btn) { btn.innerText = inputId === 'song-link' ? "ส่งข้อมูล" : "บันทึกการแก้ไข"; btn.disabled = false; }
  }
}

function autoFillYoutube() { processYoutubeLink('song-link', 'song-name', 'song-artist', 'song-gender'); }
function autoFillYoutubeEdit() { processYoutubeLink('edit-song-link', 'edit-song-name', 'edit-song-artist', 'edit-song-gender'); }

// ==========================================
// 8. การเพิ่มและแก้ไขเพลง (CRUD)
// ==========================================
function checkQuotaAndOpenModal() {
  if (!userUUID) return openModal('userLoginModal'); // บังคับ Login
  
  if (!isAdminLoggedIn) {
    const userCount = currentSongs.filter(s => s.creator === userUUID).length;
    if (userCount >= 3) return showToast("โควตาเต็ม", "คุณเสนอเพลงครบ 3 เพลงแล้ว", "error");
  }
  document.getElementById('song-link').value = '';
  document.getElementById('song-name').value = '';
  document.getElementById('song-artist').value = '';
  document.getElementById('song-start').value = '';
  document.getElementById('song-end').value = '';
  document.getElementById('song-breakdance').checked = false;
  document.getElementById('song-gender').value = 'Mix';
  openModal('addSongModal');
}

let pendingSongData = null;
function preCheckAddSong() {
  const name = document.getElementById('song-name').value.trim(); 
  if(!name) return showToast("ข้อมูลไม่ครบ", "กรุณาระบุชื่อเพลง", "error");
  
  const dup = currentSongs.find(s => s.name.toLowerCase().replace(/\s/g, '') === name.toLowerCase().replace(/\s/g, ''));
  pendingSongData = { 
    name: name, artist: document.getElementById('song-artist').value, 
    link: document.getElementById('song-link').value, 
    start: document.getElementById('song-start').value, end: document.getElementById('song-end').value, 
    isBreakdance: document.getElementById('song-breakdance').checked,
    gender: document.getElementById('song-gender').value
  };
  
  if (dup) {
    showCustomConfirm("พบเพลงซ้ำ", `มีคนเสนอเพลง "${dup.name}" ไว้แล้ว คุณต้องการเสนอซ้ำหรือไม่?`, executeAddSong);
  } else {
    executeAddSong();
  }
}

function executeAddSong() {
  const btn = document.getElementById('btn-song-submit'); 
  btn.innerText = "กำลังส่ง..."; btn.disabled = true;
  fetchAPI("addSong", { eventId: activeEvent.id, songData: pendingSongData, uuid: userUUID, isAdmin: isAdminLoggedIn }, res => {
    currentSongs = res; filterSongs();
    closeModal('addSongModal');
    showToast("สำเร็จ", "เพิ่มเพลงเข้าสู่ระบบแล้ว", "success");
    btn.innerText = "ส่งข้อมูล"; btn.disabled = false;
  }, () => { btn.innerText = "ส่งข้อมูล"; btn.disabled = false; });
}

function openUserEditSong() {
  const s = currentSongs.find(song => song.id === selectedSongId);
  document.getElementById('edit-song-link').value = s.link;
  document.getElementById('edit-song-name').value = s.name;
  document.getElementById('edit-song-artist').value = s.artist;
  document.getElementById('edit-song-start').value = s.start;
  document.getElementById('edit-song-end').value = s.end;
  document.getElementById('edit-song-breakdance').checked = (s.isBreakdance === 'Yes' || s.isBreakdance === true);
  
  const gSelect = document.getElementById('edit-song-gender');
  if (s.gender === 'M' || s.gender === 'F') gSelect.value = s.gender; else gSelect.value = 'Mix';
  
  closeModal('songDetailModal');
  openModal('editSongModal');
}

function executeEditSong() {
  const name = document.getElementById('edit-song-name').value.trim();
  if(!name) return showToast("ข้อมูลไม่ครบ", "กรุณาระบุชื่อเพลง", "error");
  
  const updatedData = { 
    name: name, artist: document.getElementById('edit-song-artist').value, 
    link: document.getElementById('edit-song-link').value, 
    start: document.getElementById('edit-song-start').value, end: document.getElementById('edit-song-end').value, 
    isBreakdance: document.getElementById('edit-song-breakdance').checked,
    gender: document.getElementById('edit-song-gender').value
  };
  
  const btn = document.getElementById('btn-song-edit-submit'); 
  btn.innerText = "กำลังบันทึก..."; btn.disabled = true;
  
  fetchAPI("editSong", { eventId: activeEvent.id, songId: selectedSongId, songData: updatedData, uuid: userUUID, isAdmin: isAdminLoggedIn }, res => { 
    currentSongs = res; filterSongs(); 
    closeModal('editSongModal'); 
    showToast("สำเร็จ", "อัปเดตเพลงเรียบร้อย", "success"); 
    btn.innerText = "บันทึกการแก้ไข"; btn.disabled = false; 
  }, () => { btn.innerText = "บันทึกการแก้ไข"; btn.disabled = false; });
}

function adminUpdateStatus(status) {
  fetchAPI("updateSongStatus", { eventId: activeEvent.id, songId: selectedSongId, status: status }, res => {
    currentSongs = res; filterSongs(); closeModal('songDetailModal'); showToast("สำเร็จ", "อัปเดตสถานะแล้ว");
  });
}

function confirmDeleteSong() {
  showCustomConfirm("ยืนยันการลบ", "คุณต้องการลบเพลงนี้ออกจากระบบใช่หรือไม่?", () => {
    fetchAPI("deleteSong", { eventId: activeEvent.id, songId: selectedSongId }, res => {
      currentSongs = res; filterSongs(); closeModal('songDetailModal'); showToast("สำเร็จ", "ลบเพลงแล้ว", "success");
    });
  });
}

// ==========================================
// 9. ระบบจัดการ Playlist (ลากวาง & AI)
// ==========================================
let sortables = [];
function openPlaylistManager() {
  document.getElementById('playlist-event-title').innerText = `Setlist: ${activeEvent.name}`;
  showView('playlist');
  initSortables();
  
  const pool = document.getElementById('list-pool');
  const kpop = document.getElementById('list-kpop');
  const tpop = document.getElementById('list-tpop');
  const mix = document.getElementById('list-mix');
  [pool, kpop, tpop, mix].forEach(el => el.innerHTML = '');
  
  fetchAPI("getPlaylist", { eventId: activeEvent.id, date: activeEvent.date }, savedLists => {
    if (savedLists.length > 0) {
      savedLists.forEach(s => {
        let target = pool;
        if(s.listName === 'list-kpop') target = kpop;
        else if(s.listName === 'list-tpop') target = tpop;
        else if(s.listName === 'list-mix') target = mix;
        target.appendChild(createPlaylistItem(s));
      });
    } else {
      currentSongs.filter(s => s.status !== 'Played').sort((a,b) => b.votes - a.votes).forEach(s => {
        pool.appendChild(createPlaylistItem(s));
      });
    }
  });
}

function confirmImportFromVotes() {
  showCustomConfirm("ดึงใหม่จากผลโหวต", "การดึงใหม่จะล้างการจัดเรียงปัจจุบันทั้งหมด ยืนยันหรือไม่?", () => {
    const pool = document.getElementById('list-pool');
    document.getElementById('list-kpop').innerHTML = '';
    document.getElementById('list-tpop').innerHTML = '';
    document.getElementById('list-mix').innerHTML = '';
    pool.innerHTML = '';
    
    currentSongs.filter(s => s.status !== 'Played').sort((a,b) => b.votes - a.votes).forEach(s => {
      pool.appendChild(createPlaylistItem(s));
    });
    showToast("ดึงข้อมูลสำเร็จ", "ดึงรายชื่อจากผลโหวตล่าสุดแล้ว");
  });
}

function createPlaylistItem(song) {
  const div = document.createElement('div');
  div.className = 'playlist-item';
  div.dataset.id = song.id;
  div.dataset.gender = song.gender || 'Mix';
  div.dataset.bd = (song.isBreakdance === 'Yes' || song.isBreakdance === true) ? "true" : "false";
  
  let tags = '';
  if (div.dataset.gender === 'M') tags += `<span class="tag tag-m">M</span>`;
  else if (div.dataset.gender === 'F') tags += `<span class="tag tag-f">F</span>`;
  else tags += `<span class="tag">Mix</span>`;
  if (div.dataset.bd === "true") tags += ` <span class="tag tag-bd">BD</span>`;

  div.innerHTML = `
    <div style="display:flex; align-items:center; overflow:hidden;">
      <i class="fa-solid fa-grip-vertical drag-handle"></i>
      <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
        <strong>${song.name}</strong><br><span style="font-size:0.75rem; color:#888;">${song.artist}</span>
      </div>
    </div>
    <div style="display:flex; gap:3px;">${tags}</div>
  `;
  return div;
}

function initSortables() {
  sortables.forEach(s => s.destroy());
  sortables = [];
  ['list-pool', 'list-kpop', 'list-tpop', 'list-mix'].forEach(id => {
    sortables.push(new Sortable(document.getElementById(id), {
      group: 'shared', animation: 150, handle: '.drag-handle', ghostClass: 'sortable-ghost'
    }));
  });
}

function randomizeAlternate(containerId) {
  const container = document.getElementById(containerId);
  const items = Array.from(container.children);
  if (items.length < 2) return;
  const shuffle = array => array.sort(() => Math.random() - 0.5);
  let males = shuffle(items.filter(i => i.dataset.gender === 'M'));
  let females = shuffle(items.filter(i => i.dataset.gender === 'F'));
  let mixes = shuffle(items.filter(i => i.dataset.gender !== 'M' && i.dataset.gender !== 'F'));
  
  container.innerHTML = '';
  let mIdx = 0, fIdx = 0, mixIdx = 0;
  let turn = 'M';
  
  while(mIdx < males.length || fIdx < females.length || mixIdx < mixes.length) {
    if(turn === 'M') { if(mIdx < males.length) { container.appendChild(males[mIdx++]); turn = 'F'; } else turn = 'F'; } 
    else if(turn === 'F') { if(fIdx < females.length) { container.appendChild(females[fIdx++]); turn = 'Mix'; } else turn = 'Mix'; } 
    else if(turn === 'Mix') { if(mixIdx < mixes.length) { container.appendChild(mixes[mixIdx++]); turn = 'M'; } else turn = 'M'; }
  }
}

function aiMagicSetlist() {
  const pool = document.getElementById('list-pool');
  const items = Array.from(pool.children);
  if (items.length < 3) return showToast("เพลงน้อยเกินไป", "ต้องมีอย่างน้อย 3 เพลงในกองกลาง", "error");

  const btn = document.getElementById('btn-ai-setlist');
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> กำลังคิด...`; btn.disabled = true;

  const songData = items.map(el => ({ 
    id: el.dataset.id, 
    gender: el.dataset.gender, 
    isBreakdance: el.dataset.bd === "true" 
  }));

  fetchAPI("aiMagicSetlist", { songs: songData }, sortedIds => {
    pool.innerHTML = '';
    sortedIds.forEach(id => {
      const matchedEl = items.find(el => el.dataset.id === id);
      if (matchedEl) pool.appendChild(matchedEl);
    });
    // ถ้ามีตกหล่นให้เติมท้าย
    items.forEach(el => { if (!sortedIds.includes(el.dataset.id)) pool.appendChild(el); });
    
    btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> AI จัด Setlist`; btn.disabled = false;
    showToast("จัดเรียงเสร็จสิ้น!", "AI สลับเพศให้เรียบร้อยแล้ว", "success");
  }, () => { btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> AI จัด Setlist`; btn.disabled = false; });
}

function savePlaylistData() {
  const lists = [];
  ['list-pool', 'list-kpop', 'list-tpop', 'list-mix'].forEach(listName => {
    const items = document.getElementById(listName).children;
    for (let i = 0; i < items.length; i++) {
      const id = items[i].dataset.id;
      const s = currentSongs.find(song => song.id === id);
      if (s) {
        lists.push({ listName: listName, id: s.id, name: s.name, artist: s.artist, gender: s.gender, isBreakdance: s.isBreakdance, time: `${s.start}-${s.end}`, link: s.link });
      }
    }
  });

  const btn = document.getElementById('btn-save-playlist');
  btn.innerText = "กำลังบันทึก..."; btn.disabled = true;
  fetchAPI("savePlaylist", { eventId: activeEvent.id, date: activeEvent.date, lists: lists }, res => {
    btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> บันทึกลง Sheet`; btn.disabled = false;
    showToast("บันทึกสำเร็จ", "ข้อมูล Setlist ถูกเซฟลง Sheet แล้ว");
  }, () => { btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> บันทึกลง Sheet`; btn.disabled = false; });
}
