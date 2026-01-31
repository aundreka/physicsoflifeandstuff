/*******************************
 * Community.gs
 * Sidebar backend for CommunityCMS.html
 *******************************/

/** === CONFIG === */
const COMMUNITY_CONFIG = {
  SHEETS: {
    MEMBERS: "members",
    PUBLICATIONS: "publications",
    PUBLICATION_LINKS: "publication_links",
    PUBLICATION_AUTHORS: "publication_authors",
    PRESENTATIONS: "presentations",
    PRESENTATION_AUTHORS: "presentation_authors",
    AWARDS: "awards",
    AWARD_RECIPIENTS: "award_recipients",
    AWARD_PUBLICATIONS: "award_publications",
    CERTIFICATES: "certificates",
    CERTIFICATE_HOLDERS: "certificate_holders",
  },

  // From your provided links
  FOLDERS: {
    MEMBER_IMAGES: "1BYf3k9WRlWaVg-YED8bPbmlAcW4jGnMY",
    AWARD_IMAGES: "1bGWk_D4f-4go1xASFBJ0KYnCvCwruJsY",
    CERTIFICATE_IMAGES: "1-1027kJEH6I3p9L0JkBFq4sNK3uyYPOu",
  },

  DEFAULT_STATUS: "approved",
  MEMBER_TYPE_VALUES: ["member", "alumni"],
};

/** === PUBLIC API (called from HTML via google.script.run) === */

/**
 * Returns minimal boot data for dropdowns / linking.
 */
function communityBootstrap() {
  const members = _getSheetRecords(COMMUNITY_CONFIG.SHEETS.MEMBERS).map((m) => ({
    id: m.id,
    label: [m.last_name, m.first_name].filter(Boolean).join(", ") || m.id,
    type: m.type || "",
    status: m.status || "",
  }));

  const publications = _getSheetRecords(COMMUNITY_CONFIG.SHEETS.PUBLICATIONS).map((p) => ({
    id: p.id,
    label: p.title || p.id,
    status: p.status || "",
  }));

  const presentations = _getSheetRecords(COMMUNITY_CONFIG.SHEETS.PRESENTATIONS).map((p) => ({
    id: p.id,
    label: p.title || p.id,
    status: p.status || "",
  }));

  const awards = _getSheetRecords(COMMUNITY_CONFIG.SHEETS.AWARDS).map((a) => ({
    id: a.id,
    label: a.award || a.id,
    status: a.status || "",
  }));

  const certificates = _getSheetRecords(COMMUNITY_CONFIG.SHEETS.CERTIFICATES).map((c) => ({
    id: c.id,
    label: c.certificate || c.id,
    status: c.status || "",
  }));

  return {
    ok: true,
    data: {
      memberTypeValues: COMMUNITY_CONFIG.MEMBER_TYPE_VALUES.slice(),
      members,
      publications,
      presentations,
      awards,
      certificates,
    },
  };
}

/**
 * Generic fetch by table name.
 * Returns array of row objects (includes status; your UI can simply hide it).
 */
function communityList(table) {
  _assertKnownTable_(table);
  return { ok: true, data: _getSheetRecords(table) };
}

/**
 * Generic get-one by id.
 */
function communityGet(table, id) {
  _assertKnownTable_(table);
  const rec = _getRecordById_(table, id);
  return { ok: true, data: rec || null };
}

/**
 * Generic create/update.
 * If record.id exists -> update; else -> create with new UUID.
 * If sheet has "status" col, it is forced to "approved" on create.
 */
