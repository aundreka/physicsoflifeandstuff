/** =========================
 *  CONFIG (HOME)
 *  ========================= */
const CONFIG = {
  HOME_SHEET: "home",
  GALLERY_SHEET: "home_gallery",
  DRIVE_FOLDER_ID: "1UhyYSQpaiC_FBPz-SdUwbv4_FNlr4fto",
  HOME_HEADER: { key: "key", value: "value" },
  GALLERY_HEADERS: { src: "src", alt: "alt", sort: "sort", status: "status" },
  APPROVED_STATUS: "approved",
  ARCHIVED_STATUS: "archived",
  FILENAME_EXT: "png",
  MAX_FILES: 999,
};

/** =========================
 *  CONFIG (ABOUT)
 *  ========================= */
const ABOUT_CFG = {
  HTML_FILE: "CMS", // unified html file name

  IMAGE_FOLDER_ID: "1PqXGCLw3MIagXAU3HudbfNyu1LO2MtDP",

  SHEETS: {
    about_bullets: { id: "id", fields: ["text"], sort: "sort", status: "status" },
    about_stats:   { id: "id", fields: ["label", "value"], sort: "sort", status: "status" },
    about_images:  { id: "id", fields: ["src", "alt"], sort: "sort", status: "status" },
    about_focus:   { id: "id", fields: ["title", "body"], sort: "sort", status: "status" },
    about_links:   { id: "id", fields: ["label", "href"], sort: "sort", status: "status" },
  },

  FILTER_OUT_ARCHIVED: false,
};



/** =========================
 *  HELPERS (HOME)
 *  ========================= */
function _getSheetOrThrow_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error(`Sheet "${name}" not found.`);
  return sh;
}
function _normalize_(s) {
  return String(s || "").trim().toLowerCase();
}
function _headerMap_(headersRow) {
  const map = {};
  headersRow.forEach((h, i) => (map[_normalize_(h)] = i + 1));
  return map;
}
function _requireHeaders_(map, required) {
  const missing = [];
  for (const k of Object.values(required)) {
    if (!map[_normalize_(k)]) missing.push(k);
  }
  if (missing.length) throw new Error(`Missing required headers: ${missing.join(", ")}`);
}
function _makeUcViewUrl_(fileId) {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/** =========================
 *  HOME: READ + SAVE
 *  ========================= */
function getHomeEntries() {
  const sh = _getSheetOrThrow_(CONFIG.HOME_SHEET);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2) return [];

  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = _headerMap_(headers);
  _requireHeaders_(map, CONFIG.HOME_HEADER);

  const keyCol = map[_normalize_(CONFIG.HOME_HEADER.key)];
  const valCol = map[_normalize_(CONFIG.HOME_HEADER.value)];

  const values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const out = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const key = row[keyCol - 1];
    if (!key) continue;
    out.push({
      rowIndex: i + 2,
      key: String(key),
      value: row[valCol - 1] == null ? "" : String(row[valCol - 1]),
    });
  }
  return out;
}

/**
 * updates: [{ rowIndex, value }]
 * Does NOT touch key column.
 */
function saveHomeEntries(updates) {
  if (!Array.isArray(updates)) throw new Error("Invalid updates payload.");

  const sh = _getSheetOrThrow_(CONFIG.HOME_SHEET);
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = _headerMap_(headers);
  _requireHeaders_(map, CONFIG.HOME_HEADER);

  const valCol = map[_normalize_(CONFIG.HOME_HEADER.value)];

  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    updates.forEach((u) => {
      if (!u || !u.rowIndex) return;
      sh.getRange(Number(u.rowIndex), valCol).setValue(u.value == null ? "" : String(u.value));
    });
  } finally {
    lock.releaseLock();
  }

  return { ok: true, updated: updates.length };
}

/** =========================
 *  HOME GALLERY: READ + OPS
 *  ========================= */
