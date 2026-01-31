/** News.gs — server-side logic for the News CMS sidebar
 * Sheets used:
 *  - news_articles
 *  - news_blocks
 *  - news_people
 * Also reads:
 *  - members (expects columns: id, first_name, last_name)
 *
 * Drive folders:
 *  - Cover uploads (hero_image): 1I9gZPCJ-xrNf3pUj_qKixTv0EHQ4Yp4y
 *  - Block uploads (src / images_json): 19Zr_7lhf1gAWnOHY2vq10QmOneSGpM4m
 */

const NEWS_CFG = {
  SHEETS: {
    ARTICLES: "news_articles",
    BLOCKS: "news_blocks",
    PEOPLE: "news_people",
    MEMBERS: "members",
  },
  DRIVE_FOLDERS: {
    COVER: "1I9gZPCJ-xrNf3pUj_qKixTv0EHQ4Yp4y",
    BLOCK: "19Zr_7lhf1gAWnOHY2vq10QmOneSGpM4m",
  },
  FILE_PREFIX: {
    COVER: "cover_",
    BLOCK: "block_",
  },
  STATUS_VALUE: "approved",
};

/* =========================
 * Sidebar API (called via google.script.run)
 * ========================= */

/** Overview list: [{slug,title,updatedAt,publishedAt}] */
function news_listArticles() {
  const sh = _sheet_(NEWS_CFG.SHEETS.ARTICLES);
  const { headers, rows } = _readTable_(sh);
  const get = _rowGetter_(headers);

  const out = rows
    .map((r) => ({
      slug: String(get(r, "slug") || "").trim(),
      title: String(get(r, "title") || "").trim(),
      publishedAt: String(get(r, "publishedAt") || "").trim(),
      updatedAt: String(get(r, "updatedAt") || "").trim(),
    }))
    .filter((x) => x.slug && x.title);

  // Newest updated first (falls back to publishedAt)
  out.sort((a, b) => (b.updatedAt || b.publishedAt).localeCompare(a.updatedAt || a.publishedAt));
  return out;
}

/** Full article payload: { article, blocks, people } */
function news_getArticle(slug) {
  slug = String(slug || "").trim();
  if (!slug) throw new Error("Missing slug.");

  const article = _getArticleBySlug_(slug);
  if (!article) return null;

  const blocks = _getBlocksBySlug_(slug);
  const people = _getPeopleBySlug_(slug);

  return { article, blocks, people };
}

