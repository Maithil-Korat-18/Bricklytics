import React from "react";
import { C } from "../config/constants";

/**
 * Injects all app-wide CSS: fonts, glass effects, buttons, auth layout,
 * animations, responsive breakpoints, and reduced-motion support.
 */
export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700;800;900&family=IBM+Plex+Mono:wght@400;500&display=swap');

      .ax-root *{ box-sizing:border-box; }
      .ax-root{ font-family:'Inter',sans-serif; color:${C.text}; background:${C.bg}; }
      .ax-root h1,.ax-root h2,.ax-root h3{ font-family:'Inter Tight',sans-serif; letter-spacing:-0.02em; margin:0; }
      .ax-mono{ font-family:'IBM Plex Mono',monospace; }

      .ax-glass{
        background: rgba(255,255,255,0.62);
        backdrop-filter: blur(20px) saturate(160%);
        -webkit-backdrop-filter: blur(20px) saturate(160%);
        border:1px solid rgba(255,255,255,0.8);
        box-shadow: 0 30px 70px -30px rgba(17,24,39,0.22);
      }

      .ax-input{
        width:100%; border:1px solid ${C.border}; border-radius:14px; background:${C.surface};
        padding:11px 14px; font-size:14px; font-family:'Inter',sans-serif; color:${C.text};
        outline:none; transition:box-shadow .25s ease, border-color .25s ease;
      }
      .ax-input:focus{ border-color:${C.blue}; box-shadow:0 0 0 4px ${C.blueGlow}; }
      .ax-input.valid{ border-color:${C.blue}; }

      .ax-label{ font-size:13px; font-weight:600; color:${C.text}; margin-bottom:7px; display:block; }
      .ax-hint{ font-size:12px; color:#8A93A6; margin-top:6px; }

      /* Floating rounded navbar */
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
        background: rgba(255, 255, 255, 0.72) !important;
        backdrop-filter: blur(20px) saturate(160%) !important;
        -webkit-backdrop-filter: blur(20px) saturate(160%) !important;
        border: 1px solid rgba(255, 255, 255, 0.5) !important;
        box-shadow: 0 10px 40px -15px rgba(17, 24, 39, 0.12) !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .bl-menu-btn { display: none; }
      .bl-btn-primary{
        display:inline-flex; align-items:center; gap:8px;
        background:#111827; color:#fff; font-weight:600; font-size:14.5px;
        padding:13px 22px; border-radius:100px; border:none; cursor:pointer;
        transition:transform .2s ease, box-shadow .2s ease; box-shadow:0 10px 24px -10px rgba(17,24,39,0.35);
      }
      .bl-btn-primary:hover{ transform:translateY(-2px); box-shadow:0 14px 28px -10px rgba(17,24,39,0.4); }
      .bl-btn-ghost{
        font-weight:600; font-size:14.5px; color:#111827; background:none; border:none;
        cursor:pointer; opacity:0.75; transition:opacity .2s ease;
      }
      .bl-btn-ghost:hover{ opacity:1; }

      .bl-nav-links { display: flex; gap: 34px; }

      .ax-btn-liquid{
        position:relative; width:100%; display:flex; align-items:center; justify-content:center; gap:9px;
        padding:12px 18px; border-radius:100px; border:none; cursor:pointer; overflow:hidden; isolation:isolate;
        color:#fff; font-weight:700; font-size:14px;
        background:linear-gradient(135deg,${C.blue},${C.purple});
        box-shadow:0 18px 40px -16px rgba(91,140,255,0.55);
        transition:box-shadow .3s ease, transform .3s ease;
      }
      .ax-btn-liquid:hover{ transform:translateY(-2px); box-shadow:0 22px 46px -16px rgba(139,92,246,0.6); }
      .ax-btn-liquid:disabled{ cursor:default; opacity:0.9; transform:none; }
      .ax-btn-liquid::before, .ax-btn-liquid::after{
        content:''; position:absolute; z-index:-1; border-radius:50%; background:rgba(255,255,255,0.35);
        filter:blur(6px); mix-blend-mode:overlay;
      }
      .ax-btn-liquid::before{ width:60px; height:60px; left:-10px; top:-16px; animation: ax-blob1 5s ease-in-out infinite; }
      .ax-btn-liquid::after{ width:44px; height:44px; right:-6px; bottom:-14px; animation: ax-blob2 6s ease-in-out infinite; }
      @keyframes ax-blob1{ 0%,100%{ transform:translate(0,0) scale(1);} 50%{ transform:translate(16px,12px) scale(1.3);} }
      @keyframes ax-blob2{ 0%,100%{ transform:translate(0,0) scale(1);} 50%{ transform:translate(-12px,-9px) scale(1.25);} }

      .ax-ripple{ position:absolute; border-radius:50%; background:rgba(255,255,255,0.55); transform:scale(0); animation:ax-ripple-anim .7s ease-out forwards; pointer-events:none; }
      @keyframes ax-ripple-anim{ to{ transform:scale(3.2); opacity:0; } }

      .ax-btn-secondary{
        width:100%; display:flex; align-items:center; justify-content:center; gap:10px;
        padding:13px 20px; border-radius:100px; border:1px solid ${C.border}; background:${C.surface};
        font-weight:600; font-size:14px; color:${C.text}; cursor:pointer; transition:border-color .2s ease, transform .2s ease;
      }
      .ax-btn-secondary:hover{ border-color:${C.blue}; transform:translateY(-1px); }

      .ax-chip{
        display:inline-flex; align-items:center; gap:8px; padding:10px 16px; border-radius:100px;
        border:1px solid ${C.border}; background:${C.surface}; font-size:13.5px; font-weight:600; color:${C.text};
        cursor:pointer; transition:all .2s ease;
      }
      .ax-chip.selected{ border-color:${C.blue}; background:${C.blueGlow}; color:#2A54BE; }

      .ax-auth-page{
        min-height:100vh; padding:40px 24px;
        display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px;
        background:
          radial-gradient(circle at top left, rgba(62,111,224,0.08), rgba(62,111,224,0) 30%),
          radial-gradient(circle at bottom right, rgba(130,94,235,0.08), rgba(130,94,235,0) 34%),
          ${C.bg};
      }
      .ax-auth-home{
        display:inline-flex; align-items:center; gap:8px;
        padding:10px 16px; border-radius:999px;
        border:1px solid ${C.border}; background:rgba(255,255,255,0.72);
        color:${C.text}; font-size:13.5px; font-weight:600;
        text-decoration:none; box-shadow:0 10px 24px -15px rgba(17,24,39,0.15);
        cursor:pointer; transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease;
      }
      .ax-auth-home:hover{
        transform:translateY(-1px); border-color:${C.blue};
        box-shadow:0 14px 28px -15px rgba(17,24,39,0.22);
      }
      .ax-auth-card{
        width:min(940px,100%); display:grid; grid-template-columns:1fr 1.1fr;
        border-radius:28px; overflow:hidden;
        box-shadow:0 30px 80px -34px rgba(17,24,39,0.25);
        border:1px solid rgba(255,255,255,0.55);
      }
      .ax-auth-hero{ min-height:580px; }
      .ax-auth-panel{
        background:rgba(255,255,255,0.88);
        backdrop-filter:blur(22px) saturate(160%);
        -webkit-backdrop-filter:blur(22px) saturate(160%);
        padding:26px clamp(20px,2.5vw,32px); display:flex; align-items:center;
      }
      .ax-auth-panel-inner{ width:100%; }
      .ax-auth-switcher{
        display:inline-flex; gap:4px; padding:4px;
        border-radius:999px; background:${C.bg}; border:1px solid ${C.border};
      }
      .ax-auth-switcher button{
        border:none; background:transparent; padding:9px 16px; border-radius:999px;
        font-size:13.5px; font-weight:600; cursor:pointer; color:#8A93A6; transition:all .2s ease;
      }
      .ax-auth-switcher button.active{
        background:${C.surface}; color:${C.text};
        box-shadow:0 8px 18px -10px rgba(17,24,39,0.25);
      }
      .ax-stepper{ display:flex; gap:8px; margin-bottom:20px; }
      .ax-stepper span{ height:8px; border-radius:999px; background:${C.border}; transition:all .25s ease; }
      .ax-stepper span.active{ width:22px; background:linear-gradient(135deg,${C.blue},${C.purple}); }
      .ax-stepper span.inactive{ width:8px; }
      .ax-auth-note{ font-size:12.5px; color:#5B6270; line-height:1.5; }
      .ax-role-grid{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      .ax-role-card{
        padding:14px 16px; border-radius:16px; border:1px solid ${C.border};
        background:${C.surface}; font-size:14px; font-weight:600;
        cursor:pointer; transition:all .2s ease; text-align:center;
      }
      .ax-role-card.selected{ border-color:${C.blue}; background:${C.blueGlow}; color:#2A54BE; }
      .ax-inline-link{
        background:none; border:none; padding:0;
        color:${C.blue}; font-weight:700; cursor:pointer;
      }

      .ax-fade-up{ animation: ax-fadeup .5s cubic-bezier(.16,.8,.24,1) both; }
      @keyframes ax-fadeup{ from{ opacity:0; transform:translateY(16px);} to{ opacity:1; transform:translateY(0);} }
      @keyframes ax-float{ 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-9px);} }
      @keyframes ax-float-slow{ 0%,100%{ transform:translateY(0) rotate(0deg);} 50%{ transform:translateY(-8px) rotate(1deg);} }
      @keyframes ax-kenburns{ 0%{ transform:scale(1);} 100%{ transform:scale(1.09);} }
      @keyframes ax-blink{ 0%,100%{ opacity:1;} 50%{ opacity:0.25;} }
      @keyframes ax-pop{ 0%{ transform:scale(0.4); opacity:0;} 60%{ transform:scale(1.12); opacity:1;} 100%{ transform:scale(1); opacity:1;} }
      @keyframes ax-spin{ to{ transform:rotate(360deg); } }

      @media (max-width: 768px) {
        .bl-navbar-floating { top: 10px !important; width: calc(100% - 20px) !important; padding: 8px 18px !important; border-radius: 20px !important; }
        .bl-nav-links { display: none !important; }
        .bl-menu-btn { display: block !important; }
      }
      @media (max-width: 940px){
        .ax-split{ grid-template-columns:1fr !important; }
        .ax-left{ display:none !important; }
        .ax-auth-card{ grid-template-columns:1fr !important; }
        .ax-auth-hero{ min-height:280px !important; }
      }
      @media (prefers-reduced-motion: reduce){
        .ax-root *{ animation:none !important; transition:none !important; }
      }
    `}</style>
  );
}
