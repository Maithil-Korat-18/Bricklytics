import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Menu, X, ArrowRight, Play, ChevronDown, MapPin, Satellite as SatelliteIcon,
  ShieldCheck, TrendingUp, GraduationCap, HeartPulse, Brain, CheckCircle2,
  Building2, Car, MessageSquare, TreePine, Mail, Sparkles,
} from "lucide-react";

/* ============================================================
   TOKENS — palette is fixed, do not introduce new colors
============================================================ */
const C = {
  bg: "var(--paper)",
  surface: "#FFFFFF",
  blue: "var(--signal)",
  purple: "var(--signal-deep)",
  blueGlow: "var(--blue-glow)",
  purpleGlow: "var(--purple-glow)",
  text: "var(--ink)",
  border: "var(--line-dim)",
};

/* ============================================================
   GLOBAL STYLES
============================================================ */
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700;800;900&family=IBM+Plex+Mono:wght@400;500&display=swap');

      :root {
        --paper:#FAFAF8;
        --ink:#14171F;
        --ink-soft:#5B6270;
        --signal:#3E6FE0;
        --signal-deep:#2A54BE;
        --match-green:#2FAE6E;
        --terracotta:#C1694F;
        --blue-glow: rgba(62,111,224,0.16);
        --purple-glow: rgba(130,94,235,0.12);
        --grid-line: rgba(20,23,31,0.05);
        --line-dim: rgba(20,23,31,0.10);

        --bg: var(--paper);
        --surface: #FFFFFF;
        --blue: var(--signal);
        --purple: var(--signal-deep);
        --blue-glow: var(--blue-glow);
        --purple-glow: var(--purple-glow);
        --text: var(--ink);
        --border: var(--line-dim);
      }

      .bl-root *{ box-sizing:border-box; }
      .bl-root{ font-family:'Inter',sans-serif; color:var(--text); background:var(--bg); }
      .bl-root h1, .bl-root h2, .bl-root h3{ font-family:'Inter Tight',sans-serif; letter-spacing:-0.02em; margin:0; }
      .bl-mono{ font-family:'IBM Plex Mono',monospace; }

      .bl-eyebrow{
        display:inline-flex; align-items:center; gap:8px;
        font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:0.08em;
        color:#3E4FBE; background:var(--blue-glow); border:1px solid rgba(91,140,255,0.35);
        padding:7px 14px; border-radius:100px; text-transform:uppercase;
      }
      .bl-dot{ width:6px; height:6px; border-radius:50%; background:var(--blue); animation: bl-blink 2.2s ease-in-out infinite; flex:none;}
      @keyframes bl-blink{ 0%,100%{opacity:1;} 50%{opacity:0.25;} }

      /* glass — ONLY navbar, ai cards, interactive demo, floating widgets, faq cards */
      .bl-glass{
        background: rgba(255,255,255,0.6);
        backdrop-filter: blur(18px) saturate(160%);
        -webkit-backdrop-filter: blur(18px) saturate(160%);
        border:1px solid rgba(255,255,255,0.8);
        box-shadow: 0 20px 50px -24px rgba(17,24,39,0.18);
      }

      /* Floating rounded navbar matches landing & auth views */
      .bl-navbar-floating {
        position: fixed !important;
        top: 20px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: 90% !important;
        max-width: 1200px !important;
        z-index: 100 !important;
        border-radius: 100px !important;
        padding: 12px 28px !important;
        background: rgba(250, 250, 248, 0.82) !important;
        backdrop-filter: blur(20px) saturate(160%) !important;
        -webkit-backdrop-filter: blur(20px) saturate(160%) !important;
        border: 1px solid rgba(255, 255, 255, 0.5) !important;
        box-shadow: 0 10px 40px -15px rgba(17, 24, 39, 0.12) !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }

      /* normal premium buttons */
      .bl-btn-primary{
        display:inline-flex; align-items:center; gap:8px;
        background:var(--text); color:#fff; font-weight:600; font-size:14.5px;
        padding:13px 22px; border-radius:100px; border:none; cursor:pointer;
        transition:transform .2s ease, box-shadow .2s ease; box-shadow:0 10px 24px -10px rgba(17,24,39,0.35);
      }
      .bl-btn-primary:hover{ transform:translateY(-2px); box-shadow:0 14px 28px -10px rgba(17,24,39,0.4); }
      .bl-btn-ghost{
        font-weight:600; font-size:14.5px; color:var(--text); background:none; border:none;
        cursor:pointer; opacity:0.75; transition:opacity .2s ease;
      }
      .bl-btn-ghost:hover{ opacity:1; }
      .bl-btn-secondary{
        display:inline-flex; align-items:center; gap:10px; background:none; border:none;
        font-weight:600; font-size:15px; color:var(--text); cursor:pointer; opacity:0.85;
      }
      .bl-btn-secondary .bl-play{
        width:36px; height:36px; border-radius:50%; background:var(--blue-glow);
        display:flex; align-items:center; justify-content:center; flex:none;
      }

      /* the ONE liquid button — hero cta only */
      .bl-liquid{
        position:relative; display:inline-flex; align-items:center; gap:10px;
        padding:16px 30px; border-radius:100px; border:none; cursor:pointer;
        color:#fff; font-weight:700; font-size:15.5px; isolation:isolate; overflow:hidden;
        background:linear-gradient(135deg,var(--blue),var(--purple));
        box-shadow:0 18px 40px -14px rgba(91,140,255,0.55);
        transition:box-shadow .3s ease, transform .3s ease;
      }
      .bl-liquid:hover{ transform:translateY(-2px); box-shadow:0 22px 46px -14px rgba(139,92,246,0.6); }
      .bl-liquid::before, .bl-liquid::after{
        content:''; position:absolute; z-index:-1; border-radius:50%;
        background:rgba(255,255,255,0.35); filter:blur(6px); mix-blend-mode:overlay;
      }
      .bl-liquid::before{ width:70px; height:70px; left:-10px; top:-20px; animation: bl-blob1 5s ease-in-out infinite; }
      .bl-liquid::after{ width:50px; height:50px; right:-6px; bottom:-18px; animation: bl-blob2 6s ease-in-out infinite; }
      @keyframes bl-blob1{ 0%,100%{ transform:translate(0,0) scale(1);} 50%{ transform:translate(18px,14px) scale(1.3);} }
      @keyframes bl-blob2{ 0%,100%{ transform:translate(0,0) scale(1);} 50%{ transform:translate(-14px,-10px) scale(1.25);} }

      @keyframes bl-float{ 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-10px);} }
      @keyframes bl-float-slow{ 0%,100%{ transform:translateY(0) rotate(0deg);} 50%{ transform:translateY(-8px) rotate(1deg);} }
      @keyframes bl-spin-slow{ from{ transform:rotate(0deg);} to{ transform:rotate(360deg);} }
      @keyframes bl-spin-rev{ from{ transform:rotate(360deg);} to{ transform:rotate(0deg);} }
      @keyframes bl-pulse-ring{ 0%{ transform:scale(0.4); opacity:0.9;} 100%{ transform:scale(1.8); opacity:0;} }
      @keyframes bl-orb-pulse{ 0%,100%{ box-shadow:0 0 30px 4px rgba(91,140,255,0.4);} 50%{ box-shadow:0 0 46px 10px rgba(139,92,246,0.45);} }
      @keyframes bl-sway{ 0%,100%{ transform:translate(0,0) rotate(var(--r,0deg));} 50%{ transform:translate(var(--dx,4px),var(--dy,-6px)) rotate(calc(var(--r,0deg)*1.5));} }
      @keyframes bl-dash{ to{ stroke-dashoffset:-200; } }

      .bl-row-reveal{ opacity:0; transform:translateY(28px); transition:opacity .8s cubic-bezier(.16,.8,.24,1), transform .8s cubic-bezier(.16,.8,.24,1); }
      .bl-row-reveal.in{ opacity:1; transform:translateY(0); }

      /* ============ Pipeline & AI Brain (User Spec) ============ */
      .stage{ position:relative; width:100%; }
      .bg-glow-blue{
        position:absolute; z-index:0; width:70vw; height:70vw; max-width:900px; max-height:900px;
        top:2%; left:-20%;
        background:radial-gradient(circle, var(--blue-glow) 0%, rgba(62,111,224,0) 68%);
        filter:blur(14px);
      }
      .bg-glow-purple{
        position:absolute; z-index:0; width:60vw; height:60vw; max-width:800px; max-height:800px;
        bottom:5%; right:-18%;
        background:radial-gradient(circle, var(--purple-glow) 0%, rgba(130,94,235,0) 70%);
        filter:blur(14px);
      }
      .bg-grid{
        position:absolute; inset:0; z-index:0;
        background-image:
          linear-gradient(var(--grid-line) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
        background-size:48px 48px;
        mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, black 20%, transparent 75%);
        -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, black 20%, transparent 75%);
      }

      .header{
        position:relative; z-index:5;
        max-width:720px; margin:0 auto; text-align:center;
        padding:120px 24px 20px;
      }
      .eyebrow{
        display:inline-flex; align-items:center; gap:8px;
        font-family:'IBM Plex Mono', monospace; font-size:12.5px; letter-spacing:0.07em;
        color:var(--signal-deep); background:rgba(62,111,224,0.09);
        border:1px solid rgba(62,111,224,0.18);
        padding:7px 14px; border-radius:100px; margin-bottom:26px;
      }
      .eyebrow .dot{ width:6px; height:6px; border-radius:50%; background:var(--match-green); }
      .sub{ margin-top:18px; font-size:16.5px; line-height:1.6; color:var(--ink-soft); }

      .pipeline{
        position:relative; z-index:5;
        max-width:560px; margin:0 auto;
        padding: 70px 24px 140px;
      }

      .spine{
        position:absolute; left:50%; top:70px; bottom:140px;
        width:2px; transform:translateX(-50%);
        background: var(--line-dim);
        overflow:visible;
      }
      .spine-fill{
        position:absolute; left:0; top:0; width:100%; height:0%;
        background: linear-gradient(to bottom,
          var(--signal) 0%,
          var(--signal) 40%,
          var(--match-green) 75%,
          var(--match-green) 100%);
        box-shadow: 0 0 12px 1px rgba(62,111,224,0.5);
        transition: height 1.1s cubic-bezier(.2,.7,.2,1);
      }
      .spine-glow-runner{
        position:absolute; left:50%; width:6px; height:70px;
        transform:translateX(-50%);
        background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.9), rgba(255,255,255,0));
        filter: blur(2px);
        animation: runDown 3.2s linear infinite;
        opacity:0.7;
      }
      @keyframes runDown{
        0%{ top:-80px; }
        100%{ top:100%; }
      }

      .node-row{
        position:relative; z-index:2;
        display:flex; align-items:center; gap:18px;
        padding: 26px 0;
      }
      .node-row.align-right{ flex-direction:row-reverse; text-align:right; }

      .node-icon{
        flex:none; width:56px; height:56px; border-radius:16px;
        display:flex; align-items:center; justify-content:center;
        background:rgba(255,255,255,0.6);
        border:1px solid rgba(20,23,31,0.08);
        backdrop-filter: blur(10px);
        position:relative;
        opacity:0.42;
        transform:scale(0.92);
        transition: all 0.7s cubic-bezier(.2,.7,.2,1);
      }
      .node-icon::after{
        content:'';
        position:absolute; inset:-8px; border-radius:22px;
        box-shadow: 0 0 0 0 rgba(62,111,224,0);
        transition: box-shadow 0.7s ease;
      }
      .node-row.active .node-icon{
        opacity:1; transform:scale(1);
        background:rgba(255,255,255,0.85);
        box-shadow:0 12px 28px -12px rgba(20,23,31,0.25);
      }
      .node-row.active .node-icon::after{
        box-shadow: 0 0 0 8px var(--node-glow, rgba(62,111,224,0.12));
      }

      .node-text{ flex:1; }
      .node-label{
        font-family:'Inter Tight', sans-serif; font-weight:700; font-size:19px;
        color:var(--ink-soft);
        transition: color 0.6s ease;
      }
      .node-row.active .node-label{ color:var(--ink); }
      .node-meta{
        font-family:'IBM Plex Mono', monospace; font-size:12px; color:var(--ink-soft);
        opacity:0; transform:translateY(4px);
        transition: all 0.6s ease 0.15s;
        margin-top:3px;
      }
      .node-row.active .node-meta{ opacity:0.8; transform:translateY(0); }

      /* per-node accent colors */
      .n-satellite{ --node-glow: rgba(62,111,224,0.14); }
      .n-satellite .node-icon svg{ stroke:var(--signal); fill:none; }
      .n-traffic{ --node-glow: rgba(47,174,110,0.14); }
      .n-traffic .node-icon svg{ stroke:var(--match-green); fill:none; }
      .n-schools{ --node-glow: rgba(193,105,79,0.14); }
      .n-schools .node-icon svg{ stroke:var(--terracotta); fill:none; }
      .n-hospitals{ --node-glow: rgba(47,174,110,0.14); }
      .n-hospitals .node-icon svg{ stroke:var(--match-green); fill:none; }
      .n-safety{ --node-glow: rgba(47,174,110,0.14); }
      .n-safety .node-icon svg{ stroke:var(--match-green); fill:none; }
      .n-growth{ --node-glow: rgba(62,111,224,0.14); }
      .n-growth .node-icon svg{ stroke:var(--signal); fill:none; }
      .n-investment{ --node-glow: rgba(193,105,79,0.14); }
      .n-investment .node-icon svg{ stroke:var(--terracotta); fill:none; }

      .brain-wrap{
        position:relative; z-index:2;
        display:flex; flex-direction:column; align-items:center;
        padding:56px 0 40px;
      }
      .brain-core{
        position:relative; width:120px; height:120px;
        display:flex; align-items:center; justify-content:center;
        opacity:0.4; transform:scale(0.9);
        transition: all 0.9s cubic-bezier(.2,.7,.2,1);
      }
      .brain-wrap.active .brain-core{ opacity:1; transform:scale(1); }
      .brain-ring{
        position:absolute; inset:0; border-radius:50%;
        border:1px solid rgba(62,111,224,0.35);
      }
      .brain-ring.r2{ inset:16px; border-color:rgba(62,111,224,0.25); }
      .brain-wrap.active .brain-ring{ animation: spinSlow 18s linear infinite; }
      .brain-wrap.active .brain-ring.r2{ animation: spinSlow 12s linear infinite reverse; }
      @keyframes spinSlow{ from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
      .brain-orb{
        width:64px; height:64px; border-radius:50%;
        background: radial-gradient(circle at 35% 30%, #6C93F0, var(--signal-deep));
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 0 0 0 rgba(62,111,224,0);
        transition: box-shadow 0.9s ease;
        z-index:5;
      }
      .brain-wrap.active .brain-orb{
        box-shadow:0 0 44px 6px rgba(62,111,224,0.38);
        animation: pulseBrain 2.6s ease-in-out infinite;
      }
      @keyframes pulseBrain{
        0%,100%{ box-shadow:0 0 44px 6px rgba(62,111,224,0.38); }
        50%{ box-shadow:0 0 60px 12px rgba(62,111,224,0.5); }
      }
      .brain-dot{
        position:absolute; width:6px; height:6px; border-radius:50%; background:var(--signal);
        opacity:0;
      }
      .brain-wrap.active .brain-dot{ opacity:0.9; animation: orbit 5s linear infinite; }
      .brain-dot:nth-child(4){ animation-delay:-1.6s; }
      .brain-dot:nth-child(5){ animation-delay:-3.2s; }
      @keyframes orbit{
        from{ transform: rotate(0deg) translateX(58px) rotate(0deg); }
        to{ transform: rotate(360deg) translateX(58px) rotate(-360deg); }
      }
      .brain-label{
        margin-top:22px; font-family:'IBM Plex Mono', monospace; font-size:12.5px;
        letter-spacing:0.08em; color:var(--ink-soft);
        opacity:0; transform:translateY(6px);
        transition: all 0.7s ease 0.2s;
      }
      .brain-wrap.active .brain-label{ opacity:1; transform:translateY(0); color:var(--signal-deep); }

      .finale-wrap{
        position:relative; z-index:2;
        display:flex; justify-content:center;
        padding-top:34px;
      }
      .finale-card{
        display:flex; align-items:center; gap:16px;
        padding:22px 34px;
        border-radius:100px;
        background:rgba(255,255,255,0.7);
        border:1px solid rgba(47,174,110,0.25);
        backdrop-filter: blur(14px);
        opacity:0.35; transform:translateY(10px) scale(0.96);
        box-shadow:0 0 0 0 rgba(47,174,110,0);
        transition: all 0.9s cubic-bezier(.2,.7,.2,1);
      }
      .finale-wrap.active .finale-card{
        opacity:1; transform:translateY(0) scale(1);
        box-shadow:0 20px 60px -18px rgba(47,174,110,0.35), 0 0 0 8px rgba(47,174,110,0.08);
      }
      .finale-icon{
        width:40px; height:40px; border-radius:12px; flex:none;
        background:rgba(47,174,110,0.14);
        display:flex; align-items:center; justify-content:center;
      }
      .finale-text .finale-label{
        font-family:'Inter Tight', sans-serif; font-weight:800; font-size:21px; color:var(--ink);
      }
      .finale-text .finale-sub{
        font-family:'IBM Plex Mono', monospace; font-size:11.5px; color:var(--match-green);
        letter-spacing:0.04em; margin-top:2px;
      }

      /* Responsive Navbar and Layout Overrides */
      @media (max-width: 768px) {
        .bl-navbar-floating {
          top: 10px !important;
          width: calc(100% - 20px) !important;
          padding: 8px 18px !important;
          border-radius: 20px !important;
        }
        .bl-nav-links {
          display: none !important;
        }
        .bl-menu-btn {
          display: block !important;
        }
        .bl-hero-grid {
          grid-template-columns: 1fr !important;
          padding-top: 40px !important;
          padding-bottom: 40px !important;
          text-align: center;
        }
        .bl-hero-grid h1 {
          margin-top: 16px !important;
        }
        .bl-hero-grid p {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .bl-hero-visual {
          height: 400px !important;
          margin-top: 30px;
        }
        .bl-console {
          grid-template-columns: 1fr !important;
        }
        .bl-feature-grid {
          grid-template-columns: repeat(2, 1fr) !important;
        }
      }
        @media (max-width: 560px) {
        .bl-feature-grid {
          grid-template-columns: 1fr !important;
        }
      }
      @media (prefers-reduced-motion: reduce){
        .bl-root *{ animation:none !important; transition:none !important; }
      }
    `}</style>
  );
}

/* ============================================================
   SCROLL REVEAL HOOK
============================================================ */
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setInView(true); io.unobserve(el); } }),
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ============================================================
   NAVBAR — glass
============================================================ */
function Navbar({ onNavigate }) {
  const [open, setOpen] = useState(false);
  return (
    <nav className="bl-navbar-floating bl-glass">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => onNavigate('landing')} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Inter Tight',sans-serif", fontWeight: 800, fontSize: 19, cursor: "pointer" }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg,${C.blue},${C.purple})`, position: "relative" }}>
            <span style={{ position: "absolute", inset: 0, margin: "auto", width: 8, height: 8, borderRadius: "50%", background: "#fff", top: "50%", left: "50%", transform: "translate(-50%,-50%)", boxShadow: "0 0 0 4px rgba(255,255,255,0.25)" }} />
          </div>
          Bricklytics
        </div>
        <div style={{ display: "flex", gap: 34 }} className="bl-nav-links">
          {["Platform", "Intelligence", "Pricing", "Company"].map((l) => (
            <a key={l} href="#" style={{ color: C.text, textDecoration: "none", fontSize: 14.5, fontWeight: 500, opacity: 0.72 }}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => onNavigate('login')} className="bl-btn-ghost bl-nav-links" style={{ textDecoration: "none" }}>Sign in</button>
          <button onClick={() => onNavigate('signup')} className="bl-btn-primary bl-nav-links">Get started</button>
          <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", display: "none" }} className="bl-menu-btn">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="bl-mobile-menu" style={{ 
          marginTop: 16, 
          display: "flex", 
          flexDirection: "column", 
          gap: 16, 
          padding: "16px 8px 8px", 
          borderTop: `1px solid ${C.border}`,
          animation: "ax-fadeup 0.3s ease" 
        }}>
          {["Platform", "Intelligence", "Pricing", "Company"].map((l) => (
            <a key={l} href="#" onClick={() => setOpen(false)} style={{ color: C.text, textDecoration: "none", fontSize: 15, fontWeight: 500, opacity: 0.8, padding: "8px 0" }}>{l}</a>
          ))}
          <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
          <button onClick={() => { setOpen(false); onNavigate('login'); }} className="bl-btn-ghost" style={{ textAlign: "left", padding: "10px 0", fontSize: 15 }}>Sign in</button>
          <button onClick={() => { setOpen(false); onNavigate('signup'); }} className="bl-btn-primary" style={{ justifyContent: "center" }}>Get started</button>
        </div>
      )}
    </nav>
  );
}