/** For dropdowns: [{id, name}] where name = "Last, First" */
function news_listMembers() {
  const sh = _sheet_(NEWS_CFG.SHEETS.MEMBERS);
  const { headers, rows } = _readTable_(sh);
  const get = _rowGetter_(headers);

  const out = rows
    .map((r) => {
      const id = String(get(r, "id") || "").trim();
      const first = String(get(r, "first_name") || "").trim();
      const last = String(get(r, "last_name") || "").trim();
      const name = [last, first].filter(Boolean).join(", ");
      return { id, name };
    })
    .filter((x) => x.id && x.name);

  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/** For dropdowns: [{id, label}] */
function news_listPublications() {
  const sh = _sheet_("publications");
  const { headers, rows } = _readTable_(sh);
  const get = _rowGetter_(headers);

  const out = rows
    .map((r) => {
      const id = String(get(r, "id") || "").trim();
      const title = String(get(r, "title") || "").trim();
      return { id, label: title || id };
    })
    .filter((x) => x.id && x.label);

  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}

/** For dropdowns: [{id, label}] */
function news_listPresentations() {
  const sh = _sheet_("presentations");
  const { headers, rows } = _readTable_(sh);
  const get = _rowGetter_(headers);

  const out = rows
    .map((r) => {
      const id = String(get(r, "id") || "").trim();
      const title = String(get(r, "title") || "").trim();
      return { id, label: title || id };
    })
    .filter((x) => x.id && x.label);

  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}

/** For dropdowns: [{id, label}] */
function news_listAwards() {
  const sh = _sheet_("awards");
  const { headers, rows } = _readTable_(sh);
  const get = _rowGetter_(headers);

  const out = rows
    .map((r) => {
      const id = String(get(r, "id") || "").trim();
      const label = String(get(r, "award") || "").trim();
      return { id, label: label || id };
    })
    .filter((x) => x.id && x.label);

  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}

/**
 * Create article (and optionally blocks + people).
 * payload = { article, blocks, people }
 *  - article required fields: title, dek, author_name, hero_image (hero_image can be uploaded first or pasted URL)
 *  - slug auto-generated if missing
 */
function news_createArticle(payload) {
  payload = payload || {};
  const article = payload.article || {};
  const blocks = Array.isArray(payload.blocks) ? payload.blocks : [];
  const people = Array.isArray(payload.people) ? payload.people : [];

  const normalized = _normalizeArticleInput_(article, { isCreate: true });

  // Ensure unique slug
  normalized.slug = _ensureUniqueSlug_(normalized.slug);

  // Write article row
  _upsertArticleRow_(normalized, { isCreate: true });

  // Replace blocks + people for slug
  _replaceBlocks_(normalized.slug, blocks);
  _replacePeople_(normalized.slug, people);

  return { ok: true, slug: normalized.slug };
}

/**
 * Update article (and replace blocks + people).
 * payload = { slug, article, blocks, people }
 */
function news_updateArticle(payload) {
  payload = payload || {};
  const slug = String(payload.slug || (payload.article && payload.article.slug) || "").trim();
  if (!slug) throw new Error("Missing slug.");

  const existing = _getArticleBySlug_(slug);
  if (!existing) throw new Error("Article not found.");

  const article = payload.article || {};
  const blocks = Array.isArray(payload.blocks) ? payload.blocks : [];
  const people = Array.isArray(payload.people) ? payload.people : [];

  const normalized = _normalizeArticleInput_(Object.assign({}, existing, article, { slug }), {
    isCreate: false,
    existing,
  });

  _upsertArticleRow_(normalized, { isCreate: false, existing });

  _replaceBlocks_(slug, blocks);
  _replacePeople_(slug, people);

  return { ok: true, slug };
}

/** Delete article + all connected blocks + people by slug */
function news_deleteArticle(slug) {
  slug = String(slug || "").trim();
  if (!slug) throw new Error("Missing slug.");

  _deleteRowsBySlug_(NEWS_CFG.SHEETS.ARTICLES, slug);
  _deleteRowsBySlug_(NEWS_CFG.SHEETS.BLOCKS, slug);
  _deleteRowsBySlug_(NEWS_CFG.SHEETS.PEOPLE, slug);

  return { ok: true };
}

/**
 * Upload hero cover image to Drive folder and return share link + filename
 * args: { base64, mimeType }
 */
function news_uploadCover(args) {
  args = args || {};
  const base64 = args.base64;
  const mimeType = args.mimeType || "image/jpeg";
  if (!base64) throw new Error("Missing file data.");

  const file = _uploadToFolder_({
    base64,
    mimeType,
    folderId: NEWS_CFG.DRIVE_FOLDERS.COVER,
    prefix: NEWS_CFG.FILE_PREFIX.COVER,
  });

  return { url: file.getUrl(), name: file.getName() };
}

/**
 * Upload a block image (or gallery image) to Drive folder and return share link + filename
 * args: { base64, mimeType }
 */
function news_uploadBlockImage(args) {
  args = args || {};
  const base64 = args.base64;
  const mimeType = args.mimeType || "image/jpeg";
  if (!base64) throw new Error("Missing file data.");

  const file = _uploadToFolder_({
    base64,
    mimeType,
    folderId: NEWS_CFG.DRIVE_FOLDERS.BLOCK,
    prefix: NEWS_CFG.FILE_PREFIX.BLOCK,
  });

  return { url: file.getUrl(), name: file.getName() };
}

/* =========================
 * Internals — Articles
 * ========================= */

function _getArticleBySlug_(slug) {
  const sh = _sheet_(NEWS_CFG.SHEETS.ARTICLES);
  const { headers, rows } = _readTable_(sh);
  const get = _rowGetter_(headers);

  for (let i = 0; i < rows.length; i++) {
    const s = String(get(rows[i], "slug") || "").trim();
    if (s === slug) {
      return _articleRowToObj_(headers, rows[i]);
    }
  }
  return null;
}

function _articleRowToObj_(headers, row) {
  const get = _rowGetter_(headers);
  const obj = {};
  headers.forEach((h) => (obj[h] = get(row, h)));

  // Normalize commonly used fields
  obj.slug = String(obj.slug || "").trim();
  obj.title = String(obj.title || "").trim();
  obj.dek = String(obj.dek || "").trim();
  obj.author_name = String(obj.author_name || "").trim();
  obj.author_role = String(obj.author_role || "").trim();
  obj.publishedAt = String(obj.publishedAt || "").trim();
  obj.updatedAt = String(obj.updatedAt || "").trim();
  obj.tags = String(obj.tags || "").trim();
  obj.hero_image = String(obj.hero_image || "").trim();
  obj.hero_caption = String(obj.hero_caption || "").trim();
  obj.hero_credit = String(obj.hero_credit || "").trim();
  obj.publication_id = String(obj.publication_id || "").trim();
  obj.presentation_id = String(obj.presentation_id || "").trim();
  obj.award_id = String(obj.award_id || "").trim();
  obj.status = NEWS_CFG.STATUS_VALUE;

  return obj;
}

function _normalizeArticleInput_(article, opts) {
  opts = opts || {};
  const isCreate = !!opts.isCreate;
  const existing = opts.existing || null;

  const slugIn = String(article.slug || "").trim();
  const title = String(article.title || "").trim();
  const dek = String(article.dek || "").trim();
  const author_name = String(article.author_name || "").trim();
  const hero_image = String(article.hero_image || "").trim();

  if (!title) throw new Error("Title is required.");
  if (!dek) throw new Error("Dek is required.");
  if (!author_name) throw new Error("Author name is required.");
  if (!hero_image) throw new Error("Hero image is required.");

  const slug = slugIn || _slugify_(title);

  const now = _todayISO_();
  const publishedAt = isCreate ? now : String(existing && existing.publishedAt ? existing.publishedAt : now);
  const updatedAt = now;

  // Optional fields
  const out = {
    slug,
    title,
    dek,
    author_name,
    author_role: String(article.author_role || "").trim(),
    publishedAt,
    updatedAt,
    tags: String(article.tags || "").trim(),
    hero_image,
    hero_caption: String(article.hero_caption || "").trim(),
    hero_credit: String(article.hero_credit || "").trim(),
    publication_id: String(article.publication_id || "").trim(),
    presentation_id: String(article.presentation_id || "").trim(),
    award_id: String(article.award_id || "").trim(),
    status: NEWS_CFG.STATUS_VALUE,
  };

  return out;
}

function _ensureUniqueSlug_(slug) {
  slug = String(slug || "").trim();
  if (!slug) slug = "article";
  const sh = _sheet_(NEWS_CFG.SHEETS.ARTICLES);
  const { headers, rows } = _readTable_(sh);
  const get = _rowGetter_(headers);

  const existing = new Set(
    rows.map((r) => String(get(r, "slug") || "").trim()).filter(Boolean)
  );

  if (!existing.has(slug)) return slug;

  // Append -2, -3, ...
  let n = 2;
  while (existing.has(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}

function _upsertArticleRow_(articleObj, opts) {
  opts = opts || {};
  const sh = _sheet_(NEWS_CFG.SHEETS.ARTICLES);
  const headers = _headers_(sh);

  // Ensure required columns exist (minimal hard guard)
  ["slug", "title", "dek", "author_name", "publishedAt", "updatedAt", "hero_image", "status"].forEach((h) => {
    if (headers.indexOf(h) === -1) throw new Error(`Missing column in news_articles: ${h}`);
  });

  const lastRow = sh.getLastRow();
  const dataRange = lastRow >= 2 ? sh.getRange(2, 1, lastRow - 1, headers.length) : null;
  const values = dataRange ? dataRange.getValues() : [];
  const slugCol = headers.indexOf("slug");

  let rowIndex = -1; // 0-based within values
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][slugCol] || "").trim() === articleObj.slug) {
      rowIndex = i;
      break;
    }
  }

  const rowArr = headers.map((h) => (articleObj[h] != null ? articleObj[h] : ""));

  if (rowIndex === -1) {
    // append
    sh.appendRow(rowArr);
  } else {
    // update row
    sh.getRange(rowIndex + 2, 1, 1, headers.length).setValues([rowArr]);
  }
}

