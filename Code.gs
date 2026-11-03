const SPREADSHEET_ID = "1k3fciGBq1QKvtoXWutH8EyRKZacPBR-rWzKVNWu1tx4";

function getSS() { 
  return SpreadsheetApp.openById(SPREADSHEET_ID); 
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const p = request.payload || {};
    let result = {};
    var data = JSON.parse(e.postData.contents);

    if (action === 'saveFeedback') {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Feedbacks');
      if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Feedbacks');
        sheet.appendRow(['Timestamp', 'Event ID', 'SongList Score', 'SongList Comment', 'Place Score', 'Place Comment', 'Website Score', 'Website Comment', 'Additional Comment', 'UUID', 'Username']);
      }
      
      sheet.appendRow([
        p.timestamp,
        p.eventId,
        p.ratings ? p.ratings.songList : 0,
        p.comments ? p.comments.songList : '',
        p.ratings ? p.ratings.place : 0,
        p.comments ? p.comments.place : '',
        p.ratings ? p.ratings.website : 0,
        p.comments ? p.comments.website : '',
        p.comments ? p.comments.additional : '',
        p.uuid,
        p.username
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, data: { status: 'success' } })).setMimeType(ContentService.MimeType.JSON);
    }

    switch (action) {
      case "getEvents": result = getEvents(); break;
      case "getSongs": result = getSongs(p.eventId); break;
      case "getFeedback": result = getFeedback(p.eventId); break;
      case "addSong": result = addSong(p.eventId, p.songData, p.uuid, p.isAdmin); break;
      case "getGlobalLeaderboard": result = getGlobalLeaderboard(); break;
      case "editSong": result = editSong(p.eventId, p.songId, p.songData, p.uuid, p.isAdmin); break;
      case "voteSong": result = voteSong(p.eventId, p.songId, p.uuid); break;
      case "getMembers": result = getMembers(); break; // 🌟 เพิ่มบรรทัดนี้
      
      // 🌟 ระบบล็อกอินด้วย Google Sign-In
      case "auth": result = unifiedAuth(p.action, p.email, p.username, p.clientUuid, p.password); break; 
      
      case "createEvent": result = createEvent(p); break;
      case "closeEvent": result = closeEvent(p.id); break;
      case "editEvent": result = editEvent(p); break;
      case "deleteEvent": result = deleteEvent(p.id); break;
      case "updateSongStatus": result = updateSongStatus(p.eventId, p.songId, p.status); break;
      case "deleteSong": result = deleteSong(p.eventId, p.songId); break;
      case "getPlaylist": result = getPlaylist(p.eventId, p.date); break;
      case "savePlaylist": result = savePlaylist(p.eventId, p.date, p.lists); break;
      
      // 🌟 ประมวลผลเพลงด้วย Database
      case "aiProcess": result = processSongDB(p.title, p.author); break; 
      case "aiMagicSetlist": result = processAiSetlist(p.songs); break;
      default: throw new Error("Invalid Action");
    }
    
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
function unifiedAuth(action, email, username, clientUuid, password) {
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
          return { uuid: "admin-" + cleanUser, username: cleanUser, role: role, email: "admin@delia.com" };
        }
      }
    }
    throw new Error("ชื่อหรือรหัสผ่าน Admin ไม่ถูกต้องค่ะ");
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
        return { status: "login_success", uuid: cleanEmail, username: data[i][1], role: data[i][3] || "User", email: cleanEmail };
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
    sheet.appendRow([cleanEmail, cleanUser, cleanEmail, "User", new Date().toLocaleString('th-TH')]);
    return { status: "login_success", uuid: cleanEmail, username: cleanUser, role: "User", email: cleanEmail };
  }

  // D. ล็อกอินอัตโนมัติ (ตรวจสอบเซสชันจาก LocalStorage)
  if (action === "auto_login" && clientUuid) {
    for (let i = 1; i < data.length; i++) {
      // ตรวจสอบทั้งช่อง UUID เดิม และช่อง Email เพื่อความเข้ากันได้
      if (data[i][0] === clientUuid || data[i][2] === clientUuid) {
        return { status: "login_success", uuid: data[i][2] || clientUuid, username: data[i][1], role: data[i][3] || "User", email: data[i][2] || clientUuid }; 
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
    "CLASS:Y", "FIFTY FIFTY", "NIZIU", "XG",
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
    "E-GIRLS", "FLOWER", "HAPPINESS", "SUDANNAYUZUYULLY", "PASSPO", "TOKYO GIRLS' STYLE", "SHIRITSU EBISU CHUGAKU"
  ] },
  { g: "Mix", o: "J-Pop", n: [
    "YOASOBI", "AAA", "TRF"
  ] }
];

