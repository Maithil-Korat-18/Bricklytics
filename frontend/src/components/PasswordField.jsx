import React, { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { C } from "../config/constants";

export default function PasswordField({ label, value, onChange, placeholder, showStrengthHint }) {
  const [show, setShow] = useState(false);
  const valid = value.length >= 8;
  return (
    <div>
      <label className="ax-label">{label}</label>
      <div style={{ position: "relative" }}>
        <Lock size={16} color="#8A93A6" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`ax-input ${valid ? "valid" : ""}`}
          style={{ paddingLeft: 38, paddingRight: 40 }}
        />
        <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          {show ? <EyeOff size={16} color="#8A93A6" /> : <Eye size={16} color="#8A93A6" />}
        </button>
      </div>
      {showStrengthHint && value.length > 0 && (
        <div className="ax-hint" style={{ display: "flex", alignItems: "center", gap: 5, color: valid ? C.blue : "#8A93A6" }}>
          {valid && <CheckCircle2 size={12} />} {valid ? "Strong enough" : "Use at least 8 characters"}
        </div>
      )}
    </div>
  );
}
