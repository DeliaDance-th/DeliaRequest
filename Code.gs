const SPREADSHEET_ID = "1k3fciGBq1QKvtoXWutH8EyRKZacPBR-rWzKVNWu1tx4";

// ============================================================
// ⚙️ ตั้งค่าความปลอดภัย
//   HARDENED = false : ทำงานเหมือนเดิมทุกอย่าง (เว็บเวอร์ชันเก่ายังใช้ได้)
//   HARDENED = true  : - ฟังก์ชันของแอดมินต้องแนบโทเคนแอดมิน (ได้จากการล็อกอินแอดมิน)
//                      - ไม่เชื่อค่า isAdmin ที่ผู้ใช้ส่งมาเอง
//                      - ไม่ส่งอีเมลสมาชิกออกไปให้ใคร (ใช้รหัสย่อแทนตัวตน)
//   ✅ เปลี่ยนเป็น true และ Deploy ใหม่ "หลังจาก" อัปเดตเว็บเวอร์ชันใหม่แล้วเท่านั้น
// ============================================================
const HARDENED = false;
const TOKEN_DAYS = 30; // โทเคนแอดมินมีอายุกี่วัน

// ฟังก์ชันที่เฉพาะแอดมินเรียกได้ (บังคับเมื่อ HARDENED = true)
const ADMIN_ACTIONS = {
  createEvent: 1, closeEvent: 1, editEvent: 1, deleteEvent: 1,
  updateSongStatus: 1, deleteSong: 1,
  getPlaylist: 1, savePlaylist: 1, listPlaylists: 1, getPlaylistBySheet: 1, savePlaylistBackup: 1,
  aiMagicSetlist: 1, getFeedback: 1,
  addArtistToDB: 1, suggestSongFixes: 1, applySongFixes: 1, mergeSongs: 1,
  addSongs: 1
};
// ฟังก์ชันที่ตอบเป็นรายการเพลง (ต้องซ่อนอีเมลเมื่อ HARDENED = true)
const SONG_LIST_ACTIONS = { getSongs: 1, addSong: 1, addSongs: 1, editSong: 1, voteSong: 1, updateSongStatus: 1, deleteSong: 1, mergeSongs: 1 };

var _ssCache = null;
function getSS() {
  // เปิดสเปรดชีตครั้งเดียวต่อหนึ่งคำขอ (เดิมเปิดซ้ำหลายรอบ ทำให้ช้า)
  if (!_ssCache) _ssCache = SpreadsheetApp.openById(SPREADSHEET_ID);
  return _ssCache;
}

// 🛡️ ครอบงานที่แก้ข้อมูลด้วยล็อก กันคนทำพร้อมกันแล้วแถวชนกัน
var _lockHeld = false; // true ระหว่างที่คำขอนี้ถือล็อกอยู่ (ล็อกของ Apps Script ถือซ้อนกันไม่ได้)
function withScriptLock(waitMs, fn) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(waitMs);
  } catch (e) {
    throw new Error("ระบบคนใช้งานหนาแน่น กรุณาลองใหม่อีกครั้งครับ");
  }
  _lockHeld = true;
  try {
    return fn();
  } finally {
    _lockHeld = false;
    lock.releaseLock();
  }
}

function clip(v, n) { return String(v == null ? "" : v).slice(0, n); }

// กันค่าที่ขึ้นต้นด้วย = + - @ ถูก Google Sheets ตีเป็นสูตร (เช่น ชื่อเพลง "=SUM(1+1)" จะกลายเป็น 2)
function safeCell(v) {
  if (typeof v === "string" && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

// ------------------------------------------------------------
// 🔐 โทเคนแอดมิน (เซ็นลายเซ็น HMAC ไม่ต้องเก็บในชีต)
// ------------------------------------------------------------
var _secretCache = null;
function getAuthSecret() {
  if (_secretCache) return _secretCache;
  const props = PropertiesService.getScriptProperties();
  let s = props.getProperty("AUTH_SECRET");
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty("AUTH_SECRET", s);
  }
  _secretCache = s;
  return s;
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function signToken(payload) {
  const body = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
  const sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(body, getAuthSecret()));
  return body + "." + sig;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const expected = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0], getAuthSecret()));
  if (!safeEqual(parts[1], expected)) return null;
  try {
    const payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
    if (!payload || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function isAdminClaims(c) {
  return !!(c && (c.r === "Admin" || c.r === "Developer"));
}

// ------------------------------------------------------------
// 🕶️ รหัสย่อแทนตัวตน (ไม่ส่งอีเมลจริงให้ฝั่งเว็บเมื่อ HARDENED = true)
// ------------------------------------------------------------
function pidOf(uuid) {
  const s = String(uuid == null ? "" : uuid).trim().toLowerCase();
  if (!s) return "";
  if (s.indexOf("admin-") === 0) return "admin"; // แอดมินทุกคนรวมเป็นกลุ่มเดียว (ถูกกรองออกจาก Leaderboard อยู่แล้ว)
  const sig = Utilities.computeHmacSha256Signature("pid:" + s, getAuthSecret());
  return sig.slice(0, 8).map(function (b) { return ("0" + (b & 0xff).toString(16)).slice(-2); }).join("");
}

// แทนอีเมลในรายการเพลงด้วยรหัสย่อ + บอกว่าเพลงนี้ "ของฉัน/ฉันโหวตแล้ว" สำหรับผู้ดูคนนี้
function anonymizeSongs(list, viewer) {
  const v = String(viewer == null ? "" : viewer).trim();
  return (list || []).map(function (s) {
    const voters = String(s.voters || "").split(",").filter(function (x) { return x !== ""; });
    return Object.assign({}, s, {
      creator: pidOf(s.creator),
      voters: voters.map(pidOf).join(","),
      mine: !!v && s.creator === v,
      voted: !!v && voters.indexOf(v) !== -1
    });
  });
}

function anonymizeMembers(map) {
  const out = {};
  Object.keys(map || {}).forEach(function (email) { out[pidOf(email)] = map[email]; });
  return out;
}

function getMembersForClient() {
  const raw = getMembers();
  return HARDENED ? anonymizeMembers(raw) : raw;
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const p = request.payload || {};
    const token = request.token || "";
    let result = {};

    // ตรวจโทเคนเฉพาะเมื่อมีแนบมา (โหมดเดิมไม่มีค่าใช้จ่ายเพิ่ม)
    const claims = token ? verifyToken(token) : null;
    const callerIsAdmin = isAdminClaims(claims);
    if (HARDENED && ADMIN_ACTIONS[action] && !callerIsAdmin) {
      throw new Error("ต้องเข้าสู่ระบบแอดมินก่อนค่ะ (เซสชันแอดมินหมดอายุหรือไม่ถูกต้อง)");
    }
    // HARDENED: เชื่อเฉพาะโทเคน ไม่เชื่อ isAdmin ที่ผู้ใช้ส่งมา
    const adminFlag = HARDENED ? callerIsAdmin : p.isAdmin;

    if (action === 'saveFeedback') {
      // ใช้สเปรดชีตเดียวกับ getFeedback (เดิมใช้ getActiveSpreadsheet ซึ่งอาจเป็นคนละไฟล์ หรือเป็น null ถ้าสคริปต์ไม่ได้ผูกกับชีต)
      var sheet = getSS().getSheetByName('Feedbacks');
      if (!sheet) {
        sheet = getSS().insertSheet('Feedbacks');
        sheet.appendRow(['Timestamp', 'Event ID', 'SongList Score', 'SongList Comment', 'Place Score', 'Place Comment', 'Website Score', 'Website Comment', 'Additional Comment', 'UUID', 'Username', 'SpecialList Score', 'SpecialList Comment']);
      } else if (sheet.getLastColumn() < 13) {
        // ชีตเก่ายังไม่มีหัวคอลัมน์ Special List: เติมหัวคอลัมน์ L, M (ข้อมูลเดิมไม่ถูกแตะ)
        sheet.getRange(1, 12, 1, 2).setValues([['SpecialList Score', 'SpecialList Comment']]);
      }
      var score = function (v) { v = parseInt(v, 10); return v >= 1 && v <= 5 ? v : 0; };

      sheet.appendRow([
        safeCell(clip(p.timestamp, 60)),
        safeCell(clip(p.eventId, 40)),
        p.ratings ? score(p.ratings.songList) : 0,
        p.comments ? safeCell(clip(p.comments.songList, 1000)) : '',
        p.ratings ? score(p.ratings.place) : 0,
        p.comments ? safeCell(clip(p.comments.place, 1000)) : '',
        p.ratings ? score(p.ratings.website) : 0,
        p.comments ? safeCell(clip(p.comments.website, 1000)) : '',
        p.comments ? safeCell(clip(p.comments.additional, 1000)) : '',
        safeCell(clip(p.uuid, 100)),
        safeCell(clip(p.username, 60)),
        p.ratings ? score(p.ratings.specialList) : 0,
        p.comments ? safeCell(clip(p.comments.specialList, 1000)) : ''
      ]);

      return ContentService.createTextOutput(JSON.stringify({ success: true, data: { status: 'success' } })).setMimeType(ContentService.MimeType.JSON);
    }

    switch (action) {
      case "getEvents": result = getEvents(); break;
      case "getSongs": result = getSongs(p.eventId); break;
      case "getFeedback": result = getFeedback(p.eventId); break;
      case "addSong": result = addSong(p.eventId, p.songData, p.uuid, adminFlag); break;
      case "addSongs": result = addSongs(p.eventId, p.songs, p.uuid, adminFlag); break;
      case "getGlobalLeaderboard": result = getGlobalLeaderboard(); break;
      case "editSong": result = editSong(p.eventId, p.songId, p.songData, p.uuid, adminFlag); break;
      case "voteSong": result = voteSong(p.eventId, p.songId, p.uuid); break;
      case "getMembers": result = getMembersForClient(); break;

      // 🌟 ระบบล็อกอินด้วย Google Sign-In
      case "auth": result = unifiedAuth(p.action, p.email, p.username, p.clientUuid, p.password, token); break;

      case "createEvent": result = createEvent(p); break;
      case "closeEvent": result = closeEvent(p.id); break;
      case "editEvent": result = editEvent(p); break;
      case "deleteEvent": result = deleteEvent(p.id); break;
      case "updateSongStatus": result = updateSongStatus(p.eventId, p.songId, p.status); break;
      case "deleteSong": result = deleteSong(p.eventId, p.songId); break;
      case "mergeSongs": result = mergeSongs(p.eventId, p.merges); break;
      case "getPlaylist": result = getPlaylist(p.eventId, p.date); break;
      case "savePlaylist": result = savePlaylist(p.eventId, p.date, p.lists); break;
      case "listPlaylists": result = listPlaylists(p.eventId); break;
      case "getPlaylistBySheet": result = getPlaylistBySheet(p.eventId, p.sheetName); break;
      case "savePlaylistBackup": result = savePlaylistBackup(p.eventId, p.date, p.lists, p.label); break;

      // 🌟 ประมวลผลเพลงด้วย Database
      case "aiProcess": result = processSongDB(p.title, p.author); break;
      case "aiMagicSetlist": result = processAiSetlist(p.songs); break;
      case "addArtistToDB": result = addArtistToDB(p.name, p.gender, p.origin, p.aliases); break;
      case "suggestSongFixes": result = suggestSongFixes(p.eventId); break;
      case "applySongFixes": result = applySongFixes(p.eventId, p.fixes); break;
      default: throw new Error("Invalid Action");
    }

    if (HARDENED && SONG_LIST_ACTIONS[action]) result = anonymizeSongs(result, p.uuid);

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() { 
  return ContentService.createTextOutput("Delia Randomdance API (Database + Google Sign-In)"); 
}

// ============================================================
// 1. ระบบยืนยันตัวตนด้วย Google Sign-In (ใช้อีเมลเป็น Primary Key)
// ============================================================
function unifiedAuth(action, email, username, clientUuid, password, token) {
  const ss = getSS();
  let cleanEmail = (email || "").toString().trim().toLowerCase();
  let cleanUser = (username || "").toString().trim();
  
  // A. โหมดล็อกอินของ Admin
  if (action === "admin_login") {
    let adminSheet = ss.getSheetByName("User");
    if (adminSheet) {
      let adminData = adminSheet.getDataRange().getValues();
      for (let i = 1; i < adminData.length; i++) {
        if (adminData[i][0] == cleanUser && adminData[i][1] == password) {
          let role = adminData[i][2] ? adminData[i][2].toString().trim() : "Admin"; 
          // ✅ ออกโทเคนแอดมิน (เซ็นลายเซ็น) ให้ฝั่งเว็บแนบไปกับทุกคำสั่งของแอดมิน
          const adminToken = signToken({ u: cleanUser, r: role, exp: Date.now() + TOKEN_DAYS * 24 * 60 * 60 * 1000 });
          return { uuid: "admin-" + cleanUser, username: cleanUser, role: role, email: "admin@delia.com", pid: "admin", token: adminToken };
        }
      }
    }
    throw new Error("ชื่อหรือรหัสผ่าน Admin ไม่ถูกต้องค่ะ");
  }

  // ต่ออายุเซสชันแอดมินด้วยโทเคน (แอดมินอยู่ในชีต User ไม่ได้อยู่ใน Members จึงใช้ auto_login ไม่ได้)
  if (action === "admin_resume") {
    const claims = verifyToken(token);
    if (!isAdminClaims(claims)) throw new Error("เซสชันแอดมินหมดอายุ กรุณาล็อกอินใหม่ค่ะ");
    return { uuid: "admin-" + claims.u, username: claims.u, role: claims.r, email: "admin@delia.com", pid: "admin", token: token };
  }

  let sheet = ss.getSheetByName("Members");
  if (!sheet) {
    sheet = ss.insertSheet("Members");
    sheet.appendRow(["Email_UUID", "Username", "Email", "Role", "JoinDate"]);
  }

  const data = sheet.getDataRange().getValues();

  // B. ขั้นตอน 1: ตรวจสอบข้อมูลจาก Google Sign-In
  if (action === "google_login") {
    if (!cleanEmail || !cleanEmail.includes("@")) throw new Error("ข้อมูลอีเมลจาก Google ไม่ถูกต้องค่ะ");
    
    for (let i = 1; i < data.length; i++) {
      // ค้นหาอีเมลที่ตรงกัน
      if (data[i][2] && data[i][2].toString().toLowerCase() === cleanEmail) {
        // 🌟 คืนค่า uuid เป็น Email ไปเลย เพื่อผูกทุกอย่างกับอีเมล
        return { status: "login_success", uuid: cleanEmail, username: data[i][1], role: data[i][3] || "User", email: cleanEmail, pid: pidOf(cleanEmail) };
      }
    }
    return { status: "need_username", email: cleanEmail };
  }

  // C. ขั้นตอน 2: ลงทะเบียนบัญชีใหม่
  if (action === "register_user") {
    if (!cleanUser) throw new Error("กรุณาตั้งชื่อผู้ใช้งานก่อนค่ะ");
    
    let cleanUserLower = cleanUser.toLowerCase();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] && data[i][1].toString().toLowerCase() === cleanUserLower) {
        throw new Error("ชื่อ '" + cleanUser + "' มีคนใช้แล้ว ลองเปลี่ยนชื่ออื่นดูนะคะ");
      }
    }

    // 🌟 เปลี่ยนการบันทึก: ไม่ใช้ Date.now() แรนดอมแล้ว แต่เอา Email ยัดใส่ช่อง UUID แทน
    sheet.appendRow([cleanEmail, safeCell(clip(cleanUser, 40)), cleanEmail, "User", new Date().toLocaleString('th-TH')]);
    return { status: "login_success", uuid: cleanEmail, username: cleanUser, role: "User", email: cleanEmail, pid: pidOf(cleanEmail) };
  }

  // D. ล็อกอินอัตโนมัติ (ตรวจสอบเซสชันจาก LocalStorage)
  if (action === "auto_login" && clientUuid) {
    for (let i = 1; i < data.length; i++) {
      // ตรวจสอบทั้งช่อง UUID เดิม และช่อง Email เพื่อความเข้ากันได้
      if (data[i][0] === clientUuid || data[i][2] === clientUuid) {
        return { status: "login_success", uuid: data[i][2] || clientUuid, username: data[i][1], role: data[i][3] || "User", email: data[i][2] || clientUuid, pid: pidOf(data[i][2] || clientUuid) }; 
      }
    }
    throw new Error("ไม่พบข้อมูลบัญชีนี้ในระบบ กรุณาล็อกอินใหม่ด้วย Google อีกครั้งค่ะ");
  }
  
  throw new Error("ระบบล็อกอินขัดข้องค่ะ");
}

