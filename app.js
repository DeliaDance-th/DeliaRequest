// ==========================================
// 1. ตั้งค่าพื้นฐาน (Configuration)
// ==========================================
const apiURL =
  "https://script.google.com/macros/s/AKfycbxTHBDk2j--fcL4tnQo5YH8KRlm0SMvjDK6YqKMhkZPk5GCWOXM8g8xeoeQtxw3ns__zA/exec";

let currentEvents = [];
let currentSongs = [];
let activeEvent = null;
let selectedSongId = null;
let currentViewId = "calendar";
let currentOrigin = "K-Pop";

// ==========================================
// 2. ระบบแปลภาษา (i18n) - ภาษาทางการและสุภาพ
// ==========================================
const translations = {
  th: {
    welcome: "ยินดีต้อนรับสู่ Delia",
    welcome_sub: "ร่วมสนุกกับการขอเพลงและโหวตเพลงใน Random Dance ได้เลยค่ะ 💖",
    google_sub: "เข้าสู่ระบบอย่างปลอดภัยด้วยบัญชี Google ของคุณ",
    welcome_back: "ยินดีต้อนรับกลับค่ะ คุณ",
    slide_login: "เลื่อนเพื่อเข้าสู่ระบบ",
    not_me: "ไม่ใช่ฉัน? (ออกจากระบบ)",
    login: "เข้าสู่ระบบ",
    calendar_title: "Event Calendar",
    calendar_sub:
      "เลือกวันที่บนปฏิทินเพื่อดูรายละเอียด หรือแอดมินคลิกเพื่อสร้างงาน",
    song_req_title: "Song Requests",
    btn_back: "กลับปฏิทิน",
    btn_add_song: "ขอเพลงใหม่",
    btn_manage_pl: "จัด Playlist",
    search_ph: "ค้นหาชื่อเพลง หรือ ศิลปิน...",
    setlist_title: "Setlist Manager",
    btn_back_list: "กลับหน้ารายการ",
    pool: "📦 กองกลาง",
    hide_pool: "ซ่อนกองกลาง",
    show_pool: "แสดงกองกลาง",
    btn_fetch_votes: "ดึงข้อมูลการขอเพลง",
    btn_add_cat: "เพิ่มหมวดหมู่",
    btn_save: "เซฟลง Sheet",
    start_time: "เริ่ม (นาที:วินาที)",
    end_time: "จบ (นาที:วินาที)",
    btn_submit: "ส่งข้อมูล",
    admin_access: "เข้าสู่โหมดผู้ดูแลระบบ",
    logout: "ออกจากระบบ",
    admin_login: "Admin Login",
    admin_sub: "กรุณากรอกชื่อและรหัสผ่านแอดมิน",
    btn_cancel: "ยกเลิก",
    btn_ok: "ตกลง",
    btn_view_songs: "ดูรายการเพลง",
    yt_link: "ลิงก์ Youtube",
    song_name: "ชื่อเพลง",
    artist: "ศิลปิน/ชื่อช่อง",
    gender: "เพศของศิลปิน",
    gender_mix: "รวม/ผสม (Mix)",
    gender_m: "ศิลปินชาย (Boy Group)",
    gender_f: "ศิลปินหญิง (Girl Group)",
    has_breakdance: "เพลงนี้มี Breakdance ใช่ไหม?",
    ex_time: "เช่น 1:30",
    ex_time_end: "เช่น 2:05",
    opt_custom: "อื่นๆ (กำหนดเวลาเอง)",
    edit_song: "แก้ไขข้อมูลเพลง",
    new_user_alert: "ยินดีต้อนรับสมาชิกใหม่!\nกรุณากรอกชื่อผู้ใช้งานของคุณ",
    username_ph: "เช่น YutoJR",
    dance_part: "ท่อนที่ใช้เต้น",
    btn_start: "เริ่มใช้งานเลย!",

    // ฟอร์มประเมิน
    txtFeedbackTitle: "แสดงความคิดเห็นสำหรับงานนี้",
    lblSongList: "1. SONG LIST (รายการเพลงในงาน)",
    lblPlace: "2. PLACE (สถานที่จัดงาน/บรรยากาศ)",
    lblWebsite: "3. WEBSITE REQUEST SONG (ระบบเว็บขอเพลง)",
    lblAdditional: "4. ADDITIONAL COMMENT (ข้อเสนอแนะเพิ่มเติม)",
    fb_comment_ph: "ความคิดเห็นเพิ่มเติม...",
    fb_additional_ph: "พิมพ์ข้อเสนอแนะของคุณที่นี่...",
    txtDontShowToday: "ไม่ต้องแสดงอีกในวันนี้",
    btnSkipFeedback: "ข้าม",
    btnSubmitFeedback: "ส่งความคิดเห็น",
    fbp_title: "งานจบแล้ว! 🎉",
    fbp_msg:
      "ขอบคุณที่มาร่วมสนุกกันนะคะ\nรบกวนเวลาสักนิด ช่วยประเมินงานนี้ให้เราหน่อยน้า 💖",
    go_feedback_form: "ไปหน้ากรอกแบบประเมิน",
    fbp_skip: "ข้าม (ดูรายการเพลงอย่างเดียว)",
    form_submitted: "คุณได้กรอกแบบฟอร์มแล้วค่ะ",

    // แดชบอร์ด
    txtDashboardTitle: "Dashboard สรุป Feedback งานนี้",
    stat_requesters: "ผู้ขอเพลงทั้งหมด",
    stat_responders: "ผู้ตอบแบบประเมิน",
    stat_percent: "คิดเป็นเปอร์เซ็นต์",
    dash_details: "รายละเอียดความคิดเห็น (รายบุคคล)",
    no_feedback: "ยังไม่มีผู้ทำแบบประเมินค่ะ",
    load_error: "เกิดข้อผิดพลาดในการโหลดข้อมูล",

    // ปุ่ม/ป้ายในหน้าต่าง ๆ
    brand_title: "กลับหน้าแรก",
    global_leaderboard: "Global Leaderboard (อันดับรวมภาพรวม) 🌟",
    btn_edit_event: "แก้ไขงาน/ลบงาน",
    btn_close_event: "ปิดงาน",
    btn_add_song_admin: "เพิ่มเพลงใหม่ (Admin)",
    btn_view_feedback_admin: "ดู Feedback งานนี้",
    shuffle_mf: "สุ่ม (M/F)",
    add_category_title: "เพิ่มหมวดหมู่ใหม่",
    filter_all: "ทั้งหมด",
    filter_bd: "Dance Break ⚡",
    tab_all: "🎵 เพลงทั้งหมด",
    tab_mine: "👤 เพลงของฉัน",
    tab_voted: "💖 ที่ฉันโหวต",
    status_open: "เปิดรับขอเพลง",
    status_closed: "ปิดรับแล้ว",
    err_loading: "โหลดข้อมูลไม่สำเร็จ",
    no_songs: "ยังไม่มีเพลงในระบบค่ะ มาเสนอเพลงกันเถอะ! 🎵",
    time_unspecified: "ยังไม่ระบุเวลา",
    has_dance_break: "มี Dance Break ⚡",
    no_dance_break: "ไม่มี Dance Break",

    // รายละเอียดเพลง
    det_category: "หมวดหมู่",
    det_dance: "ท่อนเต้น",
    det_votes: "คะแนนโหวต",
    det_listen: "ฟังเพลง",
    det_share: "คัดลอกลิงก์แชร์",
    btn_approve: "อนุมัติ",
    btn_played: "เล่นแล้ว",
    btn_delete: "ลบ",

    // สร้าง/แก้ไขงาน
    ev_create_title: "สร้างงานใหม่",
    ev_edit_title: "แก้ไขงาน",
    ev_date: "วันที่จัดงาน",
    ev_name: "ชื่องาน",
    ev_location: "สถานที่",
    ev_open: "เวลาเปิดรับ",
    ev_close: "เวลาปิดรับ",
    ev_details: "รายละเอียด",
    ev_quota: "จำกัดจำนวนเพลง (ต่อคน)",
    ev_create_btn: "สร้างกำหนดการ",
    ev_save_btn: "บันทึกการแก้ไข",
    ev_delete_btn: "ลบกำหนดการ",
    upcoming_badge: "งานถัดไปที่กำลังจะมาถึง",
    upcoming_action: "ดูรายละเอียด / ขอเพลง",

    // เพลงซ้ำ
    dup_title: "พบเพลงนี้ในระบบแล้ว!",
    dup_msg:
      "เพลงนี้มีเพื่อนๆ ขอเข้ามาแล้วค่ะ แทนที่จะสร้างซ้ำ มาร่วมกดโหวตให้เพลงนี้กันเถอะ! 💖",
    dup_vote: "โหวตให้เพลงนี้ทันที (+1)",

    // Leaderboard
    leaderboard_title: "Top 5 Active Requesters",
    leaderboard_sub: "ตารางอันดับผู้ใช้งานที่มีส่วนร่วมสูงสุดในงานนี้ 🌟",
    lb_global_title: "Global Top 5 Active Requesters",
    lb_global_sub: "ตารางอันดับผู้ที่มีส่วนร่วมสูงสุดทุกอีเวนต์ตลอดกาล 🌟",
    lb_col_user: "ผู้ใช้งาน",
    lb_col_req: "ขอเพลง",
    lb_col_vote: "โหวต",
    lb_col_received: "โหวตรวมที่ได้รับ",
    lb_col_score: "คะแนนรวม",
    lb_loading: "กำลังโหลดข้อมูลอันดับ...",
    lb_global_loading: "กำลังโหลดอันดับภาพรวม...",
    lb_loading_me: "กำลังโหลดข้อมูลของคุณ...",
    lb_empty: "ยังไม่มีข้อมูลการขอเพลงในขณะนี้",
    lb_load_fail: "ไม่สามารถโหลดข้อมูลได้",
    lb_no_rank: "ยังไม่มีอันดับของคุณในขณะนี้",
    lb_admin_note1: "👑 <strong>แอดมินไม่นับนะจ๊ะ</strong> (มาคุมงานเฉยๆ)",
    lb_admin_note2:
      "👑 <strong>แอดมินไม่นับนะจ๊ะ</strong> (ยินดีต้อนรับผู้ดูแลระบบสุดน่ารัก)",
    lb_you: "(คุณ ✨)",
    lb_my_rank:
      "🎯 อันดับปัจจุบันของคุณ: <strong>#{rank}</strong> ({name} - คะแนนรวม: {score} แต้ม)",
    lb_not_listed:
      "💡 คุณยังไม่มีรายชื่อใน Leaderboard ลองขอเพลงหรือกดโหวตเพิ่มเลย!",

    // ตรวจเพศ/ประเภทเพลงจากฐานข้อมูล
    origin_label: "ประเภท",
    detect_btn: "ตรวจประเภทอัตโนมัติ",
    detect_checking: "กำลังตรวจสอบจากฐานข้อมูล...",
    detect_found: "ตรวจพบในฐานข้อมูล: {name}",
    detect_found_plain: "ตรวจพบจากฐานข้อมูล",
    detect_ambiguous: "พบหลายศิลปินในชื่อเดียวกัน โปรดตรวจสอบ",
    detect_origin_only:
      "ทราบแค่ประเภท ({origin}) แต่ไม่ทราบว่าเป็นวงชาย/หญิง กรุณาเลือกเพศเอง",
    detect_unknown: "ไม่พบศิลปินนี้ในฐานข้อมูล กรุณาเลือกเพศและประเภทเอง",
    detect_info_failed:
      "ดึงชื่อเพลงจากลิงก์ไม่ได้ กรุณากรอกชื่อเพลงและศิลปินเอง แล้วกดปุ่มตรวจประเภท",
    detect_touched: "เลือกโดยคุณ (ระบบจะไม่เขียนทับ)",
    btn_type_fix: "ตรวจประเภทเพลง",
    type_fix_title: "ตรวจเพศ/ประเภทเพลงด้วยฐานข้อมูล",
    type_fix_hint:
      "ระบบเทียบเพลงของงานนี้กับฐานข้อมูลศิลปิน เลือกรายการที่ต้องการแก้ แล้วกดใช้ (ยังไม่แก้อะไรจนกว่าคุณจะกด)",
    type_fix_none: "ไม่พบรายการที่ต้องแก้ 👍",
    type_fix_apply: "ใช้ที่เลือก",
    type_fix_all: "เลือกทั้งหมด",
    type_fix_clear: "ไม่เลือกเลย",
    type_fix_applied: "แก้เพศ/ประเภทแล้ว {n} เพลง",
    btn_save_artist: "บันทึกศิลปินนี้เข้าฐานข้อมูล",
    artist_prompt: "ชื่อศิลปิน/วง (พิมพ์ชื่อภาษาอังกฤษ ตามด้วยชื่อภาษาอื่นได้)",
    artist_saved: "บันทึก \"{name}\" ({gender} / {origin}) เข้าฐานข้อมูลแล้ว",
    artist_updated: "อัปเดต \"{name}\" ({gender} / {origin}) ในฐานข้อมูลแล้ว",
    time_invalid: "รูปแบบเวลาไม่ถูกต้อง พิมพ์เป็น นาที:วินาที เช่น 1:42",
    time_order: "เวลาจบต้องมากกว่าเวลาเริ่ม",
    quota_left: "ขอเพลงได้อีก {left}/{max}",
    quota_none: "โควตาเต็ม {max}/{max}",
    dup_by_video: "เพลงนี้มีคนขอไว้แล้ว",
    btn_dup_merge: "รวมเพลงซ้ำ",
    dup_tool_title: "รวมเพลงซ้ำ",
    dup_tool_hint: "เพลงที่เป็นวิดีโอเดียวกัน (แม้ลิงก์คนละรูปแบบ) หรือชื่อเหมือนกัน เลือกเพลงที่จะเก็บไว้ในแต่ละกลุ่ม โหวตของเพลงที่ถูกรวมจะย้ายมาให้ แล้วลบแถวที่ซ้ำ",
    dup_tool_none: "ไม่พบเพลงซ้ำ",
    dup_tool_apply: "รวมที่เลือก",
    dup_group: "กลุ่มที่ {n}",
    dup_merge_confirm_title: "รวมเพลงซ้ำ?",
    dup_merge_confirm_msg: "จะรวม {groups} กลุ่ม และลบแถวที่ซ้ำ {rows} แถว (ย้อนกลับไม่ได้) ลิสต์ที่จัดไว้จะชี้มาที่เพลงที่เก็บไว้ให้",
    dup_merged: "รวมเพลงซ้ำแล้ว {n} กลุ่ม",
    tie_badge: "เสมอ ×{n}",
    tie_tip: "คะแนนเท่ากับอีก {m} เพลง เรียงตามใครขอก่อน",
    discover_title: "เพลงที่เพื่อน ๆ ขอไว้ · ลากดูได้ กดหัวใจเพื่อโหวต",
    discover_vote: "โหวต",
    discover_voted: "โหวตแล้ว",
    gender_conflict_title: "เพศไม่ตรงกับฐานข้อมูล",
    gender_conflict_msg: "ฐานข้อมูลระบุว่า \"{name}\" เป็น {db} แต่คุณเลือก {chosen} ต้องการบันทึกตามที่เลือกใช่ไหม",
    type_conflict_msg: "ฐานข้อมูลระบุว่า \"{name}\" เป็นประเภท {db} แต่คุณเลือก {chosen} ต้องการบันทึกตามที่เลือกใช่ไหม",
    learn_title: "บันทึกศิลปินเข้าฐานข้อมูล?",
    learn_msg: "ฐานข้อมูลยังไม่รู้จัก หรือข้อมูลต่างจากที่คุณเลือก ({gender} / {origin}) ต้องการบันทึกศิลปินนี้เพื่อให้ระบบจำไว้ไหม",

    // ย่อ/ขยายลิสต์
    collapse_all: "ย่อทุกลิสต์",
    expand_all: "ขยายทุกลิสต์",
    toggle_list: "ย่อ/ขยายลิสต์นี้",
    drop_here: "วางเพลงที่นี่",

    // จัดลิสต์อัตโนมัติ / สุ่ม / อันดับของฉัน
    btn_pl_auto: "จัดลิสต์อัตโนมัติ",
    shuffle_pool: "สุ่มทั้งหมด",
    pool_shuffled: "สุ่มลำดับเพลงในกองกลางแล้วค่ะ",
    shuffle_need_2: "ต้องมีเพลงในกองกลางอย่างน้อย 2 เพลงค่ะ",
    auto_title: "จัดลิสต์อัตโนมัติ",
    auto_hint:
      "พิมพ์ชื่อลิสต์ที่ต้องการ แล้วระบบจะสร้างลิสต์และดึงเพลงที่เหมาะสมมาใส่ให้เอง",
    auto_names_label: "ชื่อลิสต์ที่ต้องการ (คั่นด้วยเว้นวรรคหรือ ,)",
    auto_add: "เพิ่มเร็ว:",
    auto_max_label: "จำนวนเพลงสูงสุดต่อลิสต์ (เว้นว่าง = แบ่งเท่า ๆ กัน)",
    auto_alt: "สลับชาย/หญิงในแต่ละลิสต์",
    auto_rules:
      "• Kpop / Tpop / Jpop = เพลงตามประเภท\n• BreakDance = เพลงที่ติ๊กว่ามี Dance Break\n• MixSong = เพลงของวงผสม\n• เลขท้ายชื่อ (Kpop1 Kpop2) = แบ่งเพลงประเภทเดียวกันให้เท่า ๆ กัน เรียงตามโหวต\n• เพลงที่ไม่เข้าลิสต์ใดจะอยู่ในกองกลาง",
    auto_run: "จัดลิสต์เลย",
    auto_need_names: "กรุณาพิมพ์ชื่อลิสต์อย่างน้อย 1 ลิสต์ค่ะ",
    auto_confirm_title: "จัดลิสต์ใหม่ทั้งกระดาน?",
    auto_confirm_msg:
      "ลิสต์ที่จัดไว้บนกระดานตอนนี้จะถูกแทนที่ (ยังไม่บันทึกจนกว่าจะกดเซฟ ทำสำเนาสำรองไว้ก่อนได้)",
    auto_done: "จัดลิสต์เรียบร้อย: {summary} · เหลือในกองกลาง {left} เพลง",
    auto_unknown:
      "ไม่รู้จักประเภทของ {names} จึงใส่เพลงที่เหลือให้ (ตั้งชื่อ Kpop/Tpop/Jpop/BreakDance/MixSong เพื่อเลือกประเภท)",
    lb_congrats: "🎉 ยินดีด้วย! คุณติด Top 3 {medal}",
    lb_gap: "อีก {n} แต้มจะแซงอันดับ #{rank}",
    lb_login_to_rank: "เข้าสู่ระบบเพื่อดูอันดับของคุณ",

    // กู้คืน / สำรองลิสต์
    btn_pl_restore: "กู้คืนลิสต์",
    btn_pl_backup: "สำรองลิสต์",
    btn_pl_csv: "ดาวน์โหลด CSV",
    restore_title: "กู้คืนลิสต์เพลง",
    restore_hint:
      "เลือกลิสต์ที่เคยบันทึกไว้เพื่อโหลดกลับมาที่กระดาน ลิสต์จะยังไม่ถูกบันทึกทับจนกว่าคุณจะกดเซฟ",
    restore_none: "ยังไม่มีลิสต์ที่เคยบันทึกไว้สำหรับงานนี้",
    restore_kind_main_current: "ลิสต์หลัก (วันที่ปัจจุบัน)",
    restore_kind_main_other: "ลิสต์หลัก (บันทึกไว้ตอนวันที่ {date})",
    restore_kind_backup: "สำเนาสำรอง: {label}",
    restore_count: "{n} เพลง",
    restore_load: "โหลด",
    restore_confirm_title: "โหลดลิสต์นี้?",
    restore_confirm_msg:
      "กระดานปัจจุบันจะถูกแทนที่ด้วยลิสต์ที่เลือก (ยังไม่บันทึกจนกว่าจะกดเซฟ)",
    restore_done: "โหลดลิสต์เรียบร้อยค่ะ อย่าลืมกดเซฟถ้าต้องการใช้ลิสต์นี้",
    restore_found:
      "พบลิสต์ที่เคยบันทึกไว้ตอนวันที่อื่นของงานนี้ กดปุ่ม 'กู้คืนลิสต์' เพื่อโหลดกลับมา",
    need_deploy: "ฟังก์ชันนี้ต้องอัปเดต Apps Script (Code.gs) ก่อน",
    merged_new: "เพิ่มเพลงที่ขอเข้ามาใหม่ {n} เพลงเข้ากองกลางแล้ว",
    backup_label_title: "ตั้งชื่อสำเนาสำรอง",
    backup_empty: "ยังไม่มีเพลงในกระดานให้สำรองค่ะ",
    backup_saved: "สร้างสำเนาสำรองแล้ว ดูได้ในชีตชื่อ \"{name}\"",
    csv_done: "ดาวน์โหลดไฟล์ CSV แล้วค่ะ",

    // Toast / กล่องยืนยัน
    toast_notice: "แจ้งเตือน",
    toast_error: "ข้อผิดพลาด",
    toast_success: "สำเร็จ",
    toast_network: "เครือข่ายขัดข้อง",
    toast_network_msg: "สัญญาณอินเทอร์เน็ตอาจไม่เสถียร ลองใหม่อีกครั้งนะคะ",
    msg_checking_account: "กำลังตรวจสอบบัญชี...",
    msg_enter_username: "กรุณากรอกชื่อผู้ใช้งานก่อนค่ะ",
    msg_saving: "กำลังบันทึก...",
    msg_sending: "กำลังส่ง...",
    msg_logging_in: "กำลังเข้าสู่ระบบค่ะ...",
    session_expired: "เซสชันหมดอายุ",
    session_expired_msg: "ไม่พบข้อมูลบัญชี กรุณาล็อกอินด้วย Google ใหม่ค่ะ",
    logout_done: "ออกจากระบบเรียบร้อยค่ะ",
    msg_fill_all: "กรุณากรอกข้อมูลให้ครบค่ะ",
    login_failed: "เข้าสู่ระบบล้มเหลว",
    close_event_title: "ประกาศจบงาน",
    close_event_msg:
      "ระบบจะเปลี่ยนสถานะเป็น 'จบแล้ว' (Closed) และเปิดหน้าฟอร์มประเมินทันที ยืนยันหรือไม่?",
    close_event_done: "ประกาศจบงานเรียบร้อยค่ะ",
    confirm_skip_title: "ยืนยันการข้าม",
    confirm_skip_msg: "แน่ใจหรือไม่ว่าต้องการข้ามการประเมิน?",
    event_over_no_vote: "งานถูกจัดไปแล้ว ไม่สามารถโหวตเพิ่มได้ค่ะ",
    cant_vote_own: "ไม่สามารถโหวตเพลงของตนเองได้ค่ะ",
    copied_title: "คัดลอกสำเร็จ",
    copied_msg: "คัดลอกลิงก์เรียบร้อยแล้วค่ะ",
    verify_ok: "ตรวจสอบข้อมูลสำเร็จ",
    quota_full: "โควตาเต็ม",
    quota_full_msg: "คุณขอเพลงครบโควตา {n} เพลงแล้วค่ะ",
    enter_song_name: "กรุณากรอกชื่อเพลงค่ะ",
    already_voted: "คุณได้โหวตเพลงนี้ไปแล้วค่ะ",
    you_are_creator: "คุณเป็นผู้เสนอเพลงนี้ค่ะ",
    vote_added: "เพิ่มโหวตให้เพลงที่มีอยู่แล้วเรียบร้อยค่ะ! 💖",
    song_added: "เพิ่มเพลงเรียบร้อยค่ะ",
    song_updated: "อัปเดตข้อมูลสำเร็จ",
    status_updated: "อัปเดตสถานะเรียบร้อย",
    delete_song_title: "ลบเพลง",
    delete_song_msg: "ต้องการลบเพลงนี้ออกจากระบบใช่หรือไม่?",
    song_deleted: "ลบเพลงเรียบร้อยค่ะ",
    category_name: "ชื่อหมวดหมู่",
    category_rename: "เปลี่ยนชื่อหมวดหมู่",
    category_drag_hint: "กดค้าง 2 วินาทีเพื่อย้ายตำแหน่งหมวดหมู่",
    confirm_delete: "ยืนยันการลบ",
    delete_cat_msg: "เพลงในหมวดนี้จะถูกย้ายกลับไปกองกลางทั้งหมด ยืนยันหรือไม่?",
    refetch_title: "ดึงข้อมูลใหม่",
    refetch_msg: "เพลงทั้งหมดจะถูกย้ายกลับไปกองกลาง ยืนยันหรือไม่?",
    refetch_done: "ดึงข้อมูลเพลงกลับกองกลางเรียบร้อยค่ะ",
    need_3_songs: "ต้องการเพลงในกองกลางอย่างน้อย 3 เพลงค่ะ",
    ai_sorted: "จัดเรียงคิวเพลงสลับชายหญิงเรียบร้อยค่ะ",
    playlist_saved: "บันทึกเพลย์ลิสต์เรียบร้อยค่ะ",
    msg_fill_required: "กรุณากรอกข้อมูลให้ครบถ้วนค่ะ",
    event_created: "สร้างกำหนดการเรียบร้อยค่ะ",
    msg_fill_date_name: "กรุณากรอกวันที่และชื่องานให้ครบถ้วนค่ะ",
    event_updated: "แก้ไขข้อมูลและวันจัดงานเรียบร้อยค่ะ",
    delete_event_title: "ลบกำหนดการ",
    delete_event_msg: "คุณต้องการลบงานนี้ใช่หรือไม่?",
    event_deleted: "ลบกำหนดการเรียบร้อยค่ะ",
    feedback_thanks: "ส่งความคิดเห็นเรียบร้อยแล้วค่ะ ขอบคุณนะคะ! 💖",
    event_not_found: "ไม่พบข้อมูลงาน กรุณาเลือกงานก่อนค่ะ",
    lang_changed_title: "เปลี่ยนภาษา",
    lang_changed_msg: "เปลี่ยนเป็นภาษาไทยเรียบร้อยค่ะ 🇹🇭",
  },
  en: {
    welcome: "Welcome to Delia",
    welcome_sub:
      "Join us in requesting and voting for songs in Random Dance! 💖",
    google_sub: "Sign in securely with your Google account",
    welcome_back: "Welcome back, ",
    slide_login: "Slide to Login",
    not_me: "Not you? (Logout)",
    login: "Login",
    calendar_title: "Event Calendar",
    calendar_sub:
      "Select a date to view details, or admin click to create an event.",
    song_req_title: "Song Requests",
    btn_back: "Back to Calendar",
    btn_add_song: "Request Song",
    btn_manage_pl: "Manage Playlist",
    search_ph: "Search song or artist...",
    setlist_title: "Setlist Manager",
    btn_back_list: "Back to Requests",
    pool: "📦 Pool",
    hide_pool: "Hide Pool",
    show_pool: "Show Pool",
    btn_fetch_votes: "Fetch Requests",
    btn_add_cat: "Add Category",
    btn_save: "Save to Sheet",
    start_time: "Start (Min:Sec)",
    end_time: "End (Min:Sec)",
    btn_submit: "Submit",
    admin_access: "Admin Access",
    logout: "Logout",
    admin_login: "Admin Login",
    admin_sub: "Enter admin username and password",
    btn_cancel: "Cancel",
    btn_ok: "OK",
    btn_view_songs: "View Songs",
    yt_link: "YouTube Link",
    song_name: "Song Name",
    artist: "Artist/Channel",
    gender: "Artist Gender",
    gender_mix: "Mixed Group",
    gender_m: "Boy Group",
    gender_f: "Girl Group",
    has_breakdance: "Has Breakdance?",
    ex_time: "e.g., 1:30",
    ex_time_end: "e.g., 2:05",
    opt_custom: "Other (custom time)",
    edit_song: "Edit Song Info",
    new_user_alert: "Welcome New Member!\nPlease enter your username",
    username_ph: "e.g., YutoJR",
    dance_part: "Dance Part",
    btn_start: "Let's Go!",

    // Feedback form
    txtFeedbackTitle: "Event Feedback Form",
    lblSongList: "1. SONG LIST",
    lblPlace: "2. PLACE",
    lblWebsite: "3. WEBSITE REQUEST SONG",
    lblAdditional: "4. ADDITIONAL COMMENT",
    fb_comment_ph: "Additional comments...",
    fb_additional_ph: "Type your suggestions here...",
    txtDontShowToday: "Don't show again today",
    btnSkipFeedback: "Skip",
    btnSubmitFeedback: "Submit Feedback",
    fbp_title: "The event has ended! 🎉",
    fbp_msg:
      "Thanks for joining the fun!\nPlease take a moment to rate this event 💖",
    go_feedback_form: "Go to feedback form",
    fbp_skip: "Skip (just view the songs)",
    form_submitted: "You have already submitted the form.",

    // Dashboard
    txtDashboardTitle: "Event Feedback Dashboard Summary",
    stat_requesters: "Total Requesters",
    stat_responders: "Respondents",
    stat_percent: "Response Rate",
    dash_details: "Feedback Details (Individual)",
    no_feedback: "No feedback submitted yet.",
    load_error: "Failed to load data.",

    // Buttons / labels
    brand_title: "Back to home",
    global_leaderboard: "Global Leaderboard 🌟",
    btn_edit_event: "Edit / Delete Event",
    btn_close_event: "Close Event",
    btn_add_song_admin: "Add New Song (Admin)",
    btn_view_feedback_admin: "View Event Feedback",
    shuffle_mf: "Shuffle (M/F)",
    add_category_title: "Add new category",
    filter_all: "All",
    filter_bd: "Dance Break ⚡",
    tab_all: "🎵 All Songs",
    tab_mine: "👤 My Songs",
    tab_voted: "💖 Voted",
    status_open: "Open",
    status_closed: "Closed",
    err_loading: "Error loading",
    no_songs: "No songs yet. Be the first to request one! 🎵",
    time_unspecified: "No time specified",
    has_dance_break: "Has Dance Break ⚡",
    no_dance_break: "No Dance Break",

    // Song detail
    det_category: "Category",
    det_dance: "Dance Part",
    det_votes: "Votes",
    det_listen: "Listen",
    det_share: "Copy share link",
    btn_approve: "Approve",
    btn_played: "Played",
    btn_delete: "Delete",

    // Create / edit event
    ev_create_title: "Create New Event",
    ev_edit_title: "Edit Event",
    ev_date: "Event Date",
    ev_name: "Event Name",
    ev_location: "Location",
    ev_open: "Opens At",
    ev_close: "Closes At",
    ev_details: "Details",
    ev_quota: "Song limit (per person)",
    ev_create_btn: "Create Event",
    ev_save_btn: "Save Changes",
    ev_delete_btn: "Delete Event",
    upcoming_badge: "Upcoming Event",
    upcoming_action: "View Details",

    // Duplicate song
    dup_title: "This song already exists!",
    dup_msg:
      "Others have already requested this song. Instead of creating a duplicate, add your vote! 💖",
    dup_vote: "Vote for this song now (+1)",

    // Leaderboard
    leaderboard_title: "Top 5 Active Requesters",
    leaderboard_sub: "Top active users in this event 🌟",
    lb_global_title: "Global Top 5 Active Requesters",
    lb_global_sub: "Top active users across all events, all time 🌟",
    lb_col_user: "User",
    lb_col_req: "Requests",
    lb_col_vote: "Votes",
    lb_col_received: "Votes Received",
    lb_col_score: "Total Score",
    lb_loading: "Loading leaderboard...",
    lb_global_loading: "Loading global ranking...",
    lb_loading_me: "Loading your rank...",
    lb_empty: "No song requests yet.",
    lb_load_fail: "Unable to load data.",
    lb_no_rank: "You are not ranked yet.",
    lb_admin_note1: "👑 <strong>Admins are not ranked</strong> (just here to supervise)",
    lb_admin_note2:
      "👑 <strong>Admins are not ranked</strong> (welcome, dear admin!)",
    lb_you: "(You ✨)",
    lb_my_rank:
      "🎯 Your current rank: <strong>#{rank}</strong> ({name} - Total score: {score} pts)",
    lb_not_listed:
      "💡 You're not on the leaderboard yet. Try requesting or voting for a song!",

    // Song gender / origin detection
    origin_label: "Type",
    detect_btn: "Auto-detect type",
    detect_checking: "Checking the artist database...",
    detect_found: "Found in database: {name}",
    detect_found_plain: "Detected from the database",
    detect_ambiguous: "Several artists match, please double-check",
    detect_origin_only:
      "Only the type ({origin}) is known, not whether it is a boy or girl group. Please pick the gender.",
    detect_unknown: "Artist not found in the database. Please choose gender and type yourself.",
    detect_info_failed:
      "Couldn't read the song info from the link. Type the song and artist yourself, then press Auto-detect.",
    detect_touched: "Chosen by you (won't be overwritten)",
    btn_type_fix: "Check song types",
    type_fix_title: "Check song gender/type against the database",
    type_fix_hint:
      "Songs of this event are compared with the artist database. Tick the ones to fix, then apply (nothing changes until you do).",
    type_fix_none: "Nothing to fix 👍",
    type_fix_apply: "Apply selected",
    type_fix_all: "Select all",
    type_fix_clear: "Select none",
    type_fix_applied: "Fixed gender/type of {n} song(s)",
    btn_save_artist: "Save this artist to the database",
    artist_prompt: "Artist / group name (English name, optionally followed by other-language names)",
    artist_saved: "Saved \"{name}\" ({gender} / {origin}) to the database",
    artist_updated: "Updated \"{name}\" ({gender} / {origin}) in the database",
    time_invalid: "Invalid time. Use minutes:seconds, e.g. 1:42",
    time_order: "End time must be after the start time",
    quota_left: "{left}/{max} requests left",
    quota_none: "Quota full {max}/{max}",
    dup_by_video: "This song was already requested",
    btn_dup_merge: "Merge duplicates",
    dup_tool_title: "Merge duplicate songs",
    dup_tool_hint: "Songs with the same video (even with different link formats) or the same title. Pick the one to keep in each group; votes from merged songs move over and the duplicate rows are deleted.",
    dup_tool_none: "No duplicates found",
    dup_tool_apply: "Merge selected",
    dup_group: "Group {n}",
    dup_merge_confirm_title: "Merge duplicates?",
    dup_merge_confirm_msg: "This merges {groups} group(s) and deletes {rows} duplicate row(s) (cannot be undone). Saved setlists will point to the kept song.",
    dup_merged: "Merged {n} group(s)",
    tie_badge: "Tie ×{n}",
    tie_tip: "Same votes as {m} other song(s) — ordered by who requested first",
    discover_title: "Songs your friends requested · drag to browse, tap the heart to vote",
    discover_vote: "Vote",
    discover_voted: "Voted",
    gender_conflict_title: "Differs from the database",
    gender_conflict_msg: "The database lists \"{name}\" as {db}, but you chose {chosen}. Save with your choice anyway?",
    type_conflict_msg: "The database lists \"{name}\" as type {db}, but you chose {chosen}. Save with your choice anyway?",
    learn_title: "Save artist to the database?",
    learn_msg: "The database doesn't know this artist, or differs from your choice ({gender} / {origin}). Save it so the system remembers?",

    // Collapse / expand lists
    collapse_all: "Collapse all",
    expand_all: "Expand all",
    toggle_list: "Collapse / expand this list",
    drop_here: "Drop song here",

    // Auto setlist / shuffle / my rank
    btn_pl_auto: "Auto-arrange",
    shuffle_pool: "Shuffle all",
    pool_shuffled: "Pool songs shuffled.",
    shuffle_need_2: "You need at least 2 songs in the pool.",
    auto_title: "Auto-arrange setlist",
    auto_hint:
      "Type the lists you need and the system will create them and fill each one with matching songs.",
    auto_names_label: "Lists you need (separated by spaces or commas)",
    auto_add: "Quick add:",
    auto_max_label: "Max songs per list (blank = split evenly)",
    auto_alt: "Alternate boy/girl groups in each list",
    auto_rules:
      "• Kpop / Tpop / Jpop = songs of that origin\n• BreakDance = songs flagged with a Dance Break\n• MixSong = mixed-gender groups\n• A number suffix (Kpop1 Kpop2) = songs of the same type are split evenly, by votes\n• Songs that fit no list stay in the pool",
    auto_run: "Arrange now",
    auto_need_names: "Please type at least one list name.",
    auto_confirm_title: "Rebuild the whole board?",
    auto_confirm_msg:
      "The lists currently on the board will be replaced (nothing is saved until you press Save; you can make a backup copy first).",
    auto_done: "Done: {summary} · {left} left in the pool",
    auto_unknown:
      "Didn't recognise the type of {names}, so they get the leftover songs (name lists Kpop/Tpop/Jpop/BreakDance/MixSong to pick a type).",
    lb_congrats: "🎉 Congratulations! You're in the Top 3 {medal}",
    lb_gap: "{n} more points to pass #{rank}",
    lb_login_to_rank: "Log in to see your rank",

    // Restore / backup
    btn_pl_restore: "Restore",
    btn_pl_backup: "Backup copy",
    btn_pl_csv: "Download CSV",
    restore_title: "Restore playlist",
    restore_hint:
      "Pick a saved list to load back onto the board. Nothing is overwritten until you press Save.",
    restore_none: "No saved playlists for this event yet.",
    restore_kind_main_current: "Main list (current date)",
    restore_kind_main_other: "Main list (saved under date {date})",
    restore_kind_backup: "Backup: {label}",
    restore_count: "{n} songs",
    restore_load: "Load",
    restore_confirm_title: "Load this list?",
    restore_confirm_msg:
      "The current board will be replaced by the selected list (not saved until you press Save).",
    restore_done: "List loaded. Press Save if you want to keep it.",
    restore_found:
      "Found a list saved under a different date for this event. Press 'Restore' to load it.",
    need_deploy: "This feature needs the updated Apps Script (Code.gs).",
    merged_new: "{n} newly requested song(s) added to the pool.",
    backup_label_title: "Name this backup",
    backup_empty: "There are no songs on the board to back up.",
    backup_saved: "Backup created in sheet \"{name}\"",
    csv_done: "CSV downloaded.",

    // Toasts / confirm dialogs
    toast_notice: "Notice",
    toast_error: "Error",
    toast_success: "Success",
    toast_network: "Network Error",
    toast_network_msg: "Your connection may be unstable. Please try again.",
    msg_checking_account: "Verifying your account...",
    msg_enter_username: "Please enter a username first.",
    msg_saving: "Saving...",
    msg_sending: "Sending...",
    msg_logging_in: "Logging in...",
    session_expired: "Session expired",
    session_expired_msg: "Account not found. Please sign in with Google again.",
    logout_done: "You have been logged out.",
    msg_fill_all: "Please fill in all fields.",
    login_failed: "Login failed",
    close_event_title: "Close Event",
    close_event_msg:
      "The event will be marked as Closed and the feedback form will open immediately. Continue?",
    close_event_done: "Event closed.",
    confirm_skip_title: "Confirm Skip",
    confirm_skip_msg: "Are you sure you want to skip the feedback?",
    event_over_no_vote: "This event has ended. Voting is closed.",
    cant_vote_own: "You can't vote for your own song.",
    copied_title: "Copied",
    copied_msg: "Link copied to clipboard.",
    verify_ok: "Song info verified.",
    quota_full: "Quota reached",
    quota_full_msg: "You've reached your limit of {n} song requests.",
    enter_song_name: "Please enter a song name.",
    already_voted: "You have already voted for this song.",
    you_are_creator: "You requested this song.",
    vote_added: "Your vote has been added to the existing song! 💖",
    song_added: "Song added.",
    song_updated: "Song updated.",
    status_updated: "Status updated.",
    delete_song_title: "Delete Song",
    delete_song_msg: "Delete this song from the system?",
    song_deleted: "Song deleted.",
    category_name: "Category name",
    category_rename: "Rename category",
    category_drag_hint: "Press and hold for 2 seconds to reorder",
    confirm_delete: "Confirm Delete",
    delete_cat_msg:
      "All songs in this category will be moved back to the pool. Continue?",
    refetch_title: "Re-fetch Requests",
    refetch_msg: "All songs will be moved back to the pool. Continue?",
    refetch_done: "Songs moved back to the pool.",
    need_3_songs: "You need at least 3 songs in the pool.",
    ai_sorted: "Songs arranged alternating by gender.",
    playlist_saved: "Playlist saved.",
    msg_fill_required: "Please fill in all required fields.",
    event_created: "Event created.",
    msg_fill_date_name: "Please enter the event date and name.",
    event_updated: "Event updated.",
    delete_event_title: "Delete Event",
    delete_event_msg: "Do you want to delete this event?",
    event_deleted: "Event deleted.",
    feedback_thanks: "Thank you for your feedback! 💖",
    event_not_found: "Event not found. Please select an event first.",
    lang_changed_title: "Language Changed",
    lang_changed_msg: "Switched to English successfully 🇬🇧",
  },
};

