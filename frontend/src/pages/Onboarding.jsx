import React, { useState } from "react";
import { ArrowRight, Sparkles, Building2, Home as HomeIcon, MapPin, Store, GraduationCap, Car, ShieldCheck, TrendingUp, HeartPulse, Bus, TreePine } from "lucide-react";
import { C, PROPERTY_TYPES as PROP_TYPES, PRIORITIES as PRIO_LIST, budgetLabel } from "../config/constants";
import LiquidButton from "../components/LiquidButton";
import AuthNavbar from "../components/AuthNavbar";

// Local icons map
const PROPERTY_TYPES = [
  { key: "apartment", label: "Apartment", Icon: Building2 },
  { key: "villa", label: "Villa", Icon: HomeIcon },
  { key: "plot", label: "Plot", Icon: MapPin },
  { key: "commercial", label: "Commercial", Icon: Store },
];

const PRIORITIES = [
  { key: "schools", label: "Schools", Icon: GraduationCap },
  { key: "traffic", label: "Traffic", Icon: Car },
  { key: "safety", label: "Safety", Icon: ShieldCheck },
  { key: "investment", label: "Investment", Icon: TrendingUp },
  { key: "hospitals", label: "Hospitals", Icon: HeartPulse },
  { key: "transit", label: "Public Transport", Icon: Bus },
  { key: "green", label: "Green Spaces", Icon: TreePine },
];

function StepDots({ step }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 30 }}>
      {[1, 2, 3, 4].map((s) => (
        <div key={s} style={{
          width: s === step ? 22 : 8, height: 8, borderRadius: 100,
          background: s <= step ? `linear-gradient(135deg,${C.blue},${C.purple})` : C.border,
          transition: "all .35s cubic-bezier(.2,.7,.2,1)",
        }} />
      ))}
    </div>
  );
}

export default function Onboarding({ onFinish, onNavigate }) {
  const [step, setStep] = useState(1);
  const [propertyType, setPropertyType] = useState("apartment");
  const [budget, setBudget] = useState(80);
  const [priorities, setPriorities] = useState(["safety", "schools"]);

  const togglePriority = (k) => setPriorities((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const canNext = step === 1 ? !!propertyType : step === 2 ? true : step === 3 ? priorities.length > 0 : true;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: 100 }}>
      <AuthNavbar phase="onboarding" onNavigate={onNavigate} />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 24px" }}>
        <div key={step} className="ax-glass ax-fade-up" style={{ width: "100%", maxWidth: 520, borderRadius: 24, padding: "44px 40px" }}>
          <StepDots step={step} />

          {step === 1 && (
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>What are you looking for?</h2>
              <p style={{ fontSize: 14, color: "#5B6270", marginTop: 8, marginBottom: 30 }}>Pick the property type you're most interested in.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {PROPERTY_TYPES.map((p) => (
                  <div key={p.key} onClick={() => setPropertyType(p.key)} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "24px 12px",
                    borderRadius: 18, border: `1px solid ${propertyType === p.key ? C.blue : C.border}`,
                    background: propertyType === p.key ? C.blueGlow : C.surface, cursor: "pointer", transition: "all .2s ease",
                  }}>
                    <p.Icon size={24} color={propertyType === p.key ? C.blue : C.text} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>What's your budget?</h2>
              <p style={{ fontSize: 14, color: "#5B6270", marginTop: 8, marginBottom: 34 }}>You can always change this later.</p>
              <div className="ax-mono" style={{ fontSize: 32, fontWeight: 700, color: C.blue, marginBottom: 20 }}>{budgetLabel(budget)}</div>
              <input type="range" min="20" max="200" step="5" value={budget} onChange={(e) => setBudget(parseInt(e.target.value, 10))} style={{ width: "100%", accentColor: C.blue }} />
              <div className="ax-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#8A93A6", marginTop: 8 }}>
                <span>₹20L</span><span>₹2Cr+</span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>What matters most?</h2>
              <p style={{ fontSize: 14, color: "#5B6270", marginTop: 8, marginBottom: 26 }}>Choose as many as you like.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {PRIORITIES.map((p) => (
                  <div key={p.key} className={`ax-chip ${priorities.includes(p.key) ? "selected" : ""}`} onClick={() => togglePriority(p.key)}>
                    <p.Icon size={15} /> {p.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.purpleGlow, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "ax-pop .5s cubic-bezier(.2,.8,.3,1) both" }}>
                <Sparkles size={28} color={C.purple} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>Your AI profile is ready.</h2>
              <p style={{ fontSize: 14, color: "#5B6270", marginTop: 8, marginBottom: 24 }}>
                Looking for a <b style={{ color: C.text }}>{propertyType}</b> around <b style={{ color: C.text }}>{budgetLabel(budget)}</b>, prioritizing{" "}
                <b style={{ color: C.text }}>{priorities.map((k) => PRIORITIES.find((p) => p.key === k)?.label).join(", ") || "—"}</b>.
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 34 }}>
            {step > 1 && (
              <button onClick={() => setStep((s) => s - 1)} className="ax-btn-secondary" style={{ width: "auto", padding: "13px 22px" }}>Back</button>
            )}
            {step < 4 ? (
              <div style={{ flex: 1 }}>
                <LiquidButton onClick={() => canNext && setStep((s) => s + 1)}>Continue <ArrowRight size={16} /></LiquidButton>
              </div>
            ) : (
              <div style={{ flex: 1 }}>
                <LiquidButton onClick={() => onFinish({ propertyType, budget, priorities })}>Go to dashboard <ArrowRight size={16} /></LiquidButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
