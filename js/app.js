const ORDINAL = [
  "zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh",
  "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth",
  "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth",
  "twenty-first", "twenty-second", "twenty-third", "twenty-fourth", "twenty-fifth",
  "twenty-sixth", "twenty-seventh", "twenty-eighth", "twenty-ninth", "thirtieth",
  "thirty-first",
];

const canvas = document.getElementById("certificate");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");

const imageCache = new Map();
let catalog = null;
let customLeftUrl = null;
let customRightUrl = null;
let parchment = null;
let renderToken = 0;
let renderInFlight = false;
let renderPending = false;

function $(id) {
  return document.getElementById(id);
}

/** Filename-safe slug (lowercase, alnum + hyphen). */
function fileSlug(value, fallback = "x") {
  const s = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || fallback;
}

/** UTC stamp: DDHHMMSSZmmmYY */
function utcStamp(date = new Date()) {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  const mmm = String(date.getUTCMilliseconds()).padStart(3, "0");
  const yy = String(date.getUTCFullYear()).slice(-2);
  return `${dd}${hh}${mm}${ss}Z${mmm}${yy}`;
}

function makeCrc32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
}

const CRC32_TABLE = makeCrc32Table();

/** 32-bit CRC32 as 8-char lowercase hex. */
function crc32Hex(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0");
}

function canvasToPngBlob(c) {
  return new Promise((resolve, reject) => {
    c.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG export failed"));
    }, "image/png");
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = filename;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}

function dayWord(n) {
  return ORDINAL[Math.min(31, Math.max(1, Number(n) || 1))] || String(n);
}

function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) return imageCache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  imageCache.set(src, p);
  return p;
}

function divisionList() {
  return catalog.divisions || [];
}

function commandList() {
  return catalog.commandGroups || [];
}

function selectedDivision() {
  const list = divisionList();
  return list.find((u) => u.id === $("division").value) || list[0] || null;
}

function selectedCommand() {
  const list = commandList();
  return list.find((c) => c.id === $("commandGroup").value) || list.find((c) => c.abbr === "FORSCOM") || list[0] || null;
}

function divisionDisplayName() {
  const custom = $("divisionCustom").value.trim();
  if (custom) return custom;
  return selectedDivision()?.name || "Division";
}

function syncLeftUnitFromDivision() {
  const div = selectedDivision();
  if (!div) return;
  $("leftUnit").value = div.id;
  // Default right seal to the unit's parent command when available.
  if (div.command && commandList().some((c) => c.id === div.command)) {
    $("commandGroup").value = div.command;
  }
}

async function resolveLeftLogo() {
  if (customLeftUrl) return customLeftUrl;
  const id = $("leftUnit").value || selectedDivision()?.id;
  const unit = divisionList().find((u) => u.id === id) || selectedDivision();
  return unit?.logo || null;
}

async function resolveRightLogo(course) {
  if (customRightUrl) return customRightUrl;
  const cmd = selectedCommand();
  return cmd?.logo || course.defaultRightLogo || null;
}

function resolveWatermark(course) {
  return $("watermarkLogo").value || course.watermarkLogo || null;
}

function fillSelect(el, items, getValue, getLabel, includeBlank) {
  el.innerHTML = "";
  if (includeBlank) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = includeBlank;
    el.appendChild(opt);
  }
  for (const item of items) {
    const opt = document.createElement("option");
    opt.value = getValue(item);
    opt.textContent = getLabel(item);
    el.appendChild(opt);
  }
}

function fillSelectGrouped(el, groups) {
  el.innerHTML = "";
  for (const group of groups) {
    const og = document.createElement("optgroup");
    og.label = group.label;
    for (const item of group.items) {
      const opt = document.createElement("option");
      opt.value = item.value;
      opt.textContent = item.label;
      og.appendChild(opt);
    }
    el.appendChild(og);
  }
}

function populateCourseSelect() {
  fillSelect(
    $("course"),
    catalog.courses,
    (c) => c.id,
    (c) => (c.enabled ? c.name : `${c.name} (coming soon)`),
  );
  for (const opt of $("course").options) {
    const course = catalog.courses.find((c) => c.id === opt.value);
    if (course && !course.enabled) opt.disabled = true;
  }
}

function populateDivisionSelects() {
  const cmds = commandList();
  const byCmd = new Map(cmds.map((c) => [c.id, []]));
  for (const d of divisionList()) {
    if (!byCmd.has(d.command)) byCmd.set(d.command, []);
    byCmd.get(d.command).push(d);
  }

  const grouped = [];
  for (const cmd of cmds) {
    const items = (byCmd.get(cmd.id) || []).map((d) => ({
      value: d.id,
      label: `${d.name} (${d.abbr})`,
    }));
    if (items.length) grouped.push({ label: `${cmd.abbr} — ${cmd.name}`, items });
  }
  // Any leftovers without known command
  const known = new Set(cmds.map((c) => c.id));
  const orphan = divisionList().filter((d) => !known.has(d.command));
  if (orphan.length) {
    grouped.push({
      label: "Other",
      items: orphan.map((d) => ({ value: d.id, label: `${d.name} (${d.abbr})` })),
    });
  }

  fillSelectGrouped($("division"), grouped);
  fillSelectGrouped($("leftUnit"), grouped);
}