let currentLang = localStorage.getItem("delia_lang") || "th";
if (!translations[currentLang]) currentLang = "th";

// ดึงข้อความตามภาษาปัจจุบัน รองรับตัวแปรแบบ {name}
// ถ้าไม่มีคีย์ในภาษานั้น จะ fallback เป็นภาษาไทย แล้วค่อยเป็นชื่อคีย์
function t(key, vars) {
  let text = translations[currentLang]?.[key] ?? translations.th[key] ?? key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      text = text.split(`{${k}}`).join(vars[k]);
    });
  }
  return text;
}

// แปลงข้อความจากผู้ใช้ให้ปลอดภัยก่อนใส่ลงใน innerHTML (กัน XSS)
function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
}

// ลิงก์ที่อนุญาตให้ใส่ใน href: เฉพาะ http(s) (กัน javascript: URL)
function safeUrl(url) {
  const u = String(url ?? "").trim();
  return /^https?:\/\//i.test(u) ? u : "";
}

function setLanguage(lang) {
  if (!translations[lang]) lang = "th";
  currentLang = lang;
  localStorage.setItem("delia_lang", lang);

  // 1. ภาษาของเอกสาร + ปุ่มสลับภาษาบน Navbar (ทำที่นี่ที่เดียว ทุกเส้นทางที่เปลี่ยนภาษาจึงถูกต้อง)
  document.documentElement.lang = lang;
  const langTextEl = document.getElementById("current-lang-text");
  if (langTextEl) langTextEl.innerText = lang.toUpperCase();

  // 2. ข้อความคงที่ใน HTML
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang][key] !== undefined) {
      el.innerText = translations[lang][key];
    }
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const key = el.getAttribute("data-i18n-ph");
    if (translations[lang][key] !== undefined) {
      el.placeholder = translations[lang][key];
    }
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (translations[lang][key] !== undefined) {
      el.title = translations[lang][key];
    }
  });

  document
    .querySelectorAll(".lang-label")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(`.${lang}-label`)
    .forEach((el) => el.classList.add("active"));

  if (typeof renderGoogleButton === "function") {
    renderGoogleButton(lang);
  }

  // 3. ส่วนที่สร้างด้วย JS ต้องวาดใหม่
  renderCalendarDays();
  if (currentEvents.length > 0) {
    renderCalendar();
    renderUpcomingEvent();
  }
  refreshDynamicTexts();
  refreshDatePickerLocale();
}

// อัปเดตข้อความที่ถูกสร้าง/แก้ด้วย JS (ชื่อหัวข้อ สถานะงาน รายการเพลง ฯลฯ)
function refreshDynamicTexts() {
  // ชื่องานจริงต้องไม่ถูกแทนด้วยคำแปลคงที่
  if (activeEvent) {
    const viewTitle = document.getElementById("view-event-title");
    if (viewTitle) viewTitle.innerText = activeEvent.name;
    const plTitle = document.getElementById("playlist-event-title");
    if (plTitle) plTitle.innerText = `${t("setlist_title")}: ${activeEvent.name}`;
    renderEventStatus();
  }

  const poolText = document.getElementById("toggle-sidebar-text");
  if (poolText) poolText.innerText = t(isPoolOpen ? "hide_pool" : "show_pool");

  document
    .querySelectorAll(".dynamic-category .list-col-header")
    .forEach((h) => (h.title = t("category_drag_hint")));
  document
    .querySelectorAll(".dynamic-category .list-toggle")
    .forEach((b) => (b.title = t("toggle_list")));
  document
    .querySelectorAll(".dynamic-category .drop-zone")
    .forEach((z) => z.setAttribute("data-drop-hint", t("drop_here")));
  updateCollapseAllButton();

  // วาดรายการเพลงใหม่ (ข้อความ "ยังไม่ระบุเวลา" ฯลฯ)
  if (currentSongs.length > 0 && currentViewId === "songs") filterSongs();
}

function renderEventStatus() {
  const statusEl = document.getElementById("view-event-status");
  if (!statusEl || !activeEvent) return;
  if (activeEvent.status === "Closed") {
    statusEl.innerHTML = `<span style="color:var(--danger)"><i class="fa-solid fa-lock"></i> ${t("status_closed")}</span>`;
  } else {
    statusEl.innerHTML = `<span style="color:var(--success)"><i class="fa-solid fa-lock-open"></i> ${t("status_open")}</span>`;
  }
}

function renderCalendarDays() {
  const daysTh = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  const daysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const target = document.getElementById("calendar-weekdays");
  if (target) {
    target.innerHTML = (currentLang === "th" ? daysTh : daysEn)
      .map((d) => `<div>${d}</div>`)
      .join("");
  }
}

// วันที่แบบยาว เช่น "15 พฤศจิกายน 2026" / "15 November 2026" (ใช้ ค.ศ. ทั้งหมด)
function formatLongDate(d) {
  const monthText =
    currentLang === "th" ? monthNamesTh[d.getMonth()] : monthNamesEn[d.getMonth()];
  return `${d.getDate()} ${monthText} ${d.getFullYear()}`;
}

// ==========================================
// ตัวเลือกวันที่ (แสดง วัน/เดือน/ปี ค่าจริงยังเป็น YYYY-MM-DD เหมือนเดิม)
// ==========================================
const DATE_PICKER_IDS = ["event-date", "edit-event-date"];
const DATETIME_PICKER_IDS = [
  "event-open",
  "event-close",
  "edit-event-open",
  "edit-event-close",
];

function initDatePickers() {
  // ถ้าโหลดไลบรารีไม่สำเร็จ จะใช้ input วันที่ของเบราว์เซอร์ตามเดิม
  if (typeof flatpickr === "undefined") return;
  const common = {
    altInput: true,
    disableMobile: true,
    allowInput: false,
    time_24hr: true,
    locale: currentLang === "th" ? "th" : "default",
  };
  DATE_PICKER_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el || el._flatpickr) return;
    el.placeholder = "dd/mm/yyyy";
    flatpickr(el, { ...common, dateFormat: "Y-m-d", altFormat: "d/m/Y" });
  });
  DATETIME_PICKER_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el || el._flatpickr) return;
    el.placeholder = "dd/mm/yyyy hh:mm";
    flatpickr(el, {
      ...common,
      enableTime: true,
      dateFormat: "Y-m-d\\TH:i",
      altFormat: "d/m/Y H:i",
    });
  });
  refreshDatePickerLocale();
}

function refreshDatePickerLocale() {
  [...DATE_PICKER_IDS, ...DATETIME_PICKER_IDS].forEach((id) => {
    const fp = document.getElementById(id)?._flatpickr;
    if (!fp) return;
    fp.set("locale", currentLang === "th" ? "th" : "default");
    fp.l10n.firstDayOfWeek = 0; // ให้สัปดาห์เริ่มวันอาทิตย์เหมือนปฏิทินของแอป
    fp.redraw();
  });
}

// กำหนดค่าให้ช่องวันที่ (รองรับทั้งแบบมี flatpickr และ input ปกติ)
function setPickerValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el._flatpickr) el._flatpickr.setDate(value || null, false);
  else el.value = value || "";
}

