// ==========================================
// 1. ตั้งค่าพื้นฐาน (Configuration)
// ==========================================
const apiURL = "https://script.google.com/macros/s/AKfycbxTHBDk2j--fcL4tnQo5YH8KRlm0SMvjDK6YqKMhkZPk5GCWOXM8g8xeoeQtxw3ns__zA/exec"; 

let currentEvents = [];
let currentSongs = [];
let activeEvent = null;
let selectedSongId = null;

// ==========================================
// 2. ระบบระบุตัวตน & Cache 12 ชั่วโมง
// ==========================================
const CACHE_TIME = 12 * 60 * 60 * 1000;
let loginTime = localStorage.getItem('delia_login_time') || 0;

if (Date.now() - loginTime > CACHE_TIME) {
  localStorage.removeItem('delia_uuid'); localStorage.removeItem('delia_username');
  localStorage.removeItem('delia_role'); localStorage.removeItem('delia_login_time');
}

let userUUID = localStorage.getItem('delia_uuid') || "";
let userName = localStorage.getItem('delia_username') || "";
let isAdminLoggedIn = localStorage.getItem('delia_role') === 'Admin';

document.addEventListener("DOMContentLoaded", () => {
  updateUserUI();
  loadEvents();
});

function updateUserUI() {
  const greeting = document.getElementById('user-greeting');
  const btnLogin = document.getElementById('btn-login-main');
  if (isAdminLoggedIn) {
    greeting.innerHTML = "<i class='fa-solid fa-crown'></i> Admin Mode";
    greeting.classList.remove('hidden'); btnLogin.classList.add('hidden');
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
  } else if (userUUID && userName) {
    greeting.innerText = `👋 สวัสดี, ${userName}`;
    greeting.classList.remove('hidden'); btnLogin.classList.add('hidden');
  } else {
    greeting.classList.add('hidden'); btnLogin.classList.remove('hidden');
  }
}

function executeUnifiedAuth() {
  const u = document.getElementById('auth-username').value.trim();
  const p = document.getElementById('auth-password').value.trim();
  if (!u) return showToast("ข้อผิดพลาด", "กรุณากรอกชื่อผู้ใช้งาน", "error");
  
  const btn = document.getElementById('btn-auth-submit');
  btn.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> กำลังเข้าสู่ระบบ..."; btn.disabled = true;

  fetchAPI("auth", { username: u, password: p }, res => {
    userUUID = res.uuid; userName = res.username; isAdminLoggedIn = (res.role === 'Admin');
    localStorage.setItem('delia_uuid', userUUID); localStorage.setItem('delia_username', userName);
    localStorage.setItem('delia_role', res.role); localStorage.setItem('delia_login_time', Date.now());
    
    updateUserUI(); closeModal('authModal');
    if (isAdminLoggedIn) showToast("เข้าสู่ระบบสำเร็จ", "ยินดีต้อนรับท่าน Admin!", "success");
    else showToast("เข้าสู่ระบบสำเร็จ", `ยินดีต้อนรับ ${userName}`, "success");
    btn.innerText = "เข้าสู่ระบบ"; btn.disabled = false;
  }, () => { btn.innerText = "เข้าสู่ระบบ"; btn.disabled = false; });
}

// ==========================================
// 3. ระบบเชื่อมต่อฐานข้อมูล (API Fetcher)
// ==========================================
function fetchAPI(action, payload, onSuccess, onError) {
  fetch(apiURL, { method: "POST", body: JSON.stringify({ action: action, payload: payload }) })
  .then(res => res.json())
  .then(data => { if (data.success) onSuccess(data.data); else { showToast("เกิดข้อผิดพลาด", data.message, "error"); if (onError) onError(); } })
  .catch(err => { console.error(err); showToast("การเชื่อมต่อล้มเหลว", "โปรดตรวจสอบอินเทอร์เน็ต", "error"); if (onError) onError(); });
}