// ============================================================
// 2. Ultimate Dance & Idol Database (Strictly Random Dance Focus)
// ============================================================
const ARTIST_DB = [
  { g: "M", o: "K-Pop", n: [
    "TVXQ", "DBSK", "TOHOSHINKI", "SUPER JUNIOR", "SJ", "BIGBANG", "SHINEE", "2PM", "2AM", 
    "HIGHLIGHT", "BEAST", "INFINITE", "U-KISS", "TEEN TOP", "B1A4", "BLOCK B", "BTOB", "VIXX", "BOYFRIEND",
    "EXO", "BTS", "BANGTAN", "GOT7", "WINNER", "IKON", "MONSTA X", "SEVENTEEN", "SVT", "NCT", "NCT U", "NCT 127", 
    "NCT DREAM", "WAYV", "SF9", "PENTAGON", "THE BOYZ", "ASTRO", "GOLDEN CHILD", "A.C.E", "ONF", "UP10TION", "KNK",
    "STRAY KIDS", "SKZ", "ATEEZ", "TXT", "TOMORROW X TOGETHER", "ENHYPEN", "TREASURE", "CRAVITY", "MCND", "AB6IX", 
    "CIX", "ONEUS", "VERIVERY", "WEI", "DKZ", "TEMPEST", "TNX", "THE NEW SIX", "EPEX", "P1HARMONY", 
    "JUST B", "OMEGA X", "BLITZERS", "CIIPHER", "GHOST9", "TO1", "DKB", "E'LAST", "BAE173", "KINGDOM", "TAN",
    "ZEROBASEONE", "ZB1", "RIIZE", "BOYNEXTDOOR", "TWS", "XIKERS", "EVNNE", "AMPERS&ONE", "ONE PACT", "ONEPACT", 
    "POW", "NEXZ", "ARRC", "ALL(H)OURS", "WAKER", "LUN8", "ASC2NT", "DXMON", "NOWADAYS", "THE WIND", "NOMAD", 
    "8TURN", "TIOT", "WHIB", "NCHIVE", "WANNA ONE", "X1", "JBJ", "RAINZ", "UNIQ", "ALPHA DRIVE ONE", "SUPERM","CORTIS"
  ] },
  { g: "F", o: "K-Pop", n: [
    "GIRLS' GENERATION", "SNSD", "2NE1", "WONDER GIRLS", "KARA", "T-ARA", "F(X)", "MISS A", "SISTAR", "4MINUTE", 
    "APINK", "GIRL'S DAY", "AOA", "EXID", "AFTER SCHOOL", "SECRET", "BROWN EYED GIRLS", "NINE MUSES",
    "BLACKPINK", "TWICE", "RED VELVET", "GFRIEND", "MAMAMOO", "OH MY GIRL", "WJSN", "COSMIC GIRLS", "DREAMCATCHER", 
    "LOONA", "MOMOLAND", "CLC", "WEKI MEKI", "DIA", "LOVELYZ", "GUGUDAN", "PRISTIN", "CHERRY BULLET",
    "ITZY", "AESPA", "(G)I-DLE", "GIDLE", "IVE", "LE SSERAFIM", "NEWJEANS", "NMIXX", "STAYC", "KEP1ER", "FROMIS_9", 
    "EVERGLOW", "ROCKET PUNCH", "SECRET NUMBER", "WEEEKLY", "BILLLIE", "PURPLE KISS", "LIGHTSUM", "TRI.BE", 
    "CLASS:Y", "FIFTY FIFTY", "XG",
    "BABYMONSTER", "KISS OF LIFE", "ILLIT", "UNIS", "YOUNG POSSE", "RESCENE", "BADVILLAIN", "MEOVV", "KATSEYE", 
    "VVUP", "IZ*ONE", "I.O.I", "ARTMS", "TRIPLES", "LOOSSEMBLE", "VCHA", "CANDY SHOP", "VIVIZ"
  ] },
  { g: "Mix", o: "K-Pop", n: [
    "KARD", "TRIPLE H", "CO-ED SCHOOL", "SSAK3", "KOYOTE", "TROUBLE MAKER", "K-TIGERS ZERO"
  ] },
  { g: "M", o: "T-Pop", n: [
    "BUS", "BECAUSE OF YOU I SHINE", "PROXIE", "ATLAS", "LYKN", "PERSES", "DICE", "TRINITY", "DMD BOYS", 
    "LAZ1", "ALPHAA", "VAMP", "D2B", "K-OTIC", "C-QUINT", "XIS", "B.O.Y", "GOLF-MIKE", "UHT", "V.R.P"
  ] },
  { g: "F", o: "T-Pop", n: [
    "4EVE", "PIXXIE", "ALALA", "VIIS", "MINDY", "QRRA", "PRETZELLE", "SIZZY", "AR3NA", "CELESTE", "WHAWHA", 
    "EMPRESS", "MATILDA", "GAIYA", "FFK", "CHILLI WHITE CHOC", "SWEE:D", "GIRLY BERRY", "OLIVES", 
    "CANDY MAFIA", "JAMP", "ZAZA", "T-SKIRT", "2002 RATREE", "BNK48", "CGM48", "REDSPIN", "MXFRUIT"
  ] },
  { g: "Mix", o: "T-Pop", n: [
    "BAMM", "3.2.1"
  ] },
  { g: "M", o: "J-Pop", n: [
    "JO1", "INI", "BE:FIRST", "SNOW MAN", "SIXTONES", "NANIWA DANSHI", "TRAVIS JAPAN", "KING & PRINCE", 
    "ARASHI", "EXILE", "GENERATIONS", "THE RAMPAGE", "FANTASTICS", "BALLISTIK BOYZ", "LIL LEAGUE", "MAZZEL", 
    "DXTEEN", "NUMBER_I", "DA PUMP", "HEY! SAY! JUMP", "KIS-MY-FT2", "KAT-TUN", "NEWS", "DA-ICE", "M!LK", 
    "SUPER★DRAGON", "ONE N' ONLY", "BUGVEL", "ORΒIT", "OCTPATH", "OWV", "PSYCHIC FEVER", "WOLF HOWL HARMONY"
  ] },
  { g: "F", o: "J-Pop", n: [
    "AKB48", "NOGIZAKA46", "SAKURAZAKA46", "HINATAZAKA46", "ME:I", "IS:SUE", "PERFUME", "BABYMETAL", "NMB48", 
    "SKE48", "HKT48", "STU48", "MORNING MUSUME", "=LOVE", "≠ME", "≒JOY", "ATARASHII GAKKO!", "FRUITS ZIPPER", 
    "E-GIRLS", "NIZIU", "FLOWER", "HAPPINESS", "SUDANNAYUZUYULLY", "PASSPO", "TOKYO GIRLS' STYLE", "SHIRITSU EBISU CHUGAKU"
  ] },
  { g: "Mix", o: "J-Pop", n: [
    "YOASOBI", "AAA", "TRF"
  ] }
];

// ============================================================
// 3. ฐานข้อมูลศิลปิน + ระบบจำแนกเพศ/ประเภทของเพลง
//    ชีต "ArtistDB" แก้ไขเองได้: Artist | Gender (M/F/Mix) | Origin | Aliases (คั่นด้วย |) | Strict | Note
//      - Aliases  = ชื่อเรียกอื่น เช่น ชื่อฮันกึล ชื่อย่อ
//      - Strict   = TRUE สำหรับชื่อที่ซ้ำกับคำทั่วไป (เช่น IVE, BEAST, APRIL) จะรับก็ต่อเมื่อมีหลักฐานเพิ่ม
//                   (ช่อง Strict เว้นว่างได้ ระบบเดาให้เอง)
//      - แถวที่เว้น Gender ไว้ = "ค่าย/ช่อง" บอกได้แค่ประเภท (ใช้เมื่อพบในชื่อช่องเท่านั้น)
//    ข้อมูลตั้งต้นเติมให้อัตโนมัติครั้งเดียว โดยไม่ทับ/ไม่ลบแถวที่แอดมินแก้ไว้
// ============================================================
const ARTISTDB_VERSION = "2";
const ARTISTDB_HEADERS = ["Artist", "Gender", "Origin", "Aliases", "Strict", "Note"];

