/**
 * Original, code-drawn illustrations (no stock photos, so no licensing or broken-URL risk).
 * Every picture shares one visual language: deep-navy blueprint background, a soft accent glow and clean line-art.
 */

const NAVY = "#0B1220";
const NAVY2 = "#132340";
const MID = "#1E3A5F";
const SOFT = "#E2E8F0";
const CYAN = "#38BDF8";

type Ctx = { a: string };
const st = (a: string, w = 4) => `fill="none" stroke="${a}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Branch colour accents. */
export const BRANCH_ACCENT: Record<string, string> = {
  cse: "#38BDF8", it: "#38BDF8", ece: "#22D3EE", eee: "#FBBF24", mechanical: "#FB923C", civil: "#A3E635",
  "ai-data-science": "#A78BFA", robotics: "#F472B6", mechatronics: "#F472B6", aerospace: "#60A5FA", automobile: "#FB923C",
  biomedical: "#F87171", chemical: "#2DD4BF", instrumentation: "#22D3EE", agricultural: "#4ADE80", iot: "#22D3EE",
};

function frame(w: number, h: number, a: string, body: string, title: string): string {
  const id = `g${Math.abs(hash(title + a))}`;
  let grid = "";
  for (let x = 0; x <= w; x += 40) grid += `<path d="M${x} 0V${h}" />`;
  for (let y = 0; y <= h; y += 40) grid += `<path d="M0 ${y}H${w}" />`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<defs>
<linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${NAVY2}"/><stop offset="1" stop-color="${NAVY}"/></linearGradient>
<radialGradient id="${id}r" cx="0.5" cy="0.48" r="0.55"><stop offset="0" stop-color="${a}" stop-opacity="0.34"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#${id}b)"/>
<g stroke="#FFFFFF" stroke-opacity="0.045" stroke-width="1">${grid}</g>
<rect width="${w}" height="${h}" fill="url(#${id}r)"/>
<g>${body}</g>
</svg>
`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