function populateCommandSelect() {
  fillSelect(
    $("commandGroup"),
    commandList(),
    (c) => c.id,
    (c) => `${c.abbr} — ${c.name}`,
  );
  const forscom = commandList().find((c) => c.abbr === "FORSCOM");
  if (forscom) $("commandGroup").value = forscom.id;
}

function populateWatermarkSelect(course) {
  const opts = [];
  if (course.watermarkLogo) {
    opts.push({ value: course.watermarkLogo, label: `${course.shortName} default (Army University)` });
  }
  for (const g of catalog.trackedGroups || []) {
    if (g.logo) opts.push({ value: g.logo, label: `${g.abbr} — ${g.name}` });
  }
  fillSelect($("watermarkLogo"), opts, (o) => o.value, (o) => o.label);
  if (course.watermarkLogo) $("watermarkLogo").value = course.watermarkLogo;
}

function setPreview(el, src, label) {
  el.innerHTML = "";
  if (src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = label || "logo";
    el.appendChild(img);
  }
  const span = document.createElement("span");
  span.textContent = label || "No logo selected";
  el.appendChild(span);
}

async function updateLogoPreviews(course) {
  const left = await resolveLeftLogo();
  const right = await resolveRightLogo(course);
  const wm = resolveWatermark(course);
  setPreview($("leftLogoPreview"), left, left ? "Left seal" : "Missing left logo");
  setPreview($("rightLogoPreview"), right, right ? "Right seal" : "Missing right logo");
  setPreview($("watermarkPreview"), wm, wm ? "Watermark" : "No watermark");
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(/\s+/);
  let line = "";
  const lines = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => context.fillText(l, x, startY + i * lineHeight));
  return lines;
}

function drawBoldSegments(context, parts, x, y, maxWidth, lineHeight) {
  const tokens = [];
  for (const part of parts) {
    const words = part.text.split(/(\s+)/).filter((w) => w.length > 0);
    for (const w of words) {
      tokens.push({ text: w, bold: part.bold });
    }
  }

  const fontFor = (bold) => (bold
    ? 'bold 26px "Libre Baskerville", "Times New Roman", serif'
    : '400 26px "Libre Baskerville", "Times New Roman", serif');

  const measure = (tok) => {
    context.font = fontFor(tok.bold);
    return context.measureText(tok.text).width;
  };

  const lines = [];
  let current = [];
  let width = 0;
  for (const tok of tokens) {
    const w = measure(tok);
    if (width + w > maxWidth && current.length) {
      lines.push(current);
      current = /^\s+$/.test(tok.text) ? [] : [tok];
      width = current.length ? w : 0;
    } else {
      current.push(tok);
      width += w;
    }
  }
  if (current.length) lines.push(current);

  const prevAlign = context.textAlign;
  context.textAlign = "left";

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((lineTokens, i) => {
    const lineWidth = lineTokens.reduce((sum, tok) => sum + measure(tok), 0);
    let cx = x - lineWidth / 2;
    const cy = startY + i * lineHeight;
    for (const tok of lineTokens) {
      context.font = fontFor(tok.bold);
      context.fillText(tok.text, cx, cy);
      cx += measure(tok);
    }
  });

  context.textAlign = prevAlign;
}

