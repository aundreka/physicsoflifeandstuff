"use client";

import { useEffect, useRef } from "react";

type Vec2 = { x: number; y: number };

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgba(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}


const THEME = {
  // Page (slightly lighter dark)
  pageBg: "#0A1026",

  // Background vignette (less dark / more modern)
  vignetteCenter: "#111C3A",
  vignetteEdge: "#050816",

  // Atom
atom: "#FF3131",
atomGlow: "#FF3131",

  // Rings (silver)
  ring: "#C9CDD6",
  ringHighlight: "#F2F4F8",

  // Stars (brighter)
  star: "#FFFFFF",

  // Text / UI
  textTitle: "#FFFFFF",
  textSubtitle: "rgba(255,255,255,0.78)",

  // Glass panel (true glassmorphism)
  panelBgTop: "#FFFFFF",
  panelBgBottom: "#FFFFFF",
  panelBorder: "#FFFFFF",
  panelShadow: "#000000",

  // Button
  buttonBg: "#FFFFFF",
  buttonBorder: "#FFFFFF",
  buttonText: "#FFFFFF", // stays white since button is glassy
};



export default function HeroOrb() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Avoid hydration mismatch from Math.random() during render
  const seedRef = useRef<number>(Math.random() * 10_000);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    let raf = 0;

    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const mouse: Vec2 = { x: 0, y: 0 };
    const target: Vec2 = { x: 0, y: 0 };

    const resize = () => {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const r = wrap.getBoundingClientRect();
      canvas.width = Math.floor(r.width * dpr);
      canvas.height = Math.floor(r.height * dpr);
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      target.x = clamp(nx, -1, 1);
      target.y = clamp(ny, -1, 1);
    };

    const onLeave = () => {
      target.x = 0;
      target.y = 0;
    };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    // Pre-generate star dust points
    const seed = seedRef.current;
    const dust = Array.from({ length: 180 }, (_, i) => {
      const a = (i * 137.5 + seed) % 360;
      const r = Math.random();
      return {
        a,
        r,
s: 0.35 + Math.random() * 1.5, 
        o: 0.03 + Math.random() * 0.22, // slightly softer on white
      };
    });

    let t0 = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.033, (now - t0) / 1000);
      t0 = now;

      // smooth mouse
      mouse.x += (target.x - mouse.x) * (1 - Math.pow(0.001, dt));
      mouse.y += (target.y - mouse.y) * (1 - Math.pow(0.001, dt));

      const w = canvas.width;
      const h = canvas.height;
      const isMobile = wrap.clientWidth <= 768;

      // Base position: desktop left-biased; mobile perfectly centered
      const cxBase = isMobile ? w * 0.5 : w * 0.32;

      // Desktop parallax, mobile locked
      const cx = isMobile ? cxBase : cxBase + mouse.x * (w * 0.05);

      // Mobile higher; desktop centered
      const cyBase = isMobile ? h * 0.32 : h * 0.5;
      const cy = cyBase + mouse.y * (h * 0.04);

      // Size: larger on desktop, smaller on mobile
      const R = Math.min(w, h) * (isMobile ? 0.3 : 0.32);

      // Clear + base white
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = THEME.pageBg;
      ctx.fillRect(0, 0, w, h);

      // Background vignette (very subtle)
      const gx = w / 2 + mouse.x * (w * 0.04);
      const gy = h / 2 + mouse.y * (h * 0.04);
      const bg = ctx.createRadialGradient(gx, gy, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
      bg.addColorStop(0, rgba(THEME.vignetteCenter, 0.02));
      bg.addColorStop(0.45, rgba(THEME.vignetteCenter, 0.04)); 
      bg.addColorStop(1, rgba(THEME.vignetteEdge, 0.03));
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
// Subtle grid + isodose lines
// Subtle grid + isodose lines (with nucleus "light cast")
ctx.save();

const gridStep = Math.max(42 * dpr, Math.min(w, h) * 0.06);

// "Light" centered at nucleus (cx, cy) to boost grid visibility nearby
const light = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.35);
light.addColorStop(0, rgba(THEME.ringHighlight, 0.22));
light.addColorStop(0.22, rgba(THEME.ringHighlight, 0.14));
light.addColorStop(0.55, rgba(THEME.ringHighlight, 0.06));
light.addColorStop(1, "rgba(0,0,0,0)");

// Draw a faint light wash (barely visible) so the grid feels illuminated
ctx.globalCompositeOperation = "screen";
ctx.fillStyle = light;
ctx.fillRect(0, 0, w, h);