function formatTime(dtStr) {
  if (!dtStr || dtStr === "-") return "-";
  try {
    const d = new Date(dtStr);
    if (isNaN(d)) return dtStr;
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch (e) {
    return dtStr;
  }
}

// ==========================================
// 3. ระบบเซสชัน & Google Sign-In (JS API)
// ==========================================
let userUUID = localStorage.getItem("delia_uuid") || "";
let userName = localStorage.getItem("delia_username") || "";
let isAdminLoggedIn = localStorage.getItem("delia_role") === "Admin";
let isDevLoggedIn = localStorage.getItem("delia_role") === "Developer";
let pendingEmail = "";
let userPid = localStorage.getItem("delia_pid") || ""; // รหัสย่อแทนตัวตน (เมื่อเซิร์ฟเวอร์ซ่อนอีเมล)

// เพลงที่ช่อง ID ในชีตว่าง (ข้อมูลเก่า) จะมี id ซ้ำกันเป็น "" ทำให้กดเพลงไหนก็ได้เพลงแรกที่ id ว่าง
// ให้รหัสชั่วคราวที่ไม่ซ้ำ (ผูกกับเนื้อหาเพลง ไม่ผูกกับลำดับ) เซิร์ฟเวอร์รุ่นใหม่จะเติม id จริงให้ในชีตเอง
function fixSongIds(list) {
  if (!Array.isArray(list)) return list;
  const used = new Set(list.map((s) => s && s.id).filter(Boolean));
  list.forEach((s) => {
    if (!s || s.id) return;
    const base = [s.name, s.artist, s.link, s.creator].join("|");
    let h = 5381;
    for (let i = 0; i < base.length; i++) h = ((h << 5) + h + base.charCodeAt(i)) | 0;
    let id = "noid-" + (h >>> 0).toString(36);
    let n = 1;
    while (used.has(id)) id = "noid-" + (h >>> 0).toString(36) + "-" + n++;
    used.add(id);
    s.id = id;
  });
  return list;
}

// ==========================================
// รหัสวิดีโอ YouTube / เวลา นาที:วินาที / โควตา / ป้ายคะแนนเสมอ
// ==========================================
// ดึงรหัสวิดีโอจากลิงก์ทุกรูปแบบ (ตรงกับฝั่งเซิร์ฟเวอร์) รหัสแยกตัวพิมพ์เล็ก/ใหญ่
function ytVideoId(url) {
  const u = String(url == null ? "" : url).trim();
  if (!u || !/youtu/i.test(u)) return "";
  let m = u.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:shorts\/|embed\/|live\/|v\/))([\w-]{11})(?![\w-])/i);
  if (!m) m = u.match(/[?&]v=([\w-]{11})(?![\w-])/);
  return m ? m[1] : "";
}

function normSongName(s) {
  return String(s == null ? "" : s).toLowerCase().replace(/\s/g, "");
}

// เพลงในงานนี้ที่ซ้ำกับลิงก์/ชื่อที่ให้มา (ลิงก์เดียวกัน วิดีโอเดียวกัน หรือชื่อเหมือนกัน) ไม่นับเพลง exceptId
function findDuplicateSong(link, name, exceptId) {
  const vid = ytVideoId(link);
  const l = String(link || "").toLowerCase().trim();
  const n = normSongName(name);
  return (
    currentSongs.find(
      (s) =>
        s.id !== exceptId &&
        ((l && String(s.link || "").toLowerCase().trim() === l) ||
          (vid && ytVideoId(s.link) === vid) ||
          (n && normSongName(s.name) === n)),
    ) || null
  );
}

// เพลงซ้ำ: โหวตแล้ว -> แจ้ง / เพลงของตัวเอง -> แจ้ง / ไม่งั้นเปิดหน้าต่างให้โหวตเพลงที่มีอยู่แทน
function handleDuplicateSong(dup) {
  if (hasVoted(dup)) {
    showToast(t("toast_notice"), t("already_voted"), "error");
  } else if (isMine(dup)) {
    showToast(t("toast_notice"), t("you_are_creator"), "error");
  } else {
    openDuplicateModal(dup);
  }
}

// "1.42" "1:42" "142" "๑:๔๒" -> "01:42"; ว่าง -> ""; รูปแบบผิด -> null (ตรงกับฝั่งเซิร์ฟเวอร์)
function normalizeClock(raw) {
  let s = String(raw == null ? "" : raw).trim();
  if (!s) return "";
  s = s.replace(/[\u0E50-\u0E59]/g, (c) => String(c.charCodeAt(0) - 0x0e50));
  s = s.replace(/[\s.,;:\uFF1A]+/g, ":").replace(/^:+|:+$/g, "");
  let parts;
  if (/^\d+$/.test(s)) {
    if (s.length < 3 || s.length > 5) return null; // เลข 1-2 หลักกำกวม ไม่เดาให้
    parts = [s.slice(0, -2), s.slice(-2)];
  } else {
    parts = s.split(":");
  }
  if (parts.length < 2 || parts.length > 3) return null;
  if (!parts.every((p) => /^\d{1,3}$/.test(p))) return null;
  const sec = parseInt(parts[parts.length - 1], 10);
  let min = parseInt(parts[parts.length - 2], 10);
  if (parts.length === 3) min += parseInt(parts[0], 10) * 60;
  if (sec > 59) return null;
  return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}

function clockSeconds(v) {
  const m = /^(\d+):(\d{2})$/.exec(String(v));
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 0;
}

// ออกจากช่องเวลา: จัดรูปแบบให้ ถ้าผิดให้ขอบแดงและแจ้งเตือน
function tidyClock(el) {
  const n = normalizeClock(el.value);
  if (n === null) {
    el.classList.add("input-error");
    showToast(t("toast_notice"), t("time_invalid"), "error");
  } else {
    el.classList.remove("input-error");
    el.value = n;
  }
}

// อ่านท่อนที่เต้นจากฟอร์ม (add / edit) คืน {start,end} หรือ null ถ้าไม่ผ่าน (แจ้งผู้ใช้แล้ว)
function readSongTimes(prefix) {
  const pre = prefix === "add" ? "song" : "edit-song";
  const part = document.getElementById(pre + "-dance-part").value;
  if (part !== "Custom") return { start: part, end: "" };
  const sEl = document.getElementById(pre + "-start");
  const eEl = document.getElementById(pre + "-end");
  const s = normalizeClock(sEl.value);
  const e = normalizeClock(eEl.value);
  const bad = s === null ? sEl : e === null ? eEl : null;
  if (bad) {
    bad.classList.add("input-error");
    bad.focus();
    showToast(t("toast_notice"), t("time_invalid"), "error");
    return null;
  }
  if (s && e && clockSeconds(e) <= clockSeconds(s)) {
    eEl.classList.add("input-error");
    eEl.focus();
    showToast(t("toast_notice"), t("time_order"), "error");
    return null;
  }
  sEl.classList.remove("input-error");
  eEl.classList.remove("input-error");
  sEl.value = s;
  eEl.value = e;
  return { start: s, end: e };
}

// ตัวบอกโควตาบนปุ่มขอเพลง (ไม่แสดงให้แอดมินที่ไม่จำกัด หรือคนที่ยังไม่ล็อกอิน)
function updateQuotaBadge() {
  const el = document.getElementById("quota-badge");
  if (!el) return;
  if (!userUUID || isAdminLoggedIn || !activeEvent || activeEvent.status === "Closed") {
    el.classList.add("hidden");
    return;
  }
  const max = parseInt(activeEvent.quota) || 3;
  const used = currentSongs.filter((s) => isMine(s)).length;
  const left = Math.max(0, max - used);
  el.textContent = left > 0 ? t("quota_left", { left: left, max: max }) : t("quota_none", { max: max });
  el.classList.toggle("quota-full", left === 0);
  el.classList.remove("hidden");
}

// คะแนนเสมอที่ "มีความหมาย": โหวตสูงกว่าค่ากลางของงานและมีเพลงอื่นคะแนนเท่ากัน (เสมอกันที่ 1-2 โหวตมีเยอะเกินไป ไม่ต้องติดป้าย)
const tieCache = { ref: null, info: null };
function getTieInfo() {
  if (tieCache.ref === currentSongs && tieCache.info) return tieCache.info;
  const list = currentSongs.filter((s) => s.status !== "Played");
  const counts = {};
  list.forEach((s) => (counts[s.votes] = (counts[s.votes] || 0) + 1));
  const sorted = list.map((s) => s.votes).sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  tieCache.ref = currentSongs;
  tieCache.info = { counts: counts, min: Math.max(2, median + 1) };
  return tieCache.info;
}

// เพลงนี้เป็นของฉันไหม / ฉันโหวตแล้วไหม
// เซิร์ฟเวอร์โหมด HARDENED จะบอกมาเองใน s.mine / s.voted (ไม่ส่งอีเมลมา) โหมดเดิมเทียบกับ uuid
function isMine(s) {
  if (s.mine !== undefined) return !!s.mine;
  return !!userUUID && s.creator === userUUID;
}
function hasVoted(s) {
  if (s.voted !== undefined) return !!s.voted;
  return !!(userUUID && s.voters && s.voters.includes(userUUID));
}
// ใช้ระบุแถวของตัวเองใน Leaderboard (รหัสย่อ หรืออีเมลในโหมดเดิม)
function isMyLeaderboardId(id) {
  const key = userUUID ? userUUID.trim().toLowerCase() : "";
  return (!!userPid && id === userPid) || (!!key && id === key);
}
// แอดมิน/ผู้พัฒนาต่ออายุเซสชันด้วยโทเคน ผู้ใช้ทั่วไปใช้ auto_login เดิม
function authResumePayload() {
  const role = localStorage.getItem("delia_role");
  if ((role === "Admin" || role === "Developer") && localStorage.getItem("delia_token"))
    return { action: "admin_resume" };
  return { action: "auto_login", clientUuid: userUUID };
}

document.addEventListener("DOMContentLoaded", () => {
  initDatePickers();
  setLanguage(currentLang);

  if (userUUID) {
    if (sessionStorage.getItem("delia_active_session")) {
      fetchAPI(
        "auth",
        authResumePayload(),
        (res) => {
          saveLoginSession(res);
        },
        (err) => {
          if (err !== "NETWORK_ERROR") executeLogout();
        },
      );
    } else {
      document
        .querySelectorAll(".login-step")
        .forEach((el) => el.classList.add("hidden"));
      document.getElementById("step-unlock").classList.remove("hidden");
      document.getElementById("display-welcome-name").innerText = userName;
      openModal("welcomeModal");
    }
  } else {
    document
      .querySelectorAll(".login-step")
      .forEach((el) => el.classList.add("hidden"));
    document.getElementById("step-google-login").classList.remove("hidden");
    openModal("welcomeModal");
  }

  updateUserUI();
  loadEvents();
});

function initGoogle() {
  renderGoogleButton(currentLang);
}

function renderGoogleButton(lang) {
  if (typeof google === "undefined" || !google.accounts) return;
  const clientIdEl = document.getElementById("my-client-id");
  if (!clientIdEl) return;
  const clientId = clientIdEl.value;
  if (!clientId || clientId.includes("YOUR_GOOGLE_CLIENT_ID")) return;

  google.accounts.id.initialize({
    client_id: clientId,
    callback: handleGoogleLogin,
    context: "signin",
    ux_mode: "popup",
    locale: lang === "th" ? "th-TH" : "en-US",
  });

  const btnContainer = document.getElementById("google-btn-container");
  if (btnContainer) {
    btnContainer.innerHTML = "";
    google.accounts.id.renderButton(btnContainer, {
      theme: "outline",
      size: "large",
      shape: "pill",
      type: "standard",
      text: "signin_with",
      locale: lang === "th" ? "th" : "en",
    });
  }
}

function decodeJwtResponse(token) {
  let base64Url = token.split(".")[1];
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  let jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );
  return JSON.parse(jsonPayload);
}

function handleGoogleLogin(response) {
  const responsePayload = decodeJwtResponse(response.credential);
  pendingEmail = responsePayload.email;
  showToast("Google Sign-In", t("msg_checking_account"), "success");

  fetchAPI(
    "auth",
    { action: "google_login", email: pendingEmail },
    (res) => {
      if (res.status === "need_username") {
        document.getElementById("step-google-login").classList.add("hidden");
        document
          .getElementById("step-username-setup")
          .classList.remove("hidden");
      } else if (res.status === "login_success") {
        saveLoginSession(res);
      }
    },
    (err) => {
      showToast(t("toast_error"), err, "error");
    },
  );
}

function registerNewUser() {
  const username = document.getElementById("setup-username").value.trim();
  if (!username)
    return showToast(t("toast_notice"), t("msg_enter_username"), "error");

  const btn = document.getElementById("btn-register-user");
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t("msg_saving")}`;
  btn.disabled = true;

  fetchAPI(
    "auth",
    { action: "register_user", username: username, email: pendingEmail },
    (res) => {
      saveLoginSession(res);
      btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span data-i18n="btn_start">${t("btn_start")}</span>`;
      btn.disabled = false;
    },
    (err) => {
      btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span data-i18n="btn_start">${t("btn_start")}</span>`;
      btn.disabled = false;
      showToast(t("toast_error"), err, "error");
    },
  );
}

function saveLoginSession(res) {
  userUUID = res.uuid;
  userName = res.username;
  isAdminLoggedIn = res.role === "Admin";
  isDevLoggedIn = res.role === "Developer";

  localStorage.setItem("delia_uuid", userUUID);
  localStorage.setItem("delia_username", userName);
  localStorage.setItem("delia_role", res.role);
  if (res.token) localStorage.setItem("delia_token", res.token);
  else localStorage.removeItem("delia_token");
  userPid = res.pid || "";
  if (userPid) localStorage.setItem("delia_pid", userPid);
  else localStorage.removeItem("delia_pid");
  sessionStorage.setItem("delia_active_session", "true");

  closeModal("welcomeModal");
  updateUserUI();
}

function handleSlide(el) {
  const val = el.value;
  const thumb = document.getElementById("slider-thumb");
  thumb.style.left = `calc(${val}% - ${val * 0.5}px)`;
  if (val >= 95) {
    el.value = 100;
    thumb.style.left = `calc(100% - 50px)`;
    el.disabled = true;
    executeUnlock();
  }
}

function resetSlide(el) {
  if (el.value < 95) {
    el.value = 0;
    document.getElementById("slider-thumb").style.left = "0px";
  }
}

function executeUnlock() {
  const sliderText = document.getElementById("slider-text");
  if (sliderText) sliderText.innerText = t("msg_logging_in");

  fetchAPI(
    "auth",
    authResumePayload(),
    (res) => {
      saveLoginSession(res);
      loadEvents();
    },
    (err) => {
      if (err === "NETWORK_ERROR") {
        const slider = document.getElementById("unlock-slider");
        if (slider) {
          slider.value = 0;
          slider.disabled = false;
          document.getElementById("slider-thumb").style.left = "0px";
          document.getElementById("slider-text").innerText =
            t("slide_login");
        }
      } else {
        showToast(
          t("session_expired"),
          t("session_expired_msg"),
          "error",
        );
        executeLogout();
      }
    },
  );
}

function executeLogout() {
  localStorage.removeItem("delia_uuid");
  localStorage.removeItem("delia_username");
  localStorage.removeItem("delia_role");
  localStorage.removeItem("delia_token");
  localStorage.removeItem("delia_pid");
  userPid = "";
  sessionStorage.removeItem("delia_active_session");

  userUUID = "";
  userName = "";
  isAdminLoggedIn = false;
  isDevLoggedIn = false;

  updateUserUI();
  closeModal("logoutModal");
  showToast(t("logout"), t("logout_done"), "success");
  goHome();

  const slider = document.getElementById("unlock-slider");
  if (slider) {
    slider.value = 0;
    slider.disabled = false;
    document.getElementById("slider-thumb").style.left = "0px";
    document.getElementById("slider-text").innerText =
      t("slide_login");
  }

  setTimeout(() => {
    document
      .querySelectorAll(".login-step")
      .forEach((el) => el.classList.add("hidden"));
    document.getElementById("step-google-login").classList.remove("hidden");
    openModal("welcomeModal");
  }, 500);
}

function openAdminLoginModal() {
  closeModal("welcomeModal");
  closeModal("logoutModal");
  openModal("adminLoginModal");
}

function executeAdminAuth() {
  const u = document.getElementById("admin-user").value.trim();
  const p = document.getElementById("admin-pass").value.trim();
  if (!u || !p)
    return showToast(t("toast_error"), t("msg_fill_all"), "error");

  const btn = document.getElementById("btn-admin-submit");
  const originalText = btn.innerHTML;
  btn.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i>";
  btn.disabled = true;

  fetchAPI(
    "auth",
    { action: "admin_login", username: u, password: p },
    (res) => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      saveLoginSession(res);
      closeModal("adminLoginModal");
      renderCalendar();
    },
    (err) => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      showToast(t("login_failed"), err, "error");
    },
  );
}

function updateUserUI() {
  const profileBtn = document.getElementById("btn-user-profile");
  const btnLogin = document.getElementById("btn-login-main");

  if (isAdminLoggedIn || isDevLoggedIn) {
    let icon = isDevLoggedIn
      ? "<i class='fa-solid fa-code'></i>"
      : "<i class='fa-solid fa-crown'></i>";
    profileBtn.innerHTML = `${icon} <span class="hide-mobile">${escapeHTML(userName)}</span>`;
    profileBtn.classList.remove("hidden");
    if (btnLogin) btnLogin.classList.add("hidden");
    document
      .querySelectorAll(".admin-only:not(.fab-btn)")
      .forEach((el) => el.classList.remove("hidden"));
  } else if (userUUID && userName) {
    profileBtn.innerHTML = `<i class='fa-solid fa-user'></i> <span class="hide-mobile">${escapeHTML(userName)}</span>`;
    profileBtn.classList.remove("hidden");
    if (btnLogin) btnLogin.classList.add("hidden");
    document
      .querySelectorAll(".admin-only")
      .forEach((el) => el.classList.add("hidden"));
  } else {
    profileBtn.classList.add("hidden");
    if (btnLogin) btnLogin.classList.remove("hidden");
    document
      .querySelectorAll(".admin-only")
      .forEach((el) => el.classList.add("hidden"));
  }
  updateFABs();
}

// เซิร์ฟเวอร์ตอบ "ระบบคนใช้งานหนาแน่น" เมื่อรอคิวล็อกไม่ทัน (ยังไม่ได้ทำอะไรกับข้อมูลเลย จึงลองใหม่ได้อย่างปลอดภัย)
function isServerBusy(message) {
  return /หนาแน่น/.test(String(message || ""));
}

// silent = true: ไม่แสดง Toast เมื่อผิดพลาด (ใช้กับการเช็คเบื้องหลัง)
// attempt: ใช้ภายใน นับจำนวนครั้งที่ลองใหม่เมื่อระบบหนาแน่น
function fetchAPI(action, payload, onSuccess, onError, silent, attempt) {
  attempt = attempt || 0;
  fetch(apiURL, {
    method: "POST",
    body: JSON.stringify({
      action: action,
      payload: payload,
      token: localStorage.getItem("delia_token") || "",
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        onSuccess(data.data);
      } else if (isServerBusy(data.message) && attempt < 3) {
        // ลองใหม่เงียบ ๆ โดยรอแบบสุ่ม (กันทุกคนลองพร้อมกันอีกรอบ)
        setTimeout(
          () => fetchAPI(action, payload, onSuccess, onError, silent, attempt + 1),
          1200 + Math.random() * 1800 + attempt * 1000,
        );
      } else {
        if (!silent) showToast(t("toast_notice"), data.message, "error");
        if (onError) onError(data.message);
      }
    })
    .catch((err) => {
      console.error("System Error details:", err);
      if (!silent && err.name === "TypeError" && err.message.includes("fetch")) {
        showToast(
          t("toast_network"),
          t("toast_network_msg"),
          "warning",
        );
      }
      if (onError) onError("NETWORK_ERROR");
    });
}

// ==========================================
// 4. UI View Control & Modals
// ==========================================
function goHome() {
  window.history.replaceState({}, document.title, window.location.pathname);
  showView("calendar");
  loadEvents();
}
function showView(viewId) {
  currentViewId = viewId;
  document.getElementById("view-calendar").classList.add("hidden");
  document.getElementById("view-songs").classList.add("hidden");
  document.getElementById("view-playlist").classList.add("hidden");
  document.getElementById("view-" + viewId).classList.remove("hidden");
  updateFABs();
}
function updateFABs() {
  const fabAddCat = document.getElementById("fab-add-category");
  if (fabAddCat) fabAddCat.classList.add("hidden");
  if (isAdminLoggedIn && currentViewId === "playlist" && fabAddCat)
    fabAddCat.classList.remove("hidden");
}
function openModal(id) {
  if (id === "logoutModal") {
    const nameDisplay = document.getElementById("profile-name-display");
    if (nameDisplay) nameDisplay.innerText = userName;
  }
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("active");
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("active");
}
function showToast(title, message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  // กัน Toast ซ้ำ: ถ้ามีข้อความเดียวกันแสดงอยู่แล้ว ไม่สร้างซ้ำ
  const toastKey = `${type}|${title}|${message}`;
  if (Array.from(container.children).some((el) => el.dataset.key === toastKey))
    return;
  // แสดงพร้อมกันได้ไม่เกิน 2 อัน ถ้าเต็มให้เอาอันเก่าสุดออก
  while (container.children.length >= 2) container.firstElementChild.remove();

  const toast = document.createElement("div");
  toast.dataset.key = toastKey;
  toast.className = `toast ${type}`;
  const icon =
    type === "success"
      ? '<i class="fa-solid fa-circle-check"></i>'
      : type === "info"
        ? '<i class="fa-solid fa-circle-info"></i>'
        : '<i class="fa-solid fa-circle-xmark"></i>';
  toast.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-body"><h4>${escapeHTML(title)}</h4><p>${escapeHTML(message)}</p></div>`;
  container.appendChild(toast);
  setTimeout(
    () => {
      toast.style.animation = "slideInRight 0.3s reverse forwards";
      setTimeout(() => toast.remove(), 300);
    },
    type === "info" ? 6000 : 3000,
  );
}

let inputModalCallback = null;
function openInputModal(title, defaultVal, callback) {
  document.getElementById("input-modal-title").innerHTML =
    `<i class="fa-solid fa-pen-to-square"></i> ${escapeHTML(title)}`;
  const inputVal = document.getElementById("input-modal-value");
  if (inputVal) inputVal.value = defaultVal || "";
  inputModalCallback = callback;
  openModal("inputModal");
  setTimeout(() => {
    if (inputVal) inputVal.focus();
  }, 100);
}
function submitInputModal() {
  const inputVal = document.getElementById("input-modal-value");
  if (!inputVal) return;
  if (inputModalCallback) inputModalCallback(inputVal.value.trim());
  closeModal("inputModal");
}

let confirmCallback = null;
function showCustomConfirm(title, message, callback) {
  document.getElementById("custom-confirm-title").innerText = title;
  document.getElementById("custom-confirm-message").innerText = message;
  confirmCallback = callback;
  openModal("customConfirmModal");
}
const confirmOkBtn = document.getElementById("btn-custom-confirm-ok");
if (confirmOkBtn) {
  confirmOkBtn.addEventListener("click", () => {
    if (confirmCallback) confirmCallback();
    closeModal("customConfirmModal");
  });
}

function getYTThumb(link) {
  if (!link) return "DeliaLogo.png";
  let videoId = "";
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = link.match(regExp);
  if (match && /^[\w-]{11}$/.test(match[2])) videoId = match[2];
  return videoId
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : "DeliaLogo.png";
}