function drawCircularLogo(context, img, cx, cy, size) {
  if (!img) return;
  const radius = size / 2;

  // Cream disc behind the seal so transparent/tall patches don't look cropped.
  context.save();
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.closePath();
  context.fillStyle = "#f3ead2";
  context.fill();
  context.clip();

  // Nearly fill the circle — small overscale for square group seals closes the ring gap.
  // Tall SSI patches still contain-fit with a modest inset.
  const isNearlySquare = Math.abs(img.width - img.height) / Math.max(img.width, img.height) < 0.08;
  const inset = size * (isNearlySquare ? 1.04 : 0.92);
  const scale = Math.min(inset / img.width, inset / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  context.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  context.restore();

  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.strokeStyle = "#1a1a1a";
  context.lineWidth = 3;
  context.stroke();
}

async function renderCertificate() {
  if (!catalog) return;
  const token = ++renderToken;
  const course = catalog.courses.find((c) => c.id === $("course").value) || catalog.courses[0];
  const graduate = $("graduate").value.trim() || "(Graduate's username)";
  const division = divisionDisplayName();
  const dcg = $("dcg").value.trim() || "(DCG username)";
  const bco = $("bco").value.trim() || "(BCO username)";
  const leftTitle =
    $("leftSignatoryTitle").value.trim() ||
    course.leftSignatoryTitle ||
    "Division Commanding General,";
  const rightTitle =
    $("rightSignatoryTitle").value.trim() ||
    course.rightSignatoryTitle ||
    "Brigade Commanding Officer,";
  const day = dayWord($("day").value);
  const month = $("month").value;
  const year = $("year").value || new Date().getFullYear();
  const location = $("location").value.trim() || course.defaultLocation || "Fort Jackson";

  const leftSrc = await resolveLeftLogo();
  const rightSrc = await resolveRightLogo(course);
  const wmSrc = resolveWatermark(course);

  const [leftImg, rightImg, wmImg] = await Promise.all([
    loadImage(leftSrc),
    loadImage(rightSrc),
    loadImage(wmSrc),
  ]);

  // A newer render was requested while we awaited images — abandon this one.
  if (token !== renderToken) return;

  await updateLogoPreviews(course);
  if (token !== renderToken) return;

  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (parchment) {
    ctx.drawImage(parchment, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#f5ecd6";
    ctx.fillRect(0, 0, W, H);
  }

  // Border
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  // Watermark
  if (wmImg) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    const size = Math.min(W, H) * 0.62;
    ctx.drawImage(wmImg, (W - size) / 2, (H - size) / 2 - 20, size, size);
    ctx.restore();
  }

  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = '700 58px "Libre Baskerville", serif';
  ctx.fillText(course.certificateTitle || course.name, W / 2, 145);

  ctx.font = 'italic 34px "Libre Baskerville", serif';
  ctx.fillText(course.certificateSubtitle || "Certificate of Graduation", W / 2, 205);

  ctx.font = '400 72px "Great Vibes", cursive';
  ctx.fillText(graduate, W / 2, 295);
  ctx.beginPath();
  ctx.moveTo(W / 2 - 240, 335);
  ctx.lineTo(W / 2 + 240, 335);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#222";
  ctx.stroke();

  const bodyParts = [
    { text: "This is to certify that Candidate ", bold: false },
    { text: graduate, bold: true },
    { text: " of the ", bold: false },
    { text: division, bold: true },
    { text: " has successfully completed the prescribed course of instruction and satisfied all requirements of ", bold: false },
    { text: course.certificateTitle || course.name, bold: true },
    { text: ", demonstrating the professionalism, trustworthiness, and courage expected of a commissioned officer.", bold: false },
  ];
  drawBoldSegments(ctx, bodyParts, W / 2, 455, W - 320, 40);

  const sealY = 720;
  const sealSize = 200;
  drawCircularLogo(ctx, leftImg, W / 2 - 150, sealY, sealSize);
  drawCircularLogo(ctx, rightImg, W / 2 + 150, sealY, sealSize);

  ctx.fillStyle = "#111";
  ctx.font = '400 26px "Libre Baskerville", serif';
  ctx.fillText(`Given this ${day} day of ${month}, ${year}, at ${location}.`, W / 2, 880);

  // Signatures
  const leftX = W * 0.28;
  const rightX = W * 0.72;
  const sigY = 1055;

  ctx.font = '400 48px "Great Vibes", cursive';
  ctx.fillText(dcg, leftX, sigY);
  ctx.fillText(bco, rightX, sigY);

  ctx.beginPath();
  ctx.moveTo(leftX - 170, sigY + 36);
  ctx.lineTo(leftX + 170, sigY + 36);
  ctx.moveTo(rightX - 170, sigY + 36);
  ctx.lineTo(rightX + 170, sigY + 36);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = '400 22px "Libre Baskerville", serif';
  ctx.fillText(leftTitle, leftX, sigY + 70);
  ctx.fillText(division, leftX, sigY + 100);
  ctx.fillText(rightTitle, rightX, sigY + 70);
  ctx.fillText(course.rightSignatoryOrg || "Army University", rightX, sigY + 100);

  statusEl.textContent = `${course.shortName} · ${graduate} · ${division}`;
}

function queueRender() {
  renderPending = true;
  if (renderInFlight) return;
  renderInFlight = true;
  (async () => {
    while (renderPending) {
      renderPending = false;
      try {
        await renderCertificate();
      } catch (err) {
        console.error(err);
        statusEl.textContent = "Render error — check console";
      }
    }
    renderInFlight = false;
  })();
}

function readFileAsUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function syncSignatoryTitlesFromCourse(course) {
  if (!course) return;
  syncLeftSignatoryTitle(course);
  $("rightSignatoryTitle").value = course.rightSignatoryTitle || "Brigade Commanding Officer,";
}

/** Left title follows QMC selection; other units use the course default. */
function syncLeftSignatoryTitle(course) {
  if (!course) return;
  const leftUnitId = $("leftUnit").value || $("division").value;
  const isQmc = leftUnitId === "QMC" || selectedDivision()?.abbr === "QMC";
  $("leftSignatoryTitle").value = isQmc
    ? "Quartermaster General,"
    : course.leftSignatoryTitle || "Division Commanding General,";
}

function wireEvents() {
  const form = $("cert-form");
  form.addEventListener("input", queueRender);
  form.addEventListener("change", queueRender);

  $("course").addEventListener("change", () => {
    const course = catalog.courses.find((c) => c.id === $("course").value);
    if (!course || !course.enabled) return;
    $("location").value = course.defaultLocation || $("location").value;
    syncSignatoryTitlesFromCourse(course);
    populateWatermarkSelect(course);
    queueRender();
  });

  $("division").addEventListener("change", () => {
    customLeftUrl = null;
    $("leftCustomFile").value = "";
    syncLeftUnitFromDivision();
    const course = catalog.courses.find((c) => c.id === $("course").value);
    syncLeftSignatoryTitle(course);
    queueRender();
  });

  $("leftUnit").addEventListener("change", () => {
    customLeftUrl = null;
    $("leftCustomFile").value = "";
    // Keep graduate division text in sync when picking left seal directly.
    if ($("leftUnit").value) $("division").value = $("leftUnit").value;
    const div = selectedDivision();
    if (div?.command && commandList().some((c) => c.id === div.command)) {
      $("commandGroup").value = div.command;
    }
    const course = catalog.courses.find((c) => c.id === $("course").value);
    syncLeftSignatoryTitle(course);
    queueRender();
  });

  $("commandGroup").addEventListener("change", () => {
    customRightUrl = null;
    $("rightCustomFile").value = "";
    queueRender();
  });

  $("leftCustomFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    customLeftUrl = await readFileAsUrl(file);
    imageCache.delete(customLeftUrl);
    queueRender();
  });

  $("rightCustomFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    customRightUrl = await readFileAsUrl(file);
    imageCache.delete(customRightUrl);
    queueRender();
  });

  form.addEventListener("reset", () => {
    setTimeout(() => {
      customLeftUrl = null;
      customRightUrl = null;
      const course = catalog.courses.find((c) => c.enabled) || catalog.courses[0];
      $("course").value = course.id;
      $("location").value = course.defaultLocation || "Fort Jackson";
      populateWatermarkSelect(course);
      const eightySecond = divisionList().find((u) => u.abbr === "82nd");
      if (eightySecond) $("division").value = eightySecond.id;
      syncLeftUnitFromDivision();
      syncSignatoryTitlesFromCourse(course);
      queueRender();
    }, 0);
  });

  $("downloadBtn").addEventListener("click", async () => {
    await renderCertificate();
    const course = catalog.courses.find((c) => c.id === $("course").value);
    const coursePart = fileSlug(course?.shortName || course?.id || "cert", "cert");
    const userPart = fileSlug($("graduate").value, "graduate");
    const stamp = utcStamp();
    const blob = await canvasToPngBlob(canvas);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const checksum = crc32Hex(bytes);
    downloadBlob(blob, `${coursePart}-${userPart}-${stamp}-${checksum}.png`);
  });

  $("fullscreenBtn").addEventListener("click", () => {
    document.body.classList.toggle("preview-expanded");
    $("fullscreenBtn").textContent = document.body.classList.contains("preview-expanded")
      ? "Show form"
      : "Expand preview";
  });
}