function getGalleryItems() {
  const sh = _getSheetOrThrow_(CONFIG.GALLERY_SHEET);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2) return [];

  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = _headerMap_(headers);
  _requireHeaders_(map, CONFIG.GALLERY_HEADERS);

  const srcCol = map[_normalize_(CONFIG.GALLERY_HEADERS.src)];
  const altCol = map[_normalize_(CONFIG.GALLERY_HEADERS.alt)];
  const sortCol = map[_normalize_(CONFIG.GALLERY_HEADERS.sort)];
  const statusCol = map[_normalize_(CONFIG.GALLERY_HEADERS.status)];

  const values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const items = [];
  for (let i = 0; i < values.length; i++) {
    const r = values[i];
    const rowIndex = i + 2;
    const src = r[srcCol - 1];
    const alt = r[altCol - 1];
    const sort = r[sortCol - 1];
    const status = r[statusCol - 1];

    if (!src && !alt && !sort && !status) continue;

    items.push({
      rowIndex,
      src: src ? String(src) : "",
      alt: alt ? String(alt) : "",
      sort: sort === "" || sort == null ? null : Number(sort),
      status: status ? String(status) : "",
    });
  }

  items.sort((a, b) => {
    const aArch = _normalize_(a.status) === _normalize_(CONFIG.ARCHIVED_STATUS);
    const bArch = _normalize_(b.status) === _normalize_(CONFIG.ARCHIVED_STATUS);
    if (aArch !== bArch) return aArch ? 1 : -1;

    const as = a.sort == null ? 1e12 : a.sort;
    const bs = b.sort == null ? 1e12 : b.sort;
    if (as !== bs) return as - bs;
    return a.rowIndex - b.rowIndex;
  });

  return items;
}

function updateGalleryAlt(rowIndex, alt) {
  const sh = _getSheetOrThrow_(CONFIG.GALLERY_SHEET);
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = _headerMap_(headers);
  _requireHeaders_(map, CONFIG.GALLERY_HEADERS);

  const altCol = map[_normalize_(CONFIG.GALLERY_HEADERS.alt)];
  sh.getRange(Number(rowIndex), altCol).setValue(alt == null ? "" : String(alt));
  return { ok: true };
}

function archiveGalleryRow(rowIndex) {
  const sh = _getSheetOrThrow_(CONFIG.GALLERY_SHEET);
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = _headerMap_(headers);
  _requireHeaders_(map, CONFIG.GALLERY_HEADERS);

  const statusCol = map[_normalize_(CONFIG.GALLERY_HEADERS.status)];
  sh.getRange(Number(rowIndex), statusCol).setValue(CONFIG.ARCHIVED_STATUS);
  return { ok: true };
}

function reorderGallery(rowIndices) {
  if (!Array.isArray(rowIndices)) throw new Error("Invalid reorder payload.");

  const sh = _getSheetOrThrow_(CONFIG.GALLERY_SHEET);
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = _headerMap_(headers);
  _requireHeaders_(map, CONFIG.GALLERY_HEADERS);

  const sortCol = map[_normalize_(CONFIG.GALLERY_HEADERS.sort)];

  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    for (let i = 0; i < rowIndices.length; i++) {
      sh.getRange(Number(rowIndices[i]), sortCol).setValue(i + 1);
    }
  } finally {
    lock.releaseLock();
  }

  return { ok: true, count: rowIndices.length };
}

/** =========================
 *  HOME GALLERY: UPLOAD
 *  ========================= */