/* ============================================================
   HERO — full-bleed luxury image background with cross-fade
   slideshow, overlaid typography, and floating glass widgets.
   The navbar blends transparently over this section.
============================================================ */
function Hero({ onNavigate }) {
  const stageRef = useRef(null);

  // 8.5s Cross-faded Slideshow images
  const [currentImg, setCurrentImg] = useState(0);
  const images = useMemo(() => [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1600&auto=format&fit=crop"
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % images.length);
    }, 8500);
    return () => clearInterval(interval);
  }, [images]);

  return (
    <section ref={stageRef} style={{ position: "relative", width: "100%", minHeight: "100vh", overflow: "hidden" }}>
      {/* Cross-fading background images */}
      {images.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`Luxury property ${idx + 1}`}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: currentImg === idx ? 1 : 0,
            transition: "opacity 1.8s ease-in-out",
            zIndex: currentImg === idx ? 1 : 0,
          }}
        />
      ))}

      {/* Gradient overlays for readability */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2,
        background: `linear-gradient(180deg, 
          rgba(250,250,248,0.97) 0%, 
          rgba(250,250,248,0.9) 8%, 
          rgba(250,250,248,0.55) 26%, 
          rgba(250,250,248,0.15) 50%,
          rgba(20,23,31,0.08) 75%, 
          rgba(20,23,31,0.25) 100%)`
      }} />

      {/* Content overlay */}
      <div style={{
        position: "relative", zIndex: 5,
        maxWidth: 1320, margin: "0 auto",
        padding: "160px clamp(24px,5vw,72px) 80px",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}>
        {/* Main headline — large overlaid type */}
        <div style={{ maxWidth: 800 }}>
          <div className="bl-eyebrow" style={{ marginBottom: 28 }}>
            <span className="bl-dot" /> AI-POWERED PROPERTY INTELLIGENCE
          </div>
          <h1 style={{
            fontSize: "clamp(48px,7vw,96px)",
            fontWeight: 900,
            lineHeight: 0.98,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
          }}>
            Intelligence
          </h1>
          <h1 style={{
            fontSize: "clamp(48px,7vw,96px)",
            fontWeight: 900,
            lineHeight: 0.98,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
            marginTop: 4,
          }}>
            <span style={{
              background: "linear-gradient(135deg, var(--signal), var(--signal-deep))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}>Beyond</span>
          </h1>
        </div>

        {/* Subtitle + CTA */}
        <div style={{ marginTop: 32, maxWidth: 480 }}>
          <p style={{
            fontSize: 17, lineHeight: 1.6,
            color: "var(--ink-soft)",
          }}>
            Maximize your property intelligence through real-time spatial data
            and autonomous AI optimization across 340 neighborhoods.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 28, flexWrap: "wrap" }}>
            <button onClick={() => onNavigate('signup')} className="bl-liquid">
              Launch Platform <ArrowRight size={16} />
            </button>
            <button onClick={() => {
              const el = document.querySelector('.bl-console');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }} className="bl-btn-secondary">
              <span className="bl-play"><Play size={12} fill="var(--ink)" color="var(--ink)" /></span>
              See it in action
            </button>
          </div>
        </div>

        {/* AI model badge */}
        <div className="bl-mono" style={{
          position: "absolute",
          right: "clamp(24px,5vw,72px)",
          top: "38%",
          fontSize: 12,
          color: "var(--ink-soft)",
          opacity: 0.6,
          letterSpacing: "0.06em",
        }}>
          AI_model_v2.4
        </div>

        {/* Floating glass stat cards */}
        <div className="bl-glass" style={{
          position: "absolute",
          right: "clamp(24px,5vw,72px)",
          bottom: "18%",
          borderRadius: 20,
          padding: "22px 28px",
          maxWidth: 260,
          animation: "bl-float 8s ease-in-out infinite",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 17 }}>Asset Integrity</span>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--blue-glow)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={16} color="var(--signal)" />
            </div>
          </div>
          <div className="bl-mono" style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 }}>Structural score</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 800, fontSize: 28 }}>98.4%</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--match-green)" }}>+0.2%</span>
          </div>
          <div className="bl-mono" style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 }}>System stability</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 800, fontSize: 22 }}>94%</span>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--blue-glow)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={16} color="var(--signal)" />
            </div>
          </div>
        </div>

        {/* Bottom-left trust badge */}
        <div className="bl-glass" style={{
          position: "absolute",
          left: "clamp(24px,5vw,72px)",
          bottom: "8%",
          borderRadius: 20,
          padding: "18px 22px",
          maxWidth: 220,
          animation: "bl-float 9s ease-in-out infinite 1.5s",
        }}>
          <div style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 800, fontSize: 26, color: "var(--ink)" }}>+500</div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.4, marginTop: 4 }}>
            global investors trust our AI insights daily
          </div>
          <div style={{ display: "flex", gap: -6, marginTop: 10 }}>
            {[
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
            ].map((src, i) => (
              <img key={i} src={src} alt="" style={{
                width: 30, height: 30, borderRadius: "50%",
                border: "2px solid #fff",
                objectFit: "cover",
                marginLeft: i > 0 ? -8 : 0,
              }} />
            ))}
          </div>
        </div>

        {/* Slideshow dot indicators */}
        <div style={{
          position: "absolute",
          bottom: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 8,
          zIndex: 10,
        }}>
          {images.map((_, idx) => (
            <div key={idx} style={{
              width: currentImg === idx ? 24 : 8,
              height: 8,
              borderRadius: 100,
              background: currentImg === idx ? "var(--ink)" : "rgba(20,23,31,0.2)",
              transition: "all 0.4s ease",
            }} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PROBLEM — cascade of scattered tools converging into overwhelm
============================================================ */
function Problem() {
  const [ref, inView] = useInView(0.25);
  const words = [
    { t: "Searching", top: "6%", left: "6%", size: 18, color: C.blue, r: -3 },
    { t: "1,000 Listings", top: "0%", left: "30%", size: 22, color: C.blue, r: 2 },
    { t: "Comparing", top: "20%", left: "12%", size: 20, color: C.purple, r: -4 },
    { t: "Traffic", top: "30%", left: "52%", size: 24, color: C.purple, r: 5 },
    { t: "Schools", top: "12%", left: "60%", size: 19, color: C.blue, r: -6 },
    { t: "Maps", top: "46%", left: "6%", size: 22, color: C.purple, r: 4 },
    { t: "Tabs", top: "42%", left: "66%", size: 26, color: C.blue, r: -7 },
  ];
  return (
    <section ref={ref} style={{ padding: "110px 24px 90px", textAlign: "center" }}>
      <div className="bl-eyebrow" style={{ marginBottom: 26 }}><span className="bl-dot" /> THE PROBLEM</div>
      <h2 style={{ fontSize: "clamp(30px,4vw,50px)", fontWeight: 800, lineHeight: 1.12, maxWidth: 760, margin: "0 auto" }}>
        Property search isn't broken because of too few tools.<br />
        <span style={{ color: "#9BA1B0" }}>It's broken because of too many.</span>
      </h2>
      <p style={{ marginTop: 18, fontSize: 16.5, color: "#5B6270", maxWidth: 480, margin: "18px auto 0" }}>
        Every listing opens a new tab, and every tab asks you to start over.
      </p>

      <div style={{ position: "relative", height: 380, maxWidth: 1000, margin: "56px auto 0" }} className="bl-cascade">
        {words.map((w, i) => (
          <div key={i} className="bl-mono" style={{
            position: "absolute", top: w.top, left: w.left, fontWeight: 700, fontSize: w.size, color: w.color,
            opacity: inView ? 0.85 : 0, transition: `opacity .6s ease ${i * 0.08}s`,
            "--r": `${w.r}deg`, "--dx": "5px", "--dy": "-7px",
            animation: inView ? `bl-sway ${6 + i * 0.4}s ease-in-out infinite` : "none",
          }}>{w.t}</div>
        ))}
        <div style={{
          position: "absolute", top: "62%", left: "50%", transform: "translate(-50%,-50%)",
          fontFamily: "'Inter Tight',sans-serif", fontWeight: 800, fontSize: "clamp(40px,6vw,74px)", color: C.text,
          opacity: inView ? 1 : 0, transition: "opacity .8s ease .6s",
        }}>Confused</div>
      </div>
      <p className="bl-mono" style={{ fontSize: 13.5, color: "#5B6270", marginTop: 8 }}>
        Eight tabs later, <b style={{ color: C.text }}>still no answer.</b>
      </p>
    </section>
  );
}

/* ============================================================
   PIPELINE — signals converging into one AI verdict
============================================================ */
const PIPELINE_NODES = [
  { key: "satellite", label: "Satellite", meta: "imagery · updated weekly", Icon: SatelliteIcon, class: "n-satellite" },
  { key: "traffic", label: "Traffic", meta: "live congestion index", Icon: Car, class: "n-traffic" },
  { key: "schools", label: "Schools", meta: "rating & proximity", Icon: GraduationCap, class: "n-schools" },
  { key: "hospitals", label: "Hospitals", meta: "access radius", Icon: HeartPulse, class: "n-hospitals" },
  { key: "safety", label: "Safety", meta: "incident density", Icon: ShieldCheck, class: "n-safety" },
  { key: "growth", label: "Growth", meta: "5-yr appreciation trend", Icon: TrendingUp, class: "n-growth" },
  { key: "investment", label: "Investment", meta: "yield & demand signal", Icon: Building2, class: "n-investment" },
];

function PipelineNode({ node, align, active }) {
  return (
    <div className={`node-row ${node.class} ${active ? "active" : ""} ${align === "right" ? "align-right" : ""}`}>
      <div className="node-icon">
        <node.Icon size={22} />
      </div>
      <div className="node-text">
        <div className="node-label">{node.label}</div>
        <div className="node-meta">{node.meta}</div>
      </div>
    </div>
  );
}

function Pipeline() {
  const [secRef, inView] = useInView(0.15);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= 8) {
          clearInterval(interval);
          return 8;
        }
        return prev + 1;
      });
    }, 450);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <section ref={secRef} className="stage" style={{ background: "var(--paper)", position: "relative", overflow: "hidden" }}>
      <div className="bg-glow-blue" />
      <div className="bg-glow-purple" />
      <div className="bg-grid" />
      
      <div className="header">
        <div className="eyebrow"><span className="dot" /> HOW BRICKLYTICS THINKS</div>
        <h2>Every signal, read together.<br />One verdict, at the end.</h2>
        <p className="sub">
          Seven independent data streams, cross-referenced in real time — instead of seven tabs you reconcile yourself.
        </p>
      </div>

      <div className="pipeline">
        {/* Spine */}
        <div className="spine">
          <div className="spine-fill" style={{ height: `${(Math.min(7, activeStep) / 7) * 100}%` }} />
          {activeStep > 0 && activeStep < 8 && <div className="spine-glow-runner" />}
        </div>

        {/* Nodes */}
        {PIPELINE_NODES.map((n, i) => (
          <PipelineNode 
            key={n.key} 
            node={n} 
            align={i % 2 === 0 ? "left" : "right"} 
            active={activeStep > i} 
          />
        ))}

        {/* AI Brain */}
        <div className={`brain-wrap ${activeStep >= 7 ? "active" : ""}`}>
          <div className="brain-core">
            <div className="brain-ring" />
            <div className="brain-ring r2" />
            <div className="brain-dot" />
            <div className="brain-dot" />
            <div className="brain-dot" />
            <div className="brain-orb">
              <Brain size={24} color="#fff" />
            </div>
          </div>
          <div className="brain-label">AI BRAIN — SYNTHESIZING</div>
        </div>

        {/* Finale */}
        <div className={`finale-wrap ${activeStep >= 8 ? "active" : ""}`}>
          <div className="finale-card">
            <div className="finale-icon">
              <CheckCircle2 size={18} color="var(--match-green)" />
            </div>
            <div className="finale-text">
              <div className="finale-label">Perfect Match</div>
              <div className="finale-sub">96% CONFIDENCE · ONE ANSWER</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   INTERACTIVE DEMO — glass console, sliders, live ranking, radar