// ==========================================
// 5. ปฏิทิน
// ==========================================
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const monthNamesTh = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];
const monthNamesEn = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function loadEvents() {
  const grid = document.getElementById("calendar-grid");
  if (grid)
    grid.innerHTML = `<div class="loader" style="grid-column: 1 / -1;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;

  fetchAPI(
    "getEvents",
    {},
    (res) => {
      currentEvents = res;
      renderCalendar();
      renderUpcomingEvent();

      // 🌟 ระบบรับ URL Parameters สำหรับส่งไปยังหน้างานหรือเปิดฟีดแบ็กทันที
      const urlParams = new URLSearchParams(window.location.search);
      const sharedEventId = urlParams.get("eventId");
      const viewMode = urlParams.get("view");

      if (sharedEventId) {
        const ev = currentEvents.find((e) => e.id === sharedEventId);
        if (ev) {
          activeEvent = ev;
          enterSongList();

          // 🌟 ถ้าสตาฟส่งลิงก์แบบต่อท้ายด้วย &view=feedback ให้บังคับเปิดฟอร์มทันที
          if (viewMode === "feedback") {
            setTimeout(() => openModal("feedbackModal"), 800);
          }
        }
      }
    },
    () => {
      if (grid)
        grid.innerHTML = `<p class="text-center text-muted" style="grid-column: 1 / -1;">${t("err_loading")}</p>`;
    },
  );
}

function renderCalendar() {
  const display = document.getElementById("month-year-display");
  if (display) {
    const monthText =
      currentLang === "th"
        ? monthNamesTh[currentMonth]
        : monthNamesEn[currentMonth];
    const yearText = currentYear;
    display.innerText = `${monthText} ${yearText}`;
  }

  const grid = document.getElementById("calendar-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day empty";
    grid.appendChild(emptyCell);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";

    // 1. ตั้งค่าเริ่มต้น: วันอื่นๆ ที่ว่างเปล่า ให้แอดมินกดพื้นที่เพื่อสร้างงานได้ตามเดิม
    if (isAdminLoggedIn) {
      cell.classList.add("admin-clickable");
      cell.onclick = () => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        setPickerValue("event-date", dateStr);
        openModal("addEventModal");
      };
    }

    const dateNum = document.createElement("div");
    dateNum.className = "day-number";
    dateNum.innerText = i;
    cell.appendChild(dateNum);

    const dayEvents = currentEvents.filter((e) => {
      const d = new Date(e.date);
      return (
        d.getDate() === i &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    });

    if (dayEvents.length > 0) {
      cell.onclick = () => {
        handleEventClick(dayEvents[0]); // เปลี่ยนตรงนี้
      };
      cell.style.cursor = "pointer";
      if (isAdminLoggedIn) cell.classList.remove("admin-clickable");
    }

    dayEvents.forEach((e) => {
      const evt = document.createElement("div");
      evt.className = `day-event ${e.status === "Closed" ? "closed" : ""}`;
      evt.innerHTML = `${escapeHTML(e.name)} ${e.status === "Closed" ? '<i class="fa-solid fa-lock"></i>' : ""}`;

      // ปุ่มแสดงชื่องานขนาดเท่าเดิม และยังกดได้ปกติ
      evt.onclick = (event) => {
        event.stopPropagation();
        handleEventClick(e); // เปลี่ยนตรงนี้
      };
      cell.appendChild(evt);
    });
    grid.appendChild(cell);
  }
}

function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
}

function openEventIntro(event) {
  activeEvent = event;
  const d = new Date(event.date);
  document.getElementById("intro-title").innerText = event.name;

  document.getElementById("intro-date").innerText = formatLongDate(d);
  document.getElementById("intro-loc").innerText = event.location || "-";
  document.getElementById("intro-time").innerText =
    `${formatTime(event.openTime)} - ${formatTime(event.closeTime)}`;
  document.getElementById("intro-det").innerText = event.details || "-";
  document.getElementById("edit-event-id").value = event.id;
  openModal("eventIntroModal");
}

// 🌟 ฟังก์ชันเช็คว่างานจบหรือยัง (ใช้ร่วมกันทั้งระบบ)
window.isEventEnded = function (event) {
  if (!event) return false;
  if (event.status === "Closed") return true;
  const now = new Date();
  const evDate = new Date(event.date);
  evDate.setHours(23, 59, 59, 999);
  return now > evDate;
};

// 🌟 ฟังก์ชันจัดการเมื่อกดคลิกที่กล่องงานบนปฏิทิน (ซ่อมแล้ว!)
window.handleEventClick = function (event) {
  activeEvent = event;

  if (isEventEnded(event)) {
    const dontShowDate = localStorage.getItem(`hideFeedback_${event.id}`);
    const today = new Date().toDateString();

    // 🌟 เช็คว่า User นี้ เคยกดส่งฟอร์มของงานนี้ไปแล้วหรือยัง
    const hasSubmitted = localStorage.getItem(
      `feedbackSubmitted_${event.id}_${userUUID}`,
    );
    const btnGoToForm = document.getElementById("btn-go-to-form");

    if (hasSubmitted && !isAdminLoggedIn) {
      btnGoToForm.innerHTML = `<span data-i18n="form_submitted">${t("form_submitted")}</span>`;
      btnGoToForm.disabled = true;
      btnGoToForm.style.background = "#b0bec5"; // เปลี่ยนเป็นสีเทา
      btnGoToForm.style.borderColor = "#b0bec5";
    } else {
      btnGoToForm.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> <span data-i18n="go_feedback_form">${t("go_feedback_form")}</span>`;
      btnGoToForm.disabled = false;
      btnGoToForm.style.background = ""; // รีเซ็ตสี
      btnGoToForm.style.borderColor = "";
    }

    if (dontShowDate === today && !isAdminLoggedIn) {
      enterSongList();
    } else {
      openModal("feedbackPromptModal");
    }
  } else {
    openEventIntro(event);
  }
};

// 🌟 ฟังก์ชันเมื่อแอดมินกดปุ่ม "ประกาศจบงาน" (จากหน้าแรก)
window.adminCloseEvent = function () {
  showCustomConfirm(
    t("close_event_title"),
    t("close_event_msg"),
    () => {
      fetchAPI("closeEvent", { id: activeEvent.id }, (res) => {
        currentEvents = res;
        activeEvent = currentEvents.find((e) => e.id === activeEvent.id);
        showToast(t("toast_success"), t("close_event_done"), "success");
        closeModal("eventIntroModal");
        goToFeedbackForm();
      });
    },
  );
};

// 🌟 ฟังก์ชันกดยืนยันการข้าม
window.promptSkipFeedback = function () {
  showCustomConfirm(
    t("confirm_skip_title"),
    t("confirm_skip_msg"),
    () => {
      currentEventId = activeEvent.id;
      saveDontShowPreference();
      closeModal("feedbackPromptModal");
      enterSongList();
    },
  );
};

// 🌟 ฟังก์ชันพาไปหน้าเว็บฟอร์ม (สร้าง URL ใหม่)
window.goToFeedbackForm = function () {
  closeModal("feedbackPromptModal");
  const formUrl =
    window.location.origin +
    window.location.pathname +
    "?eventId=" +
    activeEvent.id +
    "&view=feedback";
  window.location.href = formUrl;
};

// 🌟 ฟังก์ชันเข้าสู่หน้ารายการเพลง
function enterSongList() {
  closeModal("eventIntroModal");
  currentEventId = activeEvent.id;

  document.getElementById("view-event-title").innerText = activeEvent.name;
  const addBtn = document.getElementById("btn-add-song-main");

  renderEventStatus();
  if (activeEvent.status === "Closed") {
    if (addBtn) addBtn.classList.add("hidden");
  } else {
    if (addBtn) addBtn.classList.remove("hidden");
  }

  showView("songs");
  loadSongs();

  window.history.replaceState(
    { path: window.location.pathname + "?eventId=" + activeEvent.id },
    "",
    window.location.pathname + "?eventId=" + activeEvent.id,
  );
}

function goBackToCalendar() {
  window.history.replaceState({}, document.title, window.location.pathname);
  showView("calendar");
}

function loadSongs() {
  discover.eventId = null; // เข้าหน้ารายการเพลงทุกครั้งให้สุ่มชุดการ์ดใหม่
  const content = document.getElementById("song-list-content");
  if (!content) return;
  content.innerHTML = `<div class="loader"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;
  fetchAPI(
    "getSongs",
    { eventId: activeEvent.id, uuid: userUUID },
    (res) => {
      currentSongs = fixSongIds(res);
      filterSongs();
    },
    () => {
      content.innerHTML = `<p class="text-center text-muted">${t("err_loading")}</p>`;
    },
  );
}

function filterSongs() {
  const searchInput = document.getElementById("search-bar");
  const q = searchInput ? searchInput.value.toLowerCase() : "";

  let visibleSongs = currentSongs;
  if (!isAdminLoggedIn) {
    visibleSongs = currentSongs.filter((s) => s.status !== "AdminOnly");
  }

  // 1. ค้นหาด้วยชื่อเพลงหรือศิลปิน
  let filtered = visibleSongs.filter(
    (s) =>
      s.name.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q),
  );

  // 2. กรองด้วย Quick Filter Pills (ปรับปรุงให้รองรับทุกรูปแบบข้อมูลในชีตและฐานข้อมูล)
  if (currentQuickFilter !== "all") {
    if (currentQuickFilter === "BD") {
      filtered = filtered.filter(
        (s) =>
          s.isBreakdance === "Yes" ||
          s.isBreakdance === true ||
          String(s.isBreakdance).toLowerCase() === "true",
      );
    } else if (["K-Pop", "T-Pop", "J-Pop"].includes(currentQuickFilter)) {
      filtered = filtered.filter(
        (s) =>
          s.origin === currentQuickFilter || s.category === currentQuickFilter,
      );
    } else if (currentQuickFilter === "M") {
      // กรอง Boy Group / ศิลปินชาย (ครอบคลุมทุกคำที่สื่อถึงศิลปินชาย/บอยกรุ๊ป)
      filtered = filtered.filter((s) => {
        let gField = String(s.gender || s.artistType || s.groupType || "")
          .trim()
          .toLowerCase();
        return (
          gField === "m" ||
          gField === "boy" ||
          gField === "male" ||
          gField.includes("boy group") ||
          gField.includes("ศิลปินชาย") ||
          gField === "boy group"
        );
      });
    } else if (currentQuickFilter === "F") {
      // กรอง Girl Group / ศิลปินหญิง (ครอบคลุมทุกคำที่สื่อถึงศิลปินหญิง/เกิร์ลกรุ๊ป)
      filtered = filtered.filter((s) => {
        let gField = String(s.gender || s.artistType || s.groupType || "")
          .trim()
          .toLowerCase();
        return (
          gField === "f" ||
          gField === "girl" ||
          gField === "female" ||
          gField.includes("girl group") ||
          gField.includes("ศิลปินหญิง") ||
          gField === "girl group"
        );
      });
    }
  }

  // 3. กรองด้วย Activity Tabs (เพลงของฉัน / ที่ฉันโหวต)
  if (currentActivityTab === "mine") {
    filtered = filtered.filter((s) => isMine(s));
  } else if (currentActivityTab === "voted") {
    filtered = filtered.filter((s) => hasVoted(s));
  }

  renderSongs(filtered);
  refreshDiscover();
  updateQuotaBadge();
}

// ==========================================
// รวมเพลงซ้ำ (แอดมิน)
// ==========================================
let dupGroups = [];

// จัดกลุ่มเพลงที่ซ้ำกัน: วิดีโอเดียวกัน หรือชื่อเหมือนกัน (ต่อกันเป็นกลุ่มเดียวได้)
function computeDupGroups() {
  const songs = currentSongs;
  const parent = songs.map((_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (a, b) => {
    a = find(a);
    b = find(b);
    if (a !== b) parent[b] = a;
  };
  const byKey = new Map();
  songs.forEach((s, i) => {
    const keys = [];
    const vid = ytVideoId(s.link);
    if (vid) keys.push("v:" + vid);
    const n = normSongName(s.name);
    if (n) keys.push("n:" + n);
    keys.forEach((k) => {
      if (byKey.has(k)) union(byKey.get(k), i);
      else byKey.set(k, i);
    });
  });
  const groups = new Map();
  songs.forEach((s, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(s);
  });
  return Array.from(groups.values())
    .filter((g) => g.length >= 2)
    .map((g) => {
      // เก็บเพลงที่โหวตมากที่สุด (เท่ากัน = เพลงที่ขอก่อน เพราะรายการเรียงตามลำดับขอไว้แล้ว)
      let keep = g[0];
      g.forEach((s) => {
        if (s.votes > keep.votes) keep = s;
      });
      return { songs: g, keepId: keep.id };
    });
}

function openDupMergeModal() {
  dupGroups = computeDupGroups();
  renderDupGroups();
  openModal("dupMergeModal");
}

function renderDupGroups() {
  const box = document.getElementById("dup-merge-list");
  const btn = document.getElementById("btn-dup-merge-apply");
  if (!box) return;
  if (dupGroups.length === 0) {
    box.innerHTML = `<p class="text-center text-muted" style="padding: 20px 0;">${escapeHTML(t("dup_tool_none"))}</p>`;
    if (btn) btn.disabled = true;
    return;
  }
  box.innerHTML = dupGroups
    .map((g, gi) => {
      const rows = g.songs
        .map(
          (s) => `<label class="dup-pick">
            <input type="radio" name="dup-keep-${gi}" value="${escapeHTML(s.id)}" ${s.id === g.keepId ? "checked" : ""} onchange="setDupKeep(${gi}, this.value)" />
            <div class="dup-info"><strong>${escapeHTML(s.name)}</strong><span class="text-muted">${escapeHTML(s.artist)}</span></div>
            <span class="dup-votes"><i class="fa-solid fa-heart"></i> ${s.votes}</span>
          </label>`,
        )
        .join("");
      return `<div class="dup-group">
        <label class="dup-group-head"><input type="checkbox" class="dup-check" data-g="${gi}" checked onchange="updateDupButton()" /> ${escapeHTML(t("dup_group", { n: gi + 1 }))}</label>
        ${rows}
      </div>`;
    })
    .join("");
  updateDupButton();
}

function setDupKeep(gi, id) {
  if (dupGroups[gi]) dupGroups[gi].keepId = id;
}

function selectedDupGroups() {
  return Array.from(document.querySelectorAll("#dup-merge-list .dup-check:checked")).map((c) => dupGroups[parseInt(c.dataset.g, 10)]);
}

function updateDupButton() {
  const n = selectedDupGroups().length;
  const btn = document.getElementById("btn-dup-merge-apply");
  if (btn) {
    btn.disabled = n === 0;
    const label = btn.querySelector("span");
    if (label) label.innerText = `${t("dup_tool_apply")} (${n})`;
  }
}

function applyDupMerges() {
  const chosen = selectedDupGroups();
  if (chosen.length === 0) return;
  const merges = chosen.map((g) => ({
    keepId: g.keepId,
    dropIds: g.songs.map((s) => s.id).filter((id) => id !== g.keepId),
  }));
  const rows = merges.reduce((n, m) => n + m.dropIds.length, 0);
  showCustomConfirm(
    t("dup_merge_confirm_title"),
    t("dup_merge_confirm_msg", { groups: merges.length, rows: rows }),
    () => {
      const btn = document.getElementById("btn-dup-merge-apply");
      if (btn) btn.disabled = true;
      fetchAPI(
        "mergeSongs",
        { eventId: activeEvent.id, merges: merges },
        (res) => {
          currentSongs = fixSongIds(res);
          filterSongs();
          closeModal("dupMergeModal");
          showToast(t("toast_success"), t("dup_merged", { n: merges.length }), "success");
        },
        (err) => {
          if (btn) btn.disabled = false;
          if (err === "Invalid Action") showToast(t("toast_notice"), t("need_deploy"), "error");
        },
      );
    },
  );
}

// ==========================================
// แถบการ์ดเพลงสุ่มวิ่งอัตโนมัติ (ไม่แสดงจำนวนโหวต)
// ==========================================
const discover = {
  eventId: null, // งานที่สร้างชุดการ์ดไว้แล้ว (สุ่มครั้งเดียวต่องาน ไม่สุ่มใหม่ทุกครั้งที่ข้อมูลรีเฟรช)
  ids: [],
  raf: 0,
  pos: 0, // ตำแหน่งเลื่อน (ทศนิยมได้ เพราะ scrollLeft ปัดเศษ)
  lastSet: 0,
  half: 0, // ความกว้างของ 1 ชุด (ใช้วนต่อเนื่อง)
  animate: false,
  resumeAt: 0,
  hover: false,
  drag: null,
  moved: false,
  lastT: 0,
  bound: false,
};
const DISCOVER_MAX = 24;
const DISCOVER_SPEED = 38; // พิกเซล/วินาที
const DISCOVER_RESUME_MS = 2000;

function discoverReducedMotion() {
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function discoverShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// เพลงที่ผู้ใช้โหวตได้จริง: ยังไม่เล่น ไม่ใช่ของตัวเอง และยังไม่ได้โหวต
function discoverCandidates() {
  return currentSongs.filter(
    (s) => s.status !== "Played" && s.status !== "AdminOnly" && !isMine(s) && !hasVoted(s),
  );
}

function discoverCardHTML(s, dup) {
  const link = safeUrl(s.link);
  const img = `<img src="${escapeHTML(getYTThumb(s.link))}" alt="" draggable="false" loading="lazy">`;
  const thumb = link
    ? `<a class="discover-thumb" href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer" draggable="false"${dup ? ' tabindex="-1"' : ""}>${img}</a>`
    : `<div class="discover-thumb">${img}</div>`;
  const voted = hasVoted(s);
  return `<div class="discover-card" data-id="${escapeHTML(s.id)}">
    ${thumb}
    <div class="discover-title">${escapeHTML(s.name)}</div>
    <div class="discover-artist">${escapeHTML(s.artist)}</div>
    <button type="button" class="discover-vote${voted ? " voted" : ""}"${dup ? ' tabindex="-1"' : ""} onclick="discoverVote(event, '${escapeHTML(s.id)}')">
      <i class="${voted ? "fa-solid" : "fa-regular"} fa-heart"></i>
      <span>${escapeHTML(t(voted ? "discover_voted" : "discover_vote"))}</span>
    </button>
  </div>`;
}

function renderDiscoverCards() {
  const track = document.getElementById("discover-track");
  const strip = document.getElementById("discover-strip");
  if (!track || !strip) return;
  const songs = discover.ids
    .map((id) => currentSongs.find((s) => s.id === id))
    .filter((s) => s && s.status !== "Played" && s.status !== "AdminOnly");
  if (songs.length === 0) {
    strip.classList.add("hidden");
    track.innerHTML = "";
    discover.animate = false;
    return;
  }
  strip.classList.remove("hidden");

  const one = songs.map((s) => discoverCardHTML(s, false)).join("");
  track.innerHTML = `<div class="discover-set">${one}</div>`;
  track.scrollLeft = 0;
  discover.pos = 0;
  discover.lastSet = 0;
  discover.half = 0;

  // วิ่งวนเฉพาะเมื่อการ์ด "ไม่ซ้ำ" ล้นแถบจริง (เกินกว่าความกว้างแถบอย่างน้อย 1 ใบ)
  // ถ้าการ์ดมีน้อยจนแสดงครบในแถบเดียว จะไม่วิ่งและไม่ทำซ้ำการ์ด เพราะจะดูเหมือนเพลงซ้ำกันเต็มแถบ
  const first = track.querySelector(".discover-set");
  const w = first.offsetWidth;
  discover.animate = songs.length >= 4 && !discoverReducedMotion() && w >= track.clientWidth + 200;
  if (!discover.animate) return;

  // ทำซ้ำอีกชุดไว้ต่อท้ายเพื่อให้วนต่อเนื่องไม่มีช่องว่าง (ชุดนี้จะโผล่มาตอนวนรอบเท่านั้น)
  const copy = first.cloneNode(true);
  copy.setAttribute("aria-hidden", "true");
  copy.querySelectorAll("a, button").forEach((el) => el.setAttribute("tabindex", "-1"));
  track.appendChild(copy);
  discover.half = copy.offsetLeft - first.offsetLeft;
  if (discover.half <= 0) discover.animate = false;
}

function updateDiscoverStates() {
  const track = document.getElementById("discover-track");
  if (!track) return;
  let removed = false;
  track.querySelectorAll(".discover-card").forEach((card) => {
    const s = currentSongs.find((x) => x.id === card.dataset.id);
    if (!s || s.status === "Played" || s.status === "AdminOnly") {
      card.remove();
      removed = true;
      return;
    }
    const voted = hasVoted(s);
    const btn = card.querySelector(".discover-vote");
    if (btn && btn.classList.contains("voted") !== voted) setDiscoverVoted(btn, voted);
  });
  if (removed) {
    discover.ids = discover.ids.filter((id) => currentSongs.some((s) => s.id === id && s.status !== "Played"));
    renderDiscoverCards();
    startDiscoverLoop();
  }
}

function setDiscoverVoted(btn, voted) {
  btn.classList.toggle("voted", voted);
  const icon = btn.querySelector("i");
  if (icon) icon.className = (voted ? "fa-solid" : "fa-regular") + " fa-heart";
  const label = btn.querySelector("span");
  if (label) label.textContent = t(voted ? "discover_voted" : "discover_vote");
}

// เรียกทุกครั้งที่รายการเพลงเปลี่ยน: สร้างชุดการ์ดครั้งแรกของงานนี้ หลังจากนั้นแค่อัปเดตสถานะปุ่ม
function refreshDiscover() {
  const strip = document.getElementById("discover-strip");
  if (!strip || !activeEvent) return;
  if (activeEvent.status === "Closed" || isEventEnded(activeEvent)) {
    strip.classList.add("hidden");
    return;
  }
  bindDiscoverEvents();
  if (discover.eventId !== activeEvent.id) {
    discover.eventId = activeEvent.id;
    // เพลงชื่อ+ศิลปินเดียวกัน (มีคนขอซ้ำ) แสดงแค่ใบเดียว
    const seen = new Set();
    discover.ids = discoverShuffle(discoverCandidates())
      .filter((s) => {
        const k = (String(s.name) + "|" + String(s.artist)).toLowerCase().replace(/\s+/g, "");
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, DISCOVER_MAX)
      .map((s) => s.id);
    renderDiscoverCards();
  } else {
    updateDiscoverStates();
  }
  startDiscoverLoop();
}

function startDiscoverLoop() {
  if (discover.raf || !discover.animate) return;
  discover.lastT = 0;
  discover.raf = requestAnimationFrame(discoverTick);
}

function discoverTick(now) {
  discover.raf = 0;
  const track = document.getElementById("discover-track");
  // ซ่อนอยู่ (ออกจากหน้ารายการเพลง) ให้หยุดลูป เริ่มใหม่ตอนเข้ามาอีกครั้ง
  if (!track || !track.offsetParent || !discover.animate) return;
  const dt = discover.lastT ? Math.min(0.1, (now - discover.lastT) / 1000) : 0;
  discover.lastT = now;

  const busy = discover.hover || discover.drag || document.hidden || now < discover.resumeAt;
  if (!busy && discover.half > 0) {
    discover.pos += DISCOVER_SPEED * dt;
    if (discover.pos >= discover.half) discover.pos -= discover.half;
    discover.lastSet = discover.pos;
    track.scrollLeft = discover.pos;
  } else if (discover.half > 0) {
    // ผู้ใช้กำลังเลื่อนเอง: วนรอบให้ต่อเนื่องทั้งสองทิศ
    let sl = track.scrollLeft;
    if (sl >= discover.half) sl -= discover.half;
    else if (sl <= 0 && discover.drag) sl += discover.half;
    if (sl !== track.scrollLeft) {
      track.scrollLeft = sl;
    }
    discover.pos = track.scrollLeft;
    discover.lastSet = discover.pos;
  }
  discover.raf = requestAnimationFrame(discoverTick);
}

function bindDiscoverEvents() {
  if (discover.bound) return;
  const track = document.getElementById("discover-track");
  const strip = document.getElementById("discover-strip");
  if (!track || !strip) return;
  discover.bound = true;

  const pause = () => {
    discover.resumeAt = performance.now() + DISCOVER_RESUME_MS;
  };

  strip.addEventListener("mouseenter", () => (discover.hover = true));
  strip.addEventListener("mouseleave", () => {
    discover.hover = false;
    pause();
  });
  strip.addEventListener("focusin", () => (discover.hover = true));
  strip.addEventListener("focusout", () => {
    discover.hover = false;
    pause();
  });

  // เลื่อนด้วยนิ้ว/ล้อเมาส์/คีย์บอร์ด: ถ้า scrollLeft ไม่ตรงกับที่โค้ดตั้งเอง แปลว่าผู้ใช้เลื่อน ให้หยุดชั่วคราว
  track.addEventListener(
    "scroll",
    () => {
      if (Math.abs(track.scrollLeft - discover.lastSet) > 1.5) {
        discover.pos = track.scrollLeft;
        discover.lastSet = track.scrollLeft;
        pause();
        if (discover.half > 0) {
          if (track.scrollLeft >= discover.half) {
            track.scrollLeft -= discover.half;
          } else if (track.scrollLeft <= 0) {
            track.scrollLeft += discover.half;
          }
          discover.pos = track.scrollLeft;
          discover.lastSet = track.scrollLeft;
        }
      }
    },
    { passive: true },
  );
  track.addEventListener("touchstart", pause, { passive: true });
  track.addEventListener("touchend", pause, { passive: true });

  // ลากด้วยเมาส์ (นิ้วใช้การเลื่อนของเบราว์เซอร์เอง)
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    discover.drag = { x: e.clientX, left: track.scrollLeft, id: e.pointerId, active: false };
    discover.moved = false;
  });
  track.addEventListener("pointermove", (e) => {
    const d = discover.drag;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    if (!d.active && Math.abs(dx) > 5) {
      d.active = true;
      discover.moved = true;
      track.classList.add("dragging");
      try {
        track.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
    if (d.active) {
      let target = d.left - dx;
      if (discover.half > 0) {
        // วนรอบระหว่างลาก
        while (target < 0) {
          target += discover.half;
          d.left += discover.half;
        }
        while (target >= discover.half) {
          target -= discover.half;
          d.left -= discover.half;
        }
      }
      track.scrollLeft = target;
      discover.pos = track.scrollLeft;
      discover.lastSet = discover.pos;
    }
  });
  const endDrag = (e) => {
    const d = discover.drag;
    if (!d || (e && e.pointerId !== undefined && e.pointerId !== d.id)) return;
    discover.drag = null;
    track.classList.remove("dragging");
    try {
      track.releasePointerCapture(d.id);
    } catch (err) {}
    pause();
    startDiscoverLoop();
  };
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);
  // หลังลากเสร็จ อย่าให้ถือว่าเป็นการคลิกปุ่ม/ลิงก์
  track.addEventListener(
    "click",
    (e) => {
      if (discover.moved) {
        e.preventDefault();
        e.stopPropagation();
        discover.moved = false;
      }
    },
    true,
  );
  track.addEventListener("dragstart", (e) => e.preventDefault());

  let rt = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (discover.eventId !== null && document.getElementById("discover-strip") && !document.getElementById("discover-strip").classList.contains("hidden")) {
        renderDiscoverCards();
        startDiscoverLoop();
      }
    }, 250);
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      discover.lastT = 0;
      startDiscoverLoop();
    }
  });
}