function compact(text) { 
  return (text || "").toString().normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""); 
}

function detectOriginByChar(text) {
  if (!text) return "K-Pop";
  if (/[ก-๙]/.test(text)) return "T-Pop"; 
  if (/[ぁ-んァ-ヶｦ-ﾟ一-龯]/.test(text)) return "J-Pop"; 
  return "K-Pop"; 
}

// ============================================================
// 3. ระบบวิเคราะห์เพลงและสัญชาติ (ผ่าน Database ล้วน 100%)
// ============================================================
// ============================================================
// 3. ระบบวิเคราะห์เพลงและสัญชาติ (เช็ค 2 ชั้น: Code + Sheet)
// ============================================================
function processSongDB(title, author) {
  const rawTitle = title || "";
  const rawAuthor = author || "Unknown Channel";
  
  // ป้องกันลิงก์ที่ไม่ใช่เพลง
  const trollKeywords = ["สปอยหนัง", "สปอยล์", "gameplay", "แคสเกม", "เรื่องผี", "เดอะโกส", "สอนทำ", "รีวิว", "พากย์ไทย", "เต็มเรื่อง", "ตลก", "ช็อตฮา", "ข่าว", "vlog", "asmr"];
  if (trollKeywords.some(kw => rawTitle.toLowerCase().includes(kw))) {
    throw new Error("ระบบตรวจพบว่าลิงก์นี้ไม่ใช่เพลง กรุณาเปลี่ยนลิงก์ค่ะ");
  }

  // แปลงเป็นตัวพิมพ์ใหญ่เพื่อความแม่นยำในการค้นหา
  const textToSearch = (rawTitle + " " + rawAuthor).toUpperCase();
  
  let result = { 
    artist: rawAuthor, 
    song: rawTitle, 
    gender: "Mix", 
    vibe: "วงใหม่ (Fallback)", 
    origin: "K-Pop" 
  };
  
  let foundMatch = false;

  // 🔍 ชั้นที่ 1: เช็คจากตัวแปร ARTIST_DB ในโค้ด (ความเร็วแสง)
  for (let category of ARTIST_DB) {
    for (let artist of category.n) {
      if (textToSearch.includes(artist)) {
        result.gender = category.g;
        result.origin = category.o;
        result.vibe = `${category.g === "M" ? "บอยกรุ๊ป" : category.g === "F" ? "เกิร์ลกรุ๊ป" : "วงผสม"} (Code DB)`;
        foundMatch = true;
        break;
      }
    }
    if (foundMatch) break;
  }
  
  // 🔍 ชั้นที่ 2: ถ้าในโค้ดหาไม่เจอ ให้ไปค้นต่อใน Google Sheets (เผื่อเพิ่งแอดมินพิมพ์เพิ่ม)
  if (!foundMatch) {
    const ss = getSS();
    let dbSheet = ss.getSheetByName("ArtistDB");
    if (dbSheet) {
      const sheetData = dbSheet.getDataRange().getValues();
      for (let i = 1; i < sheetData.length; i++) {
        let dbArtist = sheetData[i][0].toString().toUpperCase().trim();
        if (dbArtist && textToSearch.includes(dbArtist)) {
          result.gender = sheetData[i][1].toString().trim() || "Mix";
          result.origin = sheetData[i][2].toString().trim() || "K-Pop";
          result.vibe = `${result.gender === "M" ? "บอยกรุ๊ป" : result.gender === "F" ? "เกิร์ลกรุ๊ป" : "วงผสม"} (Sheet DB)`;
          foundMatch = true;
          break;
        }
      }
    }
  }
  
  // 📌 ชั้นที่ 3 (สำรอง): ดักจับสัญชาติจากตัวอักษรภาษาไทย/ญี่ปุ่น
  if (!foundMatch) {
    if (textToSearch.includes("T-POP") || textToSearch.match(/[ก-๙]/)) {
      result.origin = "T-Pop";
    } else if (textToSearch.includes("J-POP") || textToSearch.includes("AKB48") || textToSearch.match(/[ぁ-んァ-ヶｦ-ﾟ一-龯]/)) {
      result.origin = "J-Pop";
    }
  }

  return result;
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

function getSongs(eventId) {
  const sheet = getSS().getSheetByName("Req_" + eventId); 
  if (!sheet) return []; 
  const data = sheet.getDataRange().getDisplayValues(); 
  let songs = [];
  for (let i = 1; i < data.length; i++) {
    songs.push({ 
      id: data[i][0], name: data[i][1], artist: data[i][2], link: data[i][3], 
      start: data[i][4], end: data[i][5], votes: parseInt(data[i][6]) || 0, 
      voters: data[i][7] || "", creator: data[i][8] || "", status: data[i][9] || "Pending", 
      gender: data[i][10] || "Mix", isBreakdance: data[i][11] || "No", 
      origin: data[i][12] || "K-Pop" 
    });
  }
  return songs;
}

function createEvent(p) {
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
  eventSheet.appendRow([p.date, p.name, p.location, p.details, p.openTime ? "'" + p.openTime : "", p.closeTime ? "'" + p.closeTime : "", "Open", eventId, quota]);
  
  return getEvents();
}

function editEvent(p) {
  const sheet = getSS().getSheetByName("Events"); 
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][7] === p.id) { 
      sheet.getRange(i + 1, 1).setValue(p.date); 
      sheet.getRange(i + 1, 2).setValue(p.name); 
      sheet.getRange(i + 1, 3).setValue(p.location); 
      sheet.getRange(i + 1, 4).setValue(p.details); 
      sheet.getRange(i + 1, 5).setValue(p.openTime ? "'" + p.openTime : ""); 
      sheet.getRange(i + 1, 6).setValue(p.closeTime ? "'" + p.closeTime : "");
      sheet.getRange(i + 1, 9).setValue(parseInt(p.quota) || 3); // 🌟 บันทึกโควตา (คอลัมน์ 9) ให้ตรงกับที่ getEvents อ่าน
      break;
    }
  } 
  return getEvents();
}