// ชื่อเรียกอื่นของศิลปินใน ARTIST_DB ข้างบน (คีย์ต้องตรงกับชื่อใน ARTIST_DB)
const ARTIST_ALIASES = {
  "TVXQ": "동방신기", "SUPER JUNIOR": "슈퍼주니어", "BIGBANG": "빅뱅", "SHINEE": "샤이니", "2PM": "투피엠", "2AM": "투에이엠",
  "HIGHLIGHT": "하이라이트", "BEAST": "비스트", "INFINITE": "인피니트", "BTOB": "비투비", "VIXX": "빅스", "EXO": "엑소",
  "BTS": "방탄소년단|BANGTAN BOYS", "GOT7": "갓세븐", "WINNER": "위너", "IKON": "아이콘", "MONSTA X": "몬스타엑스|MONSTAX",
  "SEVENTEEN": "세븐틴", "NCT": "엔시티", "NCT 127": "엔시티 127", "NCT DREAM": "엔시티 드림", "THE BOYZ": "더보이즈",
  "ASTRO": "아스트로", "STRAY KIDS": "스트레이 키즈|STRAYKIDS", "ATEEZ": "에이티즈",
  "TXT": "투모로우바이투게더|TOMORROW_X_TOGETHER", "ENHYPEN": "엔하이픈", "TREASURE": "트레저",
  "ZEROBASEONE": "제로베이스원", "RIIZE": "라이즈", "BOYNEXTDOOR": "보이넥스트도어", "TWS": "투어스", "P1HARMONY": "피원하모니",
  "XIKERS": "싸이커스", "WANNA ONE": "워너원",
  "GIRLS' GENERATION": "소녀시대", "2NE1": "투애니원", "WONDER GIRLS": "원더걸스", "KARA": "카라", "T-ARA": "티아라",
  "SISTAR": "씨스타", "4MINUTE": "포미닛", "APINK": "에이핑크|A PINK", "GIRL'S DAY": "걸스데이|GIRLSDAY", "AOA": "에이오에이",
  "EXID": "이엑스아이디", "BLACKPINK": "블랙핑크", "TWICE": "트와이스", "RED VELVET": "레드벨벳|REDVELVET",
  "GFRIEND": "여자친구|G-FRIEND|G FRIEND", "MAMAMOO": "마마무", "OH MY GIRL": "오마이걸|OHMYGIRL", "WJSN": "우주소녀",
  "DREAMCATCHER": "드림캐쳐|드림캐처", "LOONA": "이달의 소녀|이달의소녀", "MOMOLAND": "모모랜드", "CLC": "씨엘씨",
  "WEKI MEKI": "위키미키", "LOVELYZ": "러블리즈", "GUGUDAN": "구구단", "ITZY": "있지", "AESPA": "에스파",
  "(G)I-DLE": "(여자)아이들|여자아이들|G-IDLE|I-DLE", "IVE": "아이브", "LE SSERAFIM": "르세라핌|LESSERAFIM",
  "NEWJEANS": "뉴진스|NEW JEANS", "NMIXX": "엔믹스", "STAYC": "스테이씨", "KEP1ER": "케플러|KEPLER",
  "FROMIS_9": "프로미스나인|FROMIS 9|FROMIS9", "EVERGLOW": "에버글로우", "ROCKET PUNCH": "로켓펀치", "BILLLIE": "빌리",
  "PURPLE KISS": "퍼플키스", "LIGHTSUM": "라잇썸", "FIFTY FIFTY": "피프티피프티", "BABYMONSTER": "베이비몬스터|BABY MONSTER",
  "KISS OF LIFE": "키스 오브 라이프", "ILLIT": "아일릿", "UNIS": "유니스", "IZ*ONE": "아이즈원|IZONE", "I.O.I": "아이오아이|IOI",
  "KATSEYE": "캣츠아이"
};

// ศิลปิน/ค่ายเพิ่มเติม: [ชื่อ, เพศ (M/F/Mix หรือ "" = ค่าย/ช่อง), ประเภท, ชื่อเรียกอื่น (คั่นด้วย |), Strict ("TRUE"/""), หมายเหตุ]
const ARTIST_EXTRA = [
  // --- K-Pop: วงหญิง / วงผสม / วงชายที่เพิ่งเดบิวต์ ---
  ["HEARTS2HEARTS", "F", "K-Pop", "하츠투하츠|HEARTS 2 HEARTS|HEART2HEART", "", ""],
  ["IZNA", "F", "K-Pop", "이즈나", "", ""],
  ["KIIIKIII", "F", "K-Pop", "키키|KIII KIII", "", ""],
  ["BESTIE", "F", "K-Pop", "베스티", "TRUE", ""],
  ["LABOUM", "F", "K-Pop", "라붐", "", ""],
  ["DALSHABET", "F", "K-Pop", "달샤벳", "", ""],
  ["APRIL", "F", "K-Pop", "에이프릴", "TRUE", ""],
  ["STELLAR", "F", "K-Pop", "스텔라", "TRUE", ""],
  ["HELLOVENUS", "F", "K-Pop", "헬로비너스|HELLO VENUS", "", ""],
  ["PIXY", "F", "K-Pop", "픽시", "TRUE", ""],
  ["PINK FANTASY", "F", "K-Pop", "핑크판타지", "", ""],
  ["UNI.T", "F", "K-Pop", "유니티|UNIT", "TRUE", ""],
  ["GIRLS ON TOP", "F", "K-Pop", "소녀온탑", "", ""],
  ["TUIDE", "F", "K-Pop", "튜이드", "", ""],
  ["ANS", "F", "K-Pop", "", "TRUE", ""],
  ["H1-KEY", "F", "K-Pop", "하이키|H1 KEY", "", ""],
  ["WOOAH", "F", "K-Pop", "우아", "TRUE", ""],
  ["ALLDAY PROJECT", "Mix", "K-Pop", "올데이 프로젝트|ALL DAY PROJECT", "", ""],
  ["&TEAM", "M", "K-Pop", "앤팀|AND TEAM", "TRUE", ""],
  ["PLAVE", "M", "K-Pop", "플레이브", "", ""],
  ["DAY6", "M", "K-Pop", "데이식스", "", ""],
  ["NCT WISH", "M", "K-Pop", "엔시티 위시", "", ""],
  ["NCT DOJAEJUNG", "M", "K-Pop", "엔시티 도재정", "", ""],
  ["THE ROSE", "M", "K-Pop", "더로즈", "TRUE", ""],
  // --- K-Pop: ศิลปินเดี่ยว ---
  ["IU", "F", "K-Pop", "아이유", "", ""],
  ["TAEYEON", "F", "K-Pop", "태연", "", ""],
  ["TAEYONG", "M", "K-Pop", "태용", "", ""],
  ["HYOLYN", "F", "K-Pop", "효린", "", ""],
  ["HYUNA", "F", "K-Pop", "현아", "", ""],
  ["B.I", "M", "K-Pop", "비아이", "TRUE", ""],
  ["JAY PARK", "M", "K-Pop", "박재범", "", ""],
  ["DAYOUNG", "F", "K-Pop", "다영", "TRUE", ""],
  ["LISA", "F", "K-Pop", "리사", "TRUE", ""],
  ["JENNIE", "F", "K-Pop", "제니", "", ""],
  ["JISOO", "F", "K-Pop", "지수", "TRUE", ""],
  ["ROSÉ", "F", "K-Pop", "로제|ROSE", "TRUE", ""],
  ["JUNGKOOK", "M", "K-Pop", "정국", "", ""],
  ["JIMIN", "M", "K-Pop", "지민", "TRUE", ""],
  ["SUGA", "M", "K-Pop", "슈가", "TRUE", ""],
  ["J-HOPE", "M", "K-Pop", "제이홉|JHOPE", "", ""],
  ["PSY", "M", "K-Pop", "싸이", "", ""],
  ["G-DRAGON", "M", "K-Pop", "지드래곤|GD", "", ""],
  ["TAEMIN", "M", "K-Pop", "태민", "", ""],
  ["BAEKHYUN", "M", "K-Pop", "백현", "", ""],
  ["KAI", "M", "K-Pop", "카이", "", ""],
  ["TAEYANG", "M", "K-Pop", "태양", "TRUE", ""],
  ["ZICO", "M", "K-Pop", "지코", "", ""],
  ["CRUSH", "M", "K-Pop", "크러쉬", "TRUE", ""],
  ["SUNMI", "F", "K-Pop", "선미", "", ""],
  ["HWASA", "F", "K-Pop", "화사", "", ""],
  ["MOONBYUL", "F", "K-Pop", "문별", "", ""],
  ["CHUNGHA", "F", "K-Pop", "청하", "", ""],
  ["SOMI", "F", "K-Pop", "전소미", "", ""],
  ["SOYEON", "F", "K-Pop", "전소연", "TRUE", ""],
  ["BOA", "F", "K-Pop", "보아", "", ""],
  ["MINO", "M", "K-Pop", "송민호", "TRUE", ""],
  // --- J-Pop ---
  ["MISAMO", "F", "J-Pop", "미사모|ミサモ", "", ""],
  ["CUTIE STREET", "F", "J-Pop", "かわいいだけじゃだめですか", "", ""],
  ["ADO", "F", "J-Pop", "", "TRUE", ""],
  ["KENSHI YONEZU", "M", "J-Pop", "米津玄師", "", ""],
  ["KING GNU", "M", "J-Pop", "", "", ""],
  ["ONE OK ROCK", "M", "J-Pop", "", "", ""],
  ["UTADA HIKARU", "F", "J-Pop", "宇多田ヒカル", "", ""],
  ["RADWIMPS", "M", "J-Pop", "", "", ""],
  ["SEKAI NO OWARI", "Mix", "J-Pop", "セカイノオワリ", "", ""],
  ["BUMP OF CHICKEN", "M", "J-Pop", "", "", ""],
  // --- T-Pop ---
  ["GAIA", "F", "T-Pop", "", "TRUE", ""],
  ["MILLI", "F", "T-Pop", "", "TRUE", ""],
  ["PALMY", "F", "T-Pop", "ปาล์มมี่", "TRUE", ""],
  ["BOWKYLION", "M", "T-Pop", "", "", ""],
  ["SLOT MACHINE", "M", "T-Pop", "สล็อตแมชชีน", "", ""],
  ["SCRUBB", "M", "T-Pop", "สครับบ์", "", ""],
  ["BODYSLAM", "M", "T-Pop", "บอดี้สแลม", "", ""],
  ["POTATO", "M", "T-Pop", "โปเตโต้", "TRUE", ""],
  ["TILLY BIRDS", "Mix", "T-Pop", "ทิลลี่ เบิร์ดส์", "", ""],
  // --- C-Pop ---
  ["NEXT1DE", "M", "C-Pop", "", "", ""],
  ["TFBOYS", "M", "C-Pop", "", "", ""],
  ["THE9", "F", "C-Pop", "", "TRUE", ""],
  // --- ค่าย/ช่อง (บอกได้แค่ประเภท ใช้เมื่อพบในชื่อช่อง) ---
  ["HYBE LABELS", "", "K-Pop", "HYBE", "", "label"],
  ["JYP ENTERTAINMENT", "", "K-Pop", "JYP", "", "label"],
  ["SMTOWN", "", "K-Pop", "", "", "label"],
  ["YG ENTERTAINMENT", "", "K-Pop", "", "", "label"],
  ["STONE MUSIC ENTERTAINMENT", "", "K-Pop", "", "", "label"],
  ["1THEK", "", "K-Pop", "원더케이|1THEK (원더케이)", "", "label"],
  ["MNET K-POP", "", "K-Pop", "", "", "label"],
  ["KBS KPOP", "", "K-Pop", "", "", "label"],
  ["STUDIO CHOOM", "", "K-Pop", "스튜디오 춤", "", "label"],
  ["STARSHIP", "", "K-Pop", "STARSHIP ENTERTAINMENT", "", "label"],
  ["FNC ENTERTAINMENT", "", "K-Pop", "", "", "label"],
  ["PLEDIS ENTERTAINMENT", "", "K-Pop", "", "", "label"],
  ["CUBE ENTERTAINMENT", "", "K-Pop", "", "", "label"],
  ["KQ ENTERTAINMENT", "", "K-Pop", "", "", "label"],
  ["GMM GRAMMY", "", "T-Pop", "", "", "label"],
  ["RS MUSIC", "", "T-Pop", "", "", "label"],
  ["XOXO ENTERTAINMENT", "", "T-Pop", "", "", "label"],
  ["WELOVEKAMIKAZE", "", "T-Pop", "KAMIKAZE MUSIC", "", "label"],
  ["WHAT THE DUCK", "", "T-Pop", "", "", "label"],
  ["SPICYDISC", "", "T-Pop", "", "", "label"],
  ["GENIE RECORDS", "", "T-Pop", "", "", "label"],
  ["AVEX", "", "J-Pop", "", "", "label"],
  ["SONY MUSIC JAPAN", "", "J-Pop", "", "", "label"],
  ["UNIVERSAL MUSIC JAPAN", "", "J-Pop", "", "", "label"],
  ["STARTO ENTERTAINMENT", "", "J-Pop", "", "", "label"]
];