// โหวตจากแถบการ์ด: โหวตได้อย่างเดียว (ไม่ยกเลิก) และไม่แสดงจำนวนโหวต
window.discoverVote = function (e, songId) {
  e.stopPropagation();
  if (isEventEnded(activeEvent)) {
    return showToast(t("toast_notice"), t("event_over_no_vote"), "warning");
  }
  if (!userUUID) return openModal("welcomeModal");
  const s = currentSongs.find((x) => x.id === songId);
  if (!s) return;
  if (isMine(s)) return showToast(t("toast_notice"), t("cant_vote_own"), "error");
  // ปุ่มที่ถูกกดไปแล้ว (ยังรอเซิร์ฟเวอร์ตอบ) ก็ห้ามกดซ้ำ ไม่งั้นเซิร์ฟเวอร์จะสลับเป็นยกเลิกโหวต
  const clicked = e.currentTarget;
  if (hasVoted(s) || (clicked && clicked.classList && clicked.classList.contains("voted"))) return;

  const track = document.getElementById("discover-track");
  const btns = track ? Array.from(track.querySelectorAll(`.discover-card[data-id="${CSS.escape(songId)}"] .discover-vote`)) : [];
  btns.forEach((b) => setDiscoverVoted(b, true));
  fetchAPI(
    "voteSong",
    { eventId: activeEvent.id, songId: songId, uuid: userUUID },
    (res) => {
      currentSongs = fixSongIds(res);
      filterSongs();
    },
    () => btns.forEach((b) => setDiscoverVoted(b, false)),
  );
};

window.quickVote = function (e, songId) {
  e.stopPropagation();
  // 🌟 ป้องกันไม่ให้โหวตเมื่องานจบแล้ว
  if (isEventEnded(activeEvent)) {
    return showToast(t("toast_notice"), t("event_over_no_vote"), "warning");
  }

  if (!userUUID) return openModal("welcomeModal");

  const s = currentSongs.find((x) => x.id === songId);
  if (isMine(s)) {
    return showToast(t("toast_notice"), t("cant_vote_own"), "error");
  }

  const voteBtn = e.currentTarget;
  const icon = voteBtn.querySelector("i");
  const countSpan = voteBtn.querySelector(".vote-count");
  let currentVotes = parseInt(countSpan.innerText);
  // เก็บสถานะเดิมไว้ เผื่อเซิร์ฟเวอร์ปฏิเสธ (เช่น ระบบหนาแน่น) จะได้ย้อนกลับให้ตรงความจริง
  const prevState = {
    iconClass: icon.className,
    iconColor: icon.style.color,
    countColor: countSpan.style.color,
    count: countSpan.innerText,
  };

  if (icon.classList.contains("fa-regular")) {
    icon.classList.remove("fa-regular");
    icon.classList.add("fa-solid");
    icon.style.color = "var(--primary)";
    countSpan.style.color = "var(--primary)";
    countSpan.innerText = currentVotes + 1;
    icon.classList.add("heart-pop");
    setTimeout(() => icon.classList.remove("heart-pop"), 300);
  } else {
    icon.classList.remove("fa-solid");
    icon.classList.add("fa-regular");
    icon.style.color = "var(--text-muted)";
    countSpan.style.color = "var(--text-muted)";
    countSpan.innerText = currentVotes - 1;
  }

  fetchAPI(
    "voteSong",
    { eventId: activeEvent.id, songId: songId, uuid: userUUID },
    (res) => {
      currentSongs = fixSongIds(res);
    },
    () => {
      icon.className = prevState.iconClass;
      icon.style.color = prevState.iconColor;
      countSpan.style.color = prevState.countColor;
      countSpan.innerText = prevState.count;
    },
  );
};

function renderSongs(songs) {
  const container = document.getElementById("song-list-content");
  if (!container) return;
  container.innerHTML = "";

  if (songs.length === 0) {
    container.innerHTML = `<p class="text-center text-muted no-songs-msg" data-i18n="no_songs" style="padding: 40px 0;">${t("no_songs")}</p>`;
    return;
  }
  // 🌟 หาลำดับโหวตที่ไม่ซ้ำกัน 5 อันดับแรก (ไม่นับ 0 โหวต)
  let uniqueVotes = [...new Set(songs.map((s) => s.votes))]
    .filter((v) => v > 0)
    .sort((a, b) => b - a);

  songs.forEach((s, index) => {
    const card = document.createElement("div");

    // หา Rank ของเพลงนี้
    let rank = s.votes > 0 ? uniqueVotes.indexOf(s.votes) + 1 : 0;
    let topClass = "";
    let rankHtml = "";

    if (rank === 1) {
      topClass = "rank-1";
      rankHtml =
        '<i class="fa-solid fa-crown rank-icon" style="color: #ffd700; filter: drop-shadow(0 0 2px rgba(255,215,0,0.8));"></i>';
    } else if (rank === 2) {
      topClass = "rank-2";
      rankHtml =
        '<i class="fa-solid fa-medal rank-icon" style="color: #C0C0C0;"></i>';
    } else if (rank === 3) {
      topClass = "rank-3";
      rankHtml =
        '<i class="fa-solid fa-medal rank-icon" style="color: #CD7F32;"></i>';
    } else if (rank === 4 || rank === 5) {
      topClass = "rank-4-5";
      rankHtml = `<span style="font-weight:800; color:var(--primary); margin-right:6px; font-size:0.9rem;">#${rank}</span>`;
    }

    let statusClass =
      s.status === "Approved"
        ? "status-approved"
        : s.status === "Played"
          ? "status-played"
          : "";
    card.className = `song-card ${statusClass} ${topClass}`;
    card.style.animationDelay = `${index * 0.05}s`;

    let tagsHTML = "";
    // ... โค้ดสร้าง Tag เวลาเหมือนเดิม
    let timeText = "";
    if (s.end) {
      timeText = `${s.start} - ${s.end}`;
    } else if (s.start) {
      timeText = s.start;
    } else {
      timeText = t("time_unspecified");
    }
    tagsHTML += `<span class="tag" style="background: #E8F5E9; color: #2E7D32; font-weight: 600;"><i class="fa-regular fa-clock"></i> ${escapeHTML(timeText)}</span> `;

    if (s.isBreakdance === "Yes" || s.isBreakdance === true) {
      tagsHTML += `<span class="tag tag-bd" style="background: #FFF3E0; color: #E65100; border: 1px solid #FFCC80;"><i class="fa-solid fa-bolt"></i> Dance Break</span>`;
    }

    let voteIcon = "fa-regular fa-heart";
    let voteColor = "var(--text-muted)";

    if (userUUID && hasVoted(s)) {
      voteIcon = "fa-solid fa-heart";
      voteColor = "var(--primary)";
    }
    if (userUUID && isMine(s)) {
      voteIcon = "fa-solid fa-star";
      voteColor = "#F39C12";
    }

    // เอา rankHtml ไปใส่หน้าชื่อเพลง
    card.innerHTML = `
      <img src="${getYTThumb(s.link)}" class="song-thumbnail" alt="thumbnail">
      <div class="song-info-main">
        <div class="song-title">${rankHtml}${escapeHTML(s.name)}</div>
        <div class="song-artist">${escapeHTML(s.artist)}</div>
        <div class="song-tags">${tagsHTML}</div>
      </div>
      <div class="song-vote-quick" onclick="quickVote(event, '${escapeHTML(s.id)}')">
        <i class="${voteIcon} vote-anim-icon" style="color: ${voteColor}; font-size: 1.5rem;"></i>
        <span class="vote-count" style="color: ${voteColor};">${s.votes}</span>
      </div>
    `;
    card.onclick = () => openSongDetail(s.id);
    container.appendChild(card);
  });
}

function openSongDetail(id) {
  const s = currentSongs.find((song) => song.id === id);
  if (!s) return;
  selectedSongId = id;

  document.getElementById("det-title").innerText = s.name;
  document.getElementById("det-artist").innerText = s.artist;

  let timeText = "";
  if (s.end) {
    timeText = `${s.start} - ${s.end}`;
  } else if (s.start) {
    timeText = s.start;
  } else {
    timeText = t("time_unspecified");
  }
  document.getElementById("det-time").innerText = timeText;

  document.getElementById("det-votes").innerText = `${s.votes}`;

  let tagText = "";
  if (s.isBreakdance === "Yes" || s.isBreakdance === true) {
    tagText = t("has_dance_break");
  } else {
    tagText = t("no_dance_break");
  }
  document.getElementById("det-tag").innerText = tagText;

  const linkBtn = document.getElementById("det-link");
  const detailLink = safeUrl(s.link);
  if (detailLink) {
    linkBtn.href = detailLink;
    linkBtn.classList.remove("hidden");
  } else {
    linkBtn.classList.add("hidden");
  }

  const editMySongBtn = document.getElementById("btn-edit-mysong");
  if (isAdminLoggedIn || (userUUID && isMine(s))) {
    if (editMySongBtn) editMySongBtn.classList.remove("hidden");
  } else {
    if (editMySongBtn) editMySongBtn.classList.add("hidden");
  }

  const adminControls = document.getElementById("admin-song-controls");
  if (isAdminLoggedIn) {
    if (adminControls) adminControls.classList.remove("hidden");
  } else {
    if (adminControls) adminControls.classList.add("hidden");
  }

  openModal("songDetailModal");
}

function shareSong() {
  const url =
    window.location.origin +
    window.location.pathname +
    "?eventId=" +
    activeEvent.id;
  navigator.clipboard
    .writeText(url)
    .then(() => {
      showToast(t("copied_title"), t("copied_msg"), "success");
    })
    .catch(() => {
      showCustomConfirm("Share Link", url, () => {});
    });
}

// ==========================================
// 7. การขอและแก้ไขเพลง (Form Handling)
// ==========================================

window.toggleTimeInputs = function (mode) {
  const prefix = mode === "add" ? "song" : "edit-song";
  const part = document.getElementById(`${prefix}-dance-part`).value;
  const timeDiv = document.getElementById(`${prefix}-time-inputs`);
  if (part === "Custom") {
    timeDiv.style.display = "flex";
  } else {
    timeDiv.style.display = "none";
  }
};

// ==========================================
// ตรวจเพศ/ประเภทของเพลงจากฐานข้อมูลศิลปิน (ฟอร์มขอเพลง / แก้เพลง)
// ==========================================
const SONG_FORM = {
  add: {
    link: "song-link", name: "song-name", artist: "song-artist",
    gender: "song-gender", origin: "song-origin", note: "song-detect-note", btn: "btn-song-submit",
  },
  edit: {
    link: "edit-song-link", name: "edit-song-name", artist: "edit-song-artist",
    gender: "edit-song-gender", origin: "edit-song-origin", note: "edit-song-detect-note", btn: "btn-song-edit-submit",
  },
};
// นับรอบการค้นหาจากลิงก์ ใช้ทิ้งคำตอบเก่าที่มาช้ากว่า (เช่น วางลิงก์ใหม่ทับขณะลิงก์เดิมยังโหลดอยู่)
const linkSeq = { add: 0, edit: 0 };
const detectState = {
  add: { touched: false, key: "", res: null, resT: "", resA: "" },
  edit: { touched: false, key: "", res: null, resT: "", resA: "" },
};

function setGenderDropdown(id, val) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.value = ["M", "F", "Mix"].includes(val) ? val : "Mix";
}

// ตั้งค่าช่องประเภท (ถ้าเป็นค่าที่ไม่มีในรายการ เช่น C-Pop ที่ผู้ใช้เคยเลือก จะเพิ่มตัวเลือกให้)
function setOriginSelect(id, value) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const v = String(value || "K-Pop");
  if (!Array.from(sel.options).some((o) => o.value === v)) sel.add(new Option(v, v));
  sel.value = v;
  currentOrigin = v;
}

function getOrigin(prefix) {
  const sel = document.getElementById(SONG_FORM[prefix].origin);
  return sel && sel.value ? sel.value : "K-Pop";
}

function setDetectNote(prefix, kind, html) {
  const el = document.getElementById(SONG_FORM[prefix].note);
  if (!el) return;
  if (!kind) {
    el.classList.add("hidden");
    el.innerHTML = "";
    return;
  }
  el.className = "detect-note " + kind; // detect-ok | detect-warn | detect-info
  el.innerHTML = html;
}

function resetSongForm(prefix, gender, origin) {
  linkSeq[prefix]++; // คำตอบที่ยังค้างอยู่จากการเปิดฟอร์มรอบก่อนต้องไม่มาเติมฟอร์มใหม่
  const submitBtn = document.getElementById(SONG_FORM[prefix].btn);
  if (submitBtn) submitBtn.disabled = false;
  detectState[prefix] = { touched: false, key: "", res: null, resT: "", resA: "" };
  setGenderDropdown(SONG_FORM[prefix].gender, gender || "Mix");
  setOriginSelect(SONG_FORM[prefix].origin, origin || "K-Pop");
  setDetectNote(prefix, "");
}

// ผู้ใช้เลือกเพศ/ประเภทเอง: เลิกเขียนทับอัตโนมัติ
function markDetectTouched(prefix) {
  detectState[prefix].touched = true;
  currentOrigin = getOrigin(prefix);
  setDetectNote(prefix, "detect-info", escapeHTML(t("detect_touched")));
}

function genderLabel(g) {
  return t(g === "M" ? "gender_m" : g === "F" ? "gender_f" : "gender_mix");
}

// แสดงผลที่ระบบตรวจพบลงในฟอร์ม (เซิร์ฟเวอร์รุ่นเก่าไม่มี genderKnown จึงถือว่ารู้เหมือนเดิม)
function applyDetection(prefix, res) {
  const f = SONG_FORM[prefix];
  detectState[prefix].res = res;
  const genderKnown = res.genderKnown !== undefined ? res.genderKnown : true;
  const originKnown = res.originKnown !== undefined ? res.originKnown : true;
  if (genderKnown) setGenderDropdown(f.gender, res.gender);
  if (originKnown) setOriginSelect(f.origin, res.origin);
  currentOrigin = getOrigin(prefix);

  if (genderKnown) {
    // เซิร์ฟเวอร์รุ่นเก่าไม่บอกชื่อที่จับคู่ได้ จึงใช้ข้อความกลาง ๆ
    let text = (res.matched ? t("detect_found", { name: res.matched }) : t("detect_found_plain")) +
      " · " + genderLabel(res.gender) + " · " + res.origin;
    if (res.ambiguous) text += " — " + t("detect_ambiguous");
    setDetectNote(prefix, res.ambiguous ? "detect-warn" : "detect-ok", escapeHTML(text));
  } else if (originKnown) {
    setDetectNote(prefix, "detect-warn", escapeHTML(t("detect_origin_only", { origin: res.origin })));
  } else {
    setDetectNote(prefix, "detect-warn", escapeHTML(t("detect_unknown")));
  }
}

// ถามเซิร์ฟเวอร์ว่าชื่อเพลง+ศิลปินนี้เป็นของใคร แล้วเติมลงฟอร์ม
function runDetection(prefix, title, author) {
  const key = title + "|" + author;
  detectState[prefix].key = key;
  setDetectNote(prefix, "detect-info", escapeHTML(t("detect_checking")));
  return new Promise((resolve) => {
    fetchAPI(
      "aiProcess",
      { title: title, author: author },
      (res) => {
        if (detectState[prefix].key === key) {
          detectState[prefix].resT = title;
          detectState[prefix].resA = author;
          applyDetection(prefix, res);
        }
        resolve(res);
      },
      (err) => {
        const msg = err === "NETWORK_ERROR" ? t("toast_network_msg") : err;
        setDetectNote(prefix, "detect-warn", escapeHTML(msg));
        resolve(null);
      },
      true,
    );
  });
}

// ดึงชื่อเพลง/ช่องจากลิงก์ YouTube: oEmbed ของ YouTube ก่อน (รองรับ Shorts และเร็วกว่า) แล้วค่อย noembed
async function fetchVideoInfo(url) {
  const enc = encodeURIComponent(url);
  const sources = [
    `https://www.youtube.com/oembed?format=json&url=${enc}`,
    `https://noembed.com/embed?dataType=json&url=${enc}`,
  ];
  for (const src of sources) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 6000);
      const res = await fetch(src, { signal: ctl.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.title) return { title: data.title, author: data.author_name || "" };
    } catch (e) {}
  }
  return null;
}

async function processYoutubeLink(prefix) {
  const f = SONG_FORM[prefix];
  const url = (document.getElementById(f.link).value || "").trim();
  if (!/youtu/i.test(url)) return;
  if (prefix === "add") {
    // วิดีโอนี้มีคนขอไว้แล้ว (ลิงก์คนละรูปแบบก็จับได้) ให้โหวตของเดิมแทน ไม่ต้องดึงข้อมูลซ้ำ
    const same = ytVideoId(url) ? currentSongs.find((s) => ytVideoId(s.link) === ytVideoId(url)) : null;
    if (same) return handleDuplicateSong(same);
  }

  const btn = document.getElementById(f.btn);
  const seq = ++linkSeq[prefix];
  const stale = () => seq !== linkSeq[prefix];
  if (btn) btn.disabled = true;
  setDetectNote(prefix, "detect-info", escapeHTML(t("detect_checking")));
  try {
    const info = await fetchVideoInfo(url);
    if (stale()) return; // มีลิงก์ใหม่ (หรือเปิดฟอร์มใหม่) แล้ว ทิ้งคำตอบนี้
    if (!info) {
      setDetectNote(prefix, "detect-warn", escapeHTML(t("detect_info_failed")));
      return;
    }
    document.getElementById(f.name).value = info.title;
    document.getElementById(f.artist).value = info.author;
    if (detectState[prefix].touched) {
      setDetectNote(prefix, "detect-info", escapeHTML(t("detect_touched")));
      return;
    }
    await runDetection(prefix, info.title, info.author);
  } finally {
    if (btn && !stale()) btn.disabled = false;
  }
}

function autoFillYoutube() {
  processYoutubeLink("add");
}
function autoFillYoutubeEdit() {
  processYoutubeLink("edit");
}

// พิมพ์ชื่อเพลง/ศิลปินเอง (ไม่มีลิงก์) ก็ตรวจให้ได้ ถ้ายังไม่ได้เลือกเพศ/ประเภทเอง
function autoDetectFromText(prefix) {
  const f = SONG_FORM[prefix];
  const name = (document.getElementById(f.name).value || "").trim();
  const artist = (document.getElementById(f.artist).value || "").trim();
  if (!name || detectState[prefix].touched) return;
  if (detectState[prefix].key === name + "|" + artist) return;
  runDetection(prefix, name, artist);
}

// ปุ่ม "ตรวจประเภทอัตโนมัติ": ตรวจใหม่จากชื่อ/ศิลปินที่กรอกอยู่ (ยอมเขียนทับสิ่งที่เลือกไว้)
function redetectSong(prefix) {
  const f = SONG_FORM[prefix];
  const name = (document.getElementById(f.name).value || "").trim();
  const artist = (document.getElementById(f.artist).value || "").trim();
  if (!name && !artist)
    return showToast(t("toast_notice"), t("enter_song_name"), "error");
  detectState[prefix].touched = false;
  detectState[prefix].key = "";
  runDetection(prefix, name, artist);
}

// ==========================================
// เรียนรู้จากสิ่งที่ผู้ใช้เลือก: เตือนเมื่อขัดกับฐานข้อมูล + ให้แอดมินบันทึกศิลปินเข้าฐานข้อมูล
// ==========================================
// ผลตรวจล่าสุดใช้ได้เฉพาะเมื่อยังตรงกับชื่อเพลง/ศิลปินที่อยู่ในฟอร์มตอนนี้
function currentDetection(prefix) {
  const st = detectState[prefix];
  const f = SONG_FORM[prefix];
  if (!st || !st.res) return null;
  const name = (document.getElementById(f.name).value || "").trim();
  const artist = (document.getElementById(f.artist).value || "").trim();
  return String(st.resT || "").trim() === name && String(st.resA || "").trim() === artist ? st.res : null;
}

// คืนข้อความเตือนถ้าสิ่งที่เลือกขัดกับสิ่งที่ฐานข้อมูลรู้แน่ชัด (ไม่เตือนเมื่อไม่แน่ใจ/คลุมเครือ)
function findDetectionConflict(prefix, chosenGender, chosenOrigin) {
  const res = currentDetection(prefix);
  if (!res || res.ambiguous || !res.matched) return null;
  if (res.genderKnown && res.gender && chosenGender !== res.gender) {
    return t("gender_conflict_msg", {
      name: res.matched,
      db: genderLabel(res.gender),
      chosen: genderLabel(chosenGender),
    });
  }
  if (res.originKnown && res.origin && chosenOrigin !== res.origin) {
    return t("type_conflict_msg", { name: res.matched, db: res.origin, chosen: chosenOrigin });
  }
  return null;
}

function confirmDetectionConflict(prefix, data, proceed) {
  const msg = findDetectionConflict(prefix, data.gender, data.origin);
  if (!msg) return proceed();
  showCustomConfirm(t("gender_conflict_title"), msg, proceed);
}