function communityUpsert(table, record) {
  _assertKnownTable_(table);
  record = record || {};
  const sheet = _getSheet_(table);
  const meta = _getSheetMeta_(sheet);

  // Normalize keys to match headers exactly (we only write known headers)
  const clean = {};
  meta.headers.forEach((h) => {
    if (h in record) {
      clean[h] = record[h];
      return;
    }
    const lower = String(h).trim().toLowerCase();
    if (lower in record) clean[h] = record[lower];
  });

  const isCreate = !clean.id;
  if (isCreate) clean.id = _nextSequentialId_(sheet, meta);

  // Force approved on create when status column exists (and never require UI to show status)
  if (meta.hasStatus && isCreate) clean.status = COMMUNITY_CONFIG.DEFAULT_STATUS;

  // Special: members.type should be dropdown (member/alumni) - normalize lowercase
  if (table === COMMUNITY_CONFIG.SHEETS.MEMBERS && typeof clean.type === "string") {
    clean.type = clean.type.trim().toLowerCase();
    if (clean.type && COMMUNITY_CONFIG.MEMBER_TYPE_VALUES.indexOf(clean.type) === -1) {
      throw new Error('members.type must be "member" or "alumni".');
    }
  }

  // Merge updates with existing row to avoid wiping other columns
  let toSave = clean;
  if (!isCreate) {
    const existing = _getRecordById_(table, clean.id) || {};
    const merged = {};
    meta.headers.forEach((h) => {
      if (Object.prototype.hasOwnProperty.call(clean, h)) merged[h] = clean[h];
      else if (Object.prototype.hasOwnProperty.call(existing, h)) merged[h] = existing[h];
      else if (String(h).trim().toLowerCase() === "id") merged[h] = clean.id;
      else merged[h] = "";
    });
    toSave = merged;
  }

  // Special: relationships should refer to existing ids
  _validateLinks_(table, toSave);

  const saved = _upsertRow_(sheet, meta, toSave);
  return { ok: true, data: saved };
}

/**
 * Generic delete by id.
 */
function communityDelete(table, id) {
  _assertKnownTable_(table);
  const sheet = _getSheet_(table);
  const meta = _getSheetMeta_(sheet);

  const rowIndex = _findRowIndexById_(sheet, meta, id);
  if (!rowIndex) return { ok: true, data: { deleted: false } };

  sheet.deleteRow(rowIndex);
  return { ok: true, data: { deleted: true } };
}

/**
 * Bulk upsert for relation rows to avoid client-side async races.
 * items: [{ table: "publication_authors", rec: { ... } }, ...]
 */
function communityBulkUpsert(items) {
  items = items || [];
  const saved = [];
  const errors = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i] || {};
    try {
      if (!it.table) throw new Error("Missing table");
      const res = communityUpsert(it.table, it.rec || {});
      saved.push({ index: i, table: it.table, id: res && res.data ? res.data.id : "" });
    } catch (e) {
      errors.push({ index: i, table: it.table || "", message: e && e.message ? e.message : String(e) });
    }
  }
  return { ok: errors.length === 0, data: { saved, errors } };
}

/**
 * One-time debug helper for inspecting a sheet's headers and raw rows.
 */
function communityDebugSheet(table, sampleRows) {
  if (!table) {
    return { ok: false, error: { message: "Missing table name. Example: communityDebugSheet('publications', 5)" } };
  }
  _assertKnownTable_(table);
  const ss = _ss_();
  const sheet = _getSheet_(table);
  const meta = _getSheetMeta_(sheet);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const startRow = meta.headerRow + 1;
  const take = Math.max(0, Math.min(Number(sampleRows || 5), 50));
  const rawHeader = sheet.getRange(meta.headerRow, 1, 1, lastCol).getValues()[0];
  const rawRows = take && lastRow >= startRow
    ? sheet.getRange(startRow, 1, Math.min(take, lastRow - startRow + 1), lastCol).getValues()
    : [];
  return {
    ok: true,
    data: {
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      sheetName: sheet.getName(),
      headerRow: meta.headerRow,
      idCol: meta.idCol,
      lastRow,
      lastCol,
      startRow,
      sheetNames: ss.getSheets().map((s) => s.getName()),
      rawHeader,
      rawRows,
      headersNormalized: meta.headers.map(_normalizeHeader_)
    }
  };
}

/**
 * Debug: list sheets in the active spreadsheet.
 */
function communityDebugEnv() {
  const ss = _ss_();
  return {
    ok: true,
    data: {
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      sheetNames: ss.getSheets().map((s) => s.getName())
    }
  };
}

/**
 * Debug: return parsed records from _getSheetRecords for a table.
 */
function communityDebugList(table, sampleRows) {
  if (!table) {
    return { ok: false, error: { message: "Missing table name. Example: communityDebugList('publications', 5)" } };
  }
  _assertKnownTable_(table);
  const ss = _ss_();
  const records = _getSheetRecords(table);
  const take = Math.max(0, Math.min(Number(sampleRows || 5), 500));
  return {
    ok: true,
    data: {
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      count: records.length,
      sample: take ? records.slice(0, take) : []
    }
  };
}