function addGalleryImage(payload) {
  if (!payload || !payload.base64) throw new Error("Missing upload payload.");
  const alt = payload.alt == null ? "" : String(payload.alt);

  const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  const nextName = _getNextPaddedFilename_(folder, CONFIG.FILENAME_EXT);

  const bytes = Utilities.base64Decode(payload.base64);
  const contentType = payload.contentType || "image/png";

  const blob = Utilities.newBlob(bytes, contentType, nextName);
  const file = folder.createFile(blob).setName(nextName);

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const imageUrl = _makeUcViewUrl_(file.getId());

  const sh = _getSheetOrThrow_(CONFIG.GALLERY_SHEET);
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = _headerMap_(headers);
  _requireHeaders_(map, CONFIG.GALLERY_HEADERS);

  const srcCol = map[_normalize_(CONFIG.GALLERY_HEADERS.src)];
  const altCol = map[_normalize_(CONFIG.GALLERY_HEADERS.alt)];
  const sortCol = map[_normalize_(CONFIG.GALLERY_HEADERS.sort)];
  const statusCol = map[_normalize_(CONFIG.GALLERY_HEADERS.status)];

  const items = getGalleryItems();
  let maxSort = 0;
  items.forEach((it) => {
    const isArchived = _normalize_(it.status) === _normalize_(CONFIG.ARCHIVED_STATUS);
    if (!isArchived && typeof it.sort === "number" && it.sort > maxSort) maxSort = it.sort;
  });
  const nextSort = maxSort + 1;

  const newRow = sh.getLastRow() + 1;
  sh.getRange(newRow, srcCol).setValue(imageUrl);
  sh.getRange(newRow, altCol).setValue(alt);
  sh.getRange(newRow, sortCol).setValue(nextSort);
  sh.getRange(newRow, statusCol).setValue(CONFIG.APPROVED_STATUS);

  return {
    ok: true,
    savedAs: nextName,
    url: imageUrl,
    rowIndex: newRow,
    sort: nextSort,
    status: CONFIG.APPROVED_STATUS,
  };
}

function _getNextPaddedFilename_(folder, ext) {
  const files = folder.getFiles();
  let maxN = 0;
  const re = new RegExp(`^(\\d{3})\\.${ext}$`, "i");
  while (files.hasNext()) {
    const f = files.next();
    const m = f.getName().match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxN) maxN = n;
    }
  }
  const next = maxN + 1;
  if (next > CONFIG.MAX_FILES) throw new Error(`Filename limit reached (${CONFIG.MAX_FILES}).`);
  return `${String(next).padStart(3, "0")}.${ext}`;
}

/** =========================
 *  HELPERS (ABOUT)
 *  ========================= */
function _n_(v) { return String(v || "").trim().toLowerCase(); }

function _getSheet_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error(`Sheet "${name}" not found.`);
  return sh;
}

function _getHeaderMap_(sh) {
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  headers.forEach((h, i) => map[_n_(h)] = i + 1);
  return { map, lastCol, headers };
}

