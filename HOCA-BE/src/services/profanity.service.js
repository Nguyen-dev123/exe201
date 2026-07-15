/**
 * Bộ lọc từ ngữ thô tục cho chat phòng học.
 *
 * - containsProfanity(text): kiểm tra có chứa từ cấm không
 * - cleanText(text): che các từ cấm bằng dấu *
 *
 * Cách hoạt động: tách câu thành các "từ" theo khoảng trắng / dấu câu,
 * rồi so khớp CHÍNH XÁC từng từ với danh sách cấm. Nhờ vậy "cc" đứng riêng
 * sẽ bị bắt, nhưng "success" (có chứa cc) thì KHÔNG bị chặn nhầm.
 */

// Danh sách từ cấm (đã chuẩn hóa chữ thường). Bao gồm tiếng Việt có dấu,
// không dấu và các kiểu viết tắt phổ biến.
const BAD_WORDS = [
  // ===== Viết tắt teen code / chửi tục =====
  "cc",
  "cl",
  "cak",
  "caxk",
  "clm",
  "clmm",
  "clgt",
  "cmm",
  "cmn",
  "cml",
  "cmnl",
  "cmnr",
  "dm",
  "đm",
  "dmm",
  "đmm",
  "dmmm",
  "dcm",
  "đcm",
  "dkm",
  "đkm",
  "dvcm",
  "đvcm",
  "ditme",
  "ditmoe",
  "vl",
  "vcl",
  "vkl",
  "vcc",
  "vlol",
  "vloz",
  "vlin",
  "vch",
  "đbrr",
  "dbrr",
  "ngu",
  "occho",
  "sml",
  "smn",
  "đjt",
  "djt",
  "dis",
  "loz",
  "lozz",
  "lol",
  "bcs",
  "đệch",
  "dech",
  "đếch",
  // ===== Cụm từ chửi (có khoảng trắng) - bao gồm viết tắt "m" = mày/mẹ =====
  "mẹ mày",
  "me may",
  "mẹ m",
  "me m",
  "má mày",
  "ma may",
  "má m",
  "ma m",
  "địt mẹ",
  "dit me",
  "địt m",
  "dit m",
  "địt mày",
  "dit may",
  "đụ má",
  "du ma",
  "đụ mẹ",
  "du me",
  "đụ m",
  "du m",
  "đm mày",
  "đậu má",
  "dau ma",
  "đậu mẹ",
  "dau me",
  "vãi lồn",
  "vai lon",
  "vãi cặc",
  "vai cac",
  "vãi lz",
  "vai l",
  "vãi cả",
  "óc chó",
  "oc cho",
  "óc lợn",
  "oc lon",
  "chó chết",
  "cho chet",
  "chó đẻ",
  "cho de",
  "thằng chó",
  "thang cho",
  "con chó",
  "con cho",
  "con điếm",
  "con diem",
  "khốn nạn",
  "khon nan",
  "khốn kiếp",
  "khon kiep",
  "súc vật",
  "suc vat",
  "đồ ngu",
  "do ngu",
  "đồ chó",
  "do cho",
  "đần độn",
  "dan don",
  "ngu ngốc",
  "ngu ngoc",
  "ngu si",
  "đồ điên",
  "do dien",
  "mất dạy",
  "mat day",
  "vô học",
  "vo hoc",
  "đầu buồi",
  "dau buoi",
  "đầu bòi",
  "dau boi",
  "cái lồn",
  "cai lon",
  "cái đầu buồi",
  "im mồm",
  "im mom",
  "câm mồm",
  "cam mom",
  "câm miệng",
  // ===== Tiếng Việt có dấu (từ đơn) =====
  "địt",
  "đụ",
  "cặc",
  "cặk",
  "lồn",
  "buồi",
  "buồ",
  "đĩ",
  "điếm",
  "đéo",
  "đếu",
  "cứt",
  "vãi",
  "đểu",
  // ===== Tiếng Việt không dấu (từ đơn) =====
  "dit",
  "cac",
  "cak",
  "buoi",
  "deo",
  "deu",
  "cut",
  // ===== Tiếng Anh phổ biến =====
  "fuck",
  "fck",
  "fuk",
  "fucking",
  "shit",
  "bitch",
  "asshole",
  "dick",
  "bastard",
  "cunt",
  "motherfucker",
  "wtf",
  "stfu",
  "dumbass",
];

// Cụm từ cấm có chứa khoảng trắng (so khớp theo ranh giới từ, không dùng includes thô)
const BAD_PHRASES = BAD_WORDS.filter((w) => w.includes(" "));
// Từ đơn (so khớp token chính xác)
const BAD_SINGLE = new Set(BAD_WORDS.filter((w) => !w.includes(" ")));

const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFC");

// Ký tự ngăn cách giữa các "từ"
const SEP = "\\s.,!?;:()\\[\\]{}\"'`~/\\\\|@#$%^&*\\-_=+<>";

const escapeRegex = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Build regex cho cụm từ: cụm phải nằm giữa ranh giới (đầu/cuối chuỗi hoặc dấu phân cách).
// Nhờ vậy "mẹ m" KHÔNG khớp "mẹ mình", nhưng khớp "mẹ m" hoặc "đồ mẹ m mày".
const buildPhraseRegex = (phrase) =>
  new RegExp(`(^|[${SEP}])(${escapeRegex(phrase)})(?=$|[${SEP}])`, "giu");

// Tách câu thành các token (từ) — phần ngăn cách là khoảng trắng và dấu câu.
const tokenize = (text) =>
  normalize(text)
    .split(new RegExp(`[${SEP}]+`))
    .filter(Boolean);

/**
 * Có chứa từ cấm không?
 */
const containsProfanity = (text) => {
  if (!text) return false;
  const lower = normalize(text);

  // Kiểm tra cụm từ cấm (theo ranh giới từ)
  for (const phrase of BAD_PHRASES) {
    const re = buildPhraseRegex(phrase);
    if (re.test(lower)) return true;
  }

  // Kiểm tra từng từ đơn
  const tokens = tokenize(text);
  return tokens.some((t) => BAD_SINGLE.has(t));
};

/**
 * Che các từ cấm bằng dấu * (giữ nguyên độ dài).
 */
const cleanText = (text) => {
  if (!text) return text;
  let result = String(text);

  // Che cụm từ cấm trước (giữ lại ký tự ranh giới phía trước)
  for (const phrase of BAD_PHRASES) {
    const re = buildPhraseRegex(phrase);
    result = result.replace(re, (full, pre, match) => {
      return pre + "*".repeat(match.length);
    });
  }

  // Che từng từ đơn: thay thế token khớp, giữ nguyên dấu phân cách
  result = result.replace(new RegExp(`[^${SEP}]+`, "g"), (word) => {
    if (BAD_SINGLE.has(word.toLowerCase())) {
      return "*".repeat(word.length);
    }
    return word;
  });

  return result;
};

module.exports = {
  containsProfanity,
  cleanText,
  BAD_WORDS,
};