/* =========================
 * Internals — Blocks
 * ========================= */

function _getBlocksBySlug_(slug) {
  const sh = _sheet_(NEWS_CFG.SHEETS.BLOCKS);
  const { headers, rows } = _readTable_(sh);
  const get = _rowGetter_(headers);

  const out = [];
  for (let i = 0; i < rows.length; i++) {
    if (String(get(rows[i], "slug") || "").trim() === slug) {
      out.push(_blockRowToObj_(headers, rows[i]));
    }
  }

  out.sort((a, b) => Number(a.idx || 0) - Number(b.idx || 0));
  return out;
}

function _blockRowToObj_(headers, row) {
  const get = _rowGetter_(headers);
  const obj = {};
  headers.forEach((h) => (obj[h] = get(row, h)));

  obj.block_id = String(obj.block_id || "").trim();
  obj.slug = String(obj.slug || "").trim();
  obj.idx = Number(obj.idx || 0);
  obj.type = String(obj.type || "").trim();
  obj.text = String(obj.text || "").trim();
  obj.cite = String(obj.cite || "").trim();
  obj.src = String(obj.src || "").trim();
  obj.alt = String(obj.alt || "").trim();
  obj.caption = String(obj.caption || "").trim();
  obj.credit = String(obj.credit || "").trim();
  obj.title = String(obj.title || "").trim();
  obj.provider = String(obj.provider || "").trim();
  obj.url = String(obj.url || "").trim();
  obj.items_json = String(obj.items_json || "").trim();
  obj.images_json = String(obj.images_json || "").trim();
  obj.status = NEWS_CFG.STATUS_VALUE;

  return obj;
}