/**
 * Upload member/alumni image.
 * - Folder: MEMBER_IMAGES
 * - Filename: Lastname_Firstname
 * - Returns: {url, fileId, name}
 *
 * base64Data may be a full data URL or raw base64.
 */
function uploadMemberImage(base64Data, mimeType, lastName, firstName) {
  const folder = DriveApp.getFolderById(COMMUNITY_CONFIG.FOLDERS.MEMBER_IMAGES);
  const safe = _safeName_(`${lastName || ""}_${firstName || ""}`) || `member_${Date.now()}`;

  const blob = _base64ToBlob_(base64Data, mimeType, safe);
  const file = _createOrReplaceByName_(folder, safe, blob);

  return { ok: true, data: _fileToLink_(file) };
}

/**
 * Upload award image.
 * - Folder: AWARD_IMAGES
 * - Filename: LastName_FirstName_000, 001, ...
 */
function uploadAwardImage(base64Data, mimeType, lastName, firstName) {
  const folder = DriveApp.getFolderById(COMMUNITY_CONFIG.FOLDERS.AWARD_IMAGES);
  const prefix = _safeName_(`${lastName || ""}_${firstName || ""}`) || `award_${Date.now()}`;
  const name = _nextIndexedName_(folder, `${prefix}_`, 3); // e.g. prefix_000

  const blob = _base64ToBlob_(base64Data, mimeType, name);
  const file = folder.createFile(blob).setName(name);

  return { ok: true, data: _fileToLink_(file) };
}

/**
 * Upload certificate image.
 * - Folder: CERTIFICATE_IMAGES
 * - Filename: LastName_FirstName_000, 001, ...
 */
function uploadCertificateImage(base64Data, mimeType, lastName, firstName) {
  const folder = DriveApp.getFolderById(COMMUNITY_CONFIG.FOLDERS.CERTIFICATE_IMAGES);
  const prefix = _safeName_(`${lastName || ""}_${firstName || ""}`) || `certificate_${Date.now()}`;
  const name = _nextIndexedName_(folder, `${prefix}_`, 3);

  const blob = _base64ToBlob_(base64Data, mimeType, name);
  const file = folder.createFile(blob).setName(name);

  return { ok: true, data: _fileToLink_(file) };
}

/** Convenience helpers for UI: options */
function listMemberOptions() {
  const members = _getSheetRecords(COMMUNITY_CONFIG.SHEETS.MEMBERS).map((m) => ({
    id: m.id,
    label: [m.last_name, m.first_name].filter(Boolean).join(", ") || m.id,
  }));
  return { ok: true, data: members };
}

function listPublicationOptions() {
  const pubs = _getSheetRecords(COMMUNITY_CONFIG.SHEETS.PUBLICATIONS).map((p) => ({
    id: p.id,
    label: p.title || p.id,
  }));
  return { ok: true, data: pubs };
}

/** === INTERNALS === */

function _assertKnownTable_(table) {
  const known = Object.values(COMMUNITY_CONFIG.SHEETS);
  if (known.indexOf(table) === -1) throw new Error("Unknown table: " + table);
}

function _ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function _getSheet_(name) {
  const ss = _ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    const target = String(name || "").trim().toLowerCase();
    const sheets = ss.getSheets();
    for (let i = 0; i < sheets.length; i++) {
      const s = sheets[i];
      if (String(s.getName()).trim().toLowerCase() === target) {
        sh = s;
        break;
      }
    }
  }
  if (!sh) throw new Error(`Missing sheet: "${name}"`);
  return sh;
}