// Draw grid lines, but clip them with the same light gradient
ctx.globalCompositeOperation = "source-over";

// We use the gradient as strokeStyle so lines are strongest near nucleus
ctx.lineWidth = 1 * dpr;
ctx.strokeStyle = light;
// vertical lines
for (let x = 0; x <= w; x += gridStep) {
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, h);
  ctx.stroke();
}
// horizontal lines
for (let y = 0; y <= h; y += gridStep) {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(w, y);
  ctx.stroke();
}

// ===== Isodose-style contours (medical physics) =====
ctx.save();
ctx.translate(cx, cy);
ctx.rotate(0.25);

// Red-influenced silver, fades with distance
const isoCount = 10;
for (let i = 1; i <= isoCount; i++) {
  const t = i / isoCount;

  const rx = Math.min(w, h) * (0.18 + t * 0.55);
  const ry = rx * 0.66;

  // stronger near nucleus, fades outward
ctx.strokeStyle =
  t < 0.4
    ? rgba(THEME.atomGlow, 0.12 * (1 - t))
    : rgba(THEME.ringHighlight, 0.10 * (1 - t) + 0.04);
  ctx.lineWidth = 1 * dpr;

  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}
ctx.restore();


ctx.restore();

      // Star dust (subtle, dark)
      ctx.save();
      ctx.translate(w / 2, h / 2);
      const dustParallax = { x: mouse.x * 16 * dpr, y: mouse.y * 12 * dpr };
      for (const p of dust) {
        const ang = ((p.a + now * 0.01) * Math.PI) / 180;
        const rr = Math.min(w, h) * 0.48 * p.r;
        const x = Math.cos(ang) * rr + dustParallax.x;
        const y = Math.sin(ang) * rr + dustParallax.y;
        ctx.fillStyle = rgba(THEME.star, p.o);
        ctx.beginPath();
        ctx.arc(x, y, p.s * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ===== Orb settings (desktop left, mobile centered) =====

      // ===== Atom glow (intense red but still clean on white) =====
const glow = ctx.createRadialGradient(
  cx,
  cy,
  R * 0.05,   // tighter core
  cx,
  cy,
  R * 1.6    // less spread = more intensity
);

// PURE #ff3131 energy
glow.addColorStop(0.0, "rgba(255,49,49,0.65)");
glow.addColorStop(0.12, "rgba(255,49,49,0.42)");
glow.addColorStop(0.28, "rgba(255,49,49,0.22)");
glow.addColorStop(0.55, "rgba(255,49,49,0.08)");
glow.addColorStop(1.0, "rgba(255,49,49,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 2.0, 0, Math.PI * 2);
      ctx.fill();

      // ===== Orb body (neutral metallic on white) =====
      const orb = ctx.createRadialGradient(cx - R * 0.18, cy - R * 0.18, R * 0.08, cx, cy, R);
      orb.addColorStop(0, "rgba(255,255,255,0.95)");
      orb.addColorStop(0.35, "rgba(255,255,255,0.55)");
      orb.addColorStop(0.7, rgba(THEME.vignetteCenter, 0.08));
      orb.addColorStop(1, rgba(THEME.vignetteCenter, 0.12));
      ctx.fillStyle = orb;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Inner noise / grain sheen
      ctx.save();
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = 0.14;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      for (let i = 0; i < 650; i++) {
        const a = (i * 17.3 + seed) % 360;
        const ang = (a * Math.PI) / 180;
        const rr = Math.sqrt((i * 997) % 1000) / 31.6;
        const x = cx + Math.cos(ang) * rr * R;
        const y = cy + Math.sin(ang) * rr * R;
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(x, y, 1.2 * dpr, 1.2 * dpr);
      }
      ctx.restore();

      // ===== Orbit rings (silver) =====
      const ringCount = 3;
      for (let k = 0; k < ringCount; k++) {
        const phase = now * 0.0012 + k * 1.9;
        const tilt = (k - 1) * 0.55 + mouse.y * 0.25;
        const spin = phase + (isMobile ? 0 : mouse.x * 0.4);
        const rx = R * (1.18 + k * 0.08);
        const ry = R * (0.62 + k * 0.06);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(spin);
        ctx.transform(1, Math.tan(tilt) * 0.12, 0, 1, 0, 0);

        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);

        // main ring stroke (silver)
        ctx.strokeStyle = rgba(THEME.ring, 0.75);
        ctx.lineWidth = 2 * dpr;

        // subtle shadow (very light on white)
        ctx.shadowColor = rgba(THEME.ringHighlight, 0.9);
        ctx.shadowBlur = 10 * dpr;
        ctx.stroke();

        // crisp highlight line
        ctx.shadowBlur = 0;
        ctx.strokeStyle = rgba(THEME.ringHighlight, 0.55);
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();

        ctx.restore();
      }

      // ===== Electrons (intense red) =====
      const electrons = 4;
      for (let i = 0; i < electrons; i++) {
        const ang = now * 0.0016 + (i * Math.PI * 2) / electrons + (isMobile ? 0 : mouse.x * 0.5);
        const rx = R * 1.22;
        const ry = R * 0.70;
        const x = cx + Math.cos(ang) * rx;
        const y = cy + Math.sin(ang) * ry;

        ctx.fillStyle = rgba(THEME.atom, 0.98);
ctx.shadowColor = "rgba(255,49,49,0.85)";
ctx.shadowBlur = 16 * dpr;

        ctx.beginPath();
        ctx.arc(x, y, 2.4 * dpr, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="heroWrap"
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 64px)",
        overflow: "hidden",
        background: THEME.pageBg,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="heroCanvas"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          transformOrigin: "center",
        }}
      />

      <div className="heroPanelWrap">
        <div className="heroPanel">
          <p className="abovetitle" >UST Department of Math and Physics</p>
          <h1 className="heroTitle">Physics of Life and Stuff </h1><h2 className="heroGroup" >Research Group</h2>

          <p className="heroSubtitle">
            Department of Math and Physics,
            <br />
            University of Santo Tomas
          </p>

          <a className="heroBtn" href="#news">
            <span>Explore</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <style>{`
        .heroPanelWrap{
          position:absolute;
          top:50%;
          transform: translateY(-56%);
          right: clamp(200px, 6vw, 240px);
          z-index:5;
          max-width: 700px;

          
        }
          .abovetitle{
          display:none;}
        .heroPanel{
        
          padding-left: 58px;
          padding-top: 44px;
          padding-bottom: 44px;
          border-radius: 18px;
          /* light glass on white */
          background: linear-gradient(
            to bottom,
            ${rgba(THEME.panelBgTop, 0.03)},
            ${rgba(THEME.panelBgBottom, 0.01)}
          );
          border: 1px solid ${rgba(THEME.panelBorder, 0.05)};
          backdrop-filter: blur(2px);
          box-shadow: 0 20px 60px ${rgba(THEME.panelShadow, 0.12)};

          text-align: left;
          color: ${THEME.textTitle};
        }

        .heroTitle{
          margin: 0;
          font-weight: 850;
          letter-spacing: 0.02em;
          line-height: 1.12;
          font-size: clamp(2.3rem, 4.8vw, 4.7rem);
          color: ${THEME.textTitle};
          
        }

        .heroSubtitle{
          margin: 10px 0 18px;
          font-size: clamp(0.95rem, 1.15vw, 1.05rem);
          font-weight: 300;
          line-height: 1.5;
          color: ${THEME.textSubtitle};
        }

        .heroBtn{
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          font-size: 15px;
          letter-spacing: 0.12em;
          text-transform: uppercase;

          color: ${THEME.buttonText};
          text-decoration: none;

          background: ${rgba(THEME.buttonBg, 0.05)};
          border: 1px solid ${rgba(THEME.buttonBorder, 0.2)};
          backdrop-filter: blur(10px);
          box-shadow: 0 12px 30px ${rgba(THEME.panelShadow, 0.10)};

          transition: transform 160ms ease, background 160ms ease;
        }

        .heroBtn:hover{
          transform: translateY(-1px);
          background: ${rgba(THEME.buttonBg, 0.30)};
        }

        /* ===== Mobile / small screens ===== */
        @media (max-width: 768px){
          .heroPanelWrap{
            top: auto;
            bottom: 16%;
            right: 50%;
            transform: translateX(50%);
            width: min(92vw, 520px);
            opacity: 0.7  5;
          }
          .heroGroup {
          display:none;
          }
          .heroPanel{
            text-align: center;
            background: none;
            padding: 24px 32px;
          }
            .abovetitle{
            display:block;
            font-weight:300;
            font-size:clamp(0.7rem,3vw,0.85rem);
            }
          .heroTitle{
            font-size: clamp(1.7rem, 9vw, 2.8rem);
            margin-bottom: 16px;
          }

          .heroSubtitle{
            font-size: clamp(0.8rem, 3.4vw, 0.95rem);
            display: none;
          }
        }

        @media (max-width: 420px){
          .heroPanel{
            padding: 14px 16px;
          }
        }
      `}</style>
    </div>
  );
}