// ==========================================
// 4. Utils: การแสดงผล UI & ควบคุม FAB
// ==========================================
function showView(viewId) {
  document.getElementById('view-calendar').classList.add('hidden'); 
  document.getElementById('view-songs').classList.add('hidden');
  document.getElementById('view-playlist').classList.add('hidden'); 
  document.getElementById('view-' + viewId).classList.remove('hidden');

  // ควบคุมปุ่มลอย (FAB) ให้โชว์เฉพาะหน้าที่ถูกต้อง
  if (viewId === 'calendar' && isAdminLoggedIn) {
    document.getElementById('fab-admin-add').classList.remove('hidden');
    document.getElementById('fab-add-category').classList.add('hidden');
  } else if (viewId === 'playlist' && isAdminLoggedIn) {
    document.getElementById('fab-admin-add').classList.add('hidden');
    document.getElementById('fab-add-category').classList.remove('hidden');
  } else {
    document.getElementById('fab-admin-add').classList.add('hidden');
    document.getElementById('fab-add-category').classList.add('hidden');
  }
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function showToast(title, message, type = "success") {
  const container = document.getElementById('toast-container'); const toast = document.createElement('div'); toast.className = `toast ${type}`;
  const icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-xmark"></i>';
  toast.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-body"><h4>${title}</h4><p>${message}</p></div>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'slideInRight 0.3s reverse forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
}

let inputModalCallback = null;
function openInputModal(title, defaultVal, callback) {
  document.getElementById('input-modal-title').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> ${title}`;
  document.getElementById('input-modal-value').value = defaultVal || "";
  inputModalCallback = callback; openModal('inputModal');
  setTimeout(() => document.getElementById('input-modal-value').focus(), 100);
}
function submitInputModal() {
  const val = document.getElementById('input-modal-value').value.trim();
  if (inputModalCallback) inputModalCallback(val); closeModal('inputModal');
}

let confirmCallback = null;
function showCustomConfirm(title, message, callback) {
  document.getElementById('custom-confirm-title').innerText = title; document.getElementById('custom-confirm-message').innerText = message;
  confirmCallback = callback; openModal('customConfirmModal');
}
document.getElementById('btn-custom-confirm-ok').addEventListener('click', () => { if (confirmCallback) confirmCallback(); closeModal('customConfirmModal'); });

function getYTThumb(link) {
  if (!link) return 'DeliaLogo.png'; let videoId = ''; const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = link.match(regExp); if (match && match[2].length === 11) videoId = match[2];
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : 'DeliaLogo.png';
}

// ==========================================
// 5. ระบบอีเวนต์ปฏิทิน & URL Sharing (Deep Link)
// ==========================================
let currentMonth = new Date().getMonth(); let currentYear = new Date().getFullYear();
const monthNamesTh = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

function loadEvents() {
  document.getElementById('calendar-grid').innerHTML = `<div class="loader" style="grid-column: 1 / -1;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;
  fetchAPI("getEvents", {}, res => { 
    currentEvents = res; renderCalendar(); 
    const urlParams = new URLSearchParams(window.location.search);
    const sharedEventId = urlParams.get('eventId');
    if (sharedEventId) {
      const ev = currentEvents.find(e => e.id === sharedEventId);
      if (ev) { activeEvent = ev; enterSongList(); }
    }
  }, () => { document.getElementById('calendar-grid').innerHTML = `<p class="text-center text-muted" style="grid-column: 1 / -1;">โหลดข้อมูลไม่สำเร็จ</p>`; });
}

function renderCalendar() {
  document.getElementById('month-year-display').innerText = `${monthNamesTh[currentMonth]} ${currentYear + 543}`;
  const grid = document.getElementById('calendar-grid'); grid.innerHTML = '';
  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) { const emptyCell = document.createElement('div'); emptyCell.className = 'calendar-day empty'; grid.appendChild(emptyCell); }
  for (let i = 1; i <= daysInMonth; i++) {
    const cell = document.createElement('div'); cell.className = 'calendar-day';
    const dateNum = document.createElement('div'); dateNum.className = 'day-number'; dateNum.innerText = i; cell.appendChild(dateNum);
    const dayEvents = currentEvents.filter(e => { const d = new Date(e.date); return d.getDate() === i && d.getMonth() === currentMonth && d.getFullYear() === currentYear; });
    dayEvents.forEach(e => {
      const evt = document.createElement('div'); evt.className = `day-event ${e.status === 'Closed' ? 'closed' : ''}`;
      evt.innerHTML = `${e.name} ${e.status === 'Closed' ? '<i class="fa-solid fa-lock"></i>' : ''}`;
      evt.onclick = (event) => { event.stopPropagation(); openEventIntro(e); }; cell.appendChild(evt);
    });
    grid.appendChild(cell);
  }
}
function changeMonth(dir) { currentMonth += dir; if (currentMonth < 0) { currentMonth = 11; currentYear--; } else if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(); }
function openEventIntro(event) {
  activeEvent = event; const d = new Date(event.date);
  document.getElementById('intro-title').innerText = event.name; document.getElementById('intro-date').innerText = `${d.getDate()} ${monthNamesTh[d.getMonth()]} ${d.getFullYear() + 543}`;
  document.getElementById('intro-loc').innerText = event.location; document.getElementById('intro-time').innerText = `${event.openTime} - ${event.closeTime}`; document.getElementById('intro-det').innerText = event.details || "-";
  openModal('eventIntroModal');
}