function _getSheetMeta_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) throw new Error(`Sheet "${sheet.getName()}" has no headers.`);
  const lastRow = sheet.getLastRow();
  const probeRows = Math.min(Math.max(lastRow, 1), 5);
  let headerRow = 1;
  let headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  for (let r = 1; r <= probeRows; r++) {
    const row = sheet.getRange(r, 1, 1, lastCol).getValues()[0];
    let hasId = false;
    for (let c = 0; c < row.length; c++) {
      if (String(row[c]).trim().toLowerCase() === "id") {
        hasId = true;
        break;
      }
    }
    if (hasId) {
      headerRow = r;
      headers = row.map(String);
      break;
    }
  }

  const headerMap = {};
  let idCol = 0;
  headers.forEach((h, i) => {
    headerMap[h] = i + 1;
    const norm = _normalizeHeader_(h).toLowerCase();
    if (!idCol && norm === "id") idCol = i + 1;
  });

  if (!idCol) throw new Error(`Sheet "${sheet.getName()}" must have an "id" column.`);

  return {
    headers,
    headerMap,
    hasStatus: headers.some((h) => _normalizeHeader_(h).toLowerCase() === "status"),
    idCol,
    headerRow,
  };
}

function _getSheetRecords(sheetName) {
  const sheet = _getSheet_(sheetName);
  const meta = _getSheetMeta_(sheet);
  const prefix = _idPrefix_(sheet.getName());
  const lastRow = sheet.getLastRow();
  const startRow = meta.headerRow + 1;
  if (lastRow < startRow) return [];

  const idRange = sheet.getRange(startRow, meta.idCol, lastRow - startRow + 1, 1);
  const ids = idRange.getValues();
  let max = 0;
  ids.forEach((r) => {
    const n = _parseIdNumber_(String(r[0] || "").trim(), prefix);
    if (!isNaN(n)) max = Math.max(max, n);
  });
  let dirty = false;
  for (let i = 0; i < ids.length; i++) {
    if (!ids[i][0]) {
      max += 1;
      const width = Math.max(3, String(max).length);
      ids[i][0] = prefix + "_" + String(max).padStart(width, "0");
      dirty = true;
    }
  }
  if (dirty) idRange.setValues(ids);

  const values = sheet.getRange(startRow, 1, lastRow - startRow + 1, meta.headers.length).getValues();
  for (let i = 0; i < values.length; i++) {
    values[i][meta.idCol - 1] = ids[i][0];
  }
  return values
    .map((row) => _rowToObjWithMeta_(meta, row))
    .filter((o) => o.id); // ignore blank rows
}

function _fillMissingIds_(sheet, meta) {
  const prefix = _idPrefix_(sheet.getName());
  const lastRow = sheet.getLastRow();
  const startRow = meta.headerRow + 1;
  if (lastRow < startRow) return;
  const idRange = sheet.getRange(startRow, meta.idCol, lastRow - startRow + 1, 1);
  const ids = idRange.getValues();
  let max = 0;
  ids.forEach((r) => {
    const n = _parseIdNumber_(String(r[0] || "").trim(), prefix);
    if (!isNaN(n)) max = Math.max(max, n);
  });
  let dirty = false;
  for (let i = 0; i < ids.length; i++) {
    if (!ids[i][0]) {
      max += 1;
      const width = Math.max(3, String(max).length);
      ids[i][0] = prefix + "_" + String(max).padStart(width, "0");
      dirty = true;
    }
  }
  if (dirty) idRange.setValues(ids);
}

function _nextSequentialId_(sheet, meta) {
  const prefix = _idPrefix_(sheet.getName());
  const lastRow = sheet.getLastRow();
  const startRow = meta.headerRow + 1;
  if (lastRow < startRow) return prefix + "_001";
  const ids = sheet.getRange(startRow, meta.idCol, lastRow - startRow + 1, 1).getValues().map((r) => String(r[0] || "").trim());
  let max = 0;
  ids.forEach((v) => {
    const n = _parseIdNumber_(v, prefix);
    if (!isNaN(n)) max = Math.max(max, n);
  });
  const next = max + 1;
  const width = Math.max(3, String(next).length);
  return prefix + "_" + String(next).padStart(width, "0");
}

function _rowToObj_(headers, row) {
  const o = {};
  headers.forEach((h, i) => {
    const norm = _normalizeHeader_(h);
    const key = norm.toLowerCase() === "id" ? "id" : norm;
    o[key] = row[i];
  });
  return o;
}

function _rowToObjWithMeta_(meta, row) {
  const o = _rowToObj_(meta.headers, row);
  if (!o.id && meta && meta.idCol) {
    o.id = row[meta.idCol - 1];
  }
  return o;
}