// ชื่อ (ที่ผ่านการ normalize แล้ว) ที่ซ้ำกับคำทั่วไป: ต้องมีหลักฐานเพิ่มถึงจะนับว่าเจอศิลปิน
const AMBIGUOUS_NAMES = [
  "beast", "secret", "winner", "infinite", "dice", "atlas", "trinity", "kingdom", "nomad", "triples", "astro",
  "treasure", "highlight", "boyfriend", "pentagon", "vamp", "perses", "flower", "happiness", "empress", "celeste",
  "news", "nowadays", "crush", "dean", "henry", "lay", "solar", "team", "me i", "is sue", "the wind", "stellar", "april",
  "twice", "exile", "generations", "love", "perfume", "olives", "matilda", "mindy", "waker", "tempest", "everglow",
  "dreamcatcher", "seventeen", "kepler", "snow man", "number i", "be first", "miss a", "a pink", "wanna one", "3 2 1"
];

// คำทั่วไปจริง ๆ: ห้ามใช้ "ตัวพิมพ์ใหญ่" เป็นหลักฐานว่าเป็นชื่อวง (ต้องเป็นช่องของศิลปิน หรืออยู่หน้าสุดของชื่อเพลงเท่านั้น)
const COMMON_WORDS = [
  "love", "me", "joy", "twice", "winner", "secret", "infinite", "treasure", "kingdom", "trinity", "atlas", "flower",
  "happiness", "news", "april", "seventeen", "perfume", "olives", "solar", "crush", "dean", "henry", "lay",
  "beast", "boyfriend", "pentagon", "astro", "nomad", "highlight", "dice", "exile", "generations", "tempest", "everglow"
];

const MUSIC_CUE = /official|m\/v|\bmv\b|music video|lyric|audio|dance practice|performance|choreography|\blive\b|cover|\bost\b|เนื้อเพลง|เพลง|ซับไทย|thai\s*sub/i;
const NOT_MUSIC_WORDS = ["สปอยหนัง", "สปอยล์", "gameplay", "แคสเกม", "เรื่องผี", "เดอะโกส", "สอนทำ", "รีวิว", "พากย์ไทย", "เต็มเรื่อง", "ตลก", "ช็อตฮา", "ข่าว", "vlog", "asmr"];
const CHANNEL_SUFFIX = { official: 1, topic: 1, music: 1, entertainment: 1, ent: 1, channel: 1, kpop: 1, vevo: 1, tv: 1, records: 1, labels: 1 };

// ทำให้ข้อความเทียบกันได้: ตัวพิมพ์เล็ก, ตัดเครื่องหมายทุกชนิดเป็นช่องว่าง (รวม ' ’ ( ) . - _)
function artistNorm(s) {
  return String(s == null ? "" : s)
    .normalize("NFKC").toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ").trim();
}

function artistScript(p) {
  if (/[฀-๿]/.test(p)) return "thai";
  if (/[가-힯ᄀ-ᇿ㄰-㆏]/.test(p)) return "hangul";
  if (/[぀-ヿㇰ-ㇿｦ-ﾟ㐀-䶿一-鿿]/.test(p)) return "cjk";
  return "latin";
}

function buildArtistSeedRows() {
  const rows = [];
  const seen = {};
  function push(name, g, o, aliases, strict, note) {
    const k = artistNorm(name);
    if (!k || seen[k]) return;
    seen[k] = true;
    rows.push([name, g, o, aliases || "", strict || "", note || ""]);
  }
  ARTIST_DB.forEach(function (cat) {
    cat.n.forEach(function (n) { push(n, cat.g, cat.o, ARTIST_ALIASES[n] || "", "", ""); });
  });
  ARTIST_EXTRA.forEach(function (r) { push(r[0], r[1], r[2], r[3], r[4], r[5]); });
  return rows;
}

// แปลงแถวในชีตเป็นดัชนีค้นหา (หนึ่งชื่อ/ชื่อเรียกอื่น = หนึ่งรายการ)
function compileArtistIndex(rows) {
  const entries = [];
  const seen = {};
  rows.forEach(function (r) {
    const name = String(r[0] == null ? "" : r[0]).trim();
    if (!name) return;
    const gRaw = String(r[1] == null ? "" : r[1]).trim();
    const g = /^m(ale)?$/i.test(gRaw) ? "M" : /^f(emale)?$/i.test(gRaw) ? "F" : /^mix/i.test(gRaw) ? "Mix" : "";
    const o = String(r[2] == null ? "" : r[2]).trim();
    if (!g && !o) return;
    const strictCell = String(r[4] == null ? "" : r[4]).trim().toUpperCase();
    [name].concat(String(r[3] == null ? "" : r[3]).split("|")).forEach(function (nm) {
      const p = artistNorm(nm);
      if (!p || seen[p]) return;
      seen[p] = 1;
      const s = artistScript(p);
      // ชื่อที่เสี่ยงซ้ำคำทั่วไป (เดาให้เอง) / ช่อง Strict = TRUE มีผลกับชื่อภาษาอังกฤษเท่านั้น
      // ชื่อฮันกึล/ไทย/ญี่ปุ่นที่ยาวพอจะเฉพาะตัวอยู่แล้ว
      const auto = AMBIGUOUS_NAMES.indexOf(p) !== -1 ||
                   (s === "latin" && p.indexOf(" ") === -1 && p.length <= 3) ||
                   (s === "hangul" && p.length <= 2);
      let strict;
      if (strictCell === "FALSE") strict = false;
      else if (strictCell === "TRUE") strict = s === "latin" || auto;
      else strict = auto;
      entries.push({ p: p, k: p.replace(/ /g, ""), s: s, g: g, o: o, t: strict ? 1 : 0, n: name, c: !g ? 1 : 0 });
    });
  });
  return entries;
}

function makeTextCtx(raw) {
  const norm = artistNorm(raw);
  const tokens = norm ? norm.split(" ") : [];
  const grams = {};
  for (let i = 0; i < tokens.length; i++) {
    let acc = "";
    for (let n = 0; n < 4 && i + n < tokens.length; n++) {
      acc += tokens[i + n];
      if (n > 0 && tokens[i + n].length === 1) continue; // "Super M/V" ไม่ใช่ SUPERM (ไม่ต่อคำที่ลงท้ายด้วยตัวอักษรเดี่ยว)
      grams["~" + acc] = 1;
    }
  }
  return { raw: String(raw == null ? "" : raw), norm: norm, spaced: " " + norm + " ", compact: norm.replace(/ /g, ""), grams: grams };
}