============================================================ */
const PROPERTIES = [
  { id: "bodakdev", name: "Bodakdev", dev: "Skyline Residency", price: 95, school: 88, traffic: 60, safety: 82, investment: 78, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&q=60" },
  { id: "prahladnagar", name: "Prahlad Nagar", dev: "Meridian Towers", price: 110, school: 80, traffic: 55, safety: 85, investment: 90, img: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=200&q=60" },
  { id: "thaltej", name: "Thaltej", dev: "Palm Court", price: 72, school: 70, traffic: 75, safety: 78, investment: 68, img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&q=60" },
  { id: "satellite", name: "Satellite", dev: "The Regent", price: 88, school: 85, traffic: 50, safety: 88, investment: 74, img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200&q=60" },
  { id: "vastrapur", name: "Vastrapur", dev: "Lakeview Enclave", price: 105, school: 92, traffic: 58, safety: 90, investment: 82, img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&q=60" },
  { id: "bopal", name: "South Bopal", dev: "Greenfield Estates", price: 62, school: 65, traffic: 82, safety: 72, investment: 88, img: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=200&q=60" },
];
const KEYS = ["school", "traffic", "safety", "investment"];
const LABELS = { school: "School Access", traffic: "Traffic Ease", safety: "Safety", investment: "Investment Upside" };
const CRITERION = { school: "school access", traffic: "ease of commute", safety: "safety", investment: "investment upside" };

function budgetFit(price, target) {
  const diff = Math.abs(price - target);
  return Math.max(0, 1 - Math.min(diff / 70, 1));
}

function Demo() {
  const [weights, setWeights] = useState({ school: 4, traffic: 4, safety: 5, investment: 4 });
  const [budget, setBudget] = useState(80);

  const ranked = useMemo(() => {
    const wSum = KEYS.reduce((s, k) => s + weights[k], 0);
    return PROPERTIES.map((p) => {
      let weighted = 0;
      KEYS.forEach((k) => { weighted += (weights[k] / 5) * p[k]; });
      weighted = (weighted / wSum) * 5;
      const bf = budgetFit(p.price, budget);
      const score = Math.round(Math.min(99, weighted * (0.55 + 0.45 * bf)));
      return { ...p, score };
    }).sort((a, b) => b.score - a.score);
  }, [weights, budget]);

  const top = ranked[0];
  const domKey = useMemo(() => KEYS.reduce((best, k) => (weights[k] > weights[best] ? k : best), KEYS[0]), [weights]);
  const bf = budgetFit(top.price, budget);
  const budgetPhrase = bf > 0.75 ? "sits right inside your budget" : bf > 0.4 ? "is a reasonable stretch on budget" : "is outside your comfort zone on price, but still leads";

  const radarPoints = useMemo(() => {
    const cx = 100, cy = 90, r = 62, n = 4;
    const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
    return KEYS.map((k, i) => {
      const a = angle(i);
      const scale = weights[k] / 5;
      return [cx + r * scale * Math.cos(a), cy + r * scale * Math.sin(a)];
    }).map((p) => p.join(",")).join(" ");
  }, [weights]);

  const budgetLabel = budget >= 100 ? `₹${(budget / 100).toFixed(2)}Cr` : `₹${budget}L`;

  return (
    <section style={{ padding: "110px 24px 120px", maxWidth: 1240, margin: "0 auto" }}>
      <div className="bl-eyebrow"><span className="bl-dot" /> TRY IT LIVE</div>
      <h2 style={{ fontSize: "clamp(30px,3.8vw,48px)", fontWeight: 800, marginTop: 22, lineHeight: 1.1, maxWidth: 760 }}>
        Tell it what matters.<br />Watch the city rearrange itself.
      </h2>
      <p style={{ marginTop: 14, fontSize: 16, color: "#5B6270", maxWidth: 520 }}>
        Move a priority — Bricklytics re-scores every listing in real time, then explains why.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24, marginTop: 44 }} className="bl-console">
        {/* controls */}
        <div className="bl-glass" style={{ borderRadius: 18, padding: "26px 24px" }}>
          <div className="bl-mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: "#5B6270", textTransform: "uppercase", marginBottom: 22 }}>Investor Priorities</div>
          {KEYS.map((k) => (
            <div key={k} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{LABELS[k]}</span>
                <span className="bl-mono" style={{ fontSize: 12.5, color: C.purple }}>{"★".repeat(weights[k]) + "☆".repeat(5 - weights[k])}</span>
              </div>
              <input type="range" min="1" max="5" step="1" value={weights[k]}
                onChange={(e) => setWeights((w) => ({ ...w, [k]: parseInt(e.target.value, 10) }))}
                style={{ width: "100%", accentColor: C.blue }} />
            </div>
          ))}
          <div style={{ height: 1, background: C.border, margin: "20px 0" }} />
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Budget</span>
              <span className="bl-mono" style={{ fontSize: 12.5, color: C.purple }}>{budgetLabel}</span>
            </div>
            <input type="range" min="40" max="150" step="5" value={budget} onChange={(e) => setBudget(parseInt(e.target.value, 10))} style={{ width: "100%", accentColor: C.blue }} />
          </div>
          <div style={{ height: 1, background: C.border, margin: "22px 0" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <svg width="200" height="180" viewBox="0 0 200 180">
              {[0.33, 0.66, 1].map((s, i) => {
                const pts = KEYS.map((_, j) => {
                  const a = (Math.PI * 2 * j) / 4 - Math.PI / 2;
                  return [100 + 62 * s * Math.cos(a), 90 + 62 * s * Math.sin(a)].join(",");
                }).join(" ");
                return <polygon key={i} points={pts} stroke={C.border} fill="none" strokeWidth="1" />;
              })}
              {KEYS.map((k, i) => {
                const a = (Math.PI * 2 * i) / 4 - Math.PI / 2;
                const lx = 100 + 78 * Math.cos(a), ly = 90 + 78 * Math.sin(a);
                return <text key={k} x={lx} y={ly + 3} textAnchor="middle" className="bl-mono" fontSize="9" fill="#5B6270">{LABELS[k].split(" ")[0]}</text>;
              })}
              <polygon points={radarPoints} fill="rgba(139,92,246,0.18)" stroke={C.purple} strokeWidth="1.6" style={{ transition: "all .4s ease" }} />
            </svg>
          </div>
        </div>

        {/* results */}
        <div>
          <div className="bl-glass" style={{ borderRadius: 12, padding: "13px 20px", display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="bl-mono" style={{ fontSize: 12.5, color: "#5B6270", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.blue }} />
              {PROPERTIES.length} properties ranked
            </div>
            <span className="bl-mono" style={{ fontSize: 12.5, color: C.purple }}>Top match: {top.score}%</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ranked.map((p, i) => (
              <div key={p.id} className="bl-glass" style={{
                borderRadius: 14, padding: "12px 18px", display: "grid", gridTemplateColumns: "58px 1fr auto", gap: 14, alignItems: "center",
                border: i === 0 ? `1px solid rgba(91,140,255,0.4)` : "1px solid rgba(255,255,255,0.8)",
                transition: "border-color .3s ease",
              }}>
                <div style={{ fontFamily: "'Inter Tight',sans-serif", fontSize: 22, fontWeight: 800, color: i === 0 ? C.blue : "#9BA1B0", textAlign: "center" }}>{i + 1}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, backgroundImage: `url(${p.img})`, backgroundSize: "cover", backgroundPosition: "center", flex: "none" }} />
                  <div>
                    <div style={{ fontFamily: "'Inter Tight',sans-serif", fontSize: 15.5, fontWeight: 700 }}>{p.name}</div>
                    <div className="bl-mono" style={{ fontSize: 11, color: "#5B6270" }}>{p.dev} · ₹{p.price}L</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="bl-mono" style={{ fontSize: 19, fontWeight: 700, color: i === 0 ? C.purple : C.text }}>{p.score}%</div>
                  <div style={{ fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9BA1B0" }}>Match</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bl-glass" style={{ borderRadius: 14, padding: "20px 22px", marginTop: 16 }}>
            <div className="bl-mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: C.purple, textTransform: "uppercase", marginBottom: 10 }}>Bricklytics' Reasoning</div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, margin: 0 }}>
              <b style={{ color: C.blue }}>{top.name}</b> comes out on top with a {top.score}% match. You weighted{" "}
              <b>{CRITERION[domKey]}</b> highest, and this listing scores strongly there — while it {budgetPhrase} at ₹{top.price}L against your {budgetLabel} target.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FEATURES — plain, no glass (per rules)
============================================================ */
const FEATURES = [
  { n: "01", tag: "AI Match", title: "It understands what you value.", body: "Move one priority and every listing re-ranks instantly.", Icon: Sparkles },
  { n: "02", tag: "Satellite", title: "See the city from above.", body: "Cross-checked against current imagery, not brochure photos.", Icon: SatelliteIcon },
  { n: "03", tag: "Growth", title: "Where the city is heading next.", body: "Metro lines, road widenings, zoning — tracked years ahead.", Icon: TrendingUp },
  { n: "04", tag: "Traffic", title: "Know your real commute.", body: "Actual travel time across the day, not straight-line distance.", Icon: Car },
  { n: "05", tag: "Safety", title: "Safety, measured.", body: "Lighting, foot traffic, incidents — one score per block.", Icon: ShieldCheck },
  { n: "06", tag: "Investment", title: "Read the next five years.", body: "Yield, appreciation, resale velocity by micro-market.", Icon: Building2 },
  { n: "07", tag: "AI Assistant", title: "Just ask.", body: "\"Will this flood in monsoon?\" No forms, just an answer.", Icon: MessageSquare },
  { n: "08", tag: "Neighbourhood", title: "More than an address.", body: "Schools, hospitals, parks — all within walking distance.", Icon: TreePine },
];

function FeatureCard({ f }) {
  const [ref, inView] = useInView(0.2);
  return (
    <div ref={ref} className={`bl-row-reveal ${inView ? "in" : ""}`} style={{
      padding: "26px 24px", borderRadius: 16, background: C.surface, border: `1px solid ${C.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--blue-glow)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <f.Icon size={17} color={C.blue} />
        </div>
        <span className="bl-mono" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: C.purple }}>{f.tag}</span>
      </div>
      <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{f.title}</h3>
      <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "#5B6270", margin: 0 }}>{f.body}</p>
    </div>
  );
}

function Features() {
  return (
    <section style={{ padding: "70px 24px 90px", maxWidth: 1240, margin: "0 auto" }}>
      <div className="bl-eyebrow"><span className="bl-dot" /> FEATURES</div>
      <h2 style={{ fontSize: "clamp(30px,3.8vw,48px)", fontWeight: 800, marginTop: 22, maxWidth: 720, lineHeight: 1.1 }}>
        One platform. Eight ways it changes how you see the city.
      </h2>
      <p style={{ marginTop: 14, fontSize: 16, color: "#5B6270", maxWidth: 480 }}>Every feature runs on the same engine behind the console above.</p>
      <div className="bl-feature-grid" style={{ marginTop: 36, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {FEATURES.map((f) => <FeatureCard key={f.n} f={f} />)}
      </div>
    </section>
  );
}

/* ============================================================
   FAQ — glass cards
============================================================ */
const FAQS = [
  { q: "How does Bricklytics decide what to recommend?", a: "You tell it what matters — school access, commute, safety, budget, upside — and it scores every listing against those weights in real time. There's no fixed formula; the ranking is yours." },
  { q: "Which areas does Bricklytics cover?", a: "Everything inside the AMC boundary — Ahmedabad Municipal Corporation limits. We deliberately exclude rural outskirts where data quality drops." },
  { q: "Where does the underlying data come from?", a: "Satellite imagery, municipal infrastructure records, traffic pattern data, and verified listing data — cross-referenced against each other, not taken at face value." },
  { q: "How current is the information?", a: "Satellite imagery refreshes every 12 months, traffic and pricing data continuously. Nothing you see is a one-time snapshot." },
  { q: "Is Bricklytics free to use?", a: "Early access is free during the Ahmedabad pilot. Pricing for expanded coverage and advanced investor tools will be announced before rollout." },
  { q: "Should I still talk to a local broker?", a: "Yes. Bricklytics narrows the field and tells you why a property fits — it doesn't replace due diligence, site visits, or legal verification." },
  { q: "How do I get started?", a: "Request early access below — no download, no setup. You're matched to your first shortlist within minutes." },
];

function FAQItem({ item, open, onToggle }) {
  return (
    <div className="bl-glass" style={{ borderRadius: 14, overflow: "hidden", border: open ? `1px solid rgba(91,140,255,0.35)` : "1px solid rgba(255,255,255,0.8)" }}>
      <button onClick={onToggle} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, background: "none", border: "none", textAlign: "left", padding: "20px 22px", cursor: "pointer", fontSize: 15.5, fontWeight: 500, color: C.text, fontFamily: "'Inter',sans-serif" }}>
        {item.q}
        <ChevronDown size={19} color={open ? C.purple : C.blue} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .3s ease", flex: "none" }} />
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .35s ease" }}>
        <div style={{ overflow: "hidden" }}>
          <p style={{ padding: "0 22px 20px", fontSize: 14.5, lineHeight: 1.7, color: "#5B6270", margin: 0 }}>{item.a}</p>
        </div>
      </div>
    </div>
  );
}

function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <section style={{ padding: "100px 24px 110px", maxWidth: 760, margin: "0 auto" }}>
      <div style={{ textAlign: "center" }}>
        <div className="bl-eyebrow" style={{ justifyContent: "center" }}><span className="bl-dot" /> FAQ</div>
        <h2 style={{ fontSize: "clamp(28px,3.4vw,40px)", fontWeight: 800, marginTop: 22, marginBottom: 44 }}>Questions worth asking twice.</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {FAQS.map((item, i) => (
          <FAQItem key={i} item={item} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? null : i)} />
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER — normal premium button for subscribe
============================================================ */
function Footer() {
  const socials = [
    <path key="1" d="M18.9 3H21.6L15.6 9.9L22.7 19H17.1L12.8 13.4L7.9 19H5.2L11.6 11.6L4.8 3H10.5L14.4 8.1L18.9 3Z" fill="currentColor" />,
  ];
  return (
    <footer style={{ maxWidth: 1240, margin: "0 auto", padding: "70px 24px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, paddingBottom: 44, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 800, fontSize: 20 }}>Bricklytics</div>
        <nav style={{ display: "flex", gap: 30, flexWrap: "wrap" }}>
          {["Product", "Features", "Pricing", "Contact"].map((l) => <a key={l} href="#" style={{ fontSize: 14, color: "#5B6270", textDecoration: "none" }}>{l}</a>)}
        </nav>
        <div style={{ display: "flex", gap: 12 }}>
          {["X", "in", "IG"].map((s) => (
            <a key={s} href="#" style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#5B6270", textDecoration: "none" }}>{s}</a>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, padding: "40px 0", borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontFamily: "'Inter Tight',sans-serif", fontSize: 20, fontWeight: 600, maxWidth: 320, margin: 0 }}>Stay ahead of Ahmedabad's market.</p>
        <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", gap: 10, minWidth: 320 }}>
          <input type="email" placeholder="Your email address" required style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 100, padding: "12px 18px", fontSize: 14, outline: "none", background: C.surface }} />
          <button type="submit" className="bl-btn-primary"><Mail size={14} /> Subscribe</button>
        </form>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingTop: 24 }} className="bl-mono">
        <span style={{ fontSize: 11.5, color: "#9BA1B0" }}>© 2026 Bricklytics. All rights reserved.</span>
        <span style={{ fontSize: 11.5, color: "#9BA1B0" }}>Ahmedabad, India</span>
      </div>
    </footer>
  );
}

/* ============================================================
   ROOT
============================================================ */
export default function BricklyticsLanding({ onNavigate }) {
  return (
    <div className="bl-root" style={{ position: "relative" }}>
      <GlobalStyles />
      <Navbar onNavigate={onNavigate} />
      <Hero onNavigate={onNavigate} />
      <Problem />
      <Pipeline />
      <Demo />
      <Features />
      <FAQ />
      <Footer />
    </div>
  );
}