async function init() {
  try {
    const res = await fetch("data/catalog.json");
    catalog = await res.json();
  } catch (err) {
    statusEl.textContent = "Failed to load data/catalog.json";
    console.error(err);
    return;
  }

  parchment = await loadImage("assets/textures/parchment.png");
  await Promise.all([
    document.fonts.load('400 26px "Libre Baskerville"'),
    document.fonts.load('bold 26px "Libre Baskerville"'),
    document.fonts.load('italic 34px "Libre Baskerville"'),
    document.fonts.load('700 58px "Libre Baskerville"'),
    document.fonts.load('400 72px "Great Vibes"'),
  ]);
  await document.fonts.ready;

  populateCourseSelect();
  populateDivisionSelects();
  populateCommandSelect();

  const course = catalog.courses.find((c) => c.enabled) || catalog.courses[0];
  $("course").value = course.id;
  $("location").value = course.defaultLocation || "Fort Jackson";
  populateWatermarkSelect(course);

  const eightySecond = divisionList().find((u) => u.abbr === "82nd");
  if (eightySecond) $("division").value = eightySecond.id;
  syncLeftUnitFromDivision();
  syncSignatoryTitlesFromCourse(course);

  wireEvents();
  queueRender();
  statusEl.textContent = "Ready";
}

init();