// ชื่อนี้อยู่ในข้อความหรือไม่ (ตามขอบคำ ไม่ใช่ข้อความย่อยตรงไหนก็ได้)
function entryMatchesCtx(e, c) {
  if (!c.norm) return false;
  if (e.s === "latin") {
    if (c.spaced.indexOf(" " + e.p + " ") !== -1) return true;
    return e.k.length >= 5 && c.grams["~" + e.k] === 1; // "NEW JEANS" = "NEWJEANS"
  }
  if (e.s === "hangul") {
    if (c.spaced.indexOf(" " + e.p + " ") !== -1) return true;
    return e.k.length >= 4 && c.compact.indexOf(e.k) !== -1;
  }
  // ไทย/ญี่ปุ่น/จีน: ไม่มีช่องว่างคั่นคำ จึงหาแบบข้อความย่อย (ต้องยาวพอ)
  return e.k.length >= 3 && c.compact.indexOf(e.k) !== -1;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ชื่อซ้ำคำทั่วไป: ยอมรับเมื่อช่องคือศิลปินนั้นเอง
function strictChannelOk(e, A) {
  if (!A.norm) return false;
  if (A.norm === e.p) return true;
  if (A.norm.indexOf(e.p + " ") === 0) {
    return A.norm.slice(e.p.length + 1).split(" ").every(function (w) { return CHANNEL_SUFFIX[w] === 1; });
  }
  return false;
}

// ...หรือในชื่อเพลงเขียนด้วยตัวพิมพ์ใหญ่ทั้งคำ (IVE) หรืออยู่หน้าสุดตามด้วยเครื่องหมายคั่น ("Winner - ...")
function strictTitleOk(e, T) {
  const parts = e.p.split(" ").map(escapeRegExp);
  // ตัวพิมพ์ใหญ่เป็นหลักฐานได้เมื่อชื่อเพลงมีตัวพิมพ์เล็กปนอยู่ (ถ้าพิมพ์ใหญ่ทั้งชื่อ ตัวพิมพ์ใหญ่ไม่บอกอะไร)
  if (e.s === "latin" && COMMON_WORDS.indexOf(e.p) === -1 && /[a-z]/.test(T.raw)) {
    const caps = new RegExp("(^|[^A-Za-z0-9])" + parts.map(function (x) { return x.toUpperCase(); }).join("[^A-Za-z0-9]*") + "($|[^A-Za-z0-9])");
    if (caps.test(T.raw)) return "caps";
  }
  const lead = new RegExp("^[\\s\\[\\(\"'“‘「【&]*(" + parts.join("[^\\p{L}\\p{N}]*") + ")\\s*[-–—:|(\\[「'\"‘“【]", "iu");
  const m = lead.exec(T.raw);
  if (m) {
    // คำทั่วไป (Perfume, Exile ...): ต้องเขียนเป็นชื่อวงแบบตัวพิมพ์ใหญ่ ("EXILE - ...") ไม่ใช่ "Exile - Taylor Swift"
    if (COMMON_WORDS.indexOf(e.p) !== -1 && m[1] !== m[1].toUpperCase()) return "";
    return "lead";
  }
  return "";
}

// ตัวจำแนกหลัก: คืนเพศ/ประเภท พร้อมระดับความมั่นใจ (ไม่เดาเงียบ ๆ อีกต่อไป)
function detectSongType(title, author, idx) {
  const T = makeTextCtx(title);
  const A = makeTextCtx(author);
  const cands = [];
  idx.forEach(function (e) {
    const inA = entryMatchesCtx(e, A);
    const inT = !e.c && entryMatchesCtx(e, T); // ค่าย/ช่อง (ไม่มีเพศ) นับเฉพาะเมื่ออยู่ในชื่อช่อง
    let loc = "";
    let why = "";
    if (!e.t) {
      if (inA) loc = "channel";
      else if (inT) loc = "title";
    } else {
      if (inA && strictChannelOk(e, A)) { loc = "channel"; why = "channel"; }
      else if (inT) {
        const acc = strictTitleOk(e, T);
        if (acc) { loc = "title"; why = acc; }
      }
    }
    if (!loc) return;
    // ศิลปินที่ชื่ออยู่หน้าสุดของชื่อเพลง ("A X B 'เพลง'") ถือเป็นศิลปินหลัก ได้คะแนนเพิ่ม
    const at = (loc === "channel" ? A : T).spaced.indexOf(" " + e.p + " ");
    cands.push({ e: e, loc: loc, why: why, score: (loc === "channel" ? 60 : 40) + Math.min(e.k.length, 12) + (e.t ? 0 : 5) + (at === 0 ? 12 : 0) });
  });
  cands.sort(function (a, b) { return b.score - a.score; });

  let gender = "", origin = "", matched = "", source = "none";
  let genderKnown = false, originKnown = false, ambiguous = false;

  const artists = cands.filter(function (c) { return c.e.g; });
  if (artists.length) {
    const best = artists[0];
    gender = best.e.g;
    genderKnown = true;
    matched = best.e.n;
    source = "db";
    if (best.e.o) { origin = best.e.o; originKnown = true; }
    const rival = artists.filter(function (c) {
      return c.e.n !== best.e.n && (c.e.g !== best.e.g || (c.e.o && c.e.o !== best.e.o)) && best.score - c.score < 15;
    })[0];
    if (rival) ambiguous = true;
  }
  if (!originKnown) {
    const label = cands.filter(function (c) { return c.e.o && !c.e.g; })[0];
    if (label) {
      origin = label.e.o;
      originKnown = true;
      if (source === "none") { source = "label"; matched = label.e.n; }
    }
  }
  if (!originKnown) {
    // คำใบ้ในข้อความ เช่น "K-POP" "T-POP" "J-POP" "C-POP"
    const hints = { kpop: "K-Pop", tpop: "T-Pop", jpop: "J-Pop", cpop: "C-Pop" };
    for (const h in hints) {
      if (T.grams["~" + h] === 1 || A.grams["~" + h] === 1) { origin = hints[h]; originKnown = true; source = "script"; break; }
    }
  }
  if (!originKnown) {
    // ตัวอักษรของภาษา (ข้ามกรณีเป็นคลิป "ซับไทย" ของเพลงต่างประเทศ)
    const all = T.raw + " " + A.raw;
    const thaiSub = /thai\s*sub|thaisub|ซับไทย|แปลไทย|ไอดอลไทยซับ/i.test(all);
    const has = {
      hangul: /[가-힯]/.test(all),
      kana: /[぀-ヿｦ-ﾟ]/.test(all),
      thai: /[฀-๿]/.test(all) && !thaiSub
    };
    if (has.hangul) { origin = "K-Pop"; originKnown = true; source = "script"; }
    else if (has.kana) { origin = "J-Pop"; originKnown = true; source = "script"; }
    else if (has.thai) { origin = "T-Pop"; originKnown = true; source = "script"; }
  }

  let confidence = "none";
  if (genderKnown) confidence = ambiguous ? "medium" : (originKnown ? "high" : "medium");
  else if (originKnown) confidence = "low";

  return {
    artist: String(author == null ? "" : author),
    song: String(title == null ? "" : title),
    // ค่าเดิมเพื่อให้เว็บเวอร์ชันเก่ายังใช้ได้: ถ้าไม่รู้ ให้ Mix / K-Pop เหมือนเดิม (เว็บใหม่ดู known/confidence แทน)
    gender: genderKnown ? gender : "Mix",
    origin: originKnown ? origin : "K-Pop",
    genderKnown: genderKnown,
    originKnown: originKnown,
    known: genderKnown,
    confidence: confidence,
    source: source,
    matched: matched,
    ambiguous: ambiguous,
    vibe: genderKnown
      ? (gender === "M" ? "บอยกรุ๊ป" : gender === "F" ? "เกิร์ลกรุ๊ป" : "วงผสม") + " (" + source + ")"
      : "ไม่ทราบ (Fallback)"
  };
}

function processSongDB(title, author) {
  const result = detectSongType(title, author, getArtistIndex());
  // ป้องกันลิงก์ที่ไม่ใช่เพลง (บล็อกเฉพาะเมื่อไม่รู้จักศิลปินและไม่มีคำที่บ่งบอกว่าเป็นเพลง)
  if (!result.genderKnown && !MUSIC_CUE.test(String(title || ""))) {
    const lower = String(title || "").toLowerCase();
    if (NOT_MUSIC_WORDS.some(function (kw) { return lower.indexOf(kw) !== -1; })) {
      throw new Error("ระบบตรวจพบว่าลิงก์นี้ไม่ใช่เพลง กรุณาเปลี่ยนลิงก์ค่ะ");
    }
  }
  return result;
}

// ------------------------------------------------------------
// ชีต ArtistDB: เติมข้อมูลตั้งต้น / แคช / อ่านดัชนี
// ------------------------------------------------------------
function cachePutBig(key, str, ttl) {
  const cache = CacheService.getScriptCache();
  const SIZE = 25000; // อักขระ (ภาษาไทย/ฮันกึลเป็น 3 ไบต์) ให้ต่ำกว่า 100KB ต่อค่า
  const n = Math.ceil(str.length / SIZE);
  const obj = {};
  obj[key + "_n"] = String(n);
  for (let i = 0; i < n; i++) obj[key + "_" + i] = str.slice(i * SIZE, (i + 1) * SIZE);
  cache.putAll(obj, ttl);
}

function cacheGetBig(key) {
  const cache = CacheService.getScriptCache();
  const n = parseInt(cache.get(key + "_n"), 10);
  if (!n) return null;
  const keys = [];
  for (let i = 0; i < n; i++) keys.push(key + "_" + i);
  const got = cache.getAll(keys);
  let out = "";
  for (let i = 0; i < n; i++) {
    const part = got[key + "_" + i];
    if (part == null) return null;
    out += part;
  }
  return out;
}

function clearArtistCache() {
  const cache = CacheService.getScriptCache();
  const n = parseInt(cache.get("artistidx_n"), 10) || 0;
  const keys = ["artistidx_n"];
  for (let i = 0; i < n; i++) keys.push("artistidx_" + i);
  cache.removeAll(keys);
}

// เติมข้อมูลตั้งต้นลงชีต ArtistDB แบบไม่ทำลายข้อมูลเดิม (ต้องเรียกขณะถือล็อกอยู่)
//   - ไม่มีชีต -> สร้างใหม่   - ศิลปินที่ยังไม่มี -> เพิ่มท้ายตาราง
//   - ศิลปินที่มีอยู่แล้ว -> เติมเฉพาะช่อง Aliases ที่ว่างอยู่ (ไม่แก้ Gender/Origin ที่แอดมินตั้งไว้)
function seedArtistDBLocked() {
  const ss = getSS();
  let sheet = ss.getSheetByName("ArtistDB");
  if (!sheet) sheet = ss.insertSheet("ArtistDB");

  const head = sheet.getRange(1, 1, 1, 6).getValues()[0];
  let headChanged = false;
  for (let c = 0; c < 6; c++) {
    if (String(head[c] == null ? "" : head[c]).trim() === "") { head[c] = ARTISTDB_HEADERS[c]; headChanged = true; }
  }
  if (headChanged) sheet.getRange(1, 1, 1, 6).setValues([head]);

  const last = sheet.getLastRow();
  const existing = {};
  let aliasCol = [];
  if (last > 1) {
    const vals = sheet.getRange(2, 1, last - 1, 6).getValues();
    vals.forEach(function (r, i) {
      const k = artistNorm(r[0]);
      if (k && existing[k] === undefined) existing[k] = i;
      aliasCol.push([r[3] == null ? "" : r[3]]);
    });
  }

  const toAdd = [];
  let aliasChanged = false;
  buildArtistSeedRows().forEach(function (row) {
    const k = artistNorm(row[0]);
    if (existing[k] === undefined) {
      toAdd.push([safeCell(row[0]), row[1], row[2], safeCell(row[3]), row[4], row[5]]);
    } else if (row[3] && String(aliasCol[existing[k]][0]).trim() === "") {
      aliasCol[existing[k]][0] = safeCell(row[3]);
      aliasChanged = true;
    }
  });
  if (aliasChanged) sheet.getRange(2, 4, aliasCol.length, 1).setValues(aliasCol);
  if (toAdd.length) sheet.getRange(sheet.getLastRow() + 1, 1, toAdd.length, 6).setValues(toAdd);
  return toAdd.length;
}

function ensureArtistDBSeeded() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty("ARTISTDB_SEED") === ARTISTDB_VERSION) return true;
  try {
    withScriptLock(8000, function () {
      if (props.getProperty("ARTISTDB_SEED") === ARTISTDB_VERSION) return;
      seedArtistDBLocked();
      props.setProperty("ARTISTDB_SEED", ARTISTDB_VERSION);
      clearArtistCache();
    });
    return true;
  } catch (e) {
    return false; // ระบบหนาแน่น: รอบนี้ใช้ข้อมูลในโค้ดไปก่อน แล้วค่อยเติมรอบหน้า
  }
}

function getArtistIndex() {
  try {
    const cached = cacheGetBig("artistidx");
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  const seeded = ensureArtistDBSeeded();
  let rows = [];
  try {
    const sheet = getSS().getSheetByName("ArtistDB");
    if (sheet && sheet.getLastRow() > 1) {
      rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
    }
  } catch (e) {}
  // ยังเติมข้อมูลตั้งต้นไม่สำเร็จ: เอาข้อมูลในโค้ดต่อท้าย (ชีตมาก่อน จึงชนะเมื่อชื่อซ้ำ) และยังไม่แคช
  if (!seeded || rows.length === 0) rows = rows.concat(buildArtistSeedRows());

  const idx = compileArtistIndex(rows);
  if (seeded && rows.length > 0) {
    try { cachePutBig("artistidx", JSON.stringify(idx), 300); } catch (e) {}
  }
  return idx;
}

// ------------------------------------------------------------
// เครื่องมือแอดมิน
// ------------------------------------------------------------
// เพิ่ม/แก้ศิลปินในฐานข้อมูล (มีอยู่แล้ว = อัปเดตเพศ/ประเภท และเพิ่มชื่อเรียกอื่น)
function addArtistToDB(name, gender, origin, aliases) {
  return withScriptLock(15000, function () {
    const nm = clip(name, 60).trim();
    if (!artistNorm(nm)) throw new Error("กรุณาระบุชื่อศิลปินค่ะ");
    if (["M", "F", "Mix"].indexOf(gender) === -1) throw new Error("กรุณาเลือกเพศของศิลปิน (ชาย/หญิง/ผสม) ค่ะ");
    const org = clip(origin, 10).trim();
    if (!org) throw new Error("กรุณาเลือกประเภทของศิลปินค่ะ");
    const extra = clip(aliases, 200).trim();

    const props = PropertiesService.getScriptProperties();
    if (props.getProperty("ARTISTDB_SEED") !== ARTISTDB_VERSION) {
      seedArtistDBLocked();
      props.setProperty("ARTISTDB_SEED", ARTISTDB_VERSION);
    }
    const sheet = getSS().getSheetByName("ArtistDB");
    const last = sheet.getLastRow();
    const key = artistNorm(nm);
    let status = "added";
    if (last > 1) {
      const vals = sheet.getRange(2, 1, last - 1, 6).getValues();
      for (let i = 0; i < vals.length; i++) {
        const names = [vals[i][0]].concat(String(vals[i][3] || "").split("|"));
        if (names.some(function (x) { return artistNorm(x) === key; })) {
          sheet.getRange(i + 2, 2, 1, 2).setValues([[gender, safeCell(org)]]);
          if (extra) {
            const cur = String(vals[i][3] || "").trim();
            sheet.getRange(i + 2, 4).setValue(safeCell(cur ? cur + "|" + extra : extra));
          }
          sheet.getRange(i + 2, 6).setValue("แก้โดยแอดมิน " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"));
          status = "updated";
          break;
        }
      }
    }
    if (status === "added") {
      sheet.appendRow([safeCell(nm), gender, safeCell(org), safeCell(extra), "", "เพิ่มโดยแอดมิน " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd")]);
    }
    clearArtistCache();
    return { status: status, artist: nm };
  });
}

// ตรวจเพลงทั้งงานด้วยฐานข้อมูล แล้วเสนอรายการที่เพศ/ประเภทไม่ตรง (ยังไม่แก้อะไร)
function suggestSongFixes(eventId) {
  const sheet = getSS().getSheetByName("Req_" + eventId);
  if (!sheet) return [];
  const data = sheet.getDataRange().getDisplayValues();
  const idx = getArtistIndex();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    const r = detectSongType(data[i][1], data[i][2], idx);
    const curG = data[i][10] || "Mix";
    const curO = data[i][12] || "K-Pop";
    const fix = { id: data[i][0], name: data[i][1], artist: data[i][2], gender: curG, origin: curO, matched: r.matched, source: r.source, confidence: r.confidence };
    let changed = false;
    if (r.genderKnown && !r.ambiguous && r.gender !== curG) { fix.suggestGender = r.gender; changed = true; }
    if (r.originKnown && r.source !== "script" && !r.ambiguous && r.origin !== curO) { fix.suggestOrigin = r.origin; changed = true; }
    if (changed) out.push(fix);
  }
  return out;
}

// ใช้การแก้ที่แอดมินเลือก (fixes = [{id, gender?, origin?}])
function applySongFixes(eventId, fixes) {
  return withScriptLock(20000, function () {
    if (!Array.isArray(fixes)) throw new Error("ข้อมูลไม่ถูกต้อง");
    const sheet = getSS().getSheetByName("Req_" + eventId);
    if (!sheet) throw new Error("ไม่พบรายการเพลงของงานนี้");
    const data = sheet.getDataRange().getValues();
    const rowOf = {};
    for (let i = 1; i < data.length; i++) rowOf[String(data[i][0])] = i;
    let applied = 0;
    fixes.slice(0, 500).forEach(function (f) {
      const i = rowOf[String(f && f.id)];
      if (i === undefined) return;
      let touched = false;
      if (["M", "F", "Mix"].indexOf(f.gender) !== -1) { sheet.getRange(i + 1, 11).setValue(f.gender); touched = true; }
      if (f.origin) { sheet.getRange(i + 1, 13).setValue(safeCell(clip(f.origin, 20))); touched = true; }
      if (touched) applied++;
    });
    return { applied: applied };
  });
}

// ============================================================
// 4. จัด Setlist แบบสุ่มสลับเพศ
// ============================================================
function processAiSetlist(songs) {
  if (!songs || songs.length < 2) return songs.map(s => s.id);
  
  const shuffle = arr => arr.sort(() => Math.random() - 0.5);
  let males = shuffle(songs.filter(s => s.gender === 'M')); 
  let females = shuffle(songs.filter(s => s.gender === 'F')); 
  let mixes = shuffle(songs.filter(s => s.gender !== 'M' && s.gender !== 'F'));
  let sortedIds = []; 
  let mIdx = 0, fIdx = 0, mixIdx = 0, turn = 'M';
  
  while(mIdx < males.length || fIdx < females.length || mixIdx < mixes.length) {
    if(turn === 'M') { 
      if(mIdx < males.length) { sortedIds.push(males[mIdx++].id); turn = 'F'; } else turn = 'F'; 
    } 
    else if(turn === 'F') { 
      if(fIdx < females.length) { sortedIds.push(females[fIdx++].id); turn = 'Mix'; } else turn = 'Mix'; 
    } 
    else if(turn === 'Mix') { 
      if(mixIdx < mixes.length) { sortedIds.push(mixes[mixIdx++].id); turn = 'M'; } else turn = 'M'; 
    }
  } 
  return sortedIds; 
}

// ============================================================
// 5. Database CRUD (การจัดการฐานข้อมูล Google Sheets)
// ============================================================
function getEvents() {
  const sheet = getSS().getSheetByName("Events");
  if (!sheet) return [];
  const data = sheet.getDataRange().getDisplayValues();
  let events = [];
  for (let i = 1; i < data.length; i++) {
    events.push({
      date: data[i][0], name: data[i][1], location: data[i][2], details: data[i][3],
      openTime: data[i][4], closeTime: data[i][5], status: data[i][6], id: data[i][7],
      quota: parseInt(data[i][8]) || 3 // 🌟 เพิ่มโควตา
    });
  }
  return events;
}

function sortByVotesDesc(list) {
  // เรียงโหวตมาก→น้อย โดยเท่ากันให้คงลำดับเดิม (ไม่ต้องเรียงชีตจริงทุกครั้งที่มีคนโหวต)
  return list
    .map(function (s, i) { return { s: s, i: i }; })
    .sort(function (a, b) { return (b.s.votes - a.s.votes) || (a.i - b.i); })
    .map(function (x) { return x.s; });
}

function songsFromData(data) {
  let songs = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === "" && String(data[i][1]).trim() === "") continue; // แถวว่างทั้งแถว ไม่ใช่เพลง
    songs.push({
      id: data[i][0], name: data[i][1], artist: data[i][2], link: data[i][3],
      start: data[i][4], end: data[i][5], votes: parseInt(data[i][6]) || 0,
      voters: data[i][7] || "", creator: data[i][8] || "", status: data[i][9] || "Pending",
      gender: data[i][10] || "Mix", isBreakdance: data[i][11] || "No",
      origin: data[i][12] || "K-Pop"
    });
  }
  return sortByVotesDesc(songs);
}

// แถวเพลงที่ช่อง ID (คอลัมน์ A) ว่าง จะชนกันหมด: ทุกเพลงที่ไม่มี ID ถูกมองเป็นเพลงเดียวกัน
// (กดดู/โหวต/แก้ไขแล้วไปตกที่เพลงแรกที่ ID ว่าง) จึงเติม ID ให้ทุกแถวที่ว่าง (ไม่แตะแถวที่มี ID อยู่แล้ว ไม่ลบอะไร)
function ensureSongIds(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  const rows = sheet.getRange(2, 1, last - 1, 2).getValues(); // [ID, ชื่อเพลง]
  let need = false;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === "" && String(rows[i][1]).trim() !== "") { need = true; break; }
  }
  if (!need) return false;
  const stamp = new Date().getTime();
  const used = {};
  rows.forEach(function (r) { if (String(r[0]).trim() !== "") used[String(r[0])] = 1; });
  const col = rows.map(function (r, i) {
    if (String(r[0]).trim() !== "" || String(r[1]).trim() === "") return [r[0]];
    let id;
    do { id = "S" + stamp + Math.random().toString(36).slice(2, 5) + i.toString(36); } while (used[id]);
    used[id] = 1;
    return [id];
  });
  sheet.getRange(2, 1, col.length, 1).setValues(col);
  return true;
}