function _requireCols_(map, cols) {
  const missing = [];
  cols.forEach(c => { if (!map[_n_(c)]) missing.push(c); });
  if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}`);
}

/** =========================
 *  ABOUT: READ
 *  ========================= */
function aboutGetSheet(sheetName) {
  const cfg = ABOUT_CFG.SHEETS[sheetName];
  if (!cfg) throw new Error("Unknown sheet: " + sheetName);

  const sh = _getSheet_(sheetName);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return { sheet: sheetName, items: [] };

  const { map, lastCol } = _getHeaderMap_(sh);
  const needed = [cfg.id, cfg.sort, cfg.status, ...cfg.fields];
  _requireCols_(map, needed);

  const idCol = map[_n_(cfg.id)];
  const sortCol = map[_n_(cfg.sort)];
  const statusCol = map[_n_(cfg.status)];

  const rows = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const out = [];

  for (let i = 0; i < rows.length; i++) {
    const rowIndex = i + 2;
    const r = rows[i];
    const id = r[idCol - 1];
    if (!id) continue;

    const status = r[statusCol - 1] ? String(r[statusCol - 1]) : "";
    if (ABOUT_CFG.FILTER_OUT_ARCHIVED && _n_(status) === "archived") continue;

    const item = { rowIndex, id: String(id), sort: r[sortCol - 1] == null || r[sortCol - 1] === "" ? null : Number(r[sortCol - 1]) };
    cfg.fields.forEach(f => {
      const c = map[_n_(f)];
      item[f] = r[c - 1] == null ? "" : String(r[c - 1]);
    });
    out.push(item);
  }

  out.sort((a, b) => {
    const as = a.sort == null ? 1e12 : a.sort;
    const bs = b.sort == null ? 1e12 : b.sort;
    if (as !== bs) return as - bs;
    return a.rowIndex - b.rowIndex;
  });

  return { sheet: sheetName, items: out };
}

/** =========================
 *  ABOUT: UPDATE
 *  ========================= */
function aboutUpdateRow(payload) {
  const { sheetName, rowIndex, patch } = payload || {};
  const cfg = ABOUT_CFG.SHEETS[sheetName];
  if (!cfg) throw new Error("Unknown sheet: " + sheetName);
  if (!rowIndex || !patch || typeof patch !== "object") throw new Error("Invalid payload.");

  const sh = _getSheet_(sheetName);
  const { map } = _getHeaderMap_(sh);

  const allowed = new Set(cfg.fields);
  Object.keys(patch).forEach(k => {
    if (!allowed.has(k)) throw new Error(`Field not editable: ${k}`);
  });

  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    Object.entries(patch).forEach(([field, value]) => {
      const col = map[_n_(field)];
      if (!col) throw new Error(`Missing column: ${field}`);
      sh.getRange(Number(rowIndex), col).setValue(value == null ? "" : String(value));
    });
  } finally {
    lock.releaseLock();
  }

  return { ok: true };
}

/** =========================
 *  ABOUT: REORDER
 *  ========================= */
function aboutReorder(payload) {
  const { sheetName, rowIndices } = payload || {};
  const cfg = ABOUT_CFG.SHEETS[sheetName];
  if (!cfg) throw new Error("Unknown sheet: " + sheetName);
  if (!Array.isArray(rowIndices)) throw new Error("Invalid reorder payload.");

  const sh = _getSheet_(sheetName);
  const { map } = _getHeaderMap_(sh);
  const sortCol = map[_n_(cfg.sort)];
  if (!sortCol) throw new Error("Missing sort column.");

  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    for (let i = 0; i < rowIndices.length; i++) {
      sh.getRange(Number(rowIndices[i]), sortCol).setValue(i + 1);
    }
  } finally {
    lock.releaseLock();
  }

  return { ok: true, count: rowIndices.length };
}

/** =========================
 *  ABOUT: REPLACE IMAGE (updates src, optional alt)
 *  ========================= */
function aboutReplaceImage(payload) {
  const { rowIndex, base64, contentType, alt } = payload || {};
  if (!rowIndex || !base64) throw new Error("Missing image payload.");

  const sheetName = "about_images";
  const cfg = ABOUT_CFG.SHEETS[sheetName];

  const sh = _getSheet_(sheetName);
  const { map } = _getHeaderMap_(sh);
  _requireCols_(map, [cfg.fields[0], cfg.fields[1]]); // src, alt

  const folder = DriveApp.getFolderById(ABOUT_CFG.IMAGE_FOLDER_ID);
  const bytes = Utilities.base64Decode(base64);
  const ct = contentType || "image/png";

  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
  const ext = (ct.includes("png") ? "png" : ct.includes("jpeg") ? "jpg" : ct.includes("webp") ? "webp" : "img");
  const filename = `about_${stamp}.${ext}`;

  const file = folder.createFile(Utilities.newBlob(bytes, ct, filename));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const srcUrl = _makeUcViewUrl_(file.getId());

  const srcCol = map[_n_("src")];
  const altCol = map[_n_("alt")];

  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    sh.getRange(Number(rowIndex), srcCol).setValue(srcUrl);
    if (alt != null) sh.getRange(Number(rowIndex), altCol).setValue(String(alt));
  } finally {
    lock.releaseLock();
  }

  return { ok: true, src: srcUrl, filename };
}