function deleteEvent(id) {
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
}

// ============================================================
// ฟังก์ชันบันทึกเพลง (อัปเดต: ป้องกัน Error ชีตหาย)
// ============================================================
function addSong(eventId, songData, uuid, isAdmin) {
  const ss = getSS();
  let sheet = ss.getSheetByName("Req_" + eventId); 
  
  if (!sheet) {
    sheet = ss.insertSheet("Req_" + eventId);
    sheet.appendRow(["ID", "ชื่อเพลง", "ศิลปิน", "ลิงก์เพลง", "เวลาเริ่ม", "เวลาจบ", "โหวต", "อีเมลคนโหวต", "อีเมลคนขอ", "สถานะ", "เพศศิลปิน", "Breakdance", "สัญชาติ"]);
    sheet.hideColumns(1); 
  }

  const data = sheet.getDataRange().getValues();
  let cleanNewName = songData.name.toLowerCase().replace(/\s/g, '');
  let cleanNewLink = songData.link ? songData.link.toLowerCase().trim() : "";
  
  for (let i = 1; i < data.length; i++) {
    let existingName = data[i][1].toString().toLowerCase().replace(/\s/g, '');
    let existingLink = data[i][3].toString().toLowerCase().trim();
    if ((cleanNewLink && existingLink === cleanNewLink) || existingName === cleanNewName) {
       return voteSong(eventId, data[i][0], uuid);
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
  
  const songId = "S" + new Date().getTime(); 
  const breakdanceText = songData.isBreakdance ? "Yes" : "No"; 
  const gender = songData.gender || "Mix"; 
  const origin = songData.origin || "K-Pop";
  
  // 🌟 ถ้าแอดมินเป็นคนเพิ่ม ให้กำหนดสถานะเป็น AdminOnly เพื่อซ่อนจากหน้าโหวตสาธารณะ
  const status = isAdmin ? "AdminOnly" : "Pending";
  
  sheet.appendRow([songId, songData.name, songData.artist, songData.link, songData.start, songData.end, 1, uuid, uuid, status, gender, breakdanceText, origin]); 
  sortSongs(sheet); 
  
  return getSongs(eventId);
}

function editSong(eventId, songId, songData, uuid, isAdmin) {
  const sheet = getSS().getSheetByName("Req_" + eventId); 
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == songId) {
      if (!isAdmin && data[i][8] != uuid) throw new Error("คุณไม่มีสิทธิ์แก้ไขเพลงนี้");
      
      sheet.getRange(i + 1, 2).setValue(songData.name); 
      sheet.getRange(i + 1, 3).setValue(songData.artist); 
      sheet.getRange(i + 1, 4).setValue(songData.link); 
      sheet.getRange(i + 1, 5).setValue(songData.start); 
      sheet.getRange(i + 1, 6).setValue(songData.end); 
      sheet.getRange(i + 1, 11).setValue(songData.gender || data[i][10]); 
      sheet.getRange(i + 1, 12).setValue(songData.isBreakdance ? "Yes" : "No"); 
      sheet.getRange(i + 1, 13).setValue(songData.origin || data[i][12]); 
      break;
    }
  }
  sortSongs(sheet); 
  return getSongs(eventId);
}

