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
  container.appendChild(toast); setTimeout(() => toast.remove(), 3000);
}
function customAlert(title, message) { document.getElementById('alert-title').innerText = title; document.getElementById('alert-message').innerText = message; openModal('alertModal'); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function toDateTimeLocal(timeStr) {
  if (!timeStr) return ""; if (timeStr.includes('T')) return timeStr.substring(0, 16); 
  const d = new Date(timeStr); if (!isNaN(d.getTime())) { const pad = n => n.toString().padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
  return timeStr;
}

function fetchAPI(action, payload, onSuccess, onError) {
  fetch(GAS_API_URL, { method: 'POST', body: JSON.stringify({ action: action, payload: payload }) })
  .then(res => res.json())
  .then(data => { if (data.success) onSuccess(data.data); else { showToast("ข้อผิดพลาด", data.message, "error"); if(onError) onError(); } })
  .catch(err => { showToast("Error", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: " + err.message, "error"); if(onError) onError(); });
}

// --- Smart YouTube Extractor ---
function getYoutubeThumb(url) {
  if(!url) return "https://via.placeholder.com/90x60.png?text=No+Cover";
  let vid = "";
  if (url.includes('v=')) vid = url.split('v=')[1].split('&')[0];
  else if (url.includes('youtu.be/')) vid = url.split('youtu.be/')[1].split('?')[0];
  return vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : "https://via.placeholder.com/90x60.png?text=No+Cover";
}

async function processYoutubeLink(inputId, nameId, artistId) {
  const url = document.getElementById(inputId).value;
  if(!url.includes('youtu')) return;
  try {
    const res = await fetch(`https://noembed.com/embed?dataType=json&url=${url}`);
    const data = await res.json();
    if(data && data.title) {
      let title = data.title;
      const garbages = [ /\[.*?\]/g, /\(.*?\)/g, /【.*?】/g, /「.*?」/g, /SMTOWN\s*\|?/gi, /JYP Entertainment\s*\|?/gi, /YG ENTERTAINMENT\s*\|?/gi, /HYBE LABELS\s*\|?/gi, /1theK\s*\(.*?\)\s*\|?/gi, /Stone Music Entertainment\s*\|?/gi, /Music Video/gi, /Official/gi, /MV/gi, /Teaser/gi, /Performance/gi, /HD/gi ];
      garbages.forEach(g => { title = title.replace(g, ''); });
      title = title.trim();

      let parts = title.split(/\s*[-–|~]\s*/);
      if (parts.length >= 2) {
         document.getElementById(artistId).value = parts[0].trim();
         document.getElementById(nameId).value = parts.slice(1).join('-').trim();
      } else {
         document.getElementById(nameId).value = title;
         document.getElementById(artistId).value = data.author_name ? data.author_name.replace(/ - Topic/gi, '') : '';
      }
      showToast("ดึงข้อมูลสำเร็จ", "ล้างชื่อเพลงและศิลปินอัตโนมัติ", "success");
    }
  } catch(e) { console.log(e); }
}

function autoFillYoutube() { processYoutubeLink('song-link', 'song-name', 'song-artist'); }
function autoFillYoutubeEdit() { processYoutubeLink('edit-song-link', 'edit-song-name', 'edit-song-artist'); }

function formatYoutubeLink(url, startStr) {
  if (!url || !url.includes("youtu")) return url;
  try {
    let parts = startStr.split(':'), seconds = 0;
    if (parts.length === 2) seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    else if (parts.length === 3) seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    if (seconds && !Number.isNaN(seconds)) return url + (url.includes('?') ? '&' : '?') + 't=' + seconds + 's';
  } catch (e) {} return url;
}

// --- Navigation ---
function showView(view) {
  safeToggle('view-calendar', false); safeToggle('view-songs', false); safeToggle('view-playlist', false);
  if (view === 'calendar') { safeToggle('view-calendar', true); window.history.pushState({}, '', window.location.pathname); }
  if (view === 'songs') { safeToggle('view-songs', true); document.getElementById('search-bar').value = ''; window.history.pushState({}, '', '?e=' + activeEvent.id); }
  if (view === 'playlist') { safeToggle('view-playlist', true); }
}
function goBackToCalendar() { showView('calendar'); }

// --- Calendar Logic ---
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

// --- Songs UI & Interaction ---
function filterSongs() {
  const q = document.getElementById('search-bar').value.toLowerCase();
  filteredSongs = currentSongs.filter(s => s.name.toLowerCase().includes(q) || (s.artist && s.artist.toLowerCase().includes(q)));
  renderSongList();
}

function renderSongList() {
  const container = document.getElementById('song-list-content'); container.innerHTML = "";
  if(filteredSongs.length === 0) { container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-compact-disc fa-2x mb-3"></i><br>ไม่พบเพลง</div>`; return; }
  
  filteredSongs.forEach(song => {
    const globalIndex = currentSongs.findIndex(s => s.id === song.id), isTop10 = globalIndex < 10 && song.votes > 1;
    let statusBadge = song.status === "Approved" ? `<span class="badge-status badge-Approved">Approved</span>` : (song.status === "Played" ? `<span class="badge-status badge-Played">Played</span>` : "");
    const thumb = getYoutubeThumb(song.link);
    
    let genderIcon = song.gender === 'M' ? '<i class="fa-solid fa-mars" style="color:#3498DB;"></i>' : (song.gender === 'F' ? '<i class="fa-solid fa-venus" style="color:#E74C3C;"></i>' : '<i class="fa-solid fa-venus-mars" style="color:#9B59B6;"></i>');
    let breakdancePill = song.isBreakdance === 'Yes' || song.isBreakdance === true ? `<span class="pill-breakdance">Breakdance</span>` : '';

    container.innerHTML += `
      <div class="song-item status-${song.status}" onclick="openSongDetail('${song.id}')">
        <img src="${thumb}" class="song-thumb">
        <div class="song-content">
          <div class="song-title">${isTop10 ? '<i class="fa-solid fa-crown badge-top10"></i>' : ''} ${song.name} ${breakdancePill} ${statusBadge}</div>
          <div class="song-time">${genderIcon} ${song.artist || ''} | <i class="fa-regular fa-clock"></i> ${song.start} - ${song.end}</div>
        </div>
        <div class="song-votes">${song.votes} <i class="fa-solid fa-heart" style="font-size: 0.8rem;"></i></div>
      </div>
    `;
  });
}

function openSongDetail(songId) {
  selectedSongId = songId; const song = currentSongs.find(s => s.id === songId); if(!song) return;
  document.getElementById('det-title').innerText = song.name; document.getElementById('det-artist').innerText = song.artist || '-';
  
  let tagText = (song.gender === 'M' ? 'ศิลปินชาย' : (song.gender === 'F' ? 'ศิลปินหญิง' : 'รวม')) + (song.isBreakdance === 'Yes' || song.isBreakdance === true ? ' + Breakdance' : '');
  document.getElementById('det-tag').innerText = tagText; 
  document.getElementById('det-time').innerText = `${song.start} - ${song.end}`;
  document.getElementById('det-votes').innerText = song.votes + " คน";
  document.getElementById('det-status').innerHTML = song.status === "Approved" ? `<span style="color:var(--success)">อนุมัติแล้ว</span>` : (song.status === "Played" ? `<span style="color:var(--text-muted)">เล่นไปแล้ว</span>` : song.status);
  
  const linkBtn = document.getElementById('det-link');
  if (song.link) { linkBtn.href = formatYoutubeLink(song.link, song.start); linkBtn.classList.remove('hidden'); } else { linkBtn.classList.add('hidden'); }

  const btnVote = document.getElementById('btn-toggle-vote');
  const btnEditMySong = document.getElementById('btn-edit-mysong');
  
  if (!isEventOpenForRequest || song.status === "Played") { 
    btnVote.innerHTML = `<i class="fa-solid fa-lock"></i> ปิดโหวต`; btnVote.style.background = "var(--text-muted)"; btnVote.disabled = true; 
    btnEditMySong.classList.add('hidden');
  }
  else if (song.creator === userUUID) { 
    btnVote.innerHTML = `<i class="fa-solid fa-star"></i> เพลงของคุณ`; btnVote.style.background = "var(--text-muted)"; btnVote.disabled = true; 
    btnEditMySong.classList.remove('hidden');
  } 
  else if (song.voters.includes(userUUID)) { 
    btnVote.innerHTML = `<i class="fa-solid fa-heart-crack"></i> ถอนโหวต`; btnVote.style.background = "var(--text-muted)"; btnVote.disabled = false; 
    btnEditMySong.classList.add('hidden');
  } 
  else { 
    btnVote.innerHTML = `<i class="fa-solid fa-heart"></i> โหวตเพลงนี้`; btnVote.style.background = "var(--primary)"; btnVote.disabled = false; 
    btnEditMySong.classList.add('hidden');
  }
  
  if(isAdminLoggedIn) btnEditMySong.classList.remove('hidden');
  openModal('songDetailModal');
}

function openUserEditSong() {
  const song = currentSongs.find(s => s.id === selectedSongId);
  document.getElementById('edit-song-link').value = song.link;
  document.getElementById('edit-song-name').value = song.name;
  document.getElementById('edit-song-artist').value = song.artist;
  document.getElementById('edit-song-start').value = song.start;
  document.getElementById('edit-song-end').value = song.end;
  document.getElementById('edit-song-breakdance').checked = (song.isBreakdance === 'Yes' || song.isBreakdance === true);
  closeModal('songDetailModal');
  openModal('editSongModal');
}

function executeEditSong() {
  const name = document.getElementById('edit-song-name').value;
  if(!name) return showToast("ข้อมูลไม่ครบ", "กรุณาระบุชื่อเพลง", "error");
  const updatedData = { 
    name: name, artist: document.getElementById('edit-song-artist').value, 
    link: document.getElementById('edit-song-link').value, 
    start: document.getElementById('edit-song-start').value, end: document.getElementById('edit-song-end').value, 
    isBreakdance: document.getElementById('edit-song-breakdance').checked 
  };
  const btn = document.getElementById('btn-song-edit-submit'); btn.innerText = "บันทึก..."; btn.disabled = true;
  fetchAPI("editSong", { eventId: activeEvent.id, songId: selectedSongId, songData: updatedData, uuid: userUUID, isAdmin: isAdminLoggedIn }, res => { 
    btn.innerText = "บันทึกการแก้ไข"; btn.disabled = false; currentSongs = res; filterSongs(); closeModal('editSongModal'); showToast("สำเร็จ", "อัปเดตเพลงเรียบร้อย"); 
  }, () => { btn.innerText = "บันทึกการแก้ไข"; btn.disabled = false; });
}

function shareSong() {
  const song = currentSongs.find(s => s.id === selectedSongId);
  navigator.clipboard.writeText(`🔥 ช่วยโหวตเพลง "${song.name}" งาน ${activeEvent.name}\nคลิก: ${window.location.href}`).then(() => showToast("คัดลอกแล้ว", "นำไปส่งในแชทได้เลย"));
}

function handleVote() {
  const btn = document.getElementById('btn-toggle-vote'); btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>...`; btn.disabled = true;
  fetchAPI("voteSong", { eventId: activeEvent.id, songId: selectedSongId, uuid: userUUID }, res => { currentSongs = res; filterSongs(); btn.disabled = false; openSongDetail(selectedSongId); }, () => { btn.disabled = false; openSongDetail(selectedSongId); });
}

function checkQuotaAndOpenModal() {
  if (!isAdminLoggedIn && currentSongs.filter(s => s.creator === userUUID).length >= 3) { showToast("โควตาเต็ม", "1 บัญชีขอได้ 3 เพลง", "error"); } else { openModal('addSongModal'); }
}

function preCheckAddSong() {
  const name = document.getElementById('song-name').value; if(!name) return showToast("ข้อมูลไม่ครบ", "กรุณาระบุชื่อเพลง", "error");
  const dup = currentSongs.find(s => s.name.toLowerCase().replace(/\s/g, '') === name.toLowerCase().replace(/\s/g, ''));
  pendingSongData = { name: name, artist: document.getElementById('song-artist').value, link: document.getElementById('song-link').value, start: document.getElementById('song-start').value, end: document.getElementById('song-end').value, isBreakdance: document.getElementById('song-breakdance').checked };
  if (dup) { document.getElementById('confirm-message').innerText = `มีคนขอเพลง "${dup.name}" ไว้แล้ว เพิ่มซ้ำหรือไม่?`; closeModal('addSongModal'); openModal('confirmModal'); } else executeAddSong();
}

function executeAddSong() {
  closeModal('confirmModal'); const btn = document.getElementById('btn-song-submit'); btn.innerText = "กำลังบันทึก..."; btn.disabled = true;
  fetchAPI("addSong", { eventId: activeEvent.id, songData: pendingSongData, uuid: userUUID, isAdmin: isAdminLoggedIn }, res => { btn.innerText = "ส่งข้อมูล"; btn.disabled = false; currentSongs = res; filterSongs(); closeModal('addSongModal'); document.querySelectorAll('#addSongModal input[type="text"], #addSongModal input[type="url"]').forEach(i => i.value = ''); document.getElementById('song-breakdance').checked = false; showToast("สำเร็จ", "เสนอเพลงเรียบร้อย"); }, () => { btn.innerText = "ส่งข้อมูล"; btn.disabled = false; });
}

// --- Admin Setup ---
function handleLogin() {
  const btn = document.getElementById('btn-login-submit'); btn.innerText = "Checking..."; btn.disabled = true;
  fetchAPI("adminLogin", { username: document.getElementById('admin-user').value, password: document.getElementById('admin-pass').value }, res => {
      btn.innerText = "เข้าสู่ระบบ"; btn.disabled = false; isAdminLoggedIn = true; closeModal('adminLoginModal');
      safeToggle('btn-admin-login', false); safeToggle('btn-admin-export', true); safeToggle('btn-admin-playlist', true);
      document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden')); renderCalendar(); showToast("สำเร็จ", "ปลดล็อกสิทธิ์ผู้ดูแลระบบ");
    }, () => { btn.innerText = "เข้าสู่ระบบ"; btn.disabled = false; }
  );
}

// --- Playlist Manager (Drag & Drop UI 4 Columns) ---
let sortables = {};
function initSortables() {
  const lists = ['list-pool', 'list-kpop', 'list-tpop', 'list-mix'];
  lists.forEach(id => {
    if(sortables[id]) sortables[id].destroy(); 
    sortables[id] = new Sortable(document.getElementById(id), { group: 'shared', animation: 150, ghostClass: 'sortable-ghost' });
  });
}

function openPlaylistManager() {
  showView('playlist'); document.getElementById('playlist-event-title').innerText = `Playlist: ${activeEvent.name}`;
  const pools = ['list-pool', 'list-kpop', 'list-tpop', 'list-mix']; pools.forEach(id => document.getElementById(id).innerHTML = '');
  
  fetchAPI("getPlaylist", { eventId: activeEvent.id, date: activeEvent.date }, res => {
    if(res.length > 0) {
      res.forEach(song => {
         const listId = `list-${song.listName.toLowerCase()}`;
         const container = document.getElementById(listId) || document.getElementById('list-pool');
         container.appendChild(createDragItem(song));
      });
    }
    initSortables();
  });
}

function importFromVotes() {
  if(!confirm("จะนำเพลงที่ถูกโหวตมาสร้าง Playlist ใหม่ (ข้อมูลเดิมจะถูกทับ) ยืนยันหรือไม่?")) return;
  const pools = ['list-pool', 'list-kpop', 'list-tpop', 'list-mix']; pools.forEach(id => document.getElementById(id).innerHTML = '');
  const topSongs = [...currentSongs].filter(s => s.votes > 0).sort((a, b) => b.votes - a.votes);
  const pool = document.getElementById('list-pool');
  topSongs.forEach(s => pool.appendChild(createDragItem(s)));
  initSortables(); showToast("ดึงข้อมูลสำเร็จ", "เพลงอยู่ในกองกลางแล้ว ลากแยกประเภทได้เลย");
}

function createDragItem(song) {
  const div = document.createElement('div');
  div.className = 'drag-item';
  div.dataset.name = song.name; div.dataset.artist = song.artist; div.dataset.gender = song.gender; div.dataset.breakdance = song.isBreakdance; div.dataset.time = song.start ? `${song.start}-${song.end}` : song.time; div.dataset.link = song.link;
  
  let bdPill = song.isBreakdance === 'true' || song.isBreakdance === true || song.isBreakdance === 'Yes' ? '<span class="pill" style="background:#FFDAB9; color:#8B008B; border:none;">BD</span>' : '';
  let genderPill = song.gender === 'M' ? '<span class="pill">Boy</span>' : (song.gender === 'F' ? '<span class="pill">Girl</span>' : '<span class="pill">Mix</span>');
  
  div.innerHTML = `
    <div class="drag-num"><i class="fa-solid fa-grip-vertical" style="color:#ddd;"></i></div>
    <div class="drag-content">
      <div class="drag-title">${song.name}</div>
      <div class="drag-artist">${song.artist} ${genderPill} ${bdPill}</div>
    </div>
    <div class="drag-actions">
      <button class="btn-updown" onclick="moveSong(this, 'up')"><i class="fa-solid fa-chevron-up"></i></button>
      <button class="btn-updown" onclick="moveSong(this, 'down')"><i class="fa-solid fa-chevron-down"></i></button>
    </div>
    <i class="fa-solid fa-trash" style="color:#E74C3C; cursor:pointer; margin-left:10px; font-size:1.1rem;" onclick="removeSongFromPlaylist(this)"></i>
  `;
  return div;
}

function randomizeAlternate(listId) {
  const container = document.getElementById(listId);
  const items = Array.from(container.children);
  if(items.length === 0) return;

  const shuffle = arr => arr.sort(() => Math.random() - 0.5);
  let males = shuffle(items.filter(item => item.dataset.gender === 'M'));
  let females = shuffle(items.filter(item => item.dataset.gender === 'F'));
  let mixes = shuffle(items.filter(item => item.dataset.gender === 'Mix'));

  container.innerHTML = ''; 
  let mIdx = 0, fIdx = 0, mixIdx = 0, turn = 'M';

  while(mIdx < males.length || fIdx < females.length || mixIdx < mixes.length) {
    if(turn === 'M') {
      if(mIdx < males.length) { container.appendChild(males[mIdx++]); turn = 'F'; } else turn = 'F';
    } else if(turn === 'F') {
      if(fIdx < females.length) { container.appendChild(females[fIdx++]); turn = 'Mix'; } else turn = 'Mix';
    } else if(turn === 'Mix') {
      if(mixIdx < mixes.length) { container.appendChild(mixes[mixIdx++]); turn = 'M'; } else turn = 'M';
    }
  }
  showToast("สุ่มสำเร็จ", "จัดเรียงสลับ ชาย/หญิง แบบสุ่มเรียบร้อย", "success");
}

function moveSong(btnEl, direction) {
  const item = btnEl.closest('.drag-item');
  const container = item.parentNode;
  if (direction === 'up' && item.previousElementSibling) { container.insertBefore(item, item.previousElementSibling); }
  if (direction === 'down' && item.nextElementSibling) { container.insertBefore(item.nextElementSibling, item); }
}

function removeSongFromPlaylist(iconEl) {
  const item = iconEl.closest('.drag-item');
  item.remove();
}

function savePlaylistData() {
  const lists = ['list-pool', 'list-kpop', 'list-tpop', 'list-mix'];
  let exportData = [];
  lists.forEach(lId => {
    const container = document.getElementById(lId);
    const listName = lId.split('-')[1].toUpperCase();
    Array.from(container.children).forEach(item => {
       exportData.push({ listName: listName, name: item.dataset.name, artist: item.dataset.artist, gender: item.dataset.gender, isBreakdance: (item.dataset.breakdance === 'true' || item.dataset.breakdance === 'Yes'), time: item.dataset.time, link: item.dataset.link });
    });
  });
  const btn = document.getElementById('btn-save-playlist'); btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> บันทึก...`; btn.disabled = true;
  fetchAPI("savePlaylist", { eventId: activeEvent.id, date: activeEvent.date, lists: exportData }, res => {
    btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> บันทึกลง Sheet`; btn.disabled = false; showToast("บันทึกสำเร็จ", "เซฟ Playlist ลงชีตใหม่แล้ว");
  }, () => { btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> บันทึกลง Sheet`; btn.disabled = false; });
}

function openEditEventModal() { document.getElementById('edit-event-id').value = activeEvent.id; document.getElementById('edit-event-date').value = activeEvent.date; document.getElementById('edit-event-name').value = activeEvent.name; document.getElementById('edit-event-loc').value = activeEvent.location; document.getElementById('edit-event-open').value = toDateTimeLocal(activeEvent.openTime); document.getElementById('edit-event-close').value = toDateTimeLocal(activeEvent.closeTime); document.getElementById('edit-event-det').value = activeEvent.details; openModal('editEventModal'); }
function handleEditEvent() { const p = { id: document.getElementById('edit-event-id').value, date: document.getElementById('edit-event-date').value, name: document.getElementById('edit-event-name').value, location: document.getElementById('edit-event-loc').value, openTime: document.getElementById('edit-event-open').value, closeTime: document.getElementById('edit-event-close').value, details: document.getElementById('edit-event-det').value }; fetchAPI("editEvent", p, res => { allEvents = res; activeEvent = allEvents.find(e => e.id === p.id); renderCalendar(); closeModal('editEventModal'); openEventIntro(p.id); enterSongList(); showToast("สำเร็จ", "แก้ไขข้อมูลงานเรียบร้อย"); }); }
function handleAddEvent() { fetchAPI("createEvent", { name: document.getElementById('event-name').value, date: document.getElementById('event-date').value, location: document.getElementById('event-loc').value, openTime: document.getElementById('event-open').value, closeTime: document.getElementById('event-close').value, details: document.getElementById('event-det').value }, res => { allEvents = res; renderCalendar(); closeModal('addEventModal'); showToast("สำเร็จ", "สร้างงานใหม่เรียบร้อย"); }); }
function adminDeleteSong() { if(!confirm("ลบเพลงนี้?")) return; closeModal('songDetailModal'); fetchAPI("deleteSong", { eventId: activeEvent.id, songId: selectedSongId }, res => { currentSongs = res; filterSongs(); showToast("ลบแล้ว", "ลบเพลงสำเร็จ"); }); }
function adminUpdateStatus(status) { closeModal('songDetailModal'); fetchAPI("updateSongStatus", { eventId: activeEvent.id, songId: selectedSongId, status: status }, res => { currentSongs = res; filterSongs(); }); }

function exportDJ() {
  if(currentSongs.length === 0) return showToast("ผิดพลาด", "ไม่มีเพลง", "error");
  const sorted = [...currentSongs].sort((a, b) => b.votes - a.votes); 
  let text = `🔥 Playlist: ${activeEvent.name}\n\n`;
  sorted.forEach((s, i) => { 
    let tagLabel = s.isBreakdance === 'Yes' || s.isBreakdance === true ? ' (Breakdance)' : '';
    text += `${i+1}. ${s.name}${tagLabel} - ${s.artist} [${s.start}-${s.end}]\n`; 
    if(s.link) text += `Link: ${formatYoutubeLink(s.link, s.start)}\n`; 
    text += `\n`; 
  });
  navigator.clipboard.writeText(text).then(() => showToast("สำเร็จ", "คัดลอกข้อความให้ DJ แล้ว"));
}