// ============================================================
// รหัสวิดีโอ YouTube + เวลาแบบ นาที:วินาที
// ============================================================
// ดึงรหัสวิดีโอ 11 ตัวอักษรจากลิงก์ทุกรูปแบบ (watch?v=, youtu.be/, shorts/, embed/, live/) ไม่สนใจพารามิเตอร์ท้าย (si=, list=, t=)
// รหัสแยกตัวพิมพ์เล็ก/ใหญ่ จึงไม่แปลงตัวอักษร
function ytVideoId(url) {
  const u = String(url == null ? "" : url).trim();
  if (!u || !/youtu/i.test(u)) return "";
  let m = u.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:shorts\/|embed\/|live\/|v\/))([\w-]{11})(?![\w-])/i);
  if (!m) m = u.match(/[?&]v=([\w-]{11})(?![\w-])/);
  return m ? m[1] : "";
}

// ทำเวลาให้เป็น "MM:SS" ("1.42" "1:42" "142" "01:42" -> "01:42") คืน "" ถ้าว่าง และ null ถ้ารูปแบบไม่ถูกต้อง
function normClock(raw) {
  let s = String(raw == null ? "" : raw).trim();
  if (!s) return "";
  s = s.replace(/[\u0E50-\u0E59]/g, function (c) { return String(c.charCodeAt(0) - 0x0E50); });
  s = s.replace(/[\s.,;:\uFF1A]+/g, ":").replace(/^:+|:+$/g, "");
  let parts;
  if (/^\d+$/.test(s)) {
    if (s.length < 3 || s.length > 5) return null; // เลข 1-2 หลักกำกวมว่าเป็นนาทีหรือวินาที
    parts = [s.slice(0, -2), s.slice(-2)];
  } else {
    parts = s.split(":");
  }
  if (parts.length < 2 || parts.length > 3) return null;
  for (let i = 0; i < parts.length; i++) if (!/^\d{1,3}$/.test(parts[i])) return null;
  let sec = parseInt(parts[parts.length - 1], 10);
  let min = parseInt(parts[parts.length - 2], 10);
  if (parts.length === 3) min += parseInt(parts[0], 10) * 60;
  if (sec > 59) return null;
  return (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec;
}

// เวลาที่แอดมิน/ผู้ใช้พิมพ์มา: ถ้าจัดรูปแบบได้ก็จัดให้ ถ้าไม่ได้ (หรือเป็นค่าเดิม เช่น Hook 1) เก็บตามที่ส่งมา
function cleanTime(v) {
  const raw = clip(v, 30);
  if (/^(Hook 1|Hook 2|Dance Break)$/i.test(raw.trim())) return raw;
  const n = normClock(raw);
  return n === null ? raw : n;
}

function getSongs(eventId) {
  const sheet = getSS().getSheetByName("Req_" + eventId);
  if (!sheet) return [];
  let data = sheet.getDataRange().getDisplayValues();
  let blank = false;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === "" && String(data[i][1]).trim() !== "") { blank = true; break; }
  }
  if (blank) {
    // getSongs ถูกเรียกทั้งจากข้างในและข้างนอกล็อก: ถ้าถือล็อกอยู่แล้วก็เติมได้เลย
    if (_lockHeld) ensureSongIds(sheet);
    else withScriptLock(15000, function () { ensureSongIds(sheet); });
    data = sheet.getDataRange().getDisplayValues();
  }
  return songsFromData(data);
}

function createEvent(p) {
  return withScriptLock(15000, function () {
    const ss = getSS();
    let eventSheet = ss.getSheetByName("Events");
    if (!eventSheet) {
      eventSheet = ss.insertSheet("Events");
      eventSheet.appendRow(["วันที่จัดงาน", "ชื่องาน", "สถานที่", "รายละเอียด", "เวลาเปิดรับ", "เวลาปิดรับ", "สถานะ", "EventID", "โควตา"]);
      eventSheet.hideColumns(8);
    }

    const eventId = Math.random().toString(36).substring(2, 10);
    const newSheet = ss.insertSheet("Req_" + eventId);
    newSheet.appendRow(["ID", "ชื่อเพลง", "ศิลปิน", "ลิงก์เพลง", "เวลาเริ่ม", "เวลาจบ", "โหวต", "อีเมลคนโหวต", "อีเมลคนขอ", "สถานะ", "เพศศิลปิน", "Breakdance", "สัญชาติ"]);
    newSheet.hideColumns(1);

    const quota = parseInt(p.quota) || 3; // 🌟 รับโควตา
    eventSheet.appendRow([
      clip(p.date, 30), safeCell(clip(p.name, 120)), safeCell(clip(p.location, 120)), safeCell(clip(p.details, 500)),
      p.openTime ? "'" + clip(p.openTime, 30) : "", p.closeTime ? "'" + clip(p.closeTime, 30) : "", "Open", eventId, quota
    ]);

    return getEvents();
  });
}

function editEvent(p) {
  return withScriptLock(15000, function () {
    if (!p.id) throw new Error("ไม่พบข้อมูลงาน");
    const sheet = getSS().getSheetByName("Events");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][7] === p.id) {
        sheet.getRange(i + 1, 1).setValue(clip(p.date, 30));
        sheet.getRange(i + 1, 2).setValue(safeCell(clip(p.name, 120)));
        sheet.getRange(i + 1, 3).setValue(safeCell(clip(p.location, 120)));
        sheet.getRange(i + 1, 4).setValue(safeCell(clip(p.details, 500)));
        sheet.getRange(i + 1, 5).setValue(p.openTime ? "'" + clip(p.openTime, 30) : "");
        sheet.getRange(i + 1, 6).setValue(p.closeTime ? "'" + clip(p.closeTime, 30) : "");
        sheet.getRange(i + 1, 9).setValue(parseInt(p.quota) || 3); // 🌟 บันทึกโควตา (คอลัมน์ 9) ให้ตรงกับที่ getEvents อ่าน
        break;
      }
    }
    return getEvents();
  });
}

function deleteEvent(id) {
  return withScriptLock(15000, function () {
    // กันค่าว่าง: แถวเก่าที่ EventID ว่างจะถูกจับคู่โดยไม่ตั้งใจ และ "()" จะตรงกับชีตอื่น
    if (!id) throw new Error("ไม่พบข้อมูลงาน");
    const ss = getSS();
    const sheet = ss.getSheetByName("Events");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][7] === id) {
        sheet.deleteRow(i + 1);
        const reqSheet = ss.getSheetByName("Req_" + id);
        if (reqSheet) ss.deleteSheet(reqSheet);

        const allSheets = ss.getSheets();
        allSheets.forEach(s => {
          if (s.getName().includes(`(${id})`)) ss.deleteSheet(s);
        });
        break;
      }
    }
    return getEvents();
  });
}

// ============================================================
// ฟังก์ชันเกี่ยวกับเพลง (ล็อกกันชนกัน + กันสูตรในชีต)
// ============================================================
function addSong(eventId, songData, uuid, isAdmin) {
  return withScriptLock(15000, function () {
    return addSongLocked(eventId, songData, uuid, isAdmin);
  });
}

// เพิ่มหลายเพลงในครั้งเดียว (ดึงเพลงจากงานเก่าเข้าหน้าตัดลิสต์) เฉพาะแอดมิน
// เพลงที่ซ้ำกับที่มีอยู่แล้วจะนับเป็นโหวตตามปกติของ addSong
function addSongs(eventId, songs, uuid, isAdmin) {
  if (!isAdmin) throw new Error("เฉพาะแอดมินเท่านั้นค่ะ");
  const list = Array.isArray(songs) ? songs.slice(0, 100) : [];
  return withScriptLock(30000, function () {
    list.forEach(function (songData) {
      if (songData && String(songData.name || "").trim()) addSongLocked(eventId, songData, uuid, true);
    });
    return getSongs(eventId);
  });
}

