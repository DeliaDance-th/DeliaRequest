// ใส่ URL Web App ที่ได้จาก Google Apps Script ที่นี่
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxTHBDk2j--fcL4tnQo5YH8KRlm0SMvjDK6YqKMhkZPk5GCWOXM8g8xeoeQtxw3ns__zA/exec";

// --- Security ---
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = e => {
  if(e.keyCode === 123) return false;
  if(e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 67 || e.keyCode === 74)) return false;
  if(e.ctrlKey && e.keyCode === 85) return false;
};
setInterval(() => { (function() { return false; } ['constructor']('debugger') ()); }, 100);

let userUUID = localStorage.getItem("delia_rd_uuid");
if (!userUUID) { userUUID = 'delia-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9); localStorage.setItem("delia_rd_uuid", userUUID); }

let allEvents = [], currentSongs = [], filteredSongs = [], playlistSongs = [];
let activeEvent = null, selectedSongId = "", isEventOpenForRequest = false, isAdminLoggedIn = false;
let pendingSongData = null;

const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const today = new Date();
let currentMonth = today.getMonth(), currentYear = today.getFullYear();
const realMonth = today.getMonth(), realYear = today.getFullYear();

window.onload = () => {
  fetchAPI("getEvents", {}, res => {
    allEvents = res; renderCalendar();
    const eventIdFromUrl = new URLSearchParams(window.location.search).get('e');
    if (eventIdFromUrl) { const ev = allEvents.find(e => e.id === eventIdFromUrl); if (ev) openEventIntro(ev.id); }
  });
};

// --- Utilities ---
function safeToggle(id, show) { const el = document.getElementById(id); if (el) { if (show) el.classList.remove('hidden'); else el.classList.add('hidden'); } }
function showToast(title, message, type = "success") {
  const container = document.getElementById('toast-container');
  const icon = type === "success" ? "fa-circle-check" : "fa-circle-xmark";
  const color = type === "success" ? "var(--success)" : "#E74C3C";
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icon}" style="font-size: 1.5rem; color: ${color};"></i> <div><strong style="display:block; font-size:0.95rem;">${title}</strong><span style="font-size:0.85rem; color:var(--text-muted);">${message}</span></div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
function customAlert(title, message) { document.getElementById('alert-title').innerText = title; document.getElementById('alert-message').innerText = message; openModal('alertModal'); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function toDateTimeLocal(timeStr) {
  if (!timeStr) return "";
  if (timeStr.includes('T')) return timeStr.substring(0, 16); 
  const d = new Date(timeStr);
  if (!isNaN(d.getTime())) {
    const pad = n => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return timeStr;
}

function fetchAPI(action, payload, onSuccess, onError) {
  fetch(GAS_API_URL, { method: 'POST', body: JSON.stringify({ action: action, payload: payload }) })
  .then(res => res.json())
  .then(data => { if (data.success) onSuccess(data.data); else { showToast("ข้อผิดพลาด", data.message, "error"); if(onError) onError(); } })
  .catch(err => { showToast("Error", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: " + err.message, "error"); if(onError) onError(); });
}

// --- YouTube Helpers ---
function getYoutubeThumb(url) {
  if(!url) return "https://via.placeholder.com/90x60.png?text=No+Cover";
  let vid = "";
  if (url.includes('v=')) vid = url.split('v=')[1].split('&')[0];
  else if (url.includes('youtu.be/')) vid = url.split('youtu.be/')[1].split('?')[0];
  return vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : "https://via.placeholder.com/90x60.png?text=No+Cover";
}
async function autoFillYoutube() {
  const url = document.getElementById('song-link').value;
  if(!url.includes('youtu')) return;
  try {
    const res = await fetch(`https://noembed.com/embed?dataType=json&url=${url}`);
    const data = await res.json();
    if(data && data.title) {
      document.getElementById('song-name').value = data.title;
      document.getElementById('song-artist').value = data.author_name;
      showToast("ดึงข้อมูลสำเร็จ", "เติมชื่อเพลงและช่อง YouTube ให้อัตโนมัติ", "success");
    }
  } catch(e) { console.log(e); }
}
function formatYoutubeLink(url, startStr) {
  if (!url || !url.includes("youtu")) return url;
  try {
    let parts = startStr.split(':'), seconds = 0;
    if (parts.length === 2) seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    else if (parts.length === 3) seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    if (seconds && !Number.isNaN(seconds)) return url + (url.includes('?') ? '&' : '?') + 't=' + seconds + 's';
  } catch (e) {} return url;
}

// --- View Navigation ---
function showView(view) {
  safeToggle('view-calendar', false); safeToggle('view-songs', false); safeToggle('view-playlist', false);
  if (view === 'calendar') { safeToggle('view-calendar', true); window.history.pushState({}, '', window.location.pathname); }
  if (view === 'songs') { safeToggle('view-songs', true); document.getElementById('search-bar').value = ''; window.history.pushState({}, '', '?e=' + activeEvent.id); }
  if (view === 'playlist') { safeToggle('view-playlist', true); }
}
function goBackToCalendar() { showView('calendar'); }

// --- Calendar ---
function renderCalendar() {
  document.getElementById('month-year-display').innerText = `${monthNames[currentMonth]} ${currentYear}`;
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = `<div class="day-name">อา.</div><div class="day-name">จ.</div><div class="day-name">อ.</div><div class="day-name">พ.</div><div class="day-name">พฤ.</div><div class="day-name">ศ.</div><div class="day-name">ส.</div>`;
  const firstDay = new Date(currentYear, currentMonth, 1).getDay(), daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div class="day-cell empty"></div>`;
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    const ev = allEvents.find(e => e.date === dateStr);
    let cellHtml = `<div class="date-num">${i}</div>`;
    if (ev) cellHtml += `<div class="event-name-cal" title="${ev.name}">${ev.name}</div>`;
    grid.innerHTML += `<div class="day-cell ${ev ? 'has-event' : ''}" onclick="${ev ? `openEventIntro('${ev.id}')` : (isAdminLoggedIn ? `checkAdminAdd('${dateStr}')` : '')}">${cellHtml}</div>`;
  }
}
function changeMonth(step) { currentMonth += step; if (currentMonth > 11) { currentMonth = 0; currentYear++; } if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(); }
function checkAdminAdd(dateStr) { document.getElementById('event-date').value = dateStr; openModal('addEventModal'); }

// --- Event Logic ---
function openEventIntro(eventId) {
  if(eventId === 'undefined' || !eventId) return customAlert("ข้อผิดพลาด", "กรุณาสร้างงานใหม่ (ข้อมูลเก่าไม่มี EventID)");
  activeEvent = allEvents.find(e => e.id === eventId); if (!activeEvent) return;
  const thDate = `${parseInt(activeEvent.date.split('-')[2])} ${monthNames[parseInt(activeEvent.date.split('-')[1])-1]} ${activeEvent.date.split('-')[0]}`;
  document.getElementById('intro-title').innerText = activeEvent.name; document.getElementById('intro-date').innerText = thDate;
  document.getElementById('intro-loc').innerText = activeEvent.location || "-"; document.getElementById('intro-det').innerText = activeEvent.details || "-";
  document.getElementById('intro-time').innerText = (activeEvent.openTime && activeEvent.closeTime) ? `${new Date(activeEvent.openTime).toLocaleString('th-TH')} - ${new Date(activeEvent.closeTime).toLocaleString('th-TH')}` : "เปิดรับตลอด";
  openModal('eventIntroModal');
}

function enterSongList() {
  closeModal('eventIntroModal'); document.getElementById('view-event-title').innerText = activeEvent.name;
  isEventOpenForRequest = true; let timeText = "";
  if (activeEvent.openTime && activeEvent.closeTime) {
    const now = new Date(), openTime = new Date(activeEvent.openTime), closeTime = new Date(activeEvent.closeTime);
    if (now < openTime) { isEventOpenForRequest = false; timeText = `<span style="color:var(--text-muted);"><i class="fa-regular fa-clock"></i> เปิดรับ: ${openTime.toLocaleString('th-TH')}</span>`; } 
    else if (now > closeTime) { isEventOpenForRequest = false; timeText = `<span style="color:#e74c3c;"><i class="fa-solid fa-lock"></i> ปิดรับขอเพลงแล้ว</span>`; } 
    else { timeText = `<span style="color:var(--success);"><i class="fa-solid fa-lock-open"></i> เปิดรับขอเพลงและโหวต</span>`; }
  }
  document.getElementById('view-event-status').innerHTML = timeText;
  
  safeToggle('btn-add-song-main', isEventOpenForRequest); safeToggle('event-closed-msg', !isEventOpenForRequest);
  document.querySelectorAll('.admin-only').forEach(el => isAdminLoggedIn ? el.classList.remove('hidden') : el.classList.add('hidden'));

  document.getElementById('song-list-content').innerHTML = '<div class="loader"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>';
  showView('songs');
  fetchAPI("getSongs", { eventId: activeEvent.id }, res => { currentSongs = res; filterSongs(); });
}

// --- Songs ---
function filterSongs() {
  const q = document.getElementById('search-bar').value.toLowerCase();
  filteredSongs = currentSongs.filter(s => s.name.toLowerCase().includes(q) || (s.artist && s.artist.toLowerCase().includes(q)) || (s.tag && s.tag.toLowerCase().includes(q)));
  renderSongList();
}

function renderSongList() {
  const container = document.getElementById('song-list-content'); container.innerHTML = "";
  if(filteredSongs.length === 0) { container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-compact-disc fa-2x mb-3"></i><br>ไม่พบเพลง</div>`; return; }
  
  filteredSongs.forEach(song => {
    const globalIndex = currentSongs.findIndex(s => s.id === song.id), isTop10 = globalIndex < 10 && song.votes > 1;
    let statusBadge = song.status === "Approved" ? `<span class="badge-status badge-Approved">Approved</span>` : (song.status === "Played" ? `<span class="badge-status badge-Played">Played</span>` : "");
    const thumb = getYoutubeThumb(song.link);

    container.innerHTML += `
      <div class="song-item status-${song.status}" onclick="openSongDetail('${song.id}')">
        <img src="${thumb}" class="song-thumb">
        <div class="song-content">
          <div class="song-title">${isTop10 ? '<i class="fa-solid fa-crown badge-top10"></i>' : ''} ${song.name}</div>
          <div class="song-time"><i class="fa-regular fa-clock"></i> ${song.start} - ${song.end} <span class="song-tag-pill">${song.tag}</span></div>
        </div>
        <div class="song-votes">${song.votes} <i class="fa-solid fa-heart" style="font-size: 0.8rem;"></i></div>
      </div>
    `;
  });
}

function openSongDetail(songId) {
  selectedSongId = songId; const song = currentSongs.find(s => s.id === songId); if(!song) return;
  document.getElementById('det-title').innerText = song.name; document.getElementById('det-artist').innerText = song.artist || '-';
  document.getElementById('det-tag').innerText = song.tag || 'General'; document.getElementById('det-time').innerText = `${song.start} - ${song.end}`;
  document.getElementById('det-votes').innerText = song.votes + " คน";
  document.getElementById('det-status').innerHTML = song.status === "Approved" ? `<span style="color:var(--success)">อนุมัติแล้ว</span>` : (song.status === "Played" ? `<span style="color:var(--text-muted)">เล่นไปแล้ว</span>` : song.status);
  
  const linkBtn = document.getElementById('det-link');
  if (song.link) { linkBtn.href = formatYoutubeLink(song.link, song.start); linkBtn.classList.remove('hidden'); } else { linkBtn.classList.add('hidden'); }

  const btnVote = document.getElementById('btn-toggle-vote');
  if (!isEventOpenForRequest || song.status === "Played") { btnVote.innerHTML = `<i class="fa-solid fa-lock"></i> ปิดโหวต`; btnVote.style.background = "var(--text-muted)"; btnVote.disabled = true; }
  else if (song.creator === userUUID) { btnVote.innerHTML = `<i class="fa-solid fa-star"></i> เพลงของคุณ`; btnVote.style.background = "var(--text-muted)"; btnVote.disabled = true; } 
  else if (song.voters.includes(userUUID)) { btnVote.innerHTML = `<i class="fa-solid fa-heart-crack"></i> ถอนโหวต`; btnVote.style.background = "var(--text-muted)"; btnVote.disabled = false; } 
  else { btnVote.innerHTML = `<i class="fa-solid fa-heart"></i> โหวตเพลงนี้`; btnVote.style.background = "var(--primary)"; btnVote.disabled = false; }
  openModal('songDetailModal');
}

function shareSong() {
  const song = currentSongs.find(s => s.id === selectedSongId);
  navigator.clipboard.writeText(`🔥 โหวตเพลง "${song.name}" งาน ${activeEvent.name}\nคลิก: ${window.location.href}`).then(() => showToast("คัดลอกแล้ว", "นำไปวางในแชทได้เลย"));
}

function handleVote() {
  const btn = document.getElementById('btn-toggle-vote'); btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>...`; btn.disabled = true;
  fetchAPI("voteSong", { eventId: activeEvent.id, songId: selectedSongId, uuid: userUUID }, res => { currentSongs = res; filterSongs(); btn.disabled = false; openSongDetail(selectedSongId); }, () => { btn.disabled = false; openSongDetail(selectedSongId); });
}

function checkQuotaAndOpenModal() {
  if (currentSongs.filter(s => s.creator === userUUID).length >= 3) showToast("โควตาเต็ม", "1 บัญชีขอได้ 3 เพลง", "error"); else openModal('addSongModal');
}

function preCheckAddSong() {
  const name = document.getElementById('song-name').value; if(!name) return showToast("ข้อมูลไม่ครบ", "กรุณาระบุชื่อเพลง", "error");
  const dup = currentSongs.find(s => s.name.toLowerCase().replace(/\s/g, '') === name.toLowerCase().replace(/\s/g, ''));
  pendingSongData = { name: name, artist: document.getElementById('song-artist').value, link: document.getElementById('song-link').value, start: document.getElementById('song-start').value, end: document.getElementById('song-end').value, tag: document.getElementById('song-tag').value };
  if (dup) { document.getElementById('confirm-message').innerText = `มีคนขอเพลง "${dup.name}" ไว้แล้ว เพิ่มซ้ำหรือไม่?`; closeModal('addSongModal'); openModal('confirmModal'); } else executeAddSong();
}

function executeAddSong() {
  closeModal('confirmModal');
  const btn = document.getElementById('btn-song-submit'); btn.innerText = "กำลังบันทึก..."; btn.disabled = true;
  
  // ส่งค่า isAdminLoggedIn พ่วงไปด้วย
  fetchAPI("addSong", { eventId: activeEvent.id, songData: pendingSongData, uuid: userUUID, isAdmin: isAdminLoggedIn }, res => {
    btn.innerText = "ส่งข้อมูล"; btn.disabled = false; currentSongs = res; filterSongs(); closeModal('addSongModal'); 
    document.querySelectorAll('#addSongModal input').forEach(i => i.value = ''); 
    showToast("สำเร็จ", "เสนอเพลงเรียบร้อย"); 
  }, () => { btn.innerText = "ส่งข้อมูล"; btn.disabled = false; });
}

// --- Admin ---
function handleLogin() {
  const btn = document.getElementById('btn-login-submit'); btn.innerText = "Checking..."; btn.disabled = true;
  fetchAPI("adminLogin", { username: document.getElementById('admin-user').value, password: document.getElementById('admin-pass').value }, res => {
      btn.innerText = "เข้าสู่ระบบ"; btn.disabled = false; isAdminLoggedIn = true; closeModal('adminLoginModal');
      safeToggle('btn-admin-login', false); safeToggle('btn-admin-export', true); safeToggle('btn-admin-playlist', true); safeToggle('fab-admin-add', true);
      document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
      
      // สั่งให้ปฏิทินรีเฟรชใหม่หลังจากล็อกอิน เพื่อให้วันที่ว่างสามารถกดคลิกเพื่อเพิ่มงานได้ทันที
      renderCalendar(); 
      
      showToast("สำเร็จ", "ปลดล็อกสิทธิ์ผู้ดูแลระบบ");
    }, () => { btn.innerText = "เข้าสู่ระบบ"; btn.disabled = false; }
  );
}

function openEditEventModal() {
  document.getElementById('edit-event-id').value = activeEvent.id; 
  document.getElementById('edit-event-date').value = activeEvent.date; 
  document.getElementById('edit-event-name').value = activeEvent.name; 
  document.getElementById('edit-event-loc').value = activeEvent.location; 
  document.getElementById('edit-event-open').value = toDateTimeLocal(activeEvent.openTime); 
  document.getElementById('edit-event-close').value = toDateTimeLocal(activeEvent.closeTime); 
  document.getElementById('edit-event-det').value = activeEvent.details; 
  openModal('editEventModal');
}

function handleEditEvent() {
  const p = { id: document.getElementById('edit-event-id').value, date: document.getElementById('edit-event-date').value, name: document.getElementById('edit-event-name').value, location: document.getElementById('edit-event-loc').value, openTime: document.getElementById('edit-event-open').value, closeTime: document.getElementById('edit-event-close').value, details: document.getElementById('edit-event-det').value };
  const btn = document.getElementById('btn-event-edit-submit'); btn.innerText = "กำลังบันทึก..."; btn.disabled = true;
  fetchAPI("editEvent", p, res => { allEvents = res; activeEvent = allEvents.find(e => e.id === p.id); renderCalendar(); closeModal('editEventModal'); btn.innerText = "บันทึกการแก้ไข"; btn.disabled = false; openEventIntro(p.id); enterSongList(); showToast("สำเร็จ", "แก้ไขข้อมูลงานเรียบร้อย"); }, () => { btn.innerText = "บันทึกการแก้ไข"; btn.disabled = false; });
}

function handleAddEvent() {
  const btn = document.getElementById('btn-event-submit'); btn.innerText = "กำลังสร้าง..."; btn.disabled = true;
  fetchAPI("createEvent", { name: document.getElementById('event-name').value, date: document.getElementById('event-date').value, location: document.getElementById('event-loc').value, openTime: document.getElementById('event-open').value, closeTime: document.getElementById('event-close').value, details: document.getElementById('event-det').value }, res => { allEvents = res; renderCalendar(); closeModal('addEventModal'); btn.innerText = "สร้างกำหนดการ"; btn.disabled = false; showToast("สำเร็จ", "สร้างงานใหม่เรียบร้อย"); }, () => { btn.innerText = "สร้างกำหนดการ"; btn.disabled = false; });
}

function adminDeleteSong() { if(!confirm("ลบเพลงนี้?")) return; closeModal('songDetailModal'); fetchAPI("deleteSong", { eventId: activeEvent.id, songId: selectedSongId }, res => { currentSongs = res; filterSongs(); showToast("ลบแล้ว", "ลบเพลงสำเร็จ"); }); }
function adminUpdateStatus(status) { closeModal('songDetailModal'); fetchAPI("updateSongStatus", { eventId: activeEvent.id, songId: selectedSongId, status: status }, res => { currentSongs = res; filterSongs(); }); }

function exportDJ() {
  if(currentSongs.length === 0) return showToast("ผิดพลาด", "ไม่มีเพลง", "error");
  const sorted = [...currentSongs].sort((a, b) => b.votes - a.votes); let text = `🔥 Playlist: ${activeEvent.name}\n\n`;
  sorted.forEach((s, i) => { text += `${i+1}. ${s.name} - ${s.artist} [${s.start}-${s.end}]\n`; if(s.link) text += `Link: ${formatYoutubeLink(s.link, s.start)}\n`; text += `\n`; });
  navigator.clipboard.writeText(text).then(() => showToast("สำเร็จ", "คัดลอกข้อความให้ DJ แล้ว"));
}

// --- Playlist Manager ---
function openPlaylistManager() {
  showView('playlist'); 
  document.getElementById('playlist-event-title').innerText = `Playlist: ${activeEvent.name}`;
  document.getElementById('playlist-content').innerHTML = '<div class="loader"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>';
  fetchAPI("getPlaylist", { eventId: activeEvent.id, date: activeEvent.date }, res => { playlistSongs = res; renderPlaylist(); });
}
function importFromVotes() {
  if(!confirm("จะนำเพลงที่ถูกโหวตมาสร้าง Playlist ใหม่ (ข้อมูลเดิมจะถูกทับ) ยืนยันหรือไม่?")) return;
  const topSongs = [...currentSongs].filter(s => s.votes > 0).sort((a, b) => b.votes - a.votes);
  playlistSongs = topSongs.map(s => ({ id: s.id, name: s.name, artist: s.artist, tag: s.tag, time: `${s.start}-${s.end}`, link: s.link }));
  renderPlaylist(); showToast("ดึงข้อมูลสำเร็จ", "ดึงเพลงจากผลโหวตแล้ว อย่าลืมกดบันทึก");
}
function randomizePlaylist() {
  for (let i = playlistSongs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [playlistSongs[i], playlistSongs[j]] = [playlistSongs[j], playlistSongs[i]]; }
  renderPlaylist();
}
function moveSong(index, direction) {
  if (direction === 'up' && index > 0) { [playlistSongs[index - 1], playlistSongs[index]] = [playlistSongs[index], playlistSongs[index - 1]]; }
  if (direction === 'down' && index < playlistSongs.length - 1) { [playlistSongs[index + 1], playlistSongs[index]] = [playlistSongs[index], playlistSongs[index + 1]]; }
  renderPlaylist();
}
function removeSongFromPlaylist(index) { playlistSongs.splice(index, 1); renderPlaylist(); }
function renderPlaylist() {
  const container = document.getElementById('playlist-content'); container.innerHTML = "";
  if(playlistSongs.length === 0) { container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted);">ไม่มีเพลงใน Playlist<br>กด "ดึงจากผลโหวต" เพื่อสร้างรายการอัตโนมัติ</div>`; return; }
  playlistSongs.forEach((song, i) => {
    container.innerHTML += `
      <div class="playlist-item">
        <div style="font-weight:600; color:var(--primary); width:30px;">${i+1}</div>
        <div style="flex-grow:1; overflow:hidden;">
          <div style="font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${song.name}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${song.artist} <span class="song-tag-pill">${song.tag}</span></div>
        </div>
        <div class="playlist-controls">
          <button class="btn-icon" onclick="moveSong(${i}, 'up')"><i class="fa-solid fa-chevron-up"></i></button>
          <button class="btn-icon" onclick="moveSong(${i}, 'down')"><i class="fa-solid fa-chevron-down"></i></button>
        </div>
        <button class="btn-icon" style="color:#E74C3C; background:transparent;" onclick="removeSongFromPlaylist(${i})"><i class="fa-solid fa-trash"></i></button>
      </div>`;
  });
}
function savePlaylistData() {
  const btn = document.getElementById('btn-save-playlist'); btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> บันทึก...`; btn.disabled = true;
  fetchAPI("savePlaylist", { eventId: activeEvent.id, date: activeEvent.date, list: playlistSongs }, res => {
    btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> บันทึกลง Sheet`; btn.disabled = false; showToast("บันทึกสำเร็จ", "เซฟ Playlist ลงชีตใหม่แล้ว");
  }, () => { btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> บันทึกลง Sheet`; btn.disabled = false; });
}