// หลังแอดมินบันทึกเพลงสำเร็จ: ถ้าฐานข้อมูลไม่รู้จักศิลปินนี้ (หรือต่างจากที่เลือก) ให้เสนอบันทึก
function shouldOfferLearn(res, gender, origin) {
  if (!isAdminLoggedIn) return false;
  if (!res) return false;
  if (res.ambiguous) return false;
  if (!res.genderKnown) return gender === "M" || gender === "F";
  return (res.gender && res.gender !== gender) || (res.originKnown && res.origin && res.origin !== origin);
}

function offerLearnArtist(prefix, data, res) {
  if (!shouldOfferLearn(res, data.gender, data.origin)) return;
  setTimeout(() => {
    showCustomConfirm(
      t("learn_title"),
      t("learn_msg", { gender: genderLabel(data.gender), origin: data.origin }),
      () => {
        const guess = guessArtistName({ name: data.name, artist: data.artist });
        openInputModal(t("artist_prompt"), guess, (value) => {
          const parts = splitArtistNames(value);
          if (!parts.name) return;
          fetchAPI(
            "addArtistToDB",
            { name: parts.name, gender: data.gender, origin: data.origin, aliases: parts.aliases },
            (r) => {
              showToast(
                t("toast_success"),
                t(r && r.status === "updated" ? "artist_updated" : "artist_saved", {
                  name: r && r.artist ? r.artist : parts.name,
                  gender: genderLabel(data.gender),
                  origin: data.origin,
                }),
                "success",
              );
            },
            (err) => {
              if (err === "Invalid Action") showToast(t("toast_notice"), t("need_deploy"), "error");
            },
          );
        });
      },
    );
  }, 400);
}

// ==========================================
// เครื่องมือแอดมิน: ฐานข้อมูลศิลปิน
// ==========================================
// เดาชื่อวงจากชื่อเพลง: "[MV] Hearts2Hearts 하츠투하츠 'STYLE' MV" -> "Hearts2Hearts 하츠투하츠"
function guessArtistName(s) {
  const title = String(s.name || "").replace(/^\s*[\[【][^\]】]*[\]】]\s*/, "");
  const lead = title.split(/\s[-–—]\s|[(\[「'"‘“]/)[0].trim();
  const channel = String(s.artist || "").replace(/\s*-\s*Topic$/i, "").trim();
  return lead.length >= 2 && lead.length <= 40 ? lead : channel;
}

// แยก "ชื่ออังกฤษ + ชื่อภาษาอื่น" เป็นชื่อหลัก + ชื่อเรียกอื่น
function splitArtistNames(text) {
  const str = String(text || "").trim();
  const idx = str.search(/[^\x00-\x7F]/);
  if (idx > 0) return { name: str.slice(0, idx).trim(), aliases: str.slice(idx).trim() };
  return { name: str, aliases: "" };
}

function saveArtistToDB() {
  const s = currentSongs.find((song) => song.id === selectedSongId);
  if (!s) return;
  // ช่องถามชื่ออยู่ใต้หน้าต่างรายละเอียดเพลง (z-index เท่ากัน) จึงต้องปิดหน้าต่างรายละเอียดก่อน
  closeModal("songDetailModal");
  openInputModal(t("artist_prompt"), guessArtistName(s), (value) => {
    const parts = splitArtistNames(value);
    if (!parts.name) return;
    fetchAPI(
      "addArtistToDB",
      { name: parts.name, gender: s.gender, origin: s.origin, aliases: parts.aliases },
      (res) => {
        showToast(
          t("toast_success"),
          t(res && res.status === "updated" ? "artist_updated" : "artist_saved", {
            name: res && res.artist ? res.artist : parts.name,
            gender: genderLabel(s.gender),
            origin: s.origin,
          }),
          "success",
        );
      },
      (err) => {
        if (err === "Invalid Action") showToast(t("toast_notice"), t("need_deploy"), "error");
      },
    );
  });
}

let typeFixes = [];

function openTypeFixModal() {
  const box = document.getElementById("type-fix-list");
  if (box)
    box.innerHTML = `<div class="loader"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;
  const applyBtn = document.getElementById("btn-type-fix-apply");
  if (applyBtn) applyBtn.disabled = true;
  openModal("typeFixModal");
  fetchAPI(
    "suggestSongFixes",
    { eventId: activeEvent.id },
    (list) => {
      typeFixes = list || [];
      renderTypeFixes();
    },
    (err) => {
      if (box)
        box.innerHTML = `<p class="text-center text-muted" style="padding: 20px 0;">${escapeHTML(err === "Invalid Action" ? t("need_deploy") : t("load_error"))}</p>`;
    },
  );
}

function renderTypeFixes() {
  const box = document.getElementById("type-fix-list");
  const applyBtn = document.getElementById("btn-type-fix-apply");
  if (!box) return;
  if (typeFixes.length === 0) {
    box.innerHTML = `<p class="text-center text-muted" style="padding: 20px 0;">${escapeHTML(t("type_fix_none"))}</p>`;
    if (applyBtn) applyBtn.disabled = true;
    return;
  }
  box.innerHTML = typeFixes
    .map((f, i) => {
      const changes = [];
      if (f.suggestGender)
        changes.push(`${escapeHTML(t("gender"))}: <s>${escapeHTML(genderLabel(f.gender))}</s> → <b>${escapeHTML(genderLabel(f.suggestGender))}</b>`);
      if (f.suggestOrigin)
        changes.push(`${escapeHTML(t("origin_label"))}: <s>${escapeHTML(f.origin)}</s> → <b>${escapeHTML(f.suggestOrigin)}</b>`);
      return `<label class="fix-row">
        <input type="checkbox" class="fix-check" data-i="${i}" checked onchange="updateTypeFixButton()" />
        <div class="fix-info">
          <strong>${escapeHTML(f.name)}</strong>
          <span class="text-muted">${escapeHTML(f.artist)} · ${escapeHTML(t("detect_found", { name: f.matched || "" }))}</span>
          <div class="fix-change">${changes.join(" · ")}</div>
        </div>
      </label>`;
    })
    .join("");
  updateTypeFixButton();
}

function selectedTypeFixes() {
  return Array.from(document.querySelectorAll("#type-fix-list .fix-check:checked")).map(
    (c) => typeFixes[parseInt(c.dataset.i, 10)],
  );
}

function updateTypeFixButton() {
  const n = selectedTypeFixes().length;
  const btn = document.getElementById("btn-type-fix-apply");
  if (btn) {
    btn.disabled = n === 0;
    const label = btn.querySelector("span");
    if (label) label.innerText = `${t("type_fix_apply")} (${n})`;
  }
}

function toggleAllTypeFixes(checked) {
  document.querySelectorAll("#type-fix-list .fix-check").forEach((c) => (c.checked = checked));
  updateTypeFixButton();
}

function applyTypeFixes() {
  const fixes = selectedTypeFixes().map((f) => {
    const out = { id: f.id };
    if (f.suggestGender) out.gender = f.suggestGender;
    if (f.suggestOrigin) out.origin = f.suggestOrigin;
    return out;
  });
  if (fixes.length === 0) return;
  const btn = document.getElementById("btn-type-fix-apply");
  if (btn) btn.disabled = true;
  fetchAPI(
    "applySongFixes",
    { eventId: activeEvent.id, fixes: fixes },
    (res) => {
      closeModal("typeFixModal");
      showToast(t("toast_success"), t("type_fix_applied", { n: res.applied }), "success");
      loadSongs();
    },
    () => {
      if (btn) btn.disabled = false;
    },
  );
}

function checkQuotaAndOpenModal() {
  if (!userUUID) return openModal("welcomeModal");

  const maxQuota = parseInt(activeEvent.quota) || 3;

  if (
    !isAdminLoggedIn &&
    currentSongs.filter((s) => isMine(s)).length >= maxQuota
  ) {
    return showToast(
      t("quota_full"),
      t("quota_full_msg", { n: maxQuota }),
      "error",
    );
  }

  ["song-link", "song-name", "song-artist", "song-start", "song-end"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    },
  );

  document.getElementById("song-breakdance").checked = false;
  document.getElementById("song-dance-part").value = "Hook 1";
  toggleTimeInputs("add");

  resetSongForm("add");
  openModal("addSongModal");
}

let pendingSongData = null;

function preCheckAddSong() {
  const nameInput = document.getElementById("song-name");
  const name = nameInput ? nameInput.value.trim() : "";
  const linkInput = document.getElementById("song-link");
  const link = linkInput ? linkInput.value.trim() : "";
  if (!name) return showToast(t("toast_notice"), t("enter_song_name"), "error");

  const dup = findDuplicateSong(link, name, null);
  if (dup) return handleDuplicateSong(dup);

  const times = readSongTimes("add");
  if (!times) return;
  const finalStart = times.start,
    finalEnd = times.end;

  pendingSongData = {
    name: name,
    artist: document.getElementById("song-artist").value,
    link: link,
    start: finalStart,
    end: finalEnd,
    isBreakdance: document.getElementById("song-breakdance").checked,
    gender: document.getElementById("song-gender").value,
    origin: getOrigin("add"),
  };
  confirmDetectionConflict("add", pendingSongData, executeAddSong);
}

function openDuplicateModal(dupSong) {
  duplicateSongTarget = dupSong;
  document.getElementById("dup-song-name").innerText = dupSong.name;
  document.getElementById("dup-song-artist").innerText = dupSong.artist;
  document.getElementById("dup-song-votes").innerText = dupSong.votes || 0;
  document.getElementById("dup-song-thumb").src = getYTThumb(dupSong.link);
  openModal("duplicateSongModal");
}

function executeDuplicateVote() {
  if (!duplicateSongTarget) return;
  fetchAPI(
    "voteSong",
    { eventId: activeEvent.id, songId: duplicateSongTarget.id, uuid: userUUID },
    (res) => {
      currentSongs = fixSongIds(res);
      filterSongs();
      closeModal("duplicateSongModal");
      closeModal("addSongModal");
      showToast(t("toast_success"), t("vote_added"), "success");
    },
  );
}

function executeAddSong() {
  const btn = document.getElementById("btn-song-submit");
  if (btn) btn.disabled = true;
  const learnData = pendingSongData;
  const learnRes = currentDetection("add");
  fetchAPI(
    "addSong",
    {
      eventId: activeEvent.id,
      songData: pendingSongData,
      uuid: userUUID,
      isAdmin: isAdminLoggedIn,
    },
    (res) => {
      currentSongs = fixSongIds(res);
      filterSongs();
      closeModal("addSongModal");
      showToast(t("toast_success"), t("song_added"), "success");
      if (btn) btn.disabled = false;
      offerLearnArtist("add", learnData, learnRes);

      // 🌟 หากกำลังเปิดหน้า Playlist Manager อยู่ ให้เพิ่มเพลงใหม่ลงใน Pool ทันที
      if (currentViewId === "playlist") {
        refreshPoolIfNeeded();
      }
    },
    () => {
      if (btn) btn.disabled = false;
    },
  );
}

// 🌟 ฟังก์ชันช่วยตรวจสอบและดึงเพลงใหม่เข้า Pool
function refreshPoolIfNeeded() {
  const pool = document.getElementById("list-pool");
  if (!pool) return;

  const existingIds = new Set();
  document
    .querySelectorAll(".drop-zone [data-id]")
    .forEach((el) => existingIds.add(el.dataset.id));

  currentSongs.forEach((s) => {
    if (s.status !== "Played" && !existingIds.has(s.id)) {
      pool.appendChild(createPlaylistItem(s));
    }
  });
}

function openUserEditSong() {
  const s = currentSongs.find((song) => song.id === selectedSongId);
  if (!s) return;

  document.getElementById("edit-song-link").value = s.link;
  document.getElementById("edit-song-name").value = s.name;
  document.getElementById("edit-song-artist").value = s.artist;

  const predefinedParts = ["Hook 1", "Hook 2", "Dance Break"];
  if (predefinedParts.includes(s.start) && !s.end) {
    document.getElementById("edit-song-dance-part").value = s.start;
    document.getElementById("edit-song-start").value = "";
    document.getElementById("edit-song-end").value = "";
  } else {
    document.getElementById("edit-song-dance-part").value = "Custom";
    document.getElementById("edit-song-start").value = s.start || "";
    document.getElementById("edit-song-end").value = s.end || "";
  }
  toggleTimeInputs("edit");

  document.getElementById("edit-song-breakdance").checked =
    s.isBreakdance === "Yes" || s.isBreakdance === true;
  resetSongForm("edit", s.gender, s.origin);
  closeModal("songDetailModal");
  openModal("editSongModal");
}

function executeEditSong() {
  const name = document.getElementById("edit-song-name").value.trim();
  if (!name) return showToast(t("toast_error"), t("enter_song_name"), "error");

  const times = readSongTimes("edit");
  if (!times) return;
  const finalStart = times.start,
    finalEnd = times.end;

  const updatedData = {
    name: name,
    artist: document.getElementById("edit-song-artist").value,
    link: document.getElementById("edit-song-link").value,
    start: finalStart,
    end: finalEnd,
    isBreakdance: document.getElementById("edit-song-breakdance").checked,
    gender: document.getElementById("edit-song-gender").value,
    origin: getOrigin("edit"),
  };

  confirmDetectionConflict("edit", updatedData, () => sendEditSong(updatedData));
}

function sendEditSong(updatedData) {
  const btn = document.getElementById("btn-song-edit-submit");
  if (btn) btn.disabled = true;
  const learnRes = currentDetection("edit");
  fetchAPI(
    "editSong",
    {
      eventId: activeEvent.id,
      songId: selectedSongId,
      songData: updatedData,
      uuid: userUUID,
      isAdmin: isAdminLoggedIn,
    },
    (res) => {
      currentSongs = fixSongIds(res);
      filterSongs();
      closeModal("editSongModal");
      showToast(t("toast_success"), t("song_updated"), "success");
      if (btn) btn.disabled = false;
      offerLearnArtist("edit", updatedData, learnRes);
    },
    () => {
      if (btn) btn.disabled = false;
    },
  );
}

function adminUpdateStatus(status) {
  fetchAPI(
    "updateSongStatus",
    { eventId: activeEvent.id, songId: selectedSongId, status: status, uuid: userUUID },
    (res) => {
      currentSongs = fixSongIds(res);
      filterSongs();
      closeModal("songDetailModal");
      showToast(t("toast_success"), t("status_updated"));
    },
  );
}

function confirmDeleteSong() {
  showCustomConfirm(t("delete_song_title"), t("delete_song_msg"), () => {
    fetchAPI(
      "deleteSong",
      { eventId: activeEvent.id, songId: selectedSongId, uuid: userUUID },
      (res) => {
        currentSongs = fixSongIds(res);
        filterSongs();
        closeModal("songDetailModal");
        showToast(t("toast_success"), t("song_deleted"), "success");
      },
    );
  });
}

// ==========================================
// 8. Playlist Manager
// ==========================================
let sortableLists = [];
let boardSortable = null;
let isPoolOpen = false;

function togglePoolSidebar() {
  isPoolOpen = !isPoolOpen;
  const pool = document.getElementById("pool-sidebar");
  const workspace = document.querySelector(".playlist-workspace");
  const text = document.getElementById("toggle-sidebar-text");

  if (isPoolOpen) {
    if (pool) pool.classList.remove("collapsed");
    if (workspace) workspace.classList.remove("pool-closed");
    if (text) text.innerText = t("hide_pool");
  } else {
    if (pool) pool.classList.add("collapsed");
    if (workspace) workspace.classList.add("pool-closed");
    if (text) text.innerText = t("show_pool");
  }
}

function openPlaylistManager() {
  document.getElementById("playlist-event-title").innerText =
    `${t("setlist_title")}: ${activeEvent.name}`;
  showView("playlist");
  document.getElementById("list-pool").innerHTML = "";
  document.getElementById("dynamic-board").innerHTML = "";

  const pool = document.getElementById("pool-sidebar");
  const workspace = document.querySelector(".playlist-workspace");
  const textBtn = document.getElementById("toggle-sidebar-text");

  if (window.innerWidth <= 768) {
    isPoolOpen = false;
    if (pool) pool.classList.add("collapsed");
    if (workspace) workspace.classList.add("pool-closed");
    if (textBtn) textBtn.innerText = t("show_pool");
  } else {
    isPoolOpen = true;
    if (pool) pool.classList.remove("collapsed");
    if (workspace) workspace.classList.remove("pool-closed");
    if (textBtn) textBtn.innerText = t("hide_pool");
  }

  fetchAPI(
    "getPlaylist",
    { eventId: activeEvent.id, date: activeEvent.date },
    (savedLists) => {
      const added = renderPlaylistBoard(savedLists);
      if (savedLists.length > 0 && added > 0) {
        showToast(t("toast_success"), t("merged_new", { n: added }), "info");
      }
      // ถ้าวันที่นี้ยังไม่มีลิสต์ ลองดูว่าเคยบันทึกไว้ตอนวันที่อื่นหรือไม่
      if (savedLists.length === 0) offerPlaylistRestoreIfAny();
    },
  );
}

// หา drop-zone จากชื่อหมวดหมู่ (เทียบตรง ๆ ไม่ใช้ selector จึงรองรับชื่อที่มีเครื่องหมายคำพูด)
function findDropZone(name) {
  return (
    Array.from(document.querySelectorAll(".drop-zone")).find(
      (z) => z.getAttribute("data-category") === name,
    ) || null
  );
}

// วาดกระดานจากรายการลิสต์ แล้วเติมเพลงที่ยังไม่อยู่ในลิสต์ใดเลย (เช่น มีคนขอเพลงหลังเซฟ) เข้ากองกลาง
// ข้อมูลเพลง (ชื่อ ศิลปิน แท็ก) ใช้ค่าล่าสุดจากรายการเพลงเสมอ ไม่ใช้ค่าเก่าในชีต
// คืนจำนวนเพลงที่เติมเข้ากองกลาง
function renderPlaylistBoard(savedLists, categoryOrder) {
  const pool = document.getElementById("list-pool");
  const board = document.getElementById("dynamic-board");
  pool.innerHTML = "";
  board.innerHTML = "";

  const poolNames = ["list-pool", "POOL", "กองกลาง"];
  const categoryNames = [
    ...new Set([
      ...(categoryOrder || []),
      ...savedLists.map((s) => s.listName),
    ]),
  ].filter((n) => !poolNames.includes(n));
  categoryNames.forEach((cat) => createCategoryBox(cat));

  savedLists.forEach((saved) => {
    const latest = currentSongs.find((x) => x.id === saved.id);
    const target = findDropZone(saved.listName) || pool;
    target.appendChild(createPlaylistItem(latest || saved));
  });

  const placed = new Set(
    Array.from(document.querySelectorAll(".drop-zone [data-id]")).map(
      (el) => el.dataset.id,
    ),
  );
  const missing = currentSongs
    .filter((s) => s.status !== "Played" && !placed.has(s.id))
    .sort((a, b) => b.votes - a.votes);
  missing.forEach((s) => pool.appendChild(createPlaylistItem(s)));

  updateListCounts();
  updateCollapseAllButton();
  initSortables();
  return missing.length;
}

// รวบรวมลิสต์ทั้งกระดาน (รวมกองกลาง) ในรูปแบบที่ส่งไปเซิร์ฟเวอร์
function collectPlaylistLists() {
  const lists = [];
  document.querySelectorAll(".drop-zone").forEach((zone) => {
    const listName = zone.getAttribute("data-category");
    Array.from(zone.children).forEach((el) => {
      const s = currentSongs.find((song) => song.id === el.dataset.id);
      if (s)
        lists.push({
          listName: listName,
          id: s.id,
          name: s.name,
          artist: s.artist,
          gender: s.gender,
          // ส่งเป็น true/false จริง (ค่าในชีตเป็น "Yes"/"No" ซึ่ง "No" ก็นับเป็นจริงในเซิร์ฟเวอร์)
          isBreakdance: s.isBreakdance === "Yes" || s.isBreakdance === true,
          time: `${s.start}-${s.end}`,
          link: s.link,
        });
    });
  });
  return lists;
}

// ---------- กู้คืนลิสต์ ----------
let restoreCandidates = [];

function offerPlaylistRestoreIfAny() {
  const eventId = activeEvent.id;
  fetchAPI(
    "listPlaylists",
    { eventId: eventId },
    (list) => {
      const orphan = (list || []).some(
        (x) =>
          x.kind === "main" &&
          x.count > 0 &&
          x.date !== "" &&
          x.date !== activeEvent.date,
      );
      if (orphan && activeEvent.id === eventId && currentViewId === "playlist") {
        showToast(t("toast_notice"), t("restore_found"), "info");
      }
    },
    null,
    true,
  );
}

function openPlaylistRestoreModal() {
  const box = document.getElementById("restore-list");
  if (box)
    box.innerHTML = `<div class="loader"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;
  openModal("playlistRestoreModal");
  fetchAPI(
    "listPlaylists",
    { eventId: activeEvent.id },
    (list) => {
      restoreCandidates = list || [];
      renderRestoreList();
    },
    (err) => {
      if (box)
        box.innerHTML = `<p class="text-center text-muted" style="padding: 20px 0;">${escapeHTML(err === "Invalid Action" ? t("need_deploy") : t("load_error"))}</p>`;
    },
  );
}

function renderRestoreList() {
  const box = document.getElementById("restore-list");
  if (!box) return;
  if (restoreCandidates.length === 0) {
    box.innerHTML = `<p class="text-center text-muted" style="padding: 20px 0;">${escapeHTML(t("restore_none"))}</p>`;
    return;
  }
  box.innerHTML = restoreCandidates
    .map((c, i) => {
      let title;
      if (c.kind === "backup")
        title = t("restore_kind_backup", { label: c.label || c.date });
      else if (!c.date || c.date === activeEvent.date)
        title = t("restore_kind_main_current");
      else title = t("restore_kind_main_other", { date: c.date });
      return `<div class="restore-item">
        <div class="restore-info"><strong>${escapeHTML(title)}</strong><span class="text-muted">${escapeHTML(t("restore_count", { n: c.count }))}</span></div>
        <button class="btn btn-outline btn-sm" onclick="loadPlaylistFromSheet(${i})">${escapeHTML(t("restore_load"))}</button>
      </div>`;
    })
    .join("");
}

function loadPlaylistFromSheet(i) {
  const cand = restoreCandidates[i];
  if (!cand) return;
  showCustomConfirm(t("restore_confirm_title"), t("restore_confirm_msg"), () => {
    fetchAPI(
      "getPlaylistBySheet",
      { eventId: activeEvent.id, sheetName: cand.sheetName },
      (rows) => {
        closeModal("playlistRestoreModal");
        renderPlaylistBoard(rows || []);
        showToast(t("toast_success"), t("restore_done"), "info");
      },
    );
  });
}

// ---------- สำรองลิสต์ ----------
function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}-${p(d.getMinutes())}`;
}

// บันทึกสำเนาสำรองเป็นชีตใหม่ ไม่ทับลิสต์หลัก
function backupPlaylistCopy() {
  const lists = collectPlaylistLists();
  if (lists.length === 0)
    return showToast(t("toast_notice"), t("backup_empty"), "error");
  openInputModal(t("backup_label_title"), nowStamp(), (label) => {
    fetchAPI(
      "savePlaylistBackup",
      { eventId: activeEvent.id, date: activeEvent.date, lists: lists, label: label },
      (res) => {
        showToast(
          t("toast_success"),
          t("backup_saved", { name: res && res.sheetName ? res.sheetName : label }),
          "success",
        );
      },
      (err) => {
        if (err === "Invalid Action")
          showToast(t("toast_notice"), t("need_deploy"), "error");
      },
    );
  });
}

// ดาวน์โหลดลิสต์ปัจจุบันเป็นไฟล์ CSV (เปิดใน Excel/Sheets ได้ ภาษาไทยไม่เพี้ยน)
function downloadPlaylistCSV() {
  const lists = collectPlaylistLists();
  if (lists.length === 0)
    return showToast(t("toast_notice"), t("backup_empty"), "error");
  const cell = (v) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // กันถูกตีเป็นสูตรเมื่อเปิดใน Excel
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [
    ["Category", "Order", "Song", "Artist", "Gender", "Breakdance", "Time", "Link"],
  ];
  lists.forEach((s, i) =>
    rows.push([
      s.listName,
      i + 1,
      s.name,
      s.artist,
      s.gender,
      s.isBreakdance ? "Yes" : "No",
      s.time,
      s.link,
    ]),
  );
  const csv = "\ufeff" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
  const safeName = (v) =>
    String(v ?? "").replace(/[\\/:*?"<>|]+/g, "").trim().slice(0, 40) || "event";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  a.download = `Delia-setlist-${safeName(activeEvent.name)}-${safeName(activeEvent.date)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  showToast(t("toast_success"), t("csv_done"), "success");
}

function addNewCategory() {
  openInputModal(t("category_name"), "K-Pop", (newTitle) => {
    if (
      !newTitle ||
      newTitle.toLowerCase() === "pool" ||
      newTitle === "list-pool" ||
      newTitle === "กองกลาง"
    )
      return;
    createCategoryBox(newTitle);
  });
}

// ==========================================
// ย่อ/ขยายกล่องลิสต์ (เหมือนพัดหน้าต่าง) + จำสถานะแยกตามงาน
// ==========================================
function collapseStorageKey() {
  return "delia_pl_collapsed_" + (activeEvent ? activeEvent.id : "");
}

function loadCollapsedNames() {
  try {
    const v = JSON.parse(localStorage.getItem(collapseStorageKey()) || "[]");
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

// บันทึกชื่อลิสต์ที่ถูกย่ออยู่ตอนนี้ (อ่านจากหน้าจอจริง)
function saveCollapsedState() {
  const names = Array.from(
    document.querySelectorAll(".dynamic-category.collapsed .drop-zone"),
  ).map((z) => z.getAttribute("data-category"));
  try {
    if (names.length) localStorage.setItem(collapseStorageKey(), JSON.stringify(names));
    else localStorage.removeItem(collapseStorageKey());
  } catch (e) {}
}

function clearCollapsedState() {
  try {
    localStorage.removeItem(collapseStorageKey());
  } catch (e) {}
}

function setCategoryCollapsed(col, collapsed) {
  col.classList.toggle("collapsed", collapsed);
  const btn = col.querySelector(".list-toggle");
  if (btn) btn.setAttribute("aria-expanded", String(!collapsed));
}

function toggleCategory(zoneId) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;
  const col = zone.parentElement;
  setCategoryCollapsed(col, !col.classList.contains("collapsed"));
  saveCollapsedState();
  updateCollapseAllButton();
}

// ปุ่มเดียวสลับ: ถ้ามีลิสต์ที่ยังขยายอยู่ = ย่อทั้งหมด ไม่งั้น = ขยายทั้งหมด
function toggleAllCategories() {
  const cols = Array.from(document.querySelectorAll(".dynamic-category"));
  if (!cols.length) return;
  const collapse = cols.some((c) => !c.classList.contains("collapsed"));
  cols.forEach((c) => setCategoryCollapsed(c, collapse));
  saveCollapsedState();
  updateCollapseAllButton();
}

function updateCollapseAllButton() {
  const btn = document.getElementById("btn-pl-collapse-all");
  if (!btn) return;
  const cols = Array.from(document.querySelectorAll(".dynamic-category"));
  const allCollapsed = cols.length > 0 && cols.every((c) => c.classList.contains("collapsed"));
  btn.disabled = cols.length === 0;
  const icon = btn.querySelector("i");
  if (icon) icon.className = allCollapsed ? "fa-solid fa-angles-down" : "fa-solid fa-angles-up";
  const label = btn.querySelector("span");
  if (label) label.innerText = t(allCollapsed ? "expand_all" : "collapse_all");
}

// ตัวเลขจำนวนเพลงบนหัวกล่อง (เห็นได้แม้ย่ออยู่)
function updateListCounts() {
  document.querySelectorAll(".dynamic-category").forEach((col) => {
    const zone = col.querySelector(".drop-zone");
    const badge = col.querySelector(".list-count");
    if (zone && badge) badge.innerText = zone.querySelectorAll(".playlist-item").length;
  });
}

function createCategoryBox(title) {
  const safeId = "cat-" + Date.now() + Math.floor(Math.random() * 1000);
  const col = document.createElement("div");
  col.className = "list-col dynamic-category";
  const startCollapsed = loadCollapsedNames().includes(title);
  if (startCollapsed) col.classList.add("collapsed");
  col.innerHTML = `
    <div class="list-col-header" title="${t("category_drag_hint")}">
      <button type="button" class="list-toggle" aria-expanded="${!startCollapsed}" title="${escapeHTML(t("toggle_list"))}" onclick="toggleCategory('${safeId}')"><i class="fa-solid fa-chevron-down"></i></button>
      <span class="list-count">0</span>
      <h3>${escapeHTML(title)} 
        <i class="fa-solid fa-pen text-muted" style="font-size:0.8rem; cursor:pointer; margin-left:8px;" onclick="renameCategory('${safeId}')"></i> 
        <i class="fa-solid fa-trash text-danger" style="font-size:0.8rem; cursor:pointer; margin-left:4px;" onclick="deleteCategory('${safeId}')"></i>
      </h3>
      <button class="btn btn-outline btn-full btn-sm" onclick="randomizeAlternate('${safeId}')"><i class="fa-solid fa-shuffle"></i> M/F</button>
    </div>
    <div id="${safeId}" class="drop-zone" data-category="${escapeHTML(title)}" data-drop-hint="${escapeHTML(t("drop_here"))}"></div>
  `;
  document.getElementById("dynamic-board").appendChild(col);
  updateCollapseAllButton();
  initSortables();
}

function renameCategory(zoneId) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;
  const oldTitle = zone.getAttribute("data-category");
  openInputModal(t("category_rename"), oldTitle, (newTitle) => {
    if (
      newTitle &&
      newTitle.toLowerCase() !== "pool" &&
      newTitle !== "กองกลาง"
    ) {
      zone.setAttribute("data-category", newTitle);
      saveCollapsedState();
      zone.previousElementSibling.querySelector("h3").innerHTML = `${escapeHTML(newTitle)} 
        <i class="fa-solid fa-pen text-muted" style="font-size:0.8rem; cursor:pointer; margin-left:8px;" onclick="renameCategory('${zoneId}')"></i> 
        <i class="fa-solid fa-trash text-danger" style="font-size:0.8rem; cursor:pointer; margin-left:4px;" onclick="deleteCategory('${zoneId}')"></i>`;
    }
  });
}

function removeCategoryBox(zone) {
  zone.parentElement.remove();
  saveCollapsedState();
  updateCollapseAllButton();
}

function deleteCategory(zoneId) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;
  const items = Array.from(zone.children);
  if (items.length > 0) {
    showCustomConfirm(
      t("confirm_delete"),
      t("delete_cat_msg"),
      () => {
        const pool = document.getElementById("list-pool");
        items.forEach((el) => pool.appendChild(el));
        removeCategoryBox(zone);
      },
    );
  } else {
    removeCategoryBox(zone);
  }
}

function confirmImportFromVotes() {
  showCustomConfirm(
    t("refetch_title"),
    t("refetch_msg"),
    () => {
      const pool = document.getElementById("list-pool");
      document
        .querySelectorAll(".dynamic-board .drop-zone")
        .forEach((zone) => (zone.innerHTML = ""));
      pool.innerHTML = "";
      currentSongs
        .filter((s) => s.status !== "Played")
        .sort((a, b) => b.votes - a.votes)
        .forEach((s) => {
          pool.appendChild(createPlaylistItem(s));
        });
      updateListCounts();
      showToast(t("toast_success"), t("refetch_done"));
    },
  );
}

function createPlaylistItem(song) {
  const div = document.createElement("div");
  div.className = "playlist-item";
  div.dataset.id = song.id;
  div.dataset.gender = song.gender || "Mix";
  div.dataset.bd =
    song.isBreakdance === "Yes" || song.isBreakdance === true
      ? "true"
      : "false";

  let tags = "";
  let originColor =
    song.origin === "T-Pop"
      ? "#FFF59D"
      : song.origin === "J-Pop"
        ? "#FFCC80"
        : "#E1BEE7";
  let originTextColor =
    song.origin === "T-Pop"
      ? "#F57F17"
      : song.origin === "J-Pop"
        ? "#E65100"
        : "#4A148C";
  tags += `<span class="tag" style="background:${originColor}; color:${originTextColor}; font-weight:600;">${escapeHTML(song.origin || "K-Pop")}</span> `;
  if (div.dataset.gender === "M") tags += `<span class="tag tag-m">M</span>`;
  else if (div.dataset.gender === "F")
    tags += `<span class="tag tag-f">F</span>`;
  else tags += `<span class="tag">Mix</span>`;
  if (div.dataset.bd === "true") tags += ` <span class="tag tag-bd">BD</span>`;
  const live = currentSongs.find((x) => x.id === song.id);
  if (live) {
    div.dataset.votes = live.votes;
    tags += ` <span class="tag tag-votes">♥ ${live.votes}</span>`;
    const tie = getTieInfo();
    const same = tie.counts[live.votes] || 0;
    if (live.status !== "Played" && live.votes >= tie.min && same >= 2) {
      tags += ` <span class="tag tag-tie" title="${escapeHTML(t("tie_tip", { m: same - 1 }))}">${escapeHTML(t("tie_badge", { n: same }))}</span>`;
    }
  }

  div.innerHTML = `
    <div style="display:flex; align-items:center; overflow:hidden; gap: 8px;">
      <img src="${getYTThumb(song.link)}" style="width:40px; height:24px; object-fit:cover; border-radius:4px;">
      <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
        <strong>${escapeHTML(song.name)}</strong><br><span style="font-size:0.75rem; color:#888;">${escapeHTML(song.artist)}</span>
      </div>
    </div>
    <div style="display:flex; gap:3px;">${tags}</div>
  `;
  return div;
}

function initSortables() {
  sortableLists.forEach((s) => s.destroy());
  sortableLists = [];
  if (boardSortable) boardSortable.destroy();

  boardSortable = new Sortable(document.getElementById("dynamic-board"), {
    animation: 150,
    handle: ".list-col-header",
    ghostClass: "sortable-ghost",
    delay: 2000,
    delayOnTouchOnly: false,
  });

  document.querySelectorAll(".drop-zone").forEach((zone) => {
    sortableLists.push(
      new Sortable(zone, {
        group: "shared",
        animation: 150,
        ghostClass: "sortable-ghost",
        delay: 150,
        delayOnTouchOnly: true,
        // ระหว่างลาก ลิสต์ที่ย่ออยู่จะโผล่เป็นแถบ "วางที่นี่" ให้ลากเพลงใส่ได้
        onStart: () => document.body.classList.add("pl-dragging"),
        onEnd: () => {
          document.body.classList.remove("pl-dragging");
          updateListCounts();
        },
        onAdd: updateListCounts,
        onRemove: updateListCounts,
      }),
    );
  });
}

function randomizeAlternate(containerId) {
  const container = document.getElementById(containerId);
  const items = Array.from(container.children);
  if (items.length < 2) return;
  const shuffle = (array) => array.sort(() => Math.random() - 0.5);
  let males = shuffle(items.filter((i) => i.dataset.gender === "M"));
  let females = shuffle(items.filter((i) => i.dataset.gender === "F"));
  let mixes = shuffle(
    items.filter((i) => i.dataset.gender !== "M" && i.dataset.gender !== "F"),
  );
  container.innerHTML = "";
  let mIdx = 0,
    fIdx = 0,
    mixIdx = 0,
    turn = "M";
  while (
    mIdx < males.length ||
    fIdx < females.length ||
    mixIdx < mixes.length
  ) {
    if (turn === "M") {
      if (mIdx < males.length) {
        container.appendChild(males[mIdx++]);
        turn = "F";
      } else turn = "F";
    } else if (turn === "F") {
      if (fIdx < females.length) {
        container.appendChild(females[fIdx++]);
        turn = "Mix";
      } else turn = "Mix";
    } else if (turn === "Mix") {
      if (mixIdx < mixes.length) {
        container.appendChild(mixes[mixIdx++]);
        turn = "M";
      } else turn = "M";
    }
  }
}

// ==========================================
// สุ่มเพลงทั้งหมดในกองกลาง (ทำในเครื่อง ไม่ต้องรอเซิร์ฟเวอร์)
// ==========================================
function shufflePool() {
  const pool = document.getElementById("list-pool");
  const items = Array.from(pool.children);
  if (items.length < 2)
    return showToast(t("toast_notice"), t("shuffle_need_2"), "error");
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  items.forEach((el) => pool.appendChild(el));
  showToast(t("toast_success"), t("pool_shuffled"), "success");
}

// ==========================================
// จัดลิสต์อัตโนมัติ: แอดมินพิมพ์ชื่อลิสต์ (เช่น Kpop1 Kpop2 Tpop1 BreakDance MixSong)
// ระบบสร้างลิสต์และดึงเพลงที่ตรงประเภทมาใส่ให้
// ==========================================
const AUTO_RESERVED_NAMES = ["pool", "list-pool", "กองกลาง"];

// เดาประเภทลิสต์จากชื่อ: kpop / tpop / jpop / bd (Dance Break) / mix (วงผสม) / other
function detectAutoType(name) {
  const key = String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/^(break|bd|dancebreak)/.test(key)) return "bd";
  if (/^mix/.test(key)) return "mix";
  if (/^kpop/.test(key)) return "kpop";
  if (/^tpop/.test(key)) return "tpop";
  if (/^jpop/.test(key)) return "jpop";
  return "other";
}