// ------------------------------------------------------------------ primitives
const dot = (x: number, y: number, r: number, f: string) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`;
const rect = (x: number, y: number, w: number, h: number, o: { f?: string; s?: string; r?: number; sw?: number } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 8}" fill="${o.f ?? "none"}" stroke="${o.s ?? "none"}" stroke-width="${o.sw ?? 4}"/>`;
const line = (x1: number, y1: number, x2: number, y2: number, c: string, w = 4) => `<path d="M${x1} ${y1}L${x2} ${y2}" ${st(c, w)}/>`;
const path = (d: string, c: string, w = 4, fill = "none") => `<path d="${d}" fill="${fill}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const wifi = (cx: number, cy: number, a: string, s = 1) =>
  [1, 2, 3].map((i) => path(`M${cx - 18 * i * s} ${cy - 14 * i * s}Q${cx} ${cy - 34 * i * s} ${cx + 18 * i * s} ${cy - 14 * i * s}`, a, 4, "none")).join("") + dot(cx, cy, 5 * s, a);
const bolt = (cx: number, cy: number, s: number, c: string) =>
  path(`M${cx + 6 * s} ${cy - 24 * s}L${cx - 14 * s} ${cy + 4 * s}H${cx} L${cx - 6 * s} ${cy + 26 * s}L${cx + 16 * s} ${cy - 4 * s}H${cx + 2 * s}Z`, c, 3, c);
const pins = (x: number, y: number, n: number, gap: number, len: number, dir: "h" | "v", c: string) => {
  let s = "";
  for (let i = 0; i < n; i++) s += dir === "h" ? line(x + i * gap, y, x + i * gap, y + len, c, 4) : line(x, y + i * gap, x + len, y + i * gap, c, 4);
  return s;
};
function gearPath(cx: number, cy: number, r: number, teeth: number, depth: number): string {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const q = step / 4;
    const arr: [number, number][] = [[a0, r - depth], [a0 + q * 0.6, r], [a0 + q * 1.9, r], [a0 + q * 2.5, r - depth]];
    for (const [ang, rr] of arr) pts.push(`${(cx + Math.cos(ang) * rr).toFixed(1)} ${(cy + Math.sin(ang) * rr).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

// ------------------------------------------------------------------ motifs (all centred on 400,300 in an 800x600 frame)
const MOTIFS: Record<string, (c: Ctx) => string> = {
  brain: ({ a }) => {
    const L = [[250, [180, 300, 420]], [400, [130, 240, 360, 470]], [550, [180, 300, 420]]] as const;
    let s = "";
    for (let i = 0; i < 2; i++) for (const y1 of L[i][1]) for (const y2 of L[i + 1][1]) s += line(L[i][0], y1, L[i + 1][0], y2, a + "55", 2);
    for (const [x, ys] of L) for (const y of ys) s += dot(x, y, 18, NAVY) + `<circle cx="${x}" cy="${y}" r="18" ${st(a, 4)}/>`;
    return s + dot(550, 300, 8, a) + path("M600 300H660", a, 4) + path("M648 288L662 300L648 312", a, 4);
  },
  dashboard: ({ a }) =>
    rect(150, 120, 500, 360, { f: NAVY, s: a, r: 18 }) + line(150, 170, 650, 170, a, 4) + dot(180, 145, 6, a) + dot(204, 145, 6, SOFT) + dot(228, 145, 6, MID) +
    [0, 1, 2].map((i) => rect(180 + i * 150, 200, 130, 70, { f: MID, r: 10 }) + line(196 + i * 150, 224, 250 + i * 150, 224, a, 5) + line(196 + i * 150, 248, 280 + i * 150, 248, SOFT + "88", 4)).join("") +
    path("M185 440L260 390L330 415L420 330L500 372L610 290", a, 5) + [[260, 390], [330, 415], [420, 330], [500, 372]].map(([x, y]) => dot(x, y, 7, SOFT)).join(""),
  shield: ({ a }) =>
    path("M400 110L570 175V300C570 395 500 460 400 495C300 460 230 395 230 300V175Z", a, 6, NAVY) + path("M335 300L385 350L475 245", SOFT, 12) +
    [[130, 200], [110, 330], [150, 440], [670, 220], [690, 350], [650, 450]].map(([x, y]) => rect(x - 18, y - 12, 36, 24, { f: MID, s: a + "99", r: 6, sw: 3 })).join("") +
    [[148, 205, 215, 240], [128, 330, 232, 315], [168, 437, 245, 400], [652, 225, 585, 245], [672, 350, 568, 320], [632, 445, 555, 405]].map(([x1, y1, x2, y2]) => line(x1, y1, x2, y2, a + "66", 3)).join(""),
  cart: ({ a }) =>
    path("M140 160H215L285 380H585L640 240H245", a, 6) + dot(320, 440, 22, NAVY) + `<circle cx="320" cy="440" r="22" ${st(a, 6)}/>` + dot(550, 440, 22, NAVY) + `<circle cx="550" cy="440" r="22" ${st(a, 6)}/>` +
    [0, 1, 2].map((i) => rect(310 + i * 90, 270 - (i === 1 ? 20 : 0), 70, 90 + (i === 1 ? 20 : 0), { f: MID, s: SOFT + "AA", r: 8, sw: 3 })).join("") +
    path("M470 120Q520 70 580 110", a, 4) + path("M566 92L584 112L560 122", a, 4) + dot(470, 120, 8, a) + dot(640, 110, 10, SOFT),
  document: ({ a }) =>
    rect(220, 100, 300, 400, { f: NAVY, s: a, r: 16 }) + [150, 195, 240].map((y, i) => line(260, y, 480 - i * 40, y, i === 0 ? a : SOFT + "99", 6)).join("") +
    [300, 345, 390, 435].map((y, i) => line(260, y, 480 - ((i * 37) % 70), y, MID, 6)).join("") +
    `<circle cx="540" cy="360" r="72" fill="${NAVY}" fill-opacity="0.9" ${st(a, 8)}/>` + line(592, 412, 650, 470, a, 12) + path("M512 360L534 382L574 338", SOFT, 8),
  chip: ({ a }) =>
    rect(270, 200, 260, 200, { f: NAVY, s: a, r: 14 }) + rect(300, 230, 120, 140, { f: MID, s: a + "AA", r: 8, sw: 3 }) +
    pins(290, 180, 8, 28, 20, "h", SOFT) + pins(290, 400, 8, 28, 20, "h", SOFT) + wifi(400, 160, a, 1.25).replace(/<g>/, "") +
    line(440, 240, 500, 240, a, 5) + line(440, 275, 500, 275, SOFT + "88", 5) + line(440, 310, 480, 310, SOFT + "88", 5) +
    path("M180 300H270", a + "AA", 4) + dot(180, 300, 8, a) + path("M530 300H620", a + "AA", 4) + dot(620, 300, 8, a) + rect(530, 480, 90, 50, { f: MID, s: a, r: 8, sw: 3 }) + line(575, 480, 575, 400, a + "88", 3),
  sensorcloud: ({ a }) =>
    rect(150, 300, 80, 170, { f: NAVY, s: SOFT, r: 40 }) + rect(180, 340, 20, 80, { f: a, r: 10 }) + dot(190, 440, 26, a) + wifi(305, 335, a, 1.1) +
    path("M440 330Q440 260 505 258Q520 190 590 205Q650 195 665 260Q725 265 715 330Z", a, 6, MID) +
    path("M470 460L520 420L570 440L625 390L690 410", a, 5) + [[520, 420], [570, 440], [625, 390]].map(([x, y]) => dot(x, y, 7, SOFT)).join("") + line(440, 480, 720, 480, SOFT + "55", 3),
  fpga: ({ a }) =>
    rect(230, 150, 250, 250, { f: NAVY, s: a, r: 16 }) +
    [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => rect(255 + c * 56, 175 + r * 56, 44, 44, { f: (r + c) % 3 === 0 ? a + "55" : MID, r: 6 })).join("")).join("") +
    pins(255, 128, 4, 56, 22, "h", SOFT) + pins(255, 400, 4, 56, 22, "h", SOFT) + pins(208, 175, 4, 56, 22, "v", SOFT) + pins(480, 175, 4, 56, 22, "v", SOFT) +
    rect(560, 140, 90, 270, { f: NAVY, s: SOFT, r: 22 }) + dot(605, 190, 26, "#EF4444") + dot(605, 275, 26, "#FBBF24") + dot(605, 360, 26, "#22C55E") + line(605, 410, 605, 480, SOFT, 8) + line(580, 480, 630, 480, SOFT, 8),
  wave: ({ a }) => {
    const noisy = Array.from({ length: 41 }, (_, i) => `${150 + i * 6.5} ${190 + Math.sin(i / 2.2) * 50 + Math.sin(i * 2.7) * 16}`).join("L");
    const clean = Array.from({ length: 41 }, (_, i) => `${540 + i * 3.3} ${410 + Math.sin(i / 2.2) * 50}`).join("L");
    return path(`M${noisy}`, SOFT + "88", 4) + rect(325, 215, 150, 170, { f: NAVY, s: a, r: 16 }) + path("M355 340Q375 260 400 300T445 260", a, 5) + path("M300 300H325M475 300H500", a, 4) + path(`M${clean}`, a, 5) + path("M150 520H650", SOFT + "33", 2);
  },
  meter: ({ a }) =>
    `<circle cx="400" cy="300" r="190" fill="${NAVY}" ${st(a, 7)}/>` +
    Array.from({ length: 11 }, (_, i) => { const t = Math.PI * (1.15 + i * 0.07 * 1.3 * 1); const x1 = 400 + Math.cos(t) * 160, y1 = 300 + Math.sin(t) * 160, x2 = 400 + Math.cos(t) * 140, y2 = 300 + Math.sin(t) * 140; return line(x1, y1, x2, y2, SOFT + "AA", 4); }).join("") +
    line(400, 300, 480, 215, a, 8) + dot(400, 300, 16, a) + rect(325, 345, 150, 54, { f: MID, s: SOFT + "66", r: 10, sw: 2 }) + bolt(400, 372, 0.9, a),
  solar: ({ a }) =>
    path("M230 340L330 190H620L520 340Z", a, 6, MID) +
    [1, 2].map((i) => line(230 + i * 33.3 * 0 + (330 - 230) * (i / 3) * -1 + 0 + 0, 340 - i * 50, 520 + (620 - 520) * (i / 3), 340 - i * 50, a + "88", 3)).join("") +
    [1, 2, 3].map((i) => line(230 + i * 72.5, 340, 330 + i * 72.5, 190, a + "88", 3)).join("") +
    line(375, 340, 375, 450, SOFT, 10) + line(310, 470, 440, 470, SOFT, 10) + line(375, 450, 330, 470, SOFT, 6) +
    dot(640, 130, 34, "#FBBF24") + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const t = (i * Math.PI) / 4; return line(640 + Math.cos(t) * 48, 130 + Math.sin(t) * 48, 640 + Math.cos(t) * 66, 130 + Math.sin(t) * 66, "#FBBF24", 5); }).join("") +
    path("M610 160L540 240", "#FBBF24AA", 3),
  battery: ({ a }) =>
    rect(190, 220, 380, 200, { f: NAVY, s: a, r: 22, sw: 7 }) + rect(570, 285, 36, 70, { f: a, r: 8 }) +
    [0, 1, 2, 3].map((i) => rect(215 + i * 88, 245, 72, 150, { f: i < 3 ? a + (i === 2 ? "99" : "") : MID, r: 10 })).join("") + bolt(375, 320, 1.4, NAVY) +
    rect(620, 150, 44, 170, { f: NAVY, s: SOFT, r: 22 }) + dot(642, 340, 26, "#F87171") + rect(634, 200, 16, 130, { f: "#F87171", r: 8 }) + line(670, 190, 700, 190, SOFT, 3) + line(670, 230, 700, 230, SOFT, 3),
  evcharge: ({ a }) =>
    rect(480, 150, 150, 250, { f: NAVY, s: a, r: 20 }) + rect(505, 180, 100, 70, { f: MID, r: 10 }) + bolt(555, 215, 1.2, a) + line(555, 400, 555, 470, SOFT, 10) + line(500, 470, 610, 470, SOFT, 10) +
    path("M480 330Q430 330 410 380T330 400", a, 7) + rect(310, 385, 50, 30, { f: a, r: 8 }) +
    path("M120 400V355Q120 335 145 330L200 320L240 270Q250 260 270 260H330Q350 260 360 270L395 320V400Z", SOFT, 5, MID) + dot(190, 405, 26, NAVY) + `<circle cx="190" cy="405" r="26" ${st(SOFT, 5)}/>` + dot(330, 405, 26, NAVY) + `<circle cx="330" cy="405" r="26" ${st(SOFT, 5)}/>`,
  streetlight: ({ a }) =>
    `<path d="M365 170L220 480H580L435 170Z" fill="${a}" fill-opacity="0.16"/>` + path("M400 520V190Q400 150 440 150H480", SOFT, 10) + rect(455, 135, 90, 34, { f: a, r: 14 }) +
    `<path d="M470 168L330 480H610Z" fill="${a}" fill-opacity="0.14"/>` + line(130, 520, 670, 520, SOFT + "66", 4) +
    dot(210, 470, 10, SOFT) + line(210, 480, 210, 505, SOFT, 6) + dot(610, 470, 10, SOFT) + line(610, 480, 610, 505, SOFT, 6) +
    wifi(250, 175, a, 0.9) + path("M300 160L330 130", a + "00", 0),
  windsolar: ({ a }) =>
    line(300, 250, 300, 500, SOFT, 10) + dot(300, 250, 18, a) +
    [0, 120, 240].map((d) => { const t = ((d - 90) * Math.PI) / 180; return path(`M300 250L${300 + Math.cos(t) * 140} ${250 + Math.sin(t) * 140}`, SOFT, 10); }).join("") +
    path("M480 440L520 340H660L620 440Z", a, 5, MID) + line(550, 340, 530, 440, a + "88", 3) + line(590, 340, 575, 440, a + "88", 3) + line(500, 390, 640, 390, a + "88", 3) + line(560, 440, 560, 500, SOFT, 6) +
    [0, 1, 2, 3].map((i) => rect(470 + i * 45, 205 - i * 12, 30, 60 + i * 12, { f: i === 3 ? a : a + "77", r: 4 })).join(""),
  arm: ({ a }) =>
    rect(210, 470, 260, 40, { f: MID, s: a, r: 10, sw: 3 }) + rect(300, 430, 80, 40, { f: NAVY, s: SOFT, r: 8, sw: 4 }) +
    path("M340 430L300 280", SOFT, 22) + path("M340 430L300 280", a, 12) + dot(340, 430, 20, NAVY) + `<circle cx="340" cy="430" r="20" ${st(a, 6)}/>` +
    path("M300 280L470 190", SOFT, 20) + path("M300 280L470 190", a, 10) + dot(300, 280, 20, NAVY) + `<circle cx="300" cy="280" r="20" ${st(a, 6)}/>` +
    dot(470, 190, 18, NAVY) + `<circle cx="470" cy="190" r="18" ${st(a, 6)}/>` + path("M470 190L540 210M470 190L520 150", SOFT, 10) + rect(560, 455, 70, 55, { f: a + "55", s: a, r: 8, sw: 3 }) + path("M535 215L545 300", a + "99", 3) + dot(595, 440, 18, SOFT),
  gear: ({ a }) =>
    path(gearPath(320, 300, 150, 14, 28), a, 6, MID) + `<circle cx="320" cy="300" r="46" fill="${NAVY}" ${st(a, 6)}/>` + dot(320, 300, 12, a) +
    path(gearPath(555, 380, 96, 9, 22), SOFT, 6, NAVY) + `<circle cx="555" cy="380" r="28" fill="${MID}" ${st(SOFT, 5)}/>` + dot(555, 380, 8, SOFT) +
    path("M180 480A190 190 0 0 0 470 520", a + "77", 3),
  vibration: ({ a }) =>
    `<circle cx="260" cy="300" r="130" fill="${NAVY}" ${st(a, 7)}/><circle cx="260" cy="300" r="82" fill="${MID}" ${st(SOFT + "AA", 4)}/><circle cx="260" cy="300" r="30" fill="${NAVY}" ${st(a, 5)}/>` +
    Array.from({ length: 8 }, (_, i) => { const t = (i * Math.PI) / 4; return dot(260 + Math.cos(t) * 106, 300 + Math.sin(t) * 106, 11, a); }).join("") +
    path("M410 300Q440 230 470 300T530 300T590 300T650 300", SOFT + "88", 4) +
    [90, 150, 70, 190, 120, 60, 100].map((h, i) => rect(430 + i * 30, 480 - h, 20, h, { f: i === 3 ? "#F87171" : a, r: 4 })).join("") + line(420, 480, 650, 480, SOFT + "55", 3),
  sorter: ({ a }) =>
    rect(130, 330, 440, 56, { f: MID, s: a, r: 28, sw: 5 }) + [175, 255, 335, 415, 495].map((x) => dot(x, 358, 8, SOFT + "99")).join("") +
    rect(180, 270, 54, 54, { f: a, r: 8 }) + rect(280, 270, 54, 54, { f: "#F472B6", r: 8 }) + rect(380, 270, 54, 54, { f: a, r: 8 }) +
    path("M440 330L600 450", SOFT, 8) + rect(560, 440, 100, 80, { f: NAVY, s: a, r: 10, sw: 4 }) + rect(190, 460, 100, 60, { f: NAVY, s: "#F472B6", r: 10, sw: 4 }) +
    line(520, 330, 520, 150, SOFT + "88", 5) + rect(480, 120, 80, 36, { f: NAVY, s: a, r: 8, sw: 4 }) + dot(520, 195, 6, a),
  heatsink: ({ a }) =>
    rect(180, 440, 440, 50, { f: MID, s: a, r: 8 }) + Array.from({ length: 9 }, (_, i) => rect(195 + i * 49, 230, 22, 210, { f: NAVY, s: a, r: 6, sw: 4 })).join("") + rect(340, 500, 120, 30, { f: SOFT + "AA", r: 6 }) +
    [0, 1, 2, 3].map((i) => path(`M${230 + i * 110} 200Q${215 + i * 110} 160 ${230 + i * 110} 125T${230 + i * 110} 60`, i % 2 ? "#FB923C" : "#F87171", 6)).join(""),
  building: ({ a }) =>
    rect(250, 110, 300, 390, { f: NAVY, s: a, r: 10 }) + [1, 2, 3, 4, 5, 6].map((i) => line(250, 110 + i * 56, 550, 110 + i * 56, a + "66", 3)).join("") + line(400, 110, 400, 500, a + "44", 3) +
    [0, 1, 2, 3, 4, 5].map((r) => [0, 1, 2, 3].map((c) => rect(272 + c * 72, 126 + r * 56, 34, 26, { f: (r * 3 + c * 5) % 4 === 0 ? a + "AA" : MID, r: 4 })).join("")).join("") +
    line(130, 500, 670, 500, SOFT, 6) + path("M250 110L205 80M550 110L595 80", a + "99", 3) + line(600, 230, 600, 500, SOFT + "66", 3) + path("M590 230H610M590 500H610", SOFT + "99", 3),
  bim: ({ a }) =>
    path("M400 130L600 230V420L400 520L200 420V230Z", a, 6, NAVY) + path("M400 130V320M200 230L400 320L600 230", a, 5) + path("M400 320V520", a, 5) +
    path("M300 180L500 280M300 375L500 275", a + "55", 3) + rect(190, 80, 140, 40, { f: MID, s: a, r: 8, sw: 3 }) + line(210, 100, 300, 100, SOFT, 5) +
    path("M130 250V400", SOFT, 3) + path("M120 250H140M120 400H140", SOFT, 3) + path("M200 560H600", SOFT + "66", 3) + dot(620, 160, 20, NAVY) + `<circle cx="620" cy="160" r="20" ${st(a, 5)}/>` + path("M610 160L618 168L632 152", a, 4),
  tank: ({ a }) =>
    path("M230 200V470Q230 505 400 505T570 470V200", SOFT, 7, NAVY) + `<ellipse cx="400" cy="200" rx="170" ry="34" fill="${MID}" ${st(SOFT, 7)}/>` +
    path("M236 340Q285 315 335 340T435 340T535 340L564 340V470Q564 500 400 500T236 470Z", a, 4, a + "55") +
    rect(370, 100, 60, 50, { f: NAVY, s: a, r: 8 }) + dot(385, 125, 8, SOFT) + dot(415, 125, 8, SOFT) + line(400, 150, 400, 240, a + "99", 3) + [1, 2].map((i) => path(`M${360 - i * 0} ${185 + i * 30}Q400 ${165 + i * 30} 440 ${185 + i * 30}`, a, 3)).join("") + wifi(560, 110, a, 0.9),
  rain: ({ a }) =>
    path("M200 220Q180 220 180 190Q180 150 235 150Q250 100 320 100Q380 95 400 140Q470 130 490 190Q520 195 520 220Z", SOFT, 6, MID) +
    Array.from({ length: 7 }, (_, i) => path(`M${230 + i * 45} ${250 + (i % 2) * 20}l-12 36`, a, 5)).join("") +
    path("M470 330L600 280L690 330V450H470Z", a, 5, NAVY) + path("M455 330L600 262L705 330", SOFT, 6) + line(520, 450, 520, 520, SOFT, 5) +
    rect(150, 440, 260, 90, { f: NAVY, s: a, r: 12 }) + path("M160 480Q200 465 240 480T320 480T400 480V520H160Z", a + "88", 3, a + "55") + path("M410 480H470", a, 5),
  traffic: ({ a }) =>
    path("M310 120L90 520M490 120L710 520", SOFT, 6) + path("M400 130L400 520", SOFT + "99", 4) + `<path d="M310 120L490 120L710 520L90 520Z" fill="${MID}" fill-opacity="0.55"/>` +
    [[360, 230, 80, 56], [250, 360, 100, 70], [470, 410, 110, 80]].map(([x, y, w, h]) => rect(x, y, w, h, { f: SOFT + "66", r: 10 }) + `<path d="M${x - 12} ${y + 20}V${y - 12}H${x + 20}M${x + w - 20} ${y - 12}H${x + w + 12}V${y + 20}M${x + w + 12} ${y + h - 20}V${y + h + 12}H${x + w - 20}M${x + 20} ${y + h + 12}H${x - 12}V${y + h - 20}" ${st(a, 5)}/>`).join(""),
  eye: ({ a }) =>
    path("M120 300Q400 110 680 300Q400 490 120 300Z", a, 7, NAVY) + `<circle cx="400" cy="300" r="90" fill="${MID}" ${st(SOFT, 6)}/><circle cx="400" cy="300" r="44" fill="${NAVY}" ${st(a, 6)}/>` + dot(380, 280, 12, SOFT) +
    `<path d="M170 140V100H210M630 100H670V140M670 460V500H630M210 500H170V460" ${st(a, 6)}/>` + rect(255, 230, 0, 0) + line(260, 520, 540, 520, a + "88", 4),
  robotcar: ({ a }) =>
    path("M90 480Q250 480 300 400T520 300T710 140", a + "99", 12) + path("M90 480Q250 480 300 400T520 300T710 140", NAVY, 3) +
    rect(330, 290, 150, 120, { f: NAVY, s: SOFT, r: 18 }) + rect(305, 300, 26, 40, { f: MID, s: SOFT, r: 6, sw: 3 }) + rect(305, 365, 26, 40, { f: MID, s: SOFT, r: 6, sw: 3 }) + rect(479, 300, 26, 40, { f: MID, s: SOFT, r: 6, sw: 3 }) + rect(479, 365, 26, 40, { f: MID, s: SOFT, r: 6, sw: 3 }) +
    [0, 1, 2, 3, 4].map((i) => dot(360 + i * 22, 300, 7, i === 2 ? a : SOFT)).join("") + rect(360, 330, 90, 60, { f: MID, s: a, r: 8, sw: 3 }) + dot(405, 360, 8, a),
  plant: ({ a }) =>
    path("M200 460H600L560 530H240Z", SOFT, 5, MID) + rect(150, 440, 500, 30, { f: "#7C4A21", r: 10 }) + line(400, 440, 400, 280, "#4ADE80", 10) +
    path("M400 340Q320 330 300 250Q380 250 400 340Z", "#4ADE80", 4, "#4ADE8044") + path("M400 300Q480 290 510 200Q420 205 400 300Z", "#4ADE80", 4, "#4ADE8044") + path("M400 280Q370 220 400 160Q440 220 400 280Z", "#4ADE80", 4, "#4ADE8044") +
    line(560, 470, 560, 360, SOFT, 8) + rect(545, 330, 30, 40, { f: a, r: 6 }) + wifi(560, 300, a, 0.9) + [[240, 140], [300, 100], [180, 110]].map(([x, y]) => path(`M${x} ${y}q-14 22 0 34q14 -12 0 -34`, "#38BDF8", 4, "#38BDF855")).join(""),
  drone: ({ a }) =>
    path("M120 510Q260 470 320 360T560 260", a + "99", 4) + `<path d="M120 510Q260 470 320 360T560 260" stroke-dasharray="3 14" ${st(NAVY, 0)}/>` +
    [[300, 170], [500, 170], [300, 380], [500, 380]].map(([x, y]) => line(400, 275, x, y, SOFT, 8) + `<ellipse cx="${x}" cy="${y}" rx="64" ry="14" fill="${a}" fill-opacity="0.35" ${st(a, 4)}/>` + dot(x, y, 8, SOFT)).join("") +
    rect(355, 240, 90, 70, { f: NAVY, s: a, r: 18, sw: 6 }) + dot(400, 275, 10, a),
  iotcustom: ({ a }) => {
    const nodes: [number, number][] = [[400, 130], [610, 215], [610, 385], [400, 470], [190, 385], [190, 215]];
    return nodes.map(([x, y]) => line(400, 300, x, y, a + "66", 3)).join("") + path("M400 130L610 215L610 385L400 470L190 385L190 215Z", a + "33", 2) +
      nodes.map(([x, y], i) => dot(x, y, 30, NAVY) + `<circle cx="${x}" cy="${y}" r="30" ${st(i % 2 ? SOFT : a, 5)}/>` + dot(x, y, 8, i % 2 ? SOFT : a)).join("") +
      `<circle cx="400" cy="300" r="64" fill="${NAVY}" ${st(a, 7)}/>` + path("M375 300H425M400 275V325", a, 6);
  },
  ecg: ({ a }) =>
    path("M110 330H260L300 240L350 430L400 180L450 400L490 320H690", a, 8) + `<path d="M110 330H260L300 240L350 430L400 180L450 400L490 320H690" ${st(SOFT, 2)}/>` +
    path("M400 520Q330 470 330 430Q330 395 365 395Q390 395 400 420Q410 395 435 395Q470 395 470 430Q470 470 400 520Z", "#F87171", 4, "#F8717155"),
  flask: ({ a }) =>
    path("M340 110H460M360 110V250L240 450Q220 500 270 500H530Q580 500 560 450L440 250V110", SOFT, 7, NAVY) + path("M300 400Q340 380 380 400T460 400T520 400L548 450Q560 490 530 490H270Q245 490 258 450Z", a, 4, a + "66") +
    [[420, 340, 12], [370, 300, 8], [460, 300, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${st(a, 4)}/>`).join("") + `<circle cx="610" cy="200" r="16" ${st(a, 4)}/><circle cx="660" cy="250" r="12" ${st(SOFT, 4)}/>` + line(624, 210, 650, 240, a, 3),
};

export function hasMotif(m: string): boolean {
  return m in MOTIFS;
}

export function motifSvg(motif: string, accent: string, title: string, w = 800, h = 600): string {
  const fn = MOTIFS[motif] ?? MOTIFS.chip;
  const scale = Math.min(w / 800, h / 600);
  const tx = (w - 800 * scale) / 2;
  const ty = (h - 600 * scale) / 2;
  return frame(w, h, accent, `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${scale.toFixed(3)})">${fn({ a: accent })}</g>`, title);
}