function _replaceBlocks_(slug, blocks) {
  // Remove all existing blocks for slug, then append sanitized blocks
  _deleteRowsBySlug_(NEWS_CFG.SHEETS.BLOCKS, slug);

  if (!blocks || !blocks.length) return;

  const sh = _sheet_(NEWS_CFG.SHEETS.BLOCKS);
  const headers = _headers_(sh);

  // Required columns check
  ["block_id", "slug", "idx", "type", "status"].forEach((h) => {
    if (headers.indexOf(h) === -1) throw new Error(`Missing column in news_blocks: ${h}`);
  });

  const sanitized = blocks
    .map((b, i) => _normalizeBlockInput_(slug, b, i))
    .filter((b) => b && b.slug);

  if (!sanitized.length) return;

  const rowsToAppend = sanitized.map((obj) => headers.map((h) => (obj[h] != null ? obj[h] : "")));
  sh.getRange(sh.getLastRow() + 1, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
}

function _normalizeBlockInput_(slug, b, fallbackIdx) {
  b = b || {};
  const idx = _asInt_(b.idx, fallbackIdx);
  const type = String(b.type || "").trim(); // optional
  const block_id = String(b.block_id || "").trim() || `${slug}__${idx}`;

  // Normalize images_json / items_json if passed as arrays
  const images_json = _normalizeJsonArray_(b.images_json, ["src", "alt", "caption", "credit"]);
  const items_json = _normalizeJsonArray_(b.items_json, ["text", "cite", "url", "src", "alt"]);

  return {
    block_id,
    slug,
    idx,
    type,
    text: String(b.text || "").trim(),
    cite: String(b.cite || "").trim(),
    src: String(b.src || "").trim(),
    alt: String(b.alt || "").trim(),
    caption: String(b.caption || "").trim(),
    credit: String(b.credit || "").trim(),
    title: String(b.title || "").trim(),
    provider: String(b.provider || "").trim(),
    url: String(b.url || "").trim(),
    items_json,
    images_json,
    status: NEWS_CFG.STATUS_VALUE,
  };
}

function _normalizeJsonArray_(val, allowedKeys) {
  if (val == null) return "";
  if (Array.isArray(val)) {
    const cleaned = val
      .map((x) => {
        const o = {};
        allowedKeys.forEach((k) => (o[k] = String((x && x[k]) || "").trim()));
        return o;
      })
      .filter((o) => Object.values(o).some(Boolean));
    return cleaned.length ? JSON.stringify(cleaned) : "";
  }
  const s = String(val).trim();
  if (!s) return "";
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return JSON.stringify(parsed);
    return "";
  } catch (e) {
    return "";
  }
}

/* =========================
 * Internals — People
 * ========================= */

function _getPeopleBySlug_(slug) {
  const sh = _sheet_(NEWS_CFG.SHEETS.PEOPLE);
  const { headers, rows } = _readTable_(sh);
  const get = _rowGetter_(headers);

  const out = [];
  for (let i = 0; i < rows.length; i++) {
    if (String(get(rows[i], "slug") || "").trim() === slug) {
      out.push({
        id: String(get(rows[i], "id") || "").trim(),
        slug: String(get(rows[i], "slug") || "").trim(),
        person_id: String(get(rows[i], "person_id") || "").trim(),
        sort: _asInt_(get(rows[i], "sort"), 0),
      });
    }
  }
  out.sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  return out;
}