// "Kpop1, Kpop2 Tpop 1 BreakDance" -> [{name, type}] (ตัวเลขที่แยกอยู่จะต่อกับชื่อก่อนหน้า, ตัดชื่อซ้ำ)
function parseSetlistNames(text) {
  const out = [];
  const seen = new Set();
  String(text || "")
    .split(/[\s,;，、]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((tok) => {
      if (/^\d+$/.test(tok) && out.length && !/\d$/.test(out[out.length - 1].name)) {
        const prev = out.pop();
        seen.delete(prev.name.toLowerCase());
        tok = prev.name + tok;
      }
      const key = tok.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ name: tok, type: detectAutoType(tok) });
    });
  return out;
}

function autoSongOrigin(s) {
  const o = String(s.origin || "K-Pop").toLowerCase().replace(/[^a-z]/g, "");
  return o === "tpop" ? "tpop" : o === "jpop" ? "jpop" : o === "kpop" ? "kpop" : o;
}

// เรียงในลิสต์ให้สลับ ชาย → หญิง → อื่น ๆ (ลำดับในแต่ละกลุ่มคงตามเดิม คือโหวตมาก→น้อย)
function interleaveGenders(list) {
  const buckets = { M: [], F: [], O: [] };
  list.forEach((s) => (buckets[s.gender === "M" ? "M" : s.gender === "F" ? "F" : "O"]).push(s));
  const order = [buckets.M, buckets.F, buckets.O];
  const out = [];
  let i = 0;
  while (out.length < list.length) {
    const b = order[i % 3];
    if (b.length) out.push(b.shift());
    i++;
  }
  return out;
}

// ตัวคิดหลัก (ฟังก์ชันล้วน ไม่แตะหน้าเว็บ)
//   ลำดับความสำคัญ: BreakDance > Mix (เพศวงผสม) > ประเภท Kpop/Tpop/Jpop > ลิสต์ชื่ออื่น (รับเพลงที่เหลือ)
//   ลิสต์ประเภทเดียวกันแบ่งเพลงสลับกันไปทีละเพลง (เรียงตามโหวต) จึงได้จำนวนเท่า ๆ กัน
//   คืน { lists: [{name, type, songs}], leftover: [...] }
function buildAutoSetlist(specs, songs, opts) {
  opts = opts || {};
  const maxPer = parseInt(opts.maxPerList, 10) > 0 ? parseInt(opts.maxPerList, 10) : Infinity;
  const alternate = opts.alternate !== false;
  const isBD = (s) => s.isBreakdance === "Yes" || s.isBreakdance === true;
  const isMixGender = (s) => /^mix/i.test(String(s.gender || ""));

  const eligible = songs
    .filter((s) => s.status !== "Played")
    .map((s, i) => ({ s, i }))
    .sort((a, b) => (b.s.votes || 0) - (a.s.votes || 0) || a.i - b.i)
    .map((x) => x.s);

  const taken = new Set();
  const lists = specs.map((sp) => ({ name: sp.name, type: sp.type, songs: [] }));

  function deal(type, pick) {
    const targets = lists.filter((l) => l.type === type);
    if (!targets.length) return;
    let turn = 0;
    for (const s of eligible) {
      if (taken.has(s.id) || !pick(s)) continue;
      let tries = 0;
      while (tries < targets.length && targets[turn % targets.length].songs.length >= maxPer) {
        turn++;
        tries++;
      }
      if (tries >= targets.length) break; // ทุกลิสต์เต็มแล้ว
      targets[turn % targets.length].songs.push(s);
      taken.add(s.id);
      turn++;
    }
  }

  deal("bd", isBD);
  deal("mix", isMixGender);
  deal("kpop", (s) => autoSongOrigin(s) === "kpop");
  deal("tpop", (s) => autoSongOrigin(s) === "tpop");
  deal("jpop", (s) => autoSongOrigin(s) === "jpop");
  deal("other", () => true);

  if (alternate) lists.forEach((l) => (l.songs = interleaveGenders(l.songs)));
  return { lists, leftover: eligible.filter((s) => !taken.has(s.id)) };
}

function openAutoSetlistModal() {
  openModal("autoSetlistModal");
  setTimeout(() => {
    const el = document.getElementById("auto-names");
    if (el) el.focus();
  }, 100);
}

// ปุ่มลัดเพิ่มชื่อลิสต์ พร้อมเลขลำดับถัดไปให้
function addAutoChip(type) {
  const input = document.getElementById("auto-names");
  if (!input) return;
  const base = { kpop: "Kpop", tpop: "Tpop", jpop: "Jpop", bd: "BreakDance", mix: "MixSong" }[type];
  const used = parseSetlistNames(input.value).filter((x) => x.type === type).length;
  const name = type === "bd" || type === "mix" ? (used ? base + (used + 1) : base) : base + (used + 1);
  input.value = (input.value.trim() + " " + name).trim();
  input.focus();
}

function runAutoSetlist() {
  const all = parseSetlistNames(document.getElementById("auto-names").value);
  const specs = all.filter((x) => !AUTO_RESERVED_NAMES.includes(x.name.toLowerCase()));
  if (specs.length === 0)
    return showToast(t("toast_notice"), t("auto_need_names"), "error");
  if (currentSongs.length === 0)
    return showToast(t("toast_notice"), t("no_songs"), "error");

  const apply = () => {
    const res = buildAutoSetlist(specs, currentSongs, {
      maxPerList: document.getElementById("auto-max").value,
      alternate: document.getElementById("auto-alternate").checked,
    });
    const rows = [];
    res.lists.forEach((l) => l.songs.forEach((s) => rows.push(Object.assign({}, s, { listName: l.name }))));
    closeModal("autoSetlistModal");
    clearCollapsedState();
    renderPlaylistBoard(rows, specs.map((x) => x.name)); // เพลงที่เหลือถูกเติมเข้ากองกลางให้เอง
    showToast(
      t("toast_success"),
      t("auto_done", {
        summary: res.lists.map((l) => `${l.name} ${l.songs.length}`).join(" · "),
        left: res.leftover.length,
      }),
      "info",
    );
    const unknown = specs.filter((x) => x.type === "other").map((x) => x.name);
    if (unknown.length)
      showToast(t("toast_notice"), t("auto_unknown", { names: unknown.join(", ") }), "info");
  };

  const hasArranged = Array.from(document.querySelectorAll(".drop-zone")).some(
    (z) => z.id !== "list-pool" && z.children.length > 0,
  );
  if (hasArranged) showCustomConfirm(t("auto_confirm_title"), t("auto_confirm_msg"), apply);
  else apply();
}

function savePlaylistData() {
  const lists = collectPlaylistLists();
  const btnTop = document.getElementById("btn-save-playlist-top");
  const btnBot = document.getElementById("btn-save-playlist-bottom");
  if (btnTop) btnTop.disabled = true;
  if (btnBot) btnBot.disabled = true;
  fetchAPI(
    "savePlaylist",
    { eventId: activeEvent.id, date: activeEvent.date, lists: lists },
    (res) => {
      if (btnTop) btnTop.disabled = false;
      if (btnBot) btnBot.disabled = false;
      showToast(t("toast_success"), t("playlist_saved"));
    },
    () => {
      if (btnTop) btnTop.disabled = false;
      if (btnBot) btnBot.disabled = false;
    },
  );
}

function handleAddEvent() {
  const quotaInput = document.getElementById("event-quota");
  const p = {
    date: document.getElementById("event-date").value,
    name: document.getElementById("event-name").value,
    location: document.getElementById("event-loc").value,
    openTime: document.getElementById("event-open").value,
    closeTime: document.getElementById("event-close").value,
    details: document.getElementById("event-det").value,
    quota: quotaInput ? quotaInput.value : 3,
  };

  if (!p.date || !p.name)
    return showToast(t("toast_notice"), t("msg_fill_required"), "error");

  const btn = document.getElementById("btn-event-submit");
  if (btn) btn.disabled = true;

  fetchAPI(
    "createEvent",
    p,
    (res) => {
      currentEvents = res;
      renderCalendar();
      closeModal("addEventModal");
      showToast(t("toast_success"), t("event_created"), "success");
      if (btn) btn.disabled = false;
    },
    () => {
      if (btn) btn.disabled = false;
    },
  );
}

// ฟังก์ชันสำหรับเปิด Modal แก้ไขงานพร้อมดึงข้อมูลเดิมมาแสดงในฟอร์ม
window.openEditEventModal = function () {
  if (!activeEvent) return;
  document.getElementById("edit-event-id").value = activeEvent.id;

  // แปลงรูปแบบวันที่ให้อยู่ในฟอร์แมต YYYY-MM-DD เพื่อให้แสดงใน input type="date" ได้
  try {
    const d = new Date(activeEvent.date);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d - tzOffset).toISOString().split("T")[0];
    setPickerValue("edit-event-date", localISOTime);
  } catch (e) {
    setPickerValue("edit-event-date", activeEvent.date);
  }

  document.getElementById("edit-event-name").value = activeEvent.name || "";
  document.getElementById("edit-event-loc").value = activeEvent.location || "";

  // แปลงรูปแบบเวลาสำหรับ input type="datetime-local"
  const formatDateTime = (dtStr) => {
    if (!dtStr || dtStr === "-") return "";
    try {
      const dt = new Date(dtStr);
      if (isNaN(dt)) return "";
      const tzOffset = dt.getTimezoneOffset() * 60000;
      return new Date(dt - tzOffset).toISOString().slice(0, 16);
    } catch (e) {
      return "";
    }
  };

  setPickerValue("edit-event-open", formatDateTime(activeEvent.openTime));
  setPickerValue("edit-event-close", formatDateTime(activeEvent.closeTime));
  document.getElementById("edit-event-det").value = activeEvent.details || "";
  document.getElementById("edit-event-quota").value = activeEvent.quota || 3;

  openModal("editEventModal");
};

// ฟังก์ชันสำหรับส่งข้อมูลการแก้ไขงาน
window.handleEditEvent = function () {
  const p = {
    id: document.getElementById("edit-event-id").value,
    date: document.getElementById("edit-event-date").value,
    name: document.getElementById("edit-event-name").value,
    location: document.getElementById("edit-event-loc").value,
    openTime: document.getElementById("edit-event-open").value,
    closeTime: document.getElementById("edit-event-close").value,
    details: document.getElementById("edit-event-det").value,
    quota: document.getElementById("edit-event-quota").value,
  };

  if (!p.date || !p.name) {
    return showToast(t("toast_notice"), t("msg_fill_date_name"), "error");
  }

  const btn = document.getElementById("btn-event-edit-submit");
  if (btn) btn.disabled = true;

  fetchAPI(
    "editEvent",
    p,
    (res) => {
      currentEvents = res;
      activeEvent = currentEvents.find((e) => e.id === p.id);
      renderCalendar();
      renderUpcomingEvent();
      closeModal("editEventModal");
      showToast(t("toast_success"), t("event_updated"), "success");

      // อัปเดตชื่องานที่หน้าแสดงรายการเพลง (หากเปิดอยู่)
      if (currentViewId === "songs") {
        document.getElementById("view-event-title").innerText =
          activeEvent.name;
      }

      if (btn) btn.disabled = false;
    },
    () => {
      if (btn) btn.disabled = false;
    },
  );
};

