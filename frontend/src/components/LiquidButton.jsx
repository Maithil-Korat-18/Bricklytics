import React, { useRef, useState } from "react";

/**
 * Gradient button with liquid blob animation and ripple effect on click.
 */
export default function LiquidButton({ children, loading, onClick, type = "submit" }) {
  const ref = useRef(null);
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const btn = ref.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const id = Date.now();
      const size = Math.max(rect.width, rect.height);
      setRipples((r) => [...r, { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size }]);
      setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 700);
    }
    if (onClick) onClick(e);
  };

  return (
    <button ref={ref} type={type} className="ax-btn-liquid" onClick={handleClick} disabled={loading}>
      {ripples.map((r) => (
        <span key={r.id} className="ax-ripple" style={{ left: r.x, top: r.y, width: r.size, height: r.size }} />
      ))}
      {loading ? (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: `ax-blink 1s ease-in-out infinite ${i * 0.15}s` }} />
          ))}
        </span>
      ) : children}
    </button>
  );
}