// ==========================================
// 6. ระบบเพลง (Songs & Voting)
// ==========================================
function enterSongList() {
  closeModal('eventIntroModal'); document.getElementById('view-event-title').innerText = activeEvent.name;
  if (activeEvent.status === 'Closed') { document.getElementById('view-event-status').innerHTML = '<span style="color:var(--danger)"><i class="fa-solid fa-lock"></i> ปิดรับขอเพลงแล้ว (โหวตได้อย่างเดียว)</span>'; document.getElementById('btn-add-song-main').classList.add('hidden'); } 
  else { document.getElementById('view-event-status').innerHTML = '<span style="color:var(--success)"><i class="fa-solid fa-lock-open"></i> เปิดรับขอเพลงและโหวต</span>'; document.getElementById('btn-add-song-main').classList.remove('hidden'); }
  showView('songs'); loadSongs();
  const newUrl = window.location.pathname + '?eventId=' + activeEvent.id; window.history.replaceState({path: newUrl}, '', newUrl);
}

function goBackToCalendar() { window.history.replaceState({}, document.title, window.location.pathname); showView('calendar'); }

function loadSongs() {
  const content = document.getElementById('song-list-content'); content.innerHTML = `<div class="loader"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;
  fetchAPI("getSongs", { eventId: activeEvent.id }, res => { currentSongs = res; filterSongs(); }, () => { content.innerHTML = `<p class="text-center text-muted">โหลดข้อมูลไม่สำเร็จ</p>`; });
}

function filterSongs() {
  const q = document.getElementById('search-bar').value.toLowerCase();
  const filtered = currentSongs.filter(s => s.name.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
  renderSongs(filtered);
}

function renderSongs(songs) {
  const container = document.getElementById('song-list-content'); container.innerHTML = '';
  if (songs.length === 0) { container.innerHTML = `<p class="text-center text-muted" style="padding: 40px 0;">ยังไม่มีเพลงในรายการ<br>เป็นคนแรกที่ขอเพลงสิ!</p>`; return; }
  let maxVotes = 0; if (songs.length > 0) maxVotes = Math.max(...songs.map(s => s.votes));

  songs.forEach(s => {
    const card = document.createElement('div');
    let isTopVoted = (s.votes === maxVotes && maxVotes > 0);
    let topClass = isTopVoted ? 'top-voted' : '';
    let crownIcon = isTopVoted ? '<i class="fa-solid fa-crown crown-icon"></i>' : '';
    card.className = `song-card ${s.status === 'Approved' ? 'status-approved' : (s.status === 'Played' ? 'status-played' : '')} ${topClass}`;
    
    let tagsHTML = '';
    if (s.gender === 'M') tagsHTML += `<span class="tag tag-m">ชาย</span>`; else if (s.gender === 'F') tagsHTML += `<span class="tag tag-f">หญิง</span>`; else tagsHTML += `<span class="tag">ผสม</span>`;
    if (s.isBreakdance === 'Yes' || s.isBreakdance === true) tagsHTML += `<span class="tag tag-bd">Breakdance</span>`;

    let votedClass = (userUUID && s.voters && s.voters.includes(userUUID)) ? "background: var(--primary); color: white;" : "";
    card.innerHTML = `
      <img src="${getYTThumb(s.link)}" class="song-thumbnail" alt="thumbnail">
      <div class="song-info-main"><div class="song-title">${crownIcon}${s.name}</div><div class="song-artist">${s.artist}</div><div class="song-tags">${tagsHTML}</div></div>
      <div class="song-vote-box" style="${votedClass}"><span class="vote-count">${s.votes}</span><span class="vote-label">VOTES</span></div>
    `;
    card.onclick = () => openSongDetail(s.id); container.appendChild(card);
  });
}

function openSongDetail(id) {
  const s = currentSongs.find(song => song.id === id); if (!s) return; selectedSongId = id;
  document.getElementById('det-title').innerText = s.name; document.getElementById('det-artist').innerText = s.artist;
  document.getElementById('det-time').innerText = `${s.start} - ${s.end}`; document.getElementById('det-votes').innerText = `${s.votes} โหวต`;
  let tagText = s.gender === 'M' ? 'ศิลปินชาย' : (s.gender === 'F' ? 'ศิลปินหญิง' : 'วงผสม'); if (s.isBreakdance === 'Yes' || s.isBreakdance === true) tagText += ' + Breakdance';
  document.getElementById('det-tag').innerText = tagText;
  
  const linkBtn = document.getElementById('det-link'); if (s.link) { linkBtn.href = s.link; linkBtn.classList.remove('hidden'); } else linkBtn.classList.add('hidden');

  const voteBtn = document.getElementById('btn-toggle-vote');
  if (userUUID && s.creator === userUUID) { voteBtn.innerHTML = `<i class="fa-solid fa-ban"></i> เพลงของคุณ (โหวตไม่ได้)`; voteBtn.className = "btn btn-outline btn-full"; voteBtn.disabled = true; } 
  else if (userUUID && s.voters && s.voters.includes(userUUID)) { voteBtn.innerHTML = `<i class="fa-solid fa-heart-crack"></i> ยกเลิกโหวต`; voteBtn.className = "btn btn-danger btn-full"; voteBtn.disabled = false; } 
  else { voteBtn.innerHTML = `<i class="fa-solid fa-heart"></i> โหวตเพลงนี้`; voteBtn.className = "btn btn-primary btn-full"; voteBtn.disabled = false; }

  const editMySongBtn = document.getElementById('btn-edit-mysong');
  if (isAdminLoggedIn || (userUUID && s.creator === userUUID)) editMySongBtn.classList.remove('hidden'); else editMySongBtn.classList.add('hidden');
  if (isAdminLoggedIn) document.getElementById('admin-song-controls').classList.remove('hidden'); else document.getElementById('admin-song-controls').classList.add('hidden');
  openModal('songDetailModal');
}

function handleVote() {
  if (!userUUID) { closeModal('songDetailModal'); return openModal('authModal'); }
  const btn = document.getElementById('btn-toggle-vote'); btn.disabled = true; btn.innerHTML = "กำลังประมวลผล...";
  fetchAPI("voteSong", { eventId: activeEvent.id, songId: selectedSongId, uuid: userUUID }, res => { currentSongs = res; filterSongs(); openSongDetail(selectedSongId); }, () => { btn.disabled = false; });
}

function shareSong() {
  const url = window.location.origin + window.location.pathname + "?eventId=" + activeEvent.id;
  navigator.clipboard.writeText(url).then(() => { showToast("คัดลอกลิงก์สำเร็จ", "นำลิงก์ไปแชร์ให้เพื่อนเพื่อเข้ามาโหวตได้เลย!", "success"); }).catch(() => { showCustomConfirm("ลิงก์สำหรับแชร์", url, () => {}); });
}

// ==========================================
// 7. Youtube & CRUD เพลง
// ==========================================
async function processYoutubeLink(inputId, nameId, artistId, genderId) {
  const url = document.getElementById(inputId).value; if (!url.includes('youtu')) return;
  const btnId = inputId === 'song-link' ? 'btn-song-submit' : 'btn-song-edit-submit';
  const btn = document.getElementById(btnId); if(btn) { btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> กำลังวิเคราะห์...`; btn.disabled = true; }
  try {
    const res = await fetch(`https://noembed.com/embed?dataType=json&url=${url}`); const data = await res.json();
    if(data && data.title) {
      fetchAPI("aiProcess", { title: data.title, author: data.author_name }, dbRes => {
        document.getElementById(nameId).value = dbRes.song; document.getElementById(artistId).value = dbRes.artist;
        const gSelect = document.getElementById(genderId); if(gSelect) gSelect.value = (dbRes.gender === "M" || dbRes.gender === "F") ? dbRes.gender : "Mix";
        showToast("ดึงข้อมูลสำเร็จ!", `ระบบระบุ: ${dbRes.vibe}`, "success");
        if(btn) { btn.innerText = inputId === 'song-link' ? "ส่งข้อมูล" : "บันทึกการแก้ไข"; btn.disabled = false; }
      }, () => { if(btn) { btn.innerText = inputId === 'song-link' ? "ส่งข้อมูล" : "บันทึกการแก้ไข"; btn.disabled = false; } });
    }
  } catch(e) { if(btn) { btn.innerText = inputId === 'song-link' ? "ส่งข้อมูล" : "บันทึกการแก้ไข"; btn.disabled = false; } }
}