function confirmDeleteEvent() {
  const id = document.getElementById("edit-event-id").value;
  showCustomConfirm(t("delete_event_title"), t("delete_event_msg"), () => {
    fetchAPI("deleteEvent", { id: id }, (res) => {
      currentEvents = res;
      renderCalendar();
      closeModal("editEventModal");
      showToast(t("toast_success"), t("event_deleted"), "success");
    });
  });
}

// ==========================================
// ระบบคำนวณและแสดง Upcoming Event
// ==========================================
function renderUpcomingEvent() {
  const container = document.getElementById("upcoming-event-container");
  if (!container || currentEvents.length === 0) return;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let upcomingEvents = currentEvents.filter((e) => {
    const evDate = new Date(e.date);
    evDate.setHours(0, 0, 0, 0);
    return evDate >= now;
  });

  upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (upcomingEvents.length > 0) {
    const nextEv = upcomingEvents[0];
    const d = new Date(nextEv.date);
    const dateStr = formatLongDate(d);
    const badgeText = t("upcoming_badge");
    const actionText = t("upcoming_action");

    container.innerHTML = `
      <div class="upcoming-card" onclick="openEventIntroUpcoming('${escapeHTML(nextEv.id)}')">
        <div class="upcoming-info">
          <div style="font-size: 0.75rem; font-weight: bold; background: rgba(255,255,255,0.25); padding: 3px 8px; border-radius: 12px; display: inline-block; margin-bottom: 8px;">
            <i class="fa-solid fa-star"></i> ${badgeText}
          </div>
          <h3>${escapeHTML(nextEv.name)}</h3>
          <p><i class="fa-regular fa-calendar"></i> ${dateStr} &nbsp;|&nbsp; <i class="fa-solid fa-location-dot"></i> ${escapeHTML(nextEv.location || "-")}</p>
        </div>
        <div class="upcoming-action">
          ${actionText} <i class="fa-solid fa-chevron-right"></i>
        </div>
      </div>
    `;
    container.style.display = "block";
  } else {
    container.style.display = "none";
  }
}

window.openEventIntroUpcoming = function (id) {
  const ev = currentEvents.find((e) => e.id === id);
  if (ev) openEventIntro(ev);
};

// ==========================================
// ระบบ Feedback Form
// ==========================================
let currentRatings = { songList: 0, place: 0, website: 0 };
let currentEventId = "";

function setRating(category, score) {
  currentRatings[category] = score;
  const stars = document.querySelectorAll(
    `.rating-stars[data-category="${category}"] .star`,
  );
  stars.forEach((star, index) => {
    if (index < score) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

function checkAndShowFeedbackModal(eventId) {
  const dontShowDate = localStorage.getItem(`hideFeedback_${eventId}`);
  const today = new Date().toDateString();

  if (dontShowDate !== today) {
    const modal = document.getElementById("feedbackModal");
    if (modal) {
      modal.classList.remove("hidden"); // 🌟 บังคับเอา hidden ออกก่อนเผื่อค้าง
      openModal("feedbackModal"); // ใช้ระบบเปิด Modal หลักของเว็บ
    }
  }
}

function skipFeedback() {
  saveDontShowPreference();
  closeFeedbackModal();
}

function closeFeedbackModal() {
  closeModal("feedbackModal");
  // อัปเดต URL ลบ &view=feedback ออก เผื่อย้อนกลับหรือรีเฟรช
  if (currentEventId) {
    window.history.replaceState(
      {},
      "",
      window.location.pathname + "?eventId=" + currentEventId,
    );
  }
}

function saveDontShowPreference() {
  const chk = document.getElementById("chkDontShowToday");
  if (chk && chk.checked) {
    const today = new Date().toDateString();
    localStorage.setItem(`hideFeedback_${currentEventId}`, today);
  }
}

function handleFeedbackSubmit(e) {
  e.preventDefault();
  saveDontShowPreference();

  const btnSubmit = document.getElementById("btnSubmitFeedback");
  const originalText = btnSubmit.innerHTML;
  btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t("msg_sending")}`;
  btnSubmit.disabled = true;

  const feedbackData = {
    eventId: currentEventId,
    ratings: currentRatings,
    uuid: userUUID, // 🌟 เพิ่มบรรทัดนี้
    username: userName || "ผู้ใช้งานทั่วไป", // 🌟 เพิ่มบรรทัดนี้
    timestamp: new Date().toLocaleString("en-GB"), // 🌟 เพิ่มบรรทัดนี้
    comments: {
      songList: document.getElementById("fbSongListComment").value,
      place: document.getElementById("fbPlaceComment").value,
      website: document.getElementById("fbWebsiteComment").value,
      additional: document.getElementById("fbAdditionalComment").value,
    },
  };

  fetchAPI("saveFeedback", feedbackData, (res) => {
    // 🌟 บันทึกว่ายูสเซอร์คนนี้ กรอกฟอร์มของงานนี้ไปแล้ว
    if (userUUID) {
      localStorage.setItem(
        `feedbackSubmitted_${currentEventId}_${userUUID}`,
        "true",
      );
    }

    showToast(t("toast_success"), t("feedback_thanks"), "success");
    closeFeedbackModal();
    btnSubmit.innerHTML = originalText;
    btnSubmit.disabled = false;
  });
}

function openAdminFeedbackDashboard() {
  const targetEventId = activeEvent ? activeEvent.id : currentEventId;
  if (!targetEventId) {
    return showToast(t("toast_notice"), t("event_not_found"), "warning");
  }

  // 🌟 ใช้ระบบเปิด Modal หลักของเว็บเพื่อให้แสดงผลถูกต้อง (.active)
  openModal("adminFeedbackDashboardModal");

  const container = document.getElementById("feedbackListContainer");
  if (container)
    container.innerHTML = `<div class="loader"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>`;

  fetchAPI(
    "getFeedback",
    { eventId: targetEventId },
    (data) => {
      renderDashboardData(data);
    },
    (err) => {
      if (container)
        container.innerHTML = `<p class="text-center text-danger">${t("load_error")}</p>`;
    },
  );
}

function closeAdminFeedbackModal() {
  // 🌟 ใช้ระบบปิด Modal หลักของเว็บ
  closeModal("adminFeedbackDashboardModal");
}

function openAdminAddSongModal() {
  ["song-link", "song-name", "song-artist", "song-start", "song-end"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    },
  );

  const bdChk = document.getElementById("song-breakdance");
  if (bdChk) bdChk.checked = false;

  const dpSel = document.getElementById("song-dance-part");
  if (dpSel) dpSel.value = "Hook 1";

  toggleTimeInputs("add");
  resetSongForm("add");

  openModal("addSongModal");
}

function closeAdminFeedbackModal() {
  // 🌟 ใช้ระบบปิด Modal หลักของเว็บ
  closeModal("adminFeedbackDashboardModal");
}

function renderDashboardData(data) {
  const sList = document.getElementById("avgSongList");
  const sPlace = document.getElementById("avgPlace");
  const sWeb = document.getElementById("avgWebsite");

  if (sList) sList.innerText = `${data.avgSongList || "0.0"} / 5`;
  if (sPlace) sPlace.innerText = `${data.avgPlace || "0.0"} / 5`;
  if (sWeb) sWeb.innerText = `${data.avgWebsite || "0.0"} / 5`;

  // 🌟 คำนวณสถิติ
  // นับจำนวนผู้ขอเพลงแบบไม่ซ้ำคน จาก currentSongs ที่โหลดไว้อยู่แล้ว
  const uniqueRequesters = new Set(currentSongs.map((s) => s.creator)).size;
  const responders = data.comments ? data.comments.length : 0;
  const percent =
    uniqueRequesters === 0
      ? 0
      : ((responders / uniqueRequesters) * 100).toFixed(1);

  document.getElementById("stat-requesters").innerText = uniqueRequesters;
  document.getElementById("stat-responders").innerText = responders;
  document.getElementById("stat-percent").innerText = percent;

  const container = document.getElementById("feedbackListContainer");
  if (!container) return;
  container.innerHTML = "";

  if (data.comments && data.comments.length > 0) {
    data.comments.forEach((item) => {
      container.innerHTML += `
        <div class="feedback-item-card" style="background: #fff; border: 1px solid #eee; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <div style="font-weight: bold; color: var(--primary); margin-bottom: 10px; border-bottom: 1px dashed #ddd; padding-bottom: 5px;">
            <i class="fa-solid fa-user"></i> ${escapeHTML(item.username)} 
            <span style="font-size: 0.75rem; color: #aaa; float: right; font-weight: normal;">${escapeHTML(item.timestamp)}</span>
          </div>
          <div style="font-size: 0.9rem; margin-bottom: 4px;"><strong>1. Song List:</strong> <span style="color: #555;">${escapeHTML(item.songList)}</span></div>
          <div style="font-size: 0.9rem; margin-bottom: 4px;"><strong>2. Place:</strong> <span style="color: #555;">${escapeHTML(item.place)}</span></div>
          <div style="font-size: 0.9rem; margin-bottom: 4px;"><strong>3. Website:</strong> <span style="color: #555;">${escapeHTML(item.website)}</span></div>
          <div style="font-size: 0.9rem;"><strong>4. Additional:</strong> <span style="color: #555;">${escapeHTML(item.additional)}</span></div>
        </div>
      `;
    });
  } else {
    container.innerHTML = `<p class="text-center text-muted" style="padding: 20px 0;">${t("no_feedback")}</p>`;
  }
}

function toggleLanguage() {
  const newLang = currentLang === "th" ? "en" : "th";
  setLanguage(newLang);

  // แสดง Toast แจ้งเตือนการเปลี่ยนภาษาเบาๆ (ปุ่มภาษาบน Navbar อัปเดตใน setLanguage แล้ว)
  showToast(t("lang_changed_title"), t("lang_changed_msg"), "success");
}

let currentQuickFilter = "all";
let currentActivityTab = "all";
let duplicateSongTarget = null;

function setQuickFilter(filter) {
  currentQuickFilter = filter;
  document
    .querySelectorAll(".filter-pill")
    .forEach((b) => b.classList.remove("active"));
  event.currentTarget.classList.add("active");
  filterSongs();
}

function setActivityTab(tab) {
  currentActivityTab = tab;
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  event.currentTarget.classList.add("active");
  filterSongs();
}

let globalMemberMap = {};

// ตั้งหัวข้อ Leaderboard ให้ตรงโหมด (รายงาน/รวมทุกงาน) และตรงภาษา
function setLeaderboardTitles(isGlobal) {
  document
    .querySelectorAll("#leaderboardModal h2")
    .forEach(
      (h) => (h.innerText = t(isGlobal ? "lb_global_title" : "leaderboard_title")),
    );
  document
    .querySelectorAll("#leaderboardModal .lb-sub")
    .forEach(
      (p) => (p.innerText = t(isGlobal ? "lb_global_sub" : "leaderboard_sub")),
    );
}

function lbScore(u) {
  return u.receivedVotes * 3 + u.requestedCount * 2 + u.votedCount;
}

// ล้างสถานะท้ายตาราง (ข้อความรอโหลด + เอฟเฟกต์ฉลองรอบก่อน)
function resetLeaderboardFooter() {
  const footer = document.getElementById("my-rank-footer");
  if (footer) {
    footer.classList.remove("my-rank-top3");
    footer.innerText = t("lb_loading_me");
  }
  const layer = document.getElementById("lb-confetti");
  if (layer) layer.innerHTML = "";
  const trophy = document.getElementById("lb-trophy");
  if (trophy) trophy.classList.remove("celebrate");
}

// แสดงอันดับปัจจุบันของผู้ใช้ท้ายตาราง (ใช้ทั้ง Leaderboard ของงานและของภาพรวม)
// leaderboardData ต้องเรียงตามคะแนนแล้ว และกรองแอดมินออกแล้ว
function renderMyRank(leaderboardData) {
  const footer = document.getElementById("my-rank-footer");
  if (!footer) return;
  footer.classList.remove("my-rank-top3");

  if (isAdminLoggedIn) {
    footer.innerHTML = t("lb_admin_note2");
    return;
  }
  if (!userUUID) {
    footer.innerText = t("lb_login_to_rank");
    return;
  }

  let idx = leaderboardData.findIndex((u) => isMyLeaderboardId(u.id));
  if (idx === -1 && userName) {
    idx = leaderboardData.findIndex(
      (u) => u.username.toLowerCase() === userName.toLowerCase(),
    );
  }
  if (idx === -1) {
    footer.innerHTML = t("lb_not_listed");
    return;
  }

  const me = leaderboardData[idx];
  const rank = idx + 1;
  const score = lbScore(me);
  let html = t("lb_my_rank", {
    rank: rank,
    name: escapeHTML(me.username),
    score: score,
  });
  if (idx > 0) {
    const need = lbScore(leaderboardData[idx - 1]) - score + 1; // ต้องได้เกินคนข้างหน้า
    html += `<div class="my-rank-gap">${escapeHTML(t("lb_gap", { n: need, rank: idx }))}</div>`;
  }
  if (rank <= 3) {
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
    html = `<div class="my-rank-congrats">${escapeHTML(t("lb_congrats", { medal: medal }))}</div>` + html;
    footer.classList.add("my-rank-top3");
    celebrateTop3();
  }
  footer.innerHTML = html;
}

// อนิเมชันแสดงความยินดีเล็ก ๆ (คอนเฟตติ + ถ้วยเด้ง) ปิดเองถ้าผู้ใช้ตั้งค่าลดการเคลื่อนไหว
function celebrateTop3() {
  const reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  const layer = document.getElementById("lb-confetti");
  if (layer) {
    layer.innerHTML = "";
    const pieces = ["🎉", "✨", "🏆", "⭐", "💖", "🎊"];
    for (let i = 0; i < 26; i++) {
      const el = document.createElement("span");
      el.className = "confetti-piece";
      el.textContent = pieces[i % pieces.length];
      el.style.left = Math.random() * 100 + "%";
      el.style.animationDelay = Math.random() * 0.6 + "s";
      el.style.animationDuration = 1.8 + Math.random() * 1.4 + "s";
      el.style.fontSize = 14 + Math.random() * 14 + "px";
      layer.appendChild(el);
    }
    setTimeout(() => {
      layer.innerHTML = "";
    }, 4200);
  }
  const trophy = document.getElementById("lb-trophy");
  if (trophy) {
    trophy.classList.remove("celebrate");
    void trophy.offsetWidth; // ให้เริ่มอนิเมชันใหม่ได้ทุกครั้งที่เปิด
    trophy.classList.add("celebrate");
  }
}

function openLeaderboardModal() {
  const tbody = document.getElementById("leaderboard-tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> ${t("lb_loading")}</td></tr>`;
  setLeaderboardTitles(false);
  resetLeaderboardFooter();

  openModal("leaderboardModal");

  // ดึงข้อมูลสมาชิกจากชีต Members มาจับคู่ Email กับ Username
  fetchAPI(
    "getMembers",
    {},
    (memberMap) => {
      globalMemberMap = memberMap || {};
      processAndRenderLeaderboard();
    },
    () => {
      globalMemberMap = {};
      processAndRenderLeaderboard();
    },
  );
}

function processAndRenderLeaderboard() {
  const tbody = document.getElementById("leaderboard-tbody");
  if (!tbody) return;

  let userStatsMap = {};

  currentSongs.forEach((song) => {
    // 1. ประมวลผลผู้ขอเพลง
    if (song.creator) {
      let creatorKey = song.creator.trim().toLowerCase();
      // ดึง Username จากชีต Members โดยเทียบจาก Email (creatorKey)
      let displayName =
        globalMemberMap[creatorKey] || song.creatorName || song.creator;

      if (!userStatsMap[creatorKey]) {
        userStatsMap[creatorKey] = {
          id: creatorKey,
          username: displayName,
          requestedCount: 0,
          votedCount: 0,
          receivedVotes: 0,
        };
      } else {
        if (globalMemberMap[creatorKey]) {
          userStatsMap[creatorKey].username = globalMemberMap[creatorKey];
        }
      }
      userStatsMap[creatorKey].requestedCount += 1;
      userStatsMap[creatorKey].receivedVotes += song.votes || 0;
    }

    // 2. ประมวลผลผู้กดโหวต (Voters)
    if (song.voters) {
      let voterList = Array.isArray(song.voters)
        ? song.voters
        : song.voters.split(",").filter((v) => v !== "");
      voterList.forEach((voterId) => {
        let voterKey = voterId.trim().toLowerCase();
        let displayVoterName = globalMemberMap[voterKey] || voterId;

        if (!userStatsMap[voterKey]) {
          userStatsMap[voterKey] = {
            id: voterKey,
            username: displayVoterName,
            requestedCount: 0,
            votedCount: 0,
            receivedVotes: 0,
          };
        }
        userStatsMap[voterKey].votedCount += 1;
      });
    }
  });

  // กรอง Admin ออกจากการจัดอันดับ
  let leaderboardData = Object.values(userStatsMap)
    .filter((user) => {
      let lowerName = user.username.toLowerCase();
      return !lowerName.startsWith("admin") && lowerName !== "admin";
    })
    .sort((a, b) => {
      let scoreA = a.receivedVotes * 3 + a.requestedCount * 2 + a.votedCount;
      let scoreB = b.receivedVotes * 3 + b.requestedCount * 2 + b.votedCount;
      return scoreB - scoreA;
    });

  let top5 = leaderboardData.slice(0, 5);

  if (top5.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 20px;">${t("lb_empty")}</td></tr>`;
    document.getElementById("my-rank-footer").innerHTML = isAdminLoggedIn
      ? t("lb_admin_note1")
      : t("lb_no_rank");
    return;
  }

  tbody.innerHTML = "";
  top5.forEach((user, index) => {
    let rankBadge =
      index === 0
        ? "🥇"
        : index === 1
          ? "🥈"
          : index === 2
            ? "🥉"
            : `#${index + 1}`;
    let displayName = user.username;

    let currentEmailKey = userUUID ? userUUID.trim().toLowerCase() : "";
    let isMe =
      isMyLeaderboardId(user.id) ||
      user.username.toLowerCase() === userName.toLowerCase();
    let totalScore =
      user.receivedVotes * 3 + user.requestedCount * 2 + user.votedCount;

    let tr = document.createElement("tr");

    if (index === 0) tr.className = "leaderboard-row-top1";
    else if (index === 1) tr.className = "leaderboard-row-top2";
    else if (index === 2) tr.className = "leaderboard-row-top3";
    else tr.style.borderBottom = "1px solid var(--border-color)";

    if (isMe) {
      tr.style.outline = "2px dashed var(--primary)";
    }

    tr.innerHTML = `
      <td style="padding: 10px 8px; font-weight: bold;">${rankBadge}</td>
      <td style="padding: 10px 8px; font-weight: 600; color: var(--dark);">${escapeHTML(displayName)} ${isMe ? t("lb_you") : ""}</td>
      <td style="padding: 10px 8px; text-align: center;">${user.requestedCount}</td>
      <td style="padding: 10px 8px; text-align: center;">${user.votedCount}</td>
      <td style="padding: 10px 8px; text-align: center; font-weight: bold; color: var(--primary);">${totalScore}</td>
    `;
    tbody.appendChild(tr);
  });

  // แสดงลำดับของผู้ใช้งานปัจจุบันที่ด้านล่าง Modal (+ ฉลองถ้าติด Top 3)
  renderMyRank(leaderboardData);
}
function openGlobalLeaderboardModal() {
  const tbody = document.getElementById("leaderboard-tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> ${t("lb_global_loading")}</td></tr>`;

  // เปลี่ยนหัวข้อ Modal ให้รู้ว่าเป็นอันดับรวม
  setLeaderboardTitles(true);
  resetLeaderboardFooter();

  openModal("leaderboardModal");

  fetchAPI(
    "getGlobalLeaderboard",
    {},
    (res) => {
      processAndRenderGlobalLeaderboard(res.songs, res.members);
    },
    () => {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 20px;">${t("lb_load_fail")}</td></tr>`;
    },
  );
}

function processAndRenderGlobalLeaderboard(songs, memberMap) {
  const tbody = document.getElementById("leaderboard-tbody");
  if (!tbody) return;

  let userStatsMap = {};

  songs.forEach((song) => {
    // 1. ประมวลผลผู้ขอเพลงรวมทุกงาน
    if (song.creator) {
      let creatorKey = song.creator.trim().toLowerCase();
      let rawName = memberMap[creatorKey] || song.creator;
      let displayName = rawName.includes("@") ? rawName.split("@")[0] : rawName;

      if (!userStatsMap[creatorKey]) {
        userStatsMap[creatorKey] = {
          id: creatorKey,
          username: displayName,
          requestedCount: 0,
          votedCount: 0,
          receivedVotes: 0,
        };
      }
      userStatsMap[creatorKey].requestedCount += 1;
      userStatsMap[creatorKey].receivedVotes += song.votes || 0;
    }

    // 2. ประมวลผลผู้กดโหวตรวมทุกงาน
    if (song.voters) {
      let voterList = Array.isArray(song.voters)
        ? song.voters
        : song.voters.split(",").filter((v) => v !== "");
      voterList.forEach((voterId) => {
        let voterKey = voterId.trim().toLowerCase();
        let rawVoterName = memberMap[voterKey] || voterId;
        let displayVoterName = rawVoterName.includes("@")
          ? rawVoterName.split("@")[0]
          : rawVoterName;

        if (!userStatsMap[voterKey]) {
          userStatsMap[voterKey] = {
            id: voterKey,
            username: displayVoterName,
            requestedCount: 0,
            votedCount: 0,
            receivedVotes: 0,
          };
        }
        userStatsMap[voterKey].votedCount += 1;
      });
    }
  });

  // กรอง Admin ออกและจัดเรียงคะแนน
  let leaderboardData = Object.values(userStatsMap)
    .filter((user) => {
      let lowerName = user.username.toLowerCase();
      return !lowerName.startsWith("admin") && lowerName !== "admin";
    })
    .sort((a, b) => {
      let scoreA = a.receivedVotes * 3 + a.requestedCount * 2 + a.votedCount;
      let scoreB = b.receivedVotes * 3 + b.requestedCount * 2 + b.votedCount;
      return scoreB - scoreA;
    });

  let top5 = leaderboardData.slice(0, 5);
  tbody.innerHTML = "";

  if (top5.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 20px;">${t("lb_empty")}</td></tr>`;
    renderMyRank(leaderboardData);
    return;
  }

  top5.forEach((user, index) => {
    let rankBadge =
      index === 0
        ? "🥇"
        : index === 1
          ? "🥈"
          : index === 2
            ? "🥉"
            : `#${index + 1}`;
    let totalScore =
      user.receivedVotes * 3 + user.requestedCount * 2 + user.votedCount;
    let currentEmailKey = userUUID ? userUUID.trim().toLowerCase() : "";
    let isMe = isMyLeaderboardId(user.id);

    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="padding: 10px 8px; font-weight: bold;">${rankBadge}</td>
      <td style="padding: 10px 8px; font-weight: 600;">${escapeHTML(user.username)} ${isMe ? t("lb_you") : ""}</td>
      <td style="padding: 10px 8px; text-align: center;">${user.requestedCount}</td>
      <td style="padding: 10px 8px; text-align: center;">${user.votedCount}</td>
      <td style="padding: 10px 8px; text-align: center; font-weight: bold; color: var(--primary);">${totalScore}</td>
    `;
    tbody.appendChild(tr);
  });

  renderMyRank(leaderboardData);
}
