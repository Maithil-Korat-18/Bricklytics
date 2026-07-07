import React from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { C } from "../config/constants";

export default function EmailField({ value, onChange }) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return (
    <div>
      <label className="ax-label">Email</label>
      <div style={{ position: "relative" }}>
        <Mail size={16} color="#8A93A6" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input type="email" value={value} onChange={onChange} placeholder="you@example.com" className={`ax-input ${valid ? "valid" : ""}`} style={{ paddingLeft: 38 }} />
        {valid && <CheckCircle2 size={15} color={C.blue} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }} />}
      </div>
    </div>
  );
}
