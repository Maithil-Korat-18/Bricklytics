import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { C } from "../config/constants";

export default function AuthNavbar({ phase, mode, setMode, onReset, onNavigate }) {
  const [open, setOpen] = useState(false);
  
  const handleNavClick = (view) => {
    setOpen(false);
    if (onNavigate) {
      onNavigate(view);
    }
  };

  return (
    <nav className="bl-navbar-floating bl-glass">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => handleNavClick('landing')} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Inter Tight',sans-serif", fontWeight: 800, fontSize: 19, cursor: "pointer" }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg,${C.blue},${C.purple})`, position: "relative" }}>
            <span style={{ position: "absolute", inset: 0, margin: "auto", width: 8, height: 8, borderRadius: "50%", background: "#fff", top: "50%", left: "50%", transform: "translate(-50%,-50%)", boxShadow: "0 0 0 4px rgba(255,255,255,0.25)" }} />
          </div>
          Bricklytics
        </div>
        
        <div style={{ display: "flex", gap: 34 }} className="bl-nav-links">
          {["Platform", "Intelligence", "Pricing", "Company"].map((l) => (
            <a key={l} href="#" onClick={() => handleNavClick('landing')} style={{ color: C.text, textDecoration: "none", fontSize: 14.5, fontWeight: 500, opacity: 0.72 }}>{l}</a>
          ))}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {phase === "dashboard" ? (
            <>
              <button onClick={onReset} className="bl-btn-ghost bl-nav-links" style={{ fontSize: 14 }}>Adjust Priorities</button>
              <button onClick={() => handleNavClick('landing')} className="bl-btn-primary bl-nav-links">Sign Out</button>
            </>
          ) : phase === "onboarding" ? (
            <button onClick={() => handleNavClick('landing')} className="bl-btn-ghost" style={{ fontSize: 14 }}>Cancel</button>
          ) : (
            <>
              <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="bl-btn-ghost bl-nav-links" style={{ textDecoration: "none" }}>
                {mode === 'login' ? "Sign Up" : "Log In"}
              </button>
              <button onClick={() => handleNavClick('signup')} className="bl-btn-primary bl-nav-links">Get started</button>
            </>
          )}
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
            <a key={l} href="#" onClick={() => handleNavClick('landing')} style={{ color: C.text, textDecoration: "none", fontSize: 15, fontWeight: 500, opacity: 0.8, padding: "8px 0" }}>{l}</a>
          ))}
          <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
          {phase === "dashboard" ? (
            <>
              <button onClick={() => { setOpen(false); onReset(); }} className="bl-btn-ghost" style={{ textAlign: "left", padding: "10px 0", fontSize: 15 }}>Adjust Preferences</button>
              <button onClick={() => { setOpen(false); handleNavClick('landing'); }} className="bl-btn-primary" style={{ justifyContent: "center" }}>Sign Out</button>
            </>
          ) : (
            <>
              <button onClick={() => { setOpen(false); setMode(mode === 'login' ? 'signup' : 'login'); }} className="bl-btn-ghost" style={{ textAlign: "left", padding: "10px 0", fontSize: 15 }}>
                {mode === 'login' ? "Sign Up" : "Log In"}
              </button>
              <button onClick={() => { setOpen(false); handleNavClick('signup'); }} className="bl-btn-primary" style={{ justifyContent: "center" }}>Get started</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
