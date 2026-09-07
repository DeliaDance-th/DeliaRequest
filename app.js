// ใส่ URL Web App ที่ได้จาก Google Apps Script ที่นี่
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxTHBDk2j--fcL4tnQo5YH8KRlm0SMvjDK6YqKMhkZPk5GCWOXM8g8xeoeQtxw3ns__zA/exec";

// --- Security: Anti-Inspect & Anti-Console ---

// 1. บล็อกคลิกขวา
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});

// 2. บล็อกคีย์ลัดสำหรับเปิด Developer Tools และการดู Source Code
document.onkeydown = function(e) {
  // บล็อก F12
  if(e.keyCode === 123) {
    return false;
  }
  // บล็อก Ctrl+Shift+I (เปิด Inspect)
  if(e.ctrlKey && e.shiftKey && e.keyCode === 73) { // 'I'
    return false;
  }
  // บล็อก Ctrl+Shift+C (เปิด Inspect Element)
  if(e.ctrlKey && e.shiftKey && e.keyCode === 67) { // 'C'
    return false;
  }
  // บล็อก Ctrl+Shift+J (เปิด Console)
  if(e.ctrlKey && e.shiftKey && e.keyCode === 74) { // 'J'
    return false;
  }
  // บล็อก Ctrl+U (เปิดดู View Source)
  if(e.ctrlKey && e.keyCode === 85) { // 'U'
    return false;
  }
};

// 3. ป้องกันการฝืนเปิด Console (Debugger Trap)
// หากมีคนพยายามเปิด Console ระบบจะค้างอยู่ที่โหมด Debug ทันทีทำให้ดูโค้ดไม่ได้
setInterval(function() {
  (function() {
    return false;
  }
  ['constructor']('debugger')
  ());
}, 100);