function autoFillYoutube() { processYoutubeLink('song-link', 'song-name', 'song-artist', 'song-gender'); }
function autoFillYoutubeEdit() { processYoutubeLink('edit-song-link', 'edit-song-name', 'edit-song-artist', 'edit-song-gender'); }

function checkQuotaAndOpenModal() {
  if (!userUUID) return openModal('authModal');
  if (!isAdminLoggedIn && currentSongs.filter(s => s.creator === userUUID).length >= 3) return showToast("โควตาเต็ม", "คุณเสนอเพลงครบ 3 เพลงแล้ว", "error");
  ['song-link','song-name','song-artist','song-start','song-end'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('song-breakdance').checked = false; document.getElementById('song-gender').value = 'Mix';
  openModal('addSongModal');
}

let pendingSongData = null;
function preCheckAddSong() {
  const name = document.getElementById('song-name').value.trim(); if(!name) return showToast("ข้อมูลไม่ครบ", "กรุณาระบุชื่อเพลง", "error");
  const dup = currentSongs.find(s => s.name.toLowerCase().replace(/\s/g, '') === name.toLowerCase().replace(/\s/g, ''));
  pendingSongData = { name: name, artist: document.getElementById('song-artist').value, link: document.getElementById('song-link').value, start: document.getElementById('song-start').value, end: document.getElementById('song-end').value, isBreakdance: document.getElementById('song-breakdance').checked, gender: document.getElementById('song-gender').value };
  if (dup) showCustomConfirm("พบเพลงซ้ำ", `มีคนเสนอเพลง "${dup.name}" ไว้แล้ว คุณต้องการเสนอซ้ำหรือไม่?`, executeAddSong); else executeAddSong();
}

function executeAddSong() {
  const btn = document.getElementById('btn-song-submit'); btn.innerText = "กำลังส่ง..."; btn.disabled = true;
  fetchAPI("addSong", { eventId: activeEvent.id, songData: pendingSongData, uuid: userUUID, isAdmin: isAdminLoggedIn }, res => { currentSongs = res; filterSongs(); closeModal('addSongModal'); showToast("สำเร็จ", "เพิ่มเพลงเข้าสู่ระบบแล้ว", "success"); btn.innerText = "ส่งข้อมูล"; btn.disabled = false; }, () => { btn.innerText = "ส่งข้อมูล"; btn.disabled = false; });
}

function openUserEditSong() {
  const s = currentSongs.find(song => song.id === selectedSongId);
  document.getElementById('edit-song-link').value = s.link; document.getElementById('edit-song-name').value = s.name; document.getElementById('edit-song-artist').value = s.artist; document.getElementById('edit-song-start').value = s.start; document.getElementById('edit-song-end').value = s.end; document.getElementById('edit-song-breakdance').checked = (s.isBreakdance === 'Yes' || s.isBreakdance === true);
  const gSelect = document.getElementById('edit-song-gender'); gSelect.value = (s.gender === 'M' || s.gender === 'F') ? s.gender : 'Mix';
  closeModal('songDetailModal'); openModal('editSongModal');
}

function executeEditSong() {
  const name = document.getElementById('edit-song-name').value.trim(); if(!name) return showToast("ข้อมูลไม่ครบ", "กรุณาระบุชื่อเพลง", "error");
  const updatedData = { name: name, artist: document.getElementById('edit-song-artist').value, link: document.getElementById('edit-song-link').value, start: document.getElementById('edit-song-start').value, end: document.getElementById('edit-song-end').value, isBreakdance: document.getElementById('edit-song-breakdance').checked, gender: document.getElementById('edit-song-gender').value };
  const btn = document.getElementById('btn-song-edit-submit'); btn.innerText = "กำลังบันทึก..."; btn.disabled = true;
  fetchAPI("editSong", { eventId: activeEvent.id, songId: selectedSongId, songData: updatedData, uuid: userUUID, isAdmin: isAdminLoggedIn }, res => { currentSongs = res; filterSongs(); closeModal('editSongModal'); showToast("สำเร็จ", "อัปเดตเพลงเรียบร้อย", "success"); btn.innerText = "บันทึกการแก้ไข"; btn.disabled = false; }, () => { btn.innerText = "บันทึกการแก้ไข"; btn.disabled = false; });
}

function adminUpdateStatus(status) { fetchAPI("updateSongStatus", { eventId: activeEvent.id, songId: selectedSongId, status: status }, res => { currentSongs = res; filterSongs(); closeModal('songDetailModal'); showToast("สำเร็จ", "อัปเดตสถานะแล้ว"); }); }
function confirmDeleteSong() { showCustomConfirm("ยืนยันการลบ", "ลบเพลงนี้ออกจากระบบ?", () => { fetchAPI("deleteSong", { eventId: activeEvent.id, songId: selectedSongId }, res => { currentSongs = res; filterSongs(); closeModal('songDetailModal'); showToast("สำเร็จ", "ลบเพลงแล้ว", "success"); }); }); }

// ==========================================
// 8. ระบบจัดการ Playlist (Workspace 20/80)
// ==========================================
let sortableLists = [];
let boardSortable = null;
let isPoolOpen = true;

function togglePoolSidebar() {
  const pool = document.getElementById('pool-sidebar');
  const text = document.getElementById('toggle-sidebar-text');
  isPoolOpen = !isPoolOpen;
  if(isPoolOpen) { pool.classList.remove('collapsed'); text.innerText = "ซ่อนกองกลาง"; } 
  else { pool.classList.add('collapsed'); text.innerText = "แสดงกองกลาง"; }
}

function openPlaylistManager() {
  document.getElementById('playlist-event-title').innerText = `Setlist: ${activeEvent.name}`; showView('playlist');
  document.getElementById('list-pool').innerHTML = ''; document.getElementById('dynamic-board').innerHTML = '';
  
  fetchAPI("getPlaylist", { eventId: activeEvent.id, date: activeEvent.date }, savedLists => {
    // แยก "list-pool" ออกจากชื่อที่แอดมินตั้ง
    const categoryNames = [...new Set(savedLists.map(s => s.listName))].filter(n => n !== 'list-pool' && n !== 'POOL' && n !== 'กองกลาง');
    
    if (categoryNames.length === 0 && savedLists.length === 0) {
      currentSongs.filter(s => s.status !== 'Played').sort((a,b) => b.votes - a.votes).forEach(s => document.getElementById('list-pool').appendChild(createPlaylistItem(s)));
    } else {
      categoryNames.forEach(cat => createCategoryBox(cat));
      savedLists.forEach(s => { 
        let target = document.querySelector(`.drop-zone[data-category="${s.listName}"]`); 
        if (!target) target = document.getElementById('list-pool'); // ถ้าหาไม่เจอ ให้โยนลง list-pool ฝั่งซ้าย
        target.appendChild(createPlaylistItem(s)); 
      });
    }
    initSortables();
  });
}

function addNewCategory() {
  openInputModal("ตั้งชื่อหมวดหมู่ใหม่", "K-Pop ช่วงที่ 1", (newTitle) => {
    if(!newTitle) return;
    // ห้ามตั้งชื่อซ้ำกับระบบ
    if(newTitle.toLowerCase() === 'pool' || newTitle === 'list-pool' || newTitle === 'กองกลาง') {
      return showToast("ชื่อนี้ไม่อนุญาต", "ชื่อนี้ถูกสงวนไว้สำหรับระบบ กรุณาใช้ชื่ออื่น", "error");
    }
    createCategoryBox(newTitle);
  });
}

function createCategoryBox(title) {
  const safeId = 'cat-' + Date.now() + Math.floor(Math.random()*1000);
  const col = document.createElement('div'); col.className = 'list-col dynamic-category';
  col.innerHTML = `
    <div class="list-col-header" title="ลากสลับกล่องได้เลย">
      <h3>${title} 
        <i class="fa-solid fa-pen text-muted" style="font-size:0.8rem; cursor:pointer; margin-left:8px;" onclick="renameCategory('${safeId}')" title="เปลี่ยนชื่อ"></i> 
        <i class="fa-solid fa-trash text-danger" style="font-size:0.8rem; cursor:pointer; margin-left:4px;" onclick="deleteCategory('${safeId}')" title="ลบกล่องนี้"></i>
      </h3>
      <button class="btn btn-outline btn-full btn-sm" onclick="randomizeAlternate('${safeId}')"><i class="fa-solid fa-shuffle"></i> สุ่มสลับ (M/F)</button>
    </div>
    <div id="${safeId}" class="drop-zone" data-category="${title}"></div>
  `;
  document.getElementById('dynamic-board').appendChild(col); initSortables();
}

function renameCategory(zoneId) {
  const zone = document.getElementById(zoneId); if(!zone) return;
  const oldTitle = zone.getAttribute('data-category');
  openInputModal("เปลี่ยนชื่อหมวดหมู่", oldTitle, (newTitle) => {
    if(newTitle && newTitle !== "" && newTitle.toLowerCase() !== 'pool' && newTitle !== 'กองกลาง') {
      zone.setAttribute('data-category', newTitle);
      zone.previousElementSibling.querySelector('h3').innerHTML = `${newTitle} 
        <i class="fa-solid fa-pen text-muted" style="font-size:0.8rem; cursor:pointer; margin-left:8px;" onclick="renameCategory('${zoneId}')"></i> 
        <i class="fa-solid fa-trash text-danger" style="font-size:0.8rem; cursor:pointer; margin-left:4px;" onclick="deleteCategory('${zoneId}')"></i>`;
    }
  });
}

function deleteCategory(zoneId) {
  const zone = document.getElementById(zoneId); if(!zone) return;
  const items = Array.from(zone.children);
  if(items.length > 0) {
    showCustomConfirm("แจ้งเตือน", "มีเพลงอยู่ในกล่องนี้ ระบบจะย้ายเพลงกลับไปที่กองกลาง ยืนยันหรือไม่?", () => { 
      const pool = document.getElementById('list-pool'); items.forEach(el => pool.appendChild(el)); zone.parentElement.remove(); 
    });
  } else zone.parentElement.remove();
}

function confirmImportFromVotes() {
  showCustomConfirm("รีเซ็ตจากผลโหวต", "นำเพลงทั้งหมดกลับไปที่กองกลาง ยืนยันหรือไม่?", () => {
    const pool = document.getElementById('list-pool'); 
    document.querySelectorAll('.dynamic-board .drop-zone').forEach(zone => zone.innerHTML = ''); 
    pool.innerHTML = '';
    currentSongs.filter(s => s.status !== 'Played').sort((a,b) => b.votes - a.votes).forEach(s => pool.appendChild(createPlaylistItem(s)));
    showToast("ดึงข้อมูลสำเร็จ", "ย้ายรายชื่อทั้งหมดลงกองกลางแล้ว");
  });
}

function createPlaylistItem(song) {
  const div = document.createElement('div'); div.className = 'playlist-item'; div.dataset.id = song.id; div.dataset.gender = song.gender || 'Mix'; div.dataset.bd = (song.isBreakdance === 'Yes' || song.isBreakdance === true) ? "true" : "false";
  let tags = ''; if (div.dataset.gender === 'M') tags += `<span class="tag tag-m">M</span>`; else if (div.dataset.gender === 'F') tags += `<span class="tag tag-f">F</span>`; else tags += `<span class="tag">Mix</span>`; if (div.dataset.bd === "true") tags += ` <span class="tag tag-bd">BD</span>`;
  div.innerHTML = `
    <div style="display:flex; align-items:center; overflow:hidden; gap: 8px;">
      <i class="fa-solid fa-grip-vertical drag-handle"></i>
      <img src="${getYTThumb(song.link)}" style="width:40px; height:24px; object-fit:cover; border-radius:4px;">
      <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><strong>${song.name}</strong><br><span style="font-size:0.75rem; color:#888;">${song.artist}</span></div>
    </div>
    <div style="display:flex; gap:3px;">${tags}</div>
  `;
  return div;
}

function initSortables() {
  sortableLists.forEach(s => s.destroy()); sortableLists = []; if(boardSortable) boardSortable.destroy();
  boardSortable = new Sortable(document.getElementById('dynamic-board'), { animation: 150, handle: '.list-col-header', ghostClass: 'sortable-ghost' });
  document.querySelectorAll('.drop-zone').forEach(zone => { sortableLists.push(new Sortable(zone, { group: 'shared', animation: 150, handle: '.drag-handle', ghostClass: 'sortable-ghost' })); });
}

function randomizeAlternate(containerId) {
  const container = document.getElementById(containerId); const items = Array.from(container.children); if (items.length < 2) return;
  const shuffle = array => array.sort(() => Math.random() - 0.5);
  let males = shuffle(items.filter(i => i.dataset.gender === 'M')), females = shuffle(items.filter(i => i.dataset.gender === 'F')), mixes = shuffle(items.filter(i => i.dataset.gender !== 'M' && i.dataset.gender !== 'F'));
  container.innerHTML = ''; let mIdx = 0, fIdx = 0, mixIdx = 0, turn = 'M';
  while(mIdx < males.length || fIdx < females.length || mixIdx < mixes.length) {
    if(turn === 'M') { if(mIdx < males.length) { container.appendChild(males[mIdx++]); turn = 'F'; } else turn = 'F'; } 
    else if(turn === 'F') { if(fIdx < females.length) { container.appendChild(females[fIdx++]); turn = 'Mix'; } else turn = 'Mix'; } 
    else if(turn === 'Mix') { if(mixIdx < mixes.length) { container.appendChild(mixes[mixIdx++]); turn = 'M'; } else turn = 'M'; }
  }
}

function aiMagicSetlist() {
  const pool = document.getElementById('list-pool'); const items = Array.from(pool.children); if (items.length < 3) return showToast("เพลงน้อยเกินไป", "ต้องมีอย่างน้อย 3 เพลงในกองกลาง", "error");
  const btn = document.getElementById('btn-ai-setlist'); btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> กำลังคิด...`; btn.disabled = true;
  const songData = items.map(el => ({ id: el.dataset.id, gender: el.dataset.gender, isBreakdance: el.dataset.bd === "true" }));
  fetchAPI("aiMagicSetlist", { songs: songData }, sortedIds => {
    pool.innerHTML = ''; sortedIds.forEach(id => { const matchedEl = items.find(el => el.dataset.id === id); if (matchedEl) pool.appendChild(matchedEl); });
    items.forEach(el => { if (!sortedIds.includes(el.dataset.id)) pool.appendChild(el); });
    btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> AI`; btn.disabled = false; showToast("จัดเรียงเสร็จสิ้น!", "AI สลับเพศให้เรียบร้อยแล้ว", "success");
  }, () => { btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> AI`; btn.disabled = false; });
}

function savePlaylistData() {
  const lists = [];
  document.querySelectorAll('.drop-zone').forEach(zone => {
    const listName = zone.getAttribute('data-category'), items = zone.children;
    for (let i = 0; i < items.length; i++) { const s = currentSongs.find(song => song.id === items[i].dataset.id); if (s) lists.push({ listName: listName, id: s.id, name: s.name, artist: s.artist, gender: s.gender, isBreakdance: s.isBreakdance, time: `${s.start}-${s.end}`, link: s.link }); }
  });
  const btnTop = document.getElementById('btn-save-playlist-top'); const btnBot = document.getElementById('btn-save-playlist-bottom');
  if(btnTop) { btnTop.innerText = "กำลังบันทึก..."; btnTop.disabled = true; }
  if(btnBot) { btnBot.innerText = "กำลังบันทึก..."; btnBot.disabled = true; }
  
  fetchAPI("savePlaylist", { eventId: activeEvent.id, date: activeEvent.date, lists: lists }, res => { 
    if(btnTop) { btnTop.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> เซฟลง Sheet`; btnTop.disabled = false; }
    if(btnBot) { btnBot.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> บันทึกลง Sheet`; btnBot.disabled = false; }
    showToast("บันทึกสำเร็จ", "ข้อมูล Setlist ถูกเซฟลง Sheet แล้ว"); 
  }, () => { 
    if(btnTop) { btnTop.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> เซฟลง Sheet`; btnTop.disabled = false; }
    if(btnBot) { btnBot.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> บันทึกลง Sheet`; btnBot.disabled = false; }
  });
}