function addSongLocked(eventId, songData, uuid, isAdmin) {
  const ss = getSS();
  let sheet = ss.getSheetByName("Req_" + eventId);

  if (!sheet) {
    sheet = ss.insertSheet("Req_" + eventId);
    sheet.appendRow(["ID", "ชื่อเพลง", "ศิลปิน", "ลิงก์เพลง", "เวลาเริ่ม", "เวลาจบ", "โหวต", "อีเมลคนโหวต", "อีเมลคนขอ", "สถานะ", "เพศศิลปิน", "Breakdance", "สัญชาติ"]);
    sheet.hideColumns(1);
  }

  songData = songData || {};
  const name = clip(songData.name, 200);
  const artist = clip(songData.artist, 200);
  const link = clip(songData.link, 500);
  if (!name.trim()) throw new Error("กรุณากรอกชื่อเพลงค่ะ");

  const data = sheet.getDataRange().getValues();
  let cleanNewName = name.toLowerCase().replace(/\s/g, '');
  let cleanNewLink = link ? link.toLowerCase().trim() : "";
  const newVid = ytVideoId(link); // ลิงก์คนละรูปแบบแต่เป็นวิดีโอเดียวกัน (youtu.be / watch?v= / shorts) ก็นับว่าซ้ำ

  for (let i = 1; i < data.length; i++) {
    let existingName = data[i][1].toString().toLowerCase().replace(/\s/g, '');
    let existingLink = data[i][3].toString().toLowerCase().trim();
    if ((cleanNewLink && existingLink === cleanNewLink) || existingName === cleanNewName ||
        (newVid && ytVideoId(data[i][3]) === newVid)) {
       // เพลงซ้ำ -> นับเป็นโหวต (อยู่ในล็อกอยู่แล้ว จึงเรียกตัวที่ไม่ล็อกซ้ำ)
       return voteSongLocked(eventId, data[i][0], uuid);
    }
  }

  if (!isAdmin) {
    let maxQuota = 3;
    let eventSheet = ss.getSheetByName("Events");
    if(eventSheet) {
       let evData = eventSheet.getDataRange().getValues();
       for(let j=1; j<evData.length; j++) {
          if(evData[j][7] == eventId) { maxQuota = parseInt(evData[j][8]) || 3; break; }
       }
    }

    let userSongCount = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i][8] == uuid) userSongCount++;
    }
    if (userSongCount >= maxQuota) throw new Error("คุณขอเพลงครบโควตา " + maxQuota + " เพลงแล้วค่ะ");
  }

  const songId = "S" + new Date().getTime() + Math.random().toString(36).slice(2, 5);
  const breakdanceText = songData.isBreakdance ? "Yes" : "No";
  const gender = safeCell(clip(songData.gender || "Mix", 10));
  const origin = safeCell(clip(songData.origin || "K-Pop", 20));

  // 🌟 ถ้าแอดมินเป็นคนเพิ่ม ให้กำหนดสถานะเป็น AdminOnly เพื่อซ่อนจากหน้าโหวตสาธารณะ
  const status = isAdmin ? "AdminOnly" : "Pending";

  sheet.appendRow([songId, safeCell(name), safeCell(artist), safeCell(link), safeCell(cleanTime(songData.start)), safeCell(cleanTime(songData.end)), 1, uuid, uuid, status, gender, breakdanceText, origin]);

  return getSongs(eventId);
}

function editSong(eventId, songId, songData, uuid, isAdmin) {
  return withScriptLock(15000, function () {
    if (!String(songId == null ? "" : songId).trim()) throw new Error("ไม่พบเพลงนี้ กรุณารีเฟรชหน้าเว็บ");
    const sheet = getSS().getSheetByName("Req_" + eventId);
    if (!sheet) throw new Error("ไม่พบรายการเพลงของงานนี้");
    songData = songData || {};
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == songId) {
        if (!isAdmin && data[i][8] != uuid) throw new Error("คุณไม่มีสิทธิ์แก้ไขเพลงนี้");
        const name = clip(songData.name, 200);
        if (!name.trim()) throw new Error("กรุณากรอกชื่อเพลงค่ะ");

        sheet.getRange(i + 1, 2).setValue(safeCell(name));
        sheet.getRange(i + 1, 3).setValue(safeCell(clip(songData.artist, 200)));
        sheet.getRange(i + 1, 4).setValue(safeCell(clip(songData.link, 500)));
        sheet.getRange(i + 1, 5).setValue(safeCell(cleanTime(songData.start)));
        sheet.getRange(i + 1, 6).setValue(safeCell(cleanTime(songData.end)));
        sheet.getRange(i + 1, 11).setValue(songData.gender ? safeCell(clip(songData.gender, 10)) : data[i][10]);
        sheet.getRange(i + 1, 12).setValue(songData.isBreakdance ? "Yes" : "No");
        sheet.getRange(i + 1, 13).setValue(songData.origin ? safeCell(clip(songData.origin, 20)) : data[i][12]);
        break;
      }
    }
    return getSongs(eventId);
  });
}

// โหวต/ยกเลิกโหวต: อ่านชีตครั้งเดียว เขียนครั้งเดียว (เดิมอ่าน 2 รอบ เขียน 2 รอบ และเรียงชีตทุกครั้ง)
function voteSong(eventId, songId, uuid) {
  return withScriptLock(15000, function () {
    return voteSongLocked(eventId, songId, uuid);
  });
}

function voteSongLocked(eventId, songId, uuid) {
  if (!String(songId == null ? "" : songId).trim()) throw new Error("ไม่พบเพลงนี้ กรุณารีเฟรชหน้าเว็บ");
  const sheet = getSS().getSheetByName("Req_" + eventId);
  if (!sheet) return [];
  let data = sheet.getDataRange().getDisplayValues();
  for (let k = 1; k < data.length; k++) {
    if (String(data[k][0]).trim() === "" && String(data[k][1]).trim() !== "") {
      ensureSongIds(sheet); // ข้อมูลเก่าที่ ID ว่าง: เติมก่อน แล้วอ่านใหม่ เพื่อให้คำตอบมี ID ครบ
      data = sheet.getDataRange().getDisplayValues();
      break;
    }
  }

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == songId) {
      if (uuid === data[i][8]) break; // เจ้าของเพลงโหวตเพลงตัวเองไม่ได้

      let currentVotes = parseInt(data[i][6]) || 0;
      let uuidList = (data[i][7] ? data[i][7].toString() : "").split(",").filter(v => v !== "");

      if (uuidList.includes(uuid)) {
        currentVotes -= 1; // เคยกดแล้ว -> ยกเลิกโหวต
        uuidList = uuidList.filter(v => v !== uuid);
      } else {
        currentVotes += 1; // ยังไม่เคยกด -> เพิ่มโหวต
        uuidList.push(uuid);
      }

      const votersText = uuidList.join(",");
      sheet.getRange(i + 1, 7, 1, 2).setValues([[currentVotes, votersText]]);
      data[i][6] = String(currentVotes); // อัปเดตในหน่วยความจำ เพื่อตอบกลับโดยไม่ต้องอ่านชีตซ้ำ
      data[i][7] = votersText;
      break;
    }
  }
  return songsFromData(data);
}

const SONG_STATUSES = ["Pending", "Approved", "Played", "AdminOnly"];

// รวมเพลงซ้ำ (แอดมิน): merges = [{keepId, dropIds:[...]}]
// โหวตของเพลงที่ถูกรวมย้ายมาเพิ่มให้เพลงที่เก็บไว้ (นับผู้โหวต/ผู้ขอที่ยังไม่เคยโหวตเพลงที่เก็บ คนละ 1 โหวต) แล้วลบแถวที่ซ้ำ
// ลิสต์ที่จัดไว้ที่อ้างถึงเพลงที่ถูกรวมจะถูกชี้มาที่เพลงที่เก็บไว้ (และตัดแถวซ้ำในลิสต์)
function mergeSongs(eventId, merges) {
  return withScriptLock(20000, function () {
    const sheet = getSS().getSheetByName("Req_" + eventId);
    if (!sheet) throw new Error("ไม่พบรายการเพลงของงานนี้");
    if (!Array.isArray(merges) || merges.length === 0) return getSongs(eventId);
    ensureSongIds(sheet);
    const data = sheet.getDataRange().getValues();
    const rowOf = {};
    for (let i = 1; i < data.length; i++) rowOf[String(data[i][0])] = i;

    const split = function (v) { return String(v == null ? "" : v).split(",").filter(function (x) { return x !== ""; }); };
    const dropRows = [];
    const remap = {};
    merges.slice(0, 100).forEach(function (m) {
      if (!m) return;
      const k = rowOf[String(m.keepId)];
      if (k === undefined) return;
      const voters = split(data[k][7]);
      let added = 0;
      (Array.isArray(m.dropIds) ? m.dropIds : []).slice(0, 50).forEach(function (id) {
        const d = rowOf[String(id)];
        if (d === undefined || d === k || dropRows.indexOf(d) !== -1) return;
        split(data[d][7]).concat(split(data[d][8])).forEach(function (v) {
          if (voters.indexOf(v) === -1) { voters.push(v); added++; }
        });
        remap[String(id)] = String(m.keepId);
        dropRows.push(d);
      });
      if (added > 0) {
        const votes = (parseInt(data[k][6], 10) || 0) + added;
        sheet.getRange(k + 1, 7, 1, 2).setValues([[votes, voters.join(",")]]);
      }
    });

    // ลิสต์ที่จัดไว้: ชี้ SongID ไปที่เพลงที่เก็บ แล้วตัดแถวซ้ำ
    if (dropRows.length > 0) {
      const pl = getSS().getSheetByName(getPlaylistSheetName(eventId));
      if (pl && pl.getLastRow() >= 2) {
        const rng = pl.getRange(2, 9, pl.getLastRow() - 1, 1);
        const ids = rng.getValues();
        const seen = {};
        const removeRows = [];
        for (let i = 0; i < ids.length; i++) {
          const cur = String(ids[i][0]);
          const to = remap[cur] || cur;
          ids[i][0] = to;
          if (to && seen[to]) removeRows.push(i + 2); else if (to) seen[to] = 1;
        }
        rng.setValues(ids);
        removeRows.sort(function (a, b) { return b - a; }).forEach(function (r) { pl.deleteRow(r); });
      }
      dropRows.sort(function (a, b) { return b - a; }).forEach(function (r) { sheet.deleteRow(r + 1); });
    }
    return getSongs(eventId);
  });
}

function updateSongStatus(eventId, songId, status) {
  return withScriptLock(15000, function () {
    if (!String(songId == null ? "" : songId).trim()) throw new Error("ไม่พบเพลงนี้ กรุณารีเฟรชหน้าเว็บ");
    if (SONG_STATUSES.indexOf(status) === -1) throw new Error("สถานะเพลงไม่ถูกต้อง");
    const sheet = getSS().getSheetByName("Req_" + eventId);
    if (!sheet) throw new Error("ไม่พบรายการเพลงของงานนี้");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == songId) {
        sheet.getRange(i + 1, 10).setValue(status);
        break;
      }
    }
    return getSongs(eventId);
  });
}

function deleteSong(eventId, songId) {
  return withScriptLock(15000, function () {
    if (!String(songId == null ? "" : songId).trim()) throw new Error("ไม่พบเพลงนี้ กรุณารีเฟรชหน้าเว็บ");
    const sheet = getSS().getSheetByName("Req_" + eventId);
    if (!sheet) throw new Error("ไม่พบรายการเพลงของงานนี้");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == songId) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    return getSongs(eventId);
  });
}

function sortSongs(sheet) {
  if (sheet.getLastRow() > 1) {
    const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
    range.sort({column: 7, ascending: false});
  }
}

// ============================================================
// ลิสต์เพลง: ชื่อชีตผูกกับ EventID (ไม่มีวันที่) เปลี่ยนวันที่งานแล้วลิสต์ไม่หาย
//   - ใหม่:    "Song list (<EventID>)"
//   - เดิม:    "Song list [<วันที่>] (<EventID>)"  (ยังอ่านได้ ไม่ถูกลบ/แก้ไข)
// ============================================================
function getPlaylistSheetName(eventId) {
  return "Song list (" + eventId + ")";
}

function legacyPlaylistSheetName(eventId, date) {
  return "Song list [" + date + "] (" + eventId + ")";
}

function getPlaylist(eventId, date) {
  const ss = getSS();
  // 1) ชีตแบบใหม่  2) ถ้ายังไม่มี ลองชีตแบบเดิมของวันที่ปัจจุบัน
  let sheet = ss.getSheetByName(getPlaylistSheetName(eventId));
  if (!sheet && date) sheet = ss.getSheetByName(legacyPlaylistSheetName(eventId, date));
  if (!sheet) return [];
  return readPlaylistSheet(sheet);
}

// 🌟 ฟังก์ชันสำหรับให้แอดมินปิดงาน
function closeEvent(id) {
  return withScriptLock(15000, function () {
    if (!id) throw new Error("ไม่พบข้อมูลงาน");
    const sheet = getSS().getSheetByName("Events");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][7] === id) {
        sheet.getRange(i + 1, 7).setValue("Closed"); // อัปเดตสถานะเป็น Closed
        break;
      }
    }
    return getEvents();
  });
}