function _findRowIndexById_(sheet, meta, id) {
  if (!id) return 0;
  const lastRow = sheet.getLastRow();
  const startRow = meta.headerRow + 1;
  if (lastRow < startRow) return 0;

  const ids = sheet.getRange(startRow, meta.idCol, lastRow - startRow + 1, 1).getValues().map((r) => r[0]);
  const idx = ids.indexOf(id);
  return idx === -1 ? 0 : idx + startRow; // convert to sheet row
}

function _getRecordById_(sheetName, id) {
  const sheet = _getSheet_(sheetName);
  const meta = _getSheetMeta_(sheet);
  const rowIndex = _findRowIndexById_(sheet, meta, id);
  if (!rowIndex) return null;

  const row = sheet.getRange(rowIndex, 1, 1, meta.headers.length).getValues()[0];
  return _rowToObjWithMeta_(meta, row);
}

function _upsertRow_(sheet, meta, obj) {
  const rowIndex = _findRowIndexById_(sheet, meta, obj.id);
  const values = meta.headers.map((h) => (h in obj ? obj[h] : ""));

  if (rowIndex) {
    sheet.getRange(rowIndex, 1, 1, meta.headers.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }

  // Return canonical saved row
  return _getRecordById_(sheet.getName(), obj.id);
}

function _validateLinks_(table, record) {
  // Only validate when keys exist (allows partial update from UI)
  const has = (k) => Object.prototype.hasOwnProperty.call(record, k) && record[k];

  if (table === COMMUNITY_CONFIG.SHEETS.PUBLICATION_AUTHORS) {
    if (has("publication_id") && !_existsId_(COMMUNITY_CONFIG.SHEETS.PUBLICATIONS, record.publication_id)) {
      throw new Error("publication_authors.publication_id does not exist in publications.");
    }
    if (has("person_id") && !_existsId_(COMMUNITY_CONFIG.SHEETS.MEMBERS, record.person_id)) {
      throw new Error("publication_authors.person_id does not exist in members.");
    }
  }

  if (table === COMMUNITY_CONFIG.SHEETS.PUBLICATION_LINKS) {
    if (has("publication_id") && !_existsId_(COMMUNITY_CONFIG.SHEETS.PUBLICATIONS, record.publication_id)) {
      throw new Error("publication_links.publication_id does not exist in publications.");
    }
  }

  if (table === COMMUNITY_CONFIG.SHEETS.PRESENTATION_AUTHORS) {
    if (has("presentation_id") && !_existsId_(COMMUNITY_CONFIG.SHEETS.PRESENTATIONS, record.presentation_id)) {
      throw new Error("presentation_authors.presentation_id does not exist in presentations.");
    }
    if (has("person_id") && !_existsId_(COMMUNITY_CONFIG.SHEETS.MEMBERS, record.person_id)) {
      throw new Error("presentation_authors.person_id does not exist in members.");
    }
  }

  if (table === COMMUNITY_CONFIG.SHEETS.AWARD_RECIPIENTS) {
    if (has("award_id") && !_existsId_(COMMUNITY_CONFIG.SHEETS.AWARDS, record.award_id)) {
      throw new Error("award_recipients.award_id does not exist in awards.");
    }
    if (has("person_id") && !_existsId_(COMMUNITY_CONFIG.SHEETS.MEMBERS, record.person_id)) {
      throw new Error("award_recipients.person_id does not exist in members.");
    }
  }

  if (table === COMMUNITY_CONFIG.SHEETS.AWARD_PUBLICATIONS) {
    if (has("award_id") && !_existsId_(COMMUNITY_CONFIG.SHEETS.AWARDS, record.award_id)) {
      throw new Error("award_publications.award_id does not exist in awards.");
    }
    if (has("publication_id") && !_existsId_(COMMUNITY_CONFIG.SHEETS.PUBLICATIONS, record.publication_id)) {
      throw new Error("award_publications.publication_id does not exist in publications.");
    }
  }

  if (table === COMMUNITY_CONFIG.SHEETS.CERTIFICATE_HOLDERS) {
    if (has("certificate_id") && !_existsId_(COMMUNITY_CONFIG.SHEETS.CERTIFICATES, record.certificate_id)) {
      throw new Error("certificate_holders.certificate_id does not exist in certificates.");
    }
    if (has("person_id") && !_existsId_(COMMUNITY_CONFIG.SHEETS.MEMBERS, record.person_id)) {
      throw new Error("certificate_holders.person_id does not exist in members.");
    }
  }
}

function _existsId_(sheetName, id) {
  if (!id) return false;
  const sheet = _getSheet_(sheetName);
  const meta = _getSheetMeta_(sheet);
  const lastRow = sheet.getLastRow();
  const startRow = meta.headerRow + 1;
  if (lastRow < startRow) return false;
  const ids = sheet.getRange(startRow, meta.idCol, lastRow - startRow + 1, 1).getValues().map((r) => r[0]);
  return ids.indexOf(id) !== -1;
}

/** === DRIVE HELPERS === */

function _base64ToBlob_(base64Data, mimeType, filenameNoExt) {
  if (!base64Data) throw new Error("Missing file data.");
  let b64 = String(base64Data);

  // Accept data URL
  const m = b64.match(/^data:([^;]+);base64,(.+)$/);
  if (m) {
    mimeType = mimeType || m[1];
    b64 = m[2];
  }
  mimeType = mimeType || "application/octet-stream";

  const bytes = Utilities.base64Decode(b64);
  const ext = _mimeToExt_(mimeType);
  const name = ext ? `${filenameNoExt}.${ext}` : filenameNoExt;
  return Utilities.newBlob(bytes, mimeType, name);
}

function _mimeToExt_(mime) {
  mime = (mime || "").toLowerCase();
  if (mime.indexOf("png") !== -1) return "png";
  if (mime.indexOf("jpeg") !== -1 || mime.indexOf("jpg") !== -1) return "jpg";
  if (mime.indexOf("webp") !== -1) return "webp";
  if (mime.indexOf("gif") !== -1) return "gif";
  if (mime.indexOf("pdf") !== -1) return "pdf";
  return ""; // unknown; keep as-is
}

function _safeName_(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]+/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Replace any existing file with same base name (ignoring extension)
 * by moving it to trash, then create new.
 */
function _createOrReplaceByName_(folder, baseNameNoExt, blob) {
  const targetName = blob.getName(); // includes ext
  const base = baseNameNoExt;

  // Trash existing files that match base (any extension)
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    const name = f.getName();
    const nameNoExt = name.replace(/\.[^/.]+$/, "");
    if (nameNoExt === base) {
      try {
        f.setTrashed(true);
      } catch (e) {
        // ignore if can't trash
      }
    }
  }

  return folder.createFile(blob).setName(targetName);
}