function _replacePeople_(slug, people) {
  _deleteRowsBySlug_(NEWS_CFG.SHEETS.PEOPLE, slug);

  if (!people || !people.length) return;

  const sh = _sheet_(NEWS_CFG.SHEETS.PEOPLE);
  const headers = _headers_(sh);

  ["id", "slug", "person_id", "sort"].forEach((h) => {
    if (headers.indexOf(h) === -1) throw new Error(`Missing column in news_people: ${h}`);
  });

  const rowsToAppend = [];
  for (let i = 0; i < people.length; i++) {
    const p = people[i] || {};
    const person_id = String(p.person_id || "").trim();
    if (!person_id) continue;

    const sort = _asInt_(p.sort, i);
    const id = String(p.id || "").trim() || `${slug}__${person_id}__${sort}`;

    const obj = { id, slug, person_id, sort };
    rowsToAppend.push(headers.map((h) => (obj[h] != null ? obj[h] : "")));
  }

  if (!rowsToAppend.length) return;
  sh.getRange(sh.getLastRow() + 1, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
}

/* =========================
 * Internals — Drive uploads
 * ========================= */

function _uploadToFolder_(opts) {
  const folder = DriveApp.getFolderById(opts.folderId);

  const bytes = Utilities.base64Decode(String(opts.base64));
  const blob = Utilities.newBlob(bytes, opts.mimeType || "application/octet-stream");

  const name = _nextFileName_(folder, String(opts.prefix || "file_"));
  blob.setName(name);

  const file = folder.createFile(blob);

  // Make link accessible
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    // If domain policy blocks this, still return file URL (user can adjust sharing)
  }

  return file;
}

function _nextFileName_(folder, prefix) {
  // Finds highest existing suffix among files like prefix + 000..999 and returns next.
  let maxN = -1;
  const it = folder.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    const nm = f.getName();
    if (nm.indexOf(prefix) !== 0) continue;
    const tail = nm.slice(prefix.length);
    const m = tail.match(/^(\d{3})/);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (!isNaN(n)) maxN = Math.max(maxN, n);
  }
  const next = maxN + 1;
  return prefix + Utilities.formatString("%03d", next);
}

/* =========================
 * Internals — Generic sheet helpers
 * ========================= */

function _deleteRowsBySlug_(sheetName, slug) {
  const sh = _sheet_(sheetName);
  const headers = _headers_(sh);
  const slugCol = headers.indexOf("slug");
  if (slugCol === -1) throw new Error(`Missing column in ${sheetName}: slug`);

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return;

  const values = sh.getRange(2, 1, lastRow - 1, headers.length).getValues();

  // Delete bottom-up to keep indices stable
  for (let i = values.length - 1; i >= 0; i--) {
    if (String(values[i][slugCol] || "").trim() === slug) {
      sh.deleteRow(i + 2);
    }
  }
}

function _sheet_(name) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error(`Missing sheet: ${name}`);
  return sh;
}

function _headers_(sh) {
  const lastCol = sh.getLastColumn();
  if (lastCol < 1) throw new Error(`Sheet has no columns: ${sh.getName()}`);
  return sh.getRange(1, 1, 1, lastCol).getValues()[0].map((h) => String(h || "").trim());
}


function _readTable_(sh) {
  const headers = _headers_(sh);
  const lastRow = sh.getLastRow();
  const rows = lastRow >= 2 ? sh.getRange(2, 1, lastRow - 1, headers.length).getValues() : [];
  return { headers, rows };
}

function _rowGetter_(headers) {
  const map = {};
  const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, "_");
  headers.forEach((h, i) => {
    const k = norm(h);
    if (!(k in map)) map[k] = i;
  });

  return function (row, key) {
    const idx = map[norm(key)];
    return idx == null ? "" : row[idx];
  };
}


/* =========================
 * Internals — misc
 * ========================= */

function _slugify_(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "article";
}

function _todayISO_() {
  // Uses spreadsheet timezone
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone() || "GMT";
  return Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
}

function _asInt_(v, fallback) {
  const n = parseInt(v, 10);
  return isNaN(n) ? (fallback != null ? fallback : 0) : n;
}