// บันทึกลิสต์หลักลงชีต "Song list (<EventID>)" (ชีตแบบเดิมที่มีวันที่ในชื่อจะไม่ถูกแตะ เก็บไว้เป็นประวัติ)
function savePlaylist(eventId, date, lists) {
  return withScriptLock(15000, function () {
    if (!eventId) throw new Error("ไม่พบข้อมูลงาน");
    const ss = getSS();
    const sheetName = getPlaylistSheetName(eventId);
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);
    sheet.clear();
    sheet.appendRow(["หมวดหมู่ห้อง", "ลำดับ", "ชื่อเพลง", "ศิลปิน", "เพศศิลปิน", "Breakdance", "เวลาที่เต้น", "ลิงก์ Youtube", "SongID"]);

    if (lists && lists.length > 0) {
      const rows = lists.map((s, index) => [
        safeCell(s.listName), index + 1, safeCell(s.name), safeCell(s.artist), s.gender, s.isBreakdance ? "Yes" : "No", safeCell(s.time), safeCell(s.link), s.id
      ]);
      sheet.getRange(2, 1, rows.length, 9).setValues(rows);
    }
    return { success: true };
  });
}

// ============================================================
// 🌟 สำรอง / กู้คืนลิสต์เพลง
//   - ลิสต์หลัก:  "Song list [<วันที่>] (<EventID>)"
//   - สำเนาสำรอง: "Backup <ชื่อ> [<วันที่>] (<EventID>)"
//   ทุกชีตลงท้ายด้วย (<EventID>) จึงถูกลบ/ซ่อนพร้อมงานเหมือนเดิม
// ============================================================
const PLAYLIST_PREFIX = "Song list ";
const BACKUP_PREFIX = "Backup ";

// ชีตนี้เป็นลิสต์/สำเนาสำรองของงานนี้จริงหรือไม่ (กันการอ่านชีตอื่น เช่น Members)
function isPlaylistSheetOf(name, eventId) {
  if (!eventId || !name) return false;
  const suffix = "(" + eventId + ")";
  if (name.length <= suffix.length || name.slice(-suffix.length) !== suffix) return false;
  return name.indexOf(PLAYLIST_PREFIX) === 0 || name.indexOf(BACKUP_PREFIX) === 0;
}

function readPlaylistSheet(sheet) {
  const data = sheet.getDataRange().getDisplayValues();
  let list = [];
  for (let i = 1; i < data.length; i++) {
    list.push({
      id: data[i][8] || ("P" + i),
      listName: data[i][0],
      order: data[i][1],
      name: data[i][2],
      artist: data[i][3],
      gender: data[i][4],
      isBreakdance: data[i][5] === "Yes",
      time: data[i][6],
      link: data[i][7]
    });
  }
  return list;
}

// รายการลิสต์ทั้งหมดของงานนี้ (ลิสต์หลักปัจจุบัน + ลิสต์แบบเดิมที่มีวันที่ + สำเนาสำรอง)
//   date = "" หมายถึงลิสต์หลักปัจจุบัน (ชื่อชีตไม่มีวันที่)
function listPlaylists(eventId) {
  const out = [];
  getSS().getSheets().forEach(function (s) {
    const name = s.getName();
    if (!isPlaylistSheetOf(name, eventId)) return;
    const isBackup = name.indexOf(BACKUP_PREFIX) === 0;
    let label = "", date = "";
    if (isBackup) {
      const m = name.match(/^Backup (.*) \[([^\]]*)\] \(.*\)$/);
      if (m) { label = m[1]; date = m[2]; }
    } else {
      const m = name.match(/^Song list \[([^\]]*)\] \(.*\)$/);
      if (m) date = m[1];
    }
    out.push({
      sheetName: name,
      kind: isBackup ? "backup" : "main",
      label: label,
      date: date,
      count: Math.max(s.getLastRow() - 1, 0)
    });
  });
  out.sort(function (a, b) {
    if (a.kind !== b.kind) return a.kind === "main" ? -1 : 1;
    if ((a.date === "") !== (b.date === "")) return a.date === "" ? -1 : 1;
    return a.sheetName < b.sheetName ? 1 : -1;
  });
  return out;
}

function getPlaylistBySheet(eventId, sheetName) {
  if (!isPlaylistSheetOf(sheetName, eventId)) throw new Error("ไม่พบลิสต์ที่ต้องการ");
  const sheet = getSS().getSheetByName(sheetName);
  if (!sheet) throw new Error("ไม่พบลิสต์ที่ต้องการ");
  return readPlaylistSheet(sheet);
}

// บันทึกสำเนาสำรองเป็นชีตใหม่ (ไม่แตะลิสต์หลัก) ผู้ใช้เปิดแก้ใน Sheets ต่อได้
function savePlaylistBackup(eventId, date, lists, label) {
  if (!eventId) throw new Error("ไม่พบข้อมูลงาน");
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
  } catch (e) {
    throw new Error("ระบบคนใช้งานหนาแน่น กรุณาลองใหม่อีกครั้งครับ");
  }
  try {
    const ss = getSS();
    const bad = /[\[\]*?:\/\\]/g;
    let clean = String(label || "").replace(bad, " ").replace(/\s+/g, " ").trim().slice(0, 30);
    if (!clean) clean = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH-mm");
    const cleanDate = String(date || "").replace(bad, "-");

    let name = BACKUP_PREFIX + clean + " [" + cleanDate + "] (" + eventId + ")";
    let n = 2;
    while (ss.getSheetByName(name)) {
      name = BACKUP_PREFIX + clean + " " + n + " [" + cleanDate + "] (" + eventId + ")";
      n++;
    }

    const sheet = ss.insertSheet(name);
    sheet.appendRow(["หมวดหมู่ห้อง", "ลำดับ", "ชื่อเพลง", "ศิลปิน", "เพศศิลปิน", "Breakdance", "เวลาที่เต้น", "ลิงก์ Youtube", "SongID"]);
    if (lists && lists.length > 0) {
      const rows = lists.map(function (s, index) {
        return [safeCell(s.listName), index + 1, safeCell(s.name), safeCell(s.artist), s.gender,
                s.isBreakdance ? "Yes" : "No", safeCell(s.time), safeCell(s.link), s.id];
      });
      sheet.getRange(2, 1, rows.length, 9).setValues(rows);
    }
    return { success: true, sheetName: name };
  } finally {
    lock.releaseLock();
  }
}

// ============================================================
// 🛠️ ฟังก์ชันพิเศษ: รันแค่ครั้งเดียวเพื่อสร้างฐานข้อมูล ArtistDB
// ============================================================

function setupInitialArtistDB() {
  // เติมข้อมูลตั้งต้นลงชีต ArtistDB โดย "ไม่ล้างข้อมูลเดิม" (เวอร์ชันก่อนหน้าล้างชีตทิ้งทุกครั้ง)
  // - ศิลปินที่ยังไม่มี -> เพิ่มท้ายตาราง   - ศิลปินที่มีอยู่แล้ว -> เติมเฉพาะชื่อเรียกอื่นที่ยังว่าง
  const added = withScriptLock(30000, function () {
    const n = seedArtistDBLocked();
    PropertiesService.getScriptProperties().setProperty("ARTISTDB_SEED", ARTISTDB_VERSION);
    return n;
  });
  clearArtistCache();
  Logger.log("เติมข้อมูลศิลปินใหม่ " + added + " รายการ (ข้อมูลเดิมไม่ถูกแก้ไข)");
}

function getFeedback(eventId) {
  const empty = { avgSongList: "0.0", avgSpecialList: "0.0", avgPlace: "0.0", avgWebsite: "0.0", comments: [] };
  const sheet = getSS().getSheetByName('Feedbacks');
  if (!sheet) return empty;

  const data = sheet.getDataRange().getValues();
  let count = 0;
  let sumSongList = 0, sumPlace = 0, sumWebsite = 0;
  // Special List เพิ่มทีหลัง: เฉลี่ยเฉพาะคนที่ให้คะแนนหัวข้อนี้ (แถวเก่าไม่มีคอลัมน์นี้ จะได้ไม่ดึงค่าเฉลี่ยลง)
  let sumSpecial = 0, countSpecial = 0;
  let comments = [];

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(eventId)) {
      count++;
      sumSongList += Number(data[i][2]) || 0;
      sumPlace += Number(data[i][4]) || 0;
      sumWebsite += Number(data[i][6]) || 0;
      const sp = Number(data[i][11]) || 0;
      if (sp > 0) { sumSpecial += sp; countSpecial++; }

      let hasComment = (data[i][3] || data[i][5] || data[i][7] || data[i][8] || data[i][12]);
      if (hasComment || data[i][2] > 0 || sp > 0) {
        comments.push({
          timestamp: data[i][0] || "-",
          songList: data[i][3] || "-",
          specialList: data[i][12] || "-",
          place: data[i][5] || "-",
          website: data[i][7] || "-",
          additional: data[i][8] || "-",
          username: data[i][10] || "ไม่ระบุชื่อ"
        });
      }
    }
  }

  if (count === 0) return empty;

  return {
    avgSongList: (sumSongList / count).toFixed(1),
    avgSpecialList: countSpecial ? (sumSpecial / countSpecial).toFixed(1) : "0.0",
    avgPlace: (sumPlace / count).toFixed(1),
    avgWebsite: (sumWebsite / count).toFixed(1),
    comments: comments.reverse()
  };
}

function getMembers() {
  const ss = getSS();
  let sheet = ss.getSheetByName("Members");
  if (!sheet) return {};
  let data = sheet.getDataRange().getValues();
  let map = {};
  
  for (let i = 1; i < data.length; i++) {
    // 🌟 ดึงค่า Email จากคอลัมน์ C (index 2) หรือ คอลัมน์ A (index 0) มาเป็น Key
    let emailKey = (data[i][2] || data[i][0] || "").toString().trim().toLowerCase();
    // 🌟 ดึงค่า Username จากคอลัมน์ B (index 1) มาเป็น Value
    let username = data[i][1] ? data[i][1].toString().trim() : "";
    
    if (emailKey && username) {
      map[emailKey] = username;
    }
  }
  return map;
}

function autoHideOldEventSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const eventSheet = ss.getSheetByName("Events");
  if (!eventSheet) return;
  
  const eventData = eventSheet.getDataRange().getValues();
  const now = new Date();
  
  for (let i = 1; i < eventData.length; i++) {
    let eventDateStr = eventData[i][0]; // วันที่จัดงาน (Column A)
    let eventStatus = eventData[i][6];  // สถานะงาน (Column G)
    let eventId = eventData[i][7];      // EventID (Column H)
    
    if (eventDateStr && eventId) {
      let evDate = new Date(eventDateStr);
      let diffDays = (now - evDate) / (1000 * 60 * 60 * 24); // คำนวณจำนวนวันที่ผ่านมา
      
      // เงื่อนไข: ถ้าผ่านมามากกว่า 30 วัน หรือสถานะเป็น Closed และผ่านมาเกิน 7 วันแล้ว
      if (diffDays > 30 || (eventStatus === "Closed" && diffDays > 7)) {
        
        // 1. ซ่อนชีตขอเพลง (Req_<eventId>)
        let reqSheet = ss.getSheetByName("Req_" + eventId);
        if (reqSheet && !reqSheet.isSheetHidden()) {
          reqSheet.hideSheet();
        }
        
        // 2. ซ่อนชีต Playlist ของงานนั้นๆ ด้วย
        ss.getSheets().forEach(s => {
          let name = s.getName();
          if (name.includes(`(${eventId})`) && !s.isSheetHidden()) {
            s.hideSheet();
          }
        });
      }
    }
  }
}

function getGlobalLeaderboard() {
  const ss = getSS();
  const sheets = ss.getSheets();
  let allSongs = [];
  
  // วนลูปดึงข้อมูลจากทุกชีตที่เป็นคำขอเพลงของทุกงาน
  sheets.forEach(sheet => {
    let name = sheet.getName();
    if (name.indexOf("Req_") === 0) {
      let data = sheet.getDataRange().getDisplayValues();
      for (let i = 1; i < data.length; i++) {
        allSongs.push({
          id: data[i][0],
          name: data[i][1],
          artist: data[i][2],
          votes: parseInt(data[i][6]) || 0,
          voters: data[i][7] || "",
          creator: data[i][8] || "",
          status: data[i][9] || "Pending"
        });
      }
    }
  });
  
  // ดึงข้อมูลสมาชิก (Members) มาด้วยเพื่อใช้แมตช์ Username
  let memberMap = getMembers();
  
  // HARDENED: ไม่ส่งอีเมลออกไป ใช้รหัสย่อแทน (ใช้จับคู่ชื่อกับเพลงได้เหมือนเดิม)
  if (HARDENED) {
    allSongs = allSongs.map(function (s) {
      const voters = String(s.voters || "").split(",").filter(function (x) { return x !== ""; });
      return Object.assign({}, s, { creator: pidOf(s.creator), voters: voters.map(pidOf).join(",") });
    });
    memberMap = anonymizeMembers(memberMap);
  }
  
  return {
    songs: allSongs,
    members: memberMap
  };
}