function voteSong(eventId, songId, uuid) {
  // 🛡️ LockService ป้องกันคิวชนกัน (Race Condition) เมื่อมีคนโหวตพร้อมกัน
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000); // รอคิวจัดการข้อมูลสูงสุด 5 วินาที
  } catch (e) {
    throw new Error("ระบบคนใช้งานหนาแน่น กรุณาลองโหวตใหม่อีกครั้งครับ");
  }

  try {
    const sheet = getSS().getSheetByName("Req_" + eventId); 
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == songId) {
        if (uuid === data[i][8]) return getSongs(eventId); 
        
        let currentVotes = parseInt(data[i][6]) || 0; 
        let uuidList = (data[i][7] ? data[i][7].toString() : "").split(",").filter(v => v !== "");
        
        if (uuidList.includes(uuid)) { 
          currentVotes -= 1; // เคยกดแล้ว -> ยกเลิกโหวต
          uuidList = uuidList.filter(v => v !== uuid); 
        } else { 
          currentVotes += 1; // ยังไม่เคยกด -> เพิ่มโหวต
          uuidList.push(uuid); 
        }
        
        sheet.getRange(i + 1, 7).setValue(currentVotes); 
        sheet.getRange(i + 1, 8).setValue(uuidList.join(",")); 
        break;
      }
    }
    sortSongs(sheet); 
    return getSongs(eventId); 
  } finally {
    lock.releaseLock(); // ประมวลผลเสร็จแล้ว ปลดล็อกให้คิวต่อไปทำงาน
  }
}

function updateSongStatus(eventId, songId, status) {
  const sheet = getSS().getSheetByName("Req_" + eventId); 
  const data = sheet.getDataRange().getValues(); 
  for (let i = 1; i < data.length; i++) { 
    if (data[i][0] == songId) { 
      sheet.getRange(i + 1, 10).setValue(status); 
      break; 
    } 
  } 
  return getSongs(eventId); 
}

function deleteSong(eventId, songId) {
  const sheet = getSS().getSheetByName("Req_" + eventId); 
  const data = sheet.getDataRange().getValues(); 
  for (let i = 1; i < data.length; i++) { 
    if (data[i][0] == songId) { 
      sheet.deleteRow(i + 1); 
      break; 
    } 
  } 
  return getSongs(eventId); 
}

function sortSongs(sheet) {
  if (sheet.getLastRow() > 1) {
    const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
    range.sort({column: 7, ascending: false});
  }
}

function getPlaylistSheetName(eventId, date) { 
  return `Song list [${date}] (${eventId})`; 
}