// UUID System
let userUUID = localStorage.getItem("delia_rd_uuid");
if (!userUUID) { userUUID = 'delia-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9); localStorage.setItem("delia_rd_uuid", userUUID); }

let allEvents = [];
let currentSongs = [];
let filteredSongs = [];
let activeEvent = null; // เก็บ Object ของ Event ที่เลือก
let selectedSongId = "";
let isEventOpenForRequest = false;
let isAdminLoggedIn = false;
let pendingSongData = null;

const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const today = new Date();
let currentMonth = today.getMonth(), currentYear = today.getFullYear();
const realMonth = today.getMonth(), realYear = today.getFullYear();

// --- Initialization ---
window.onload = () => {
  fetchAPI("getEvents", {}, res => {
    allEvents = res;
    renderCalendar();
    
    // URL Routing: ตรวจสอบว่ามี ?e=... ต่อท้ายไหม
    const urlParams = new URLSearchParams(window.location.search);
    const eventIdFromUrl = urlParams.get('e');
    if (eventIdFromUrl) {
      const ev = allEvents.find(e => e.id === eventIdFromUrl);
      if (ev) openEventIntro(ev.id);
    }
  });
};

// --- API Helper ---
function fetchAPI(action, payload, onSuccess) {
  fetch(GAS_API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: action, payload: payload })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) onSuccess(data.data);
    else customAlert("ข้อผิดพลาด", data.message);
  })
  .catch(err => customAlert("Error", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: " + err.message));
}

// --- UI Navigation ---
function showView(view) {
  document.getElementById('view-calendar').classList.add('hidden');
  document.getElementById('view-songs').classList.add('hidden');
  if (view === 'calendar') {
    document.getElementById('view-calendar').classList.remove('hidden');
    // Clear URL param without reloading
    window.history.pushState({}, '', window.location.pathname);
  }
  if (view === 'songs') { 
    document.getElementById('view-songs').classList.remove('hidden'); 
    document.getElementById('search-bar').value = ''; 
    // Set URL param for sharing
    window.history.pushState({}, '', '?e=' + activeEvent.id);
  }
}
function goBackToCalendar() { showView('calendar'); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function customAlert(title, message) { document.getElementById('alert-title').innerText = title; document.getElementById('alert-message').innerText = message; openModal('alertModal'); }

// --- Calendar ---
function renderCalendar() {
  document.getElementById('month-year-display').innerText = `${monthNames[currentMonth]} ${currentYear}`;
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = `<div class="day-name">อา.</div><div class="day-name">จ.</div><div class="day-name">อ.</div><div class="day-name">พ.</div><div class="day-name">พฤ.</div><div class="day-name">ศ.</div><div class="day-name">ส.</div>`;
  
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div class="day-cell empty"></div>`;
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    const ev = allEvents.find(e => e.date === dateStr);
    
    let cellHtml = `<div class="date-num">${i}</div>`;
    if (ev) cellHtml += `<div class="event-name-cal" title="${ev.name}">${ev.name}</div>`;
    grid.innerHTML += `<div class="day-cell ${ev ? 'has-event' : ''}" onclick="${ev ? `openEventIntro('${ev.id}')` : `checkAdminAdd('${dateStr}')`}">${cellHtml}</div>`;
  }
  document.getElementById('btn-prev-month').disabled = (currentMonth === realMonth && currentYear === realYear);
  document.getElementById('btn-next-month').disabled = (currentMonth === (realMonth + 1 > 11 ? 0 : realMonth + 1));
}
function changeMonth(step) { currentMonth += step; if (currentMonth > 11) { currentMonth = 0; currentYear++; } if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(); }
function checkAdminAdd(dateStr) { if (isAdminLoggedIn) { document.getElementById('event-date').value = dateStr; openModal('addEventModal'); } }

// --- Event Flow ---
function openEventIntro(eventId) {
  activeEvent = allEvents.find(e => e.id === eventId);
  if (!activeEvent) return;

  const thDate = `${parseInt(activeEvent.date.split('-')[2])} ${monthNames[parseInt(activeEvent.date.split('-')[1])-1]} ${activeEvent.date.split('-')[0]}`;
  
  document.getElementById('intro-title').innerText = activeEvent.name;
  document.getElementById('intro-date').innerText = thDate;
  document.getElementById('intro-loc').innerText = activeEvent.location || "ไม่ได้ระบุสถานที่";
  document.getElementById('intro-det').innerText = activeEvent.details || "-";
  
  let timeStr = "เปิดรับตลอด";
  if (activeEvent.openTime && activeEvent.closeTime) {
    timeStr = `${new Date(activeEvent.openTime).toLocaleString('th-TH')} - ${new Date(activeEvent.closeTime).toLocaleString('th-TH')}`;
  }
  document.getElementById('intro-time').innerText = timeStr;
  
  openModal('eventIntroModal');
}

function enterSongList() {
  closeModal('eventIntroModal');
  document.getElementById('view-event-title').innerText = activeEvent.name;
  
  isEventOpenForRequest = true;
  let timeText = "";
  if (activeEvent.openTime && activeEvent.closeTime) {
    const now = new Date(); const openTime = new Date(activeEvent.openTime); const closeTime = new Date(activeEvent.closeTime);
    if (now < openTime) { isEventOpenForRequest = false; timeText = `<span style="color:var(--text-muted);"><i class="fa-regular fa-clock"></i> เปิดรับเพลง: ${openTime.toLocaleString('th-TH')}</span>`; } 
    else if (now > closeTime) { isEventOpenForRequest = false; timeText = `<span style="color:#e74c3c;"><i class="fa-solid fa-lock"></i> ปิดรับขอเพลงแล้ว</span>`; } 
    else { timeText = `<span style="color:var(--success);"><i class="fa-solid fa-lock-open"></i> เปิดรับขอเพลงและโหวต</span>`; }
  }
  document.getElementById('view-event-status').innerHTML = timeText;
  document.getElementById('btn-add-song-main').classList.toggle('hidden', !isEventOpenForRequest);
  document.getElementById('event-closed-msg').classList.toggle('hidden', isEventOpenForRequest);
  
  document.getElementById('song-list-content').innerHTML = '<div class="loader"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>';
  showView('songs');

  fetchAPI("getSongs", { eventId: activeEvent.id }, res => { currentSongs = res; filteredSongs = [...res]; renderSongList(); });
}

// --- Song List & Search ---
function filterSongs() {
  const q = document.getElementById('search-bar').value.toLowerCase();
  filteredSongs = currentSongs.filter(s => s.name.toLowerCase().includes(q) || (s.artist && s.artist.toLowerCase().includes(q)));
  renderSongList();
}

function renderSongList() {
  const container = document.getElementById('song-list-content');
  container.innerHTML = "";
  if(filteredSongs.length === 0) { container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-compact-disc fa-2x mb-3"></i><br>ไม่พบเพลง หรือยังไม่มีการขอเพลง</div>`; return; }
  
  filteredSongs.forEach((song) => {
    const globalIndex = currentSongs.findIndex(s => s.id === song.id);
    const isTop10 = globalIndex < 10 && song.votes > 1;
    let statusBadge = "";
    if (song.status === "Approved") statusBadge = `<span class="badge-status badge-Approved"><i class="fa-solid fa-check"></i> Approved</span>`;
    if (song.status === "Played") statusBadge = `<span class="badge-status badge-Played"><i class="fa-solid fa-check-double"></i> Played</span>`;

    container.innerHTML += `
      <div class="song-item status-${song.status}" onclick="openSongDetail('${song.id}')">
        <div>
          <div class="song-title">${isTop10 ? '<i class="fa-solid fa-crown badge-top10"></i>' : ''} ${song.name} ${statusBadge}</div>
          <div class="song-time"><i class="fa-regular fa-clock"></i> ${song.start} - ${song.end} | ${song.artist || ''}</div>
        </div>
        <div class="song-votes">${song.votes} <i class="fa-solid fa-heart" style="font-size: 0.8rem;"></i></div>
      </div>
    `;
  });
}

// --- Detail & Interactions ---
function formatYoutubeLink(url, startStr) {
  if (!url || !url.includes("youtu")) return url;
  try {
    let parts = startStr.split(':'); let seconds = 0;
    if (parts.length === 2) seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    else if (parts.length === 3) seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    if (seconds && !Number.isNaN(seconds)) return url + (url.includes('?') ? '&' : '?') + 't=' + seconds + 's';
  } catch (e) {} return url;
}

function shareSong() {
  const song = currentSongs.find(s => s.id === selectedSongId);
  const url = window.location.href; // Will include ?e=...
  const text = `🔥 ช่วยโหวตเพลง "${song.name}" ในงาน ${activeEvent.name}\nโหวตได้ที่ลิงก์นี้: ${url}`;
  navigator.clipboard.writeText(text).then(() => customAlert("คัดลอกแล้ว", "นำไปวางในแชทเพื่อชวนเพื่อนโหวตได้เลย!"));
}

function openSongDetail(songId) {
  selectedSongId = songId; const song = currentSongs.find(s => s.id === songId); if(!song) return;

  document.getElementById('det-title').innerText = song.name;
  document.getElementById('det-artist').innerText = song.artist || '-';
  document.getElementById('det-time').innerText = `${song.start} - ${song.end}`;
  document.getElementById('det-votes').innerText = song.votes + " คน";
  
  let statusHtml = song.status;
  if(song.status === "Approved") statusHtml = `<span style="color:var(--success)"><i class="fa-solid fa-check"></i> อนุมัติแล้ว</span>`;
  if(song.status === "Played") statusHtml = `<span style="color:var(--text-muted)"><i class="fa-solid fa-check-double"></i> เล่นไปแล้ว</span>`;
  document.getElementById('det-status').innerHTML = statusHtml;

  const linkBtn = document.getElementById('det-link');
  if (song.link) { linkBtn.href = formatYoutubeLink(song.link, song.start); linkBtn.classList.remove('hidden'); } else { linkBtn.classList.add('hidden'); }

  const btnVote = document.getElementById('btn-toggle-vote');
  if (!isEventOpenForRequest || song.status === "Played") { btnVote.innerHTML = `<i class="fa-solid fa-lock"></i> หมดเวลาโหวต`; btnVote.style.background = "var(--text-muted)"; btnVote.disabled = true; }
  else if (song.creator === userUUID) { btnVote.innerHTML = `<i class="fa-solid fa-star"></i> เพลงของคุณ`; btnVote.style.background = "var(--text-muted)"; btnVote.disabled = true; } 
  else if (song.voters.includes(userUUID)) { btnVote.innerHTML = `<i class="fa-solid fa-heart-crack"></i> ถอนโหวต`; btnVote.style.background = "var(--text-muted)"; btnVote.disabled = false; } 
  else { btnVote.innerHTML = `<i class="fa-solid fa-heart"></i> โหวตเพลงนี้`; btnVote.style.background = "var(--primary)"; btnVote.disabled = false; }

  document.getElementById('admin-song-controls').classList.toggle('hidden', !isAdminLoggedIn);
  openModal('songDetailModal');
}

function handleVote() {
  const btn = document.getElementById('btn-toggle-vote');
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> กำลังประมวลผล...`; btn.disabled = true;
  fetchAPI("voteSong", { eventId: activeEvent.id, songId: selectedSongId, uuid: userUUID }, res => { currentSongs = res; filterSongs(); btn.disabled = false; openSongDetail(selectedSongId); });
}

function checkQuotaAndOpenModal() {
  if (currentSongs.filter(s => s.creator === userUUID).length >= 3) customAlert("โควตาเต็ม", "1 บัญชีขอเพลงได้สูงสุด 3 เพลง");
  else openModal('addSongModal');
}

function preCheckAddSong() {
  const name = document.getElementById('song-name').value;
  if(!name) return customAlert("ข้อมูลไม่ครบ", "กรุณาระบุชื่อเพลง");
  
  const searchName = name.toLowerCase().replace(/\s/g, '');
  const dup = currentSongs.find(s => s.name.toLowerCase().replace(/\s/g, '') === searchName);
  
  pendingSongData = { name: name, artist: document.getElementById('song-artist').value, link: document.getElementById('song-link').value, start: document.getElementById('song-start').value, end: document.getElementById('song-end').value };

  if (dup) {
    document.getElementById('confirm-message').innerText = `มีคนขอเพลง "${dup.name}" ไว้แล้วในระบบ คุณต้องการเพิ่มเพลงนี้ซ้ำหรือไม่?`;
    closeModal('addSongModal'); openModal('confirmModal');
  } else executeAddSong();
}

function executeAddSong() {
  closeModal('confirmModal');
  const btn = document.getElementById('btn-song-submit'); btn.innerText = "กำลังบันทึก..."; btn.disabled = true;
  fetchAPI("addSong", { eventId: activeEvent.id, songData: pendingSongData, uuid: userUUID }, res => {
    btn.innerText = "ส่งข้อมูล"; btn.disabled = false; currentSongs = res; filterSongs(); closeModal('addSongModal'); document.querySelectorAll('#addSongModal input').forEach(i => i.value = '');
  });
}

// --- Admin ---
function handleLogin() {
  const btn = document.getElementById('btn-login-submit'); btn.innerText = "Checking..."; btn.disabled = true;
  fetchAPI("adminLogin", { username: document.getElementById('admin-user').value, password: document.getElementById('admin-pass').value }, res => {
    btn.innerText = "เข้าสู่ระบบ"; btn.disabled = false; isAdminLoggedIn = true; closeModal('adminLoginModal');
    document.getElementById('btn-admin-login').classList.add('hidden'); document.getElementById('btn-admin-add').classList.remove('hidden'); document.getElementById('btn-admin-export').classList.remove('hidden');
    customAlert("สำเร็จ", "ปลดล็อกสิทธิ์ผู้ดูแลระบบ");
  });
}
function handleAddEvent() {
  const name = document.getElementById('event-name').value; const date = document.getElementById('event-date').value;
  if(!date || !name) return customAlert("ข้อมูลไม่ครบ", "กรุณาระบุวันที่และชื่องาน");
  const btn = document.getElementById('btn-event-submit'); btn.innerText = "กำลังสร้าง..."; btn.disabled = true;
  fetchAPI("createEvent", { name: name, date: date, location: document.getElementById('event-loc').value, openTime: document.getElementById('event-open').value, closeTime: document.getElementById('event-close').value, details: document.getElementById('event-det').value }, res => {
    allEvents = res; renderCalendar(); closeModal('addEventModal'); btn.innerText = "สร้างกำหนดการ"; btn.disabled = false; document.querySelectorAll('#addEventModal input').forEach(i => i.value = '');
    customAlert("สำเร็จ", "เพิ่มงานเรียบร้อย");
  });
}
function adminDeleteSong() {
  if(!confirm("ลบเพลงนี้?")) return;
  closeModal('songDetailModal'); fetchAPI("deleteSong", { eventId: activeEvent.id, songId: selectedSongId }, res => { currentSongs = res; filterSongs(); });
}
function adminUpdateStatus(status) {
  closeModal('songDetailModal'); fetchAPI("updateSongStatus", { eventId: activeEvent.id, songId: selectedSongId, status: status }, res => { currentSongs = res; filterSongs(); });
}
function exportDJ() {
  if(currentSongs.length === 0) return customAlert("ไม่มีข้อมูล", "ยังไม่มีเพลงในรายการ");
  let text = `🔥 Playlist: ${activeEvent.name}\n\n`;
  currentSongs.forEach((s, i) => { text += `${i+1}. ${s.name} - ${s.artist} [${s.start}-${s.end}] (${s.votes} โหวต)\n`; if(s.link) text += `Link: ${formatYoutubeLink(s.link, s.start)}\n`; text += `\n`; });
  navigator.clipboard.writeText(text).then(() => customAlert("สำเร็จ", "คัดลอกรายชื่อเพลง (Export to DJ) เรียบร้อย"));
}