/** Second gallery image: the technologies as a tidy spec card. */
export function techTileSvg(title: string, accent: string, tech: string[], label: string): string {
  const chips = tech.slice(0, 6);
  let y = 230;
  let body = `<text x="70" y="110" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif" font-size="22" font-weight="600" fill="${accent}" letter-spacing="3">${esc(label.toUpperCase())}</text>`;
  body += `<text x="70" y="175" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif" font-size="40" font-weight="700" fill="#FFFFFF">Technologies</text>`;
  for (const t of chips) {
    const w = Math.min(560, 60 + t.length * 17);
    body += rect(70, y, w, 56, { f: MID, s: accent + "88", r: 28, sw: 2 }) + dot(100, y + 28, 7, accent) +
      `<text x="124" y="${y + 37}" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif" font-size="26" fill="${SOFT}">${esc(t)}</text>`;
    y += 70;
  }
  void title;
  return frame(800, 600, accent, body, `${title}: technologies`);
}

/** Wide hero picture: circuit board traces, a chip, a robotic arm and sensor nodes. */
export function heroSvg(): string {
  const a = CYAN;
  const traces = [
    "M60 560H300V470H460", "M60 420H210V330H420", "M1140 150H920V240H800", "M1140 330H980V420H830",
    "M60 250H160V150H380", "M1140 560H900V500H760", "M300 70V150", "M900 70V160",
  ];
  let body = traces.map((d) => path(d, a + "55", 3)).join("");
  for (const [x, y] of [[460, 470], [420, 330], [800, 240], [830, 420], [380, 150], [760, 500], [300, 70], [900, 70]] as const) body += dot(x, y, 9, NAVY) + `<circle cx="${x}" cy="${y}" r="9" ${st(a, 3)}/>`;
  // chip
  body += rect(470, 300, 260, 220, { f: NAVY, s: a, r: 16, sw: 5 }) + rect(500, 330, 120, 160, { f: MID, s: a + "AA", r: 10, sw: 3 }) + pins(490, 280, 8, 30, 20, "h", SOFT) + pins(490, 520, 8, 30, 20, "h", SOFT) + pins(450, 330, 5, 36, 20, "v", SOFT) + pins(730, 330, 5, 36, 20, "v", SOFT) +
    line(650, 360, 705, 360, a, 5) + line(650, 400, 705, 400, SOFT + "88", 5) + line(650, 440, 690, 440, SOFT + "88", 5);
  // arm
  body += rect(860, 560, 220, 34, { f: MID, s: a, r: 8, sw: 3 }) + path("M960 560L930 420", SOFT, 24) + path("M960 560L930 420", a, 12) + path("M930 420L1040 330", SOFT, 22) + path("M930 420L1040 330", a, 10) +
    [[960, 560], [930, 420], [1040, 330]].map(([x, y]) => dot(x, y, 20, NAVY) + `<circle cx="${x}" cy="${y}" r="20" ${st(a, 5)}/>`).join("") + path("M1040 330L1100 350M1040 330L1085 292", SOFT, 9);
  // sensor wifi
  body += wifi(240, 300, a, 1.4);
  return frame(1200, 640, a, body, "Illustration of a circuit board, microcontroller chip and robotic arm");
}

export function fallbackSvg(): string {
  return frame(800, 600, CYAN, MOTIFS.chip({ a: CYAN }), "ProjectNexa placeholder illustration");
}