function _nextIndexedName_(folder, prefix, digits) {
  // Finds max existing index for files whose name starts with prefix and then digits before extension.
  let max = -1;
  const re = new RegExp("^" + _escapeRegExp_(prefix) + "(\\d{" + digits + "})(?:\\.[^.]*)?$");

  const it = folder.getFiles();
  while (it.hasNext()) {
    const name = it.next().getName();
    const m = name.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n)) max = Math.max(max, n);
    }
  }

  const next = max + 1;
  const padded = String(next).padStart(digits, "0");
  return `${prefix}${padded}`;
}

function _escapeRegExp_(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function _fileToLink_(file) {
  // Ensure anyone with link can view (optional; remove if you prefer restricted)
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    // ignore
  }
  return {
    fileId: file.getId(),
    name: file.getName(),
    url: "https://drive.google.com/uc?id=" + file.getId(), // direct-ish link suitable for <img src="">
    viewUrl: file.getUrl(),
  };
}

function _idPrefix_(sheetName) {
  return String(sheetName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "sheet";
}

function _parseIdNumber_(value, prefix) {
  const v = String(value || "").trim();
  if (!v) return NaN;
  const p = String(prefix || "");
  if (p && v.indexOf(p + "_") === 0) {
    const tail = v.slice(p.length + 1);
    const n = parseInt(tail, 10);
    return isNaN(n) ? NaN : n;
  }
  // Legacy numeric ids
  const n = parseInt(v, 10);
  return isNaN(n) ? NaN : n;
}

function _normalizeHeader_(h) {
  return String(h || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/^\uFEFF/, "")
    .trim();
}
