import React from "react";
import { Sparkles, Home as HomeIcon } from "lucide-react";
import { C } from "../config/constants";

function FloatingInsight({ top, left, label, value, delay, accent }) {
  return (
    <div className="ax-glass" style={{ position: "absolute", top, left, borderRadius: 16, padding: "12px 16px", display: "flex", alignItems: "center", gap: 11, animation: `ax-float 7s ease-in-out infinite ${delay}` }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: accent === C.blue ? C.blueGlow : C.purpleGlow, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <Sparkles size={14} color={accent} />
      </div>
      <div>
        <div className="ax-mono" style={{ fontSize: 10.5, color: "#5B6270" }}>{label}</div>
        <div className="ax-mono" style={{ fontSize: 13.5, fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}

export function LeftVisual() {
  return (
    <div className="ax-left" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1400&auto=format&fit=crop"
          alt="Luxury villa"
          style={{ width: "100%", height: "100%", objectFit: "cover", animation: "ax-kenburns 22s ease-in-out infinite alternate" }}
        />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(17,24,39,0.05), rgba(17,24,39,0.35))` }} />
      </div>

      <div style={{ position: "absolute", top: "-14%", left: "-14%", width: "50%", height: "50%", borderRadius: "50%", background: `radial-gradient(circle, ${C.blueGlow} 0%, rgba(220,235,255,0) 70%)`, opacity: 0.6 }} />

      <FloatingInsight top="10%" left="8%" label="AI MATCH" value="94%" delay="0s" accent={C.blue} />
      <FloatingInsight top="26%" left="62%" label="FUTURE GROWTH" value="+24%" delay="1.2s" accent={C.purple} />
      <FloatingInsight top="66%" left="10%" label="SAFETY" value="Excellent" delay="2.1s" accent={C.blue} />
      <FloatingInsight top="80%" left="58%" label="TRAFFIC" value="Low Congestion" delay="0.6s" accent={C.purple} />

      <div style={{ position: "absolute", bottom: 40, left: 40, right: 40, color: "#fff" }}>
        <div style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 800, fontSize: 24, lineHeight: 1.2 }}>Your next home is already being scored.</div>
        <div className="ax-mono" style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>340 neighbourhoods · updated continuously</div>
      </div>
    </div>
  );
}

export default function AuthShell({ children, onNavigate }) {
  return (
    <div className="ax-auth-page">
      <button type="button" className="ax-auth-home" onClick={() => onNavigate && onNavigate("landing")}>
        <HomeIcon size={16} />
        Back to home
      </button>
      <div className="ax-auth-card ax-fade-up">
        {children}
      </div>
    </div>
  );
}