function getPlaylist(eventId, date) {
  const ss = getSS(); 
  const sheet = ss.getSheetByName(getPlaylistSheetName(eventId, date)); 
  if (!sheet) return []; 
  const data = sheet.getDataRange().getDisplayValues(); 
  let list = [];
  for (let i = 1; i < data.length; i++) {
    list.push({ 
      id: data[i][8] || ("P"+i), 
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

// 🌟 ฟังก์ชันสำหรับให้แอดมินปิดงาน
function closeEvent(id) {
  const sheet = getSS().getSheetByName("Events");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][7] === id) {
      sheet.getRange(i + 1, 7).setValue("Closed"); // อัปเดตสถานะเป็น Closed
      break;
    }
  }
  return getEvents();
}
function savePlaylist(eventId, date, lists) {
  const ss = getSS(); 
  const sheetName = getPlaylistSheetName(eventId, date); 
  let sheet = ss.getSheetByName(sheetName); 
  if (!sheet) sheet = ss.insertSheet(sheetName); 
  sheet.clear(); 
  sheet.appendRow(["หมวดหมู่ห้อง", "ลำดับ", "ชื่อเพลง", "ศิลปิน", "เพศศิลปิน", "Breakdance", "เวลาที่เต้น", "ลิงก์ Youtube", "SongID"]); 
  
  if (lists && lists.length > 0) {
    const rows = lists.map((s, index) => [
      s.listName, index + 1, s.name, s.artist, s.gender, s.isBreakdance ? "Yes" : "No", s.time, s.link, s.id
    ]);
    sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  }
  return { success: true };
}

// ============================================================
// 🛠️ ฟังก์ชันพิเศษ: รันแค่ครั้งเดียวเพื่อสร้างฐานข้อมูล ArtistDB
// ============================================================

function setupInitialArtistDB() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("ArtistDB");
  
  if (!sheet) {
    sheet = ss.insertSheet("ArtistDB");
  }
  
  sheet.clear(); // ล้างข้อมูลเก่าก่อนลงข้อมูลใหม่
  
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
      "CLASS:Y", "FIFTY FIFTY", "NIZIU", "XG",
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
      "E-GIRLS", "FLOWER", "HAPPINESS", "SUDANNAYUZUYULLY", "PASSPO", "TOKYO GIRLS' STYLE", "SHIRITSU EBISU CHUGAKU"
    ] },
    { g: "Mix", o: "J-Pop", n: [
      "YOASOBI", "AAA", "TRF"
    ] }
  ];

  // เตรียมข้อมูลสำหรับเขียนลงชีต
  let sheetData = [["Artist", "Gender", "Origin"]];
  
  for (let i = 0; i < ARTIST_DB.length; i++) {
    let category = ARTIST_DB[i];
    for (let j = 0; j < category.n.length; j++) {
      sheetData.push([category.n[j], category.g, category.o]);
    }
  }
  
  // เขียนลงชีตทีเดียวเพื่อลดเวลา
  sheet.getRange(1, 1, sheetData.length, 3).setValues(sheetData);
  sheet.getRange("A1:C1").setFontWeight("bold").setBackground("#FFD1DF");
  sheet.setColumnWidth(1, 200);
  
  Logger.log("บันทึกข้อมูล ArtistDB ลงชีตเรียบร้อยแล้วค่ะ จำนวนศิลปินทั้งหมด: " + (sheetData.length - 1) + " วง");
}

function getFeedback(eventId) {
  const sheet = getSS().getSheetByName('Feedbacks');
  if (!sheet) return { avgSongList: "0.0", avgPlace: "0.0", avgWebsite: "0.0", comments: [] };

  const data = sheet.getDataRange().getValues();
  let count = 0;
  let sumSongList = 0, sumPlace = 0, sumWebsite = 0;
  let comments = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === eventId) { 
      count++;
      sumSongList += Number(data[i][2]) || 0;
      sumPlace += Number(data[i][4]) || 0;
      sumWebsite += Number(data[i][6]) || 0;

      let hasComment = (data[i][3] || data[i][5] || data[i][7] || data[i][8]);
      if (hasComment || data[i][2] > 0) {
        comments.push({
          timestamp: data[i][0] || "-",
          songList: data[i][3] || "-",
          place: data[i][5] || "-",
          website: data[i][7] || "-",
          additional: data[i][8] || "-",
          username: data[i][10] || "ไม่ระบุชื่อ"
        });
      }
    }
  }

  if (count === 0) return { avgSongList: "0.0", avgPlace: "0.0", avgWebsite: "0.0", comments: [] };

  return {
    avgSongList: (sumSongList / count).toFixed(1),
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
  
  return {
    songs: allSongs,
    members: memberMap
  };
}