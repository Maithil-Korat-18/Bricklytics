import React, { useState, useMemo, useEffect } from "react";
import { Sparkles, Loader2, Building2, Home as HomeIcon, MapPin, Store, GraduationCap, Car, ShieldCheck, TrendingUp, HeartPulse, Bus, TreePine } from "lucide-react";
import { C, budgetLabel } from "../config/constants";
import AuthNavbar from "../components/AuthNavbar";

export default function Dashboard({ userProfile, onReset, onNavigate }) {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [chatQuery, setChatQuery] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Mock properties data covering all types
  const ALL_PROPERTIES = useMemo(() => [
    // Apartments
    { id: "bodakdev", type: "apartment", name: "Skyline Residency", area: "Bodakdev", price: 95, school: 88, traffic: 70, safety: 85, investment: 80, img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80", desc: "Premium high-rise apartment near SG Highway. Highly rated school access and robust municipal lighting." },
    { id: "prahladnagar", type: "apartment", name: "Meridian Towers", area: "Prahlad Nagar", price: 110, school: 82, traffic: 60, safety: 88, investment: 85, img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80", desc: "Located in the heart of commercial hub. Walking distance to corporate offices and parks." },
    { id: "vastrapur", type: "apartment", name: "Lakeview Enclave", area: "Vastrapur", price: 105, school: 92, traffic: 65, safety: 82, investment: 78, img: "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=400&q=80", desc: "Scenic views of Vastrapur Lake. Close proximity to top educational institutes and retail spaces." },
    { id: "thaltej", type: "apartment", name: "Palm Court", area: "Thaltej", price: 72, school: 75, traffic: 78, safety: 80, investment: 72, img: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&q=80", desc: "Affordable luxury apartments in a quiet residential zone with wide roads." },
    
    // Villas
    { id: "sbopal", type: "villa", name: "Greenfield Estates", area: "South Bopal", price: 180, school: 70, traffic: 80, safety: 78, investment: 90, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80", desc: "Gated villa community with dedicated green spaces and excellent safety infrastructure." },
    { id: "bhadaj", type: "villa", name: "Royal Meadows", area: "Bhadaj", price: 220, school: 65, traffic: 85, safety: 82, investment: 92, img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=80", desc: "Spacious 4BHK luxury villas with private gardens and smart surveillance integration." },
    { id: "shela", type: "villa", name: "Orchid Greens", area: "Shela", price: 140, school: 74, traffic: 72, safety: 75, investment: 86, img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80", desc: "Modern villas with state-of-the-art club amenities and rapid commercial connectivity." },

    // Plots
    { id: "gota", type: "plot", name: "Signature Plots", area: "Gota", price: 45, school: 68, traffic: 75, safety: 72, investment: 84, img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80", desc: "N.A. residential plots ready for construction. Excellent investment potential due to metro line." },
    { id: "ognaj", type: "plot", name: "Elite Acres", area: "Ognaj", price: 75, school: 60, traffic: 82, safety: 76, investment: 88, img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80", desc: "Premium plots located in a fast-appreciating zone close to the Ring Road." },

    // Commercial
    { id: "sbr", type: "commercial", name: "Corporate Hub", area: "Sindhu Bhavan", price: 190, school: 50, traffic: 55, safety: 90, investment: 95, img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80", desc: "Grade A office space in Ahmedabad's most premium retail and commercial street." },
    { id: "cground", type: "commercial", name: "Trade Center", area: "C G Road", price: 120, school: 60, traffic: 50, safety: 85, investment: 78, img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80", desc: "High footfall retail spaces suited for showrooms and restaurants." }
  ], []);

  // Filter and score properties
  const scoredProperties = useMemo(() => {
    const filtered = ALL_PROPERTIES.filter(p => p.type === userProfile.propertyType);
    
    return filtered.map(p => {
      const budgetDiff = Math.abs(p.price - userProfile.budget);
      const budgetScore = Math.max(0, 100 - (budgetDiff / userProfile.budget) * 100);
      
      let priorityScoreSum = 0;
      let count = 0;
      
      userProfile.priorities.forEach(pr => {
        if (pr === 'schools') { priorityScoreSum += p.school; count++; }
        if (pr === 'traffic') { priorityScoreSum += p.traffic; count++; }
        if (pr === 'safety') { priorityScoreSum += p.safety; count++; }
        if (pr === 'investment') { priorityScoreSum += p.investment; count++; }
      });
      
      const averagePriority = count > 0 ? (priorityScoreSum / count) : 75;
      const finalScore = Math.round((budgetScore * 0.4) + (averagePriority * 0.6));
      
      return {
        ...p,
        score: finalScore,
        budgetScore: Math.round(budgetScore)
      };
    }).sort((a, b) => b.score - a.score);
  }, [userProfile, ALL_PROPERTIES]);

  useEffect(() => {
    if (scoredProperties.length > 0) {
      setSelectedProperty(scoredProperties[0]);
    } else {
      setSelectedProperty(null);
    }
  }, [scoredProperties]);

  const handleAskChat = (q) => {
    const queryText = q || chatQuery;
    if (!queryText.trim()) return;

    setIsChatLoading(true);
    setChatResponse("");
    
    setTimeout(() => {
      setIsChatLoading(false);
      const lower = queryText.toLowerCase();
      if (lower.includes("flood") || lower.includes("monsoon")) {
        setChatResponse("Based on municipal elevation models and satellite runoff data, Vastrapur and Bodakdev hold excellent drainage scores with less than 2% historical waterlogging. South Bopal is generally safe but the approach roads near the main flyover experience brief water retention during continuous heavy rain (+80mm/hr).");
      } else if (lower.includes("school") || lower.includes("education")) {
        setChatResponse("Bodakdev and Vastrapur lead with over 12 top-tier schools (including CBSE and International boards) within a 3km radius. Commute time to these schools averages under 12 minutes during peak morning hours. Shela and Bhadaj are developing rapidly; school buses cover these areas, but travel times can extend to 25 minutes.");
      } else if (lower.includes("growth") || lower.includes("investment") || lower.includes("appreciate")) {
        setChatResponse("South Bopal, Shela, and Gota are the leading appreciation hotspots, showing an average of 9.2% annual growth over the last 5 years. This is fueled by the metro corridor extension and zoning amendments under DP 2021. Established areas like Prahlad Nagar and Bodakdev offer stable rental yields (3.5% - 4.2%) but lower capital appreciation (4-5%).");
      } else {
        setChatResponse("Bricklytics AI Analysis: The micro-market you selected shows stable infrastructure indicators. Average travel times to the main corporate districts (SG Highway, Gift City road junction) stay below 20 minutes outside of peak congestion hours. Safety indicators (street illumination density, emergency access) score in the top 15% of Ahmedabad Municipal limits.");
      }
    }, 1200);
  };

  const sampleQuestions = [
    "Will these areas flood in heavy monsoon?",
    "Which local schools are within 10 mins commute?",
    "Where is the highest property appreciation zone?"
  ];

  return (
    <div style={{ padding: "120px clamp(20px,4vw,56px) 60px", maxWidth: 1400, margin: "0 auto", animation: "ax-fadeup 0.5s ease" }}>
      <AuthNavbar phase="dashboard" onReset={onReset} onNavigate={onNavigate} />

      {/* Dashboard Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={24} color={C.purple} /> Property Intelligence Dashboard
          </h1>
          <p style={{ color: "#5B6270", fontSize: 14, marginTop: 4 }}>
            Tailored analysis based on your investment preferences.
          </p>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 28 }} className="bl-console">
        {/* Left Panel: Profile and Chat */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* User Profile Card */}
          <div className="ax-glass" style={{ borderRadius: 20, padding: "24px 20px" }}>
            <div className="ax-mono" style={{ fontSize: 11, color: "#8A93A6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              Your Preferences
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
                <span style={{ fontSize: 13.5, color: "#5B6270" }}>Property Type</span>
                <b style={{ fontSize: 13.5, textTransform: "capitalize" }}>{userProfile.propertyType}s</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
                <span style={{ fontSize: 13.5, color: "#5B6270" }}>Target Budget</span>
                <b style={{ fontSize: 13.5 }}>{budgetLabel(userProfile.budget)}</b>
              </div>
              <div>
                <span style={{ fontSize: 13.5, color: "#5B6270", display: "block", marginBottom: 6 }}>Key Priorities</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {userProfile.priorities.map(p => (
                    <span key={p} className="ax-mono" style={{ 
                      fontSize: 10.5, 
                      padding: "4px 8px", 
                      borderRadius: 100, 
                      background: C.blueGlow, 
                      color: "#2A54BE",
                      fontWeight: 600,
                      textTransform: "capitalize"
                    }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Q&A Assistant */}
          <div className="ax-glass" style={{ borderRadius: 20, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div className="ax-mono" style={{ fontSize: 11, color: C.purple, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Bricklytics AI Assistant
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>Ask About Neighborhoods</h3>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sampleQuestions.map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => { setChatQuery(q); handleAskChat(q); }}
                  style={{ 
                    textAlign: "left", 
                    fontSize: 12.5, 
                    padding: "10px 12px", 
                    borderRadius: 10, 
                    border: `1px solid ${C.border}`, 
                    background: C.surface, 
                    cursor: "pointer",
                    color: C.text,
                    opacity: 0.85,
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.blue; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; }}
                >
                  {q}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <input 
                type="text" 
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                placeholder="Ask about waterlogging, school commute..." 
                style={{ 
                  flex: 1, 
                  border: `1px solid ${C.border}`, 
                  borderRadius: 100, 
                  padding: "10px 14px", 
                  fontSize: 13, 
                  outline: "none" 
                }}
                onKeyDown={(e) => { if (e.key === "Enter") handleAskChat(); }}
              />
              <button 
                onClick={() => handleAskChat()}
                className="bl-btn-primary" 
                style={{ width: "auto", padding: "10px 16px", borderRadius: 100, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                Ask
              </button>
            </div>

            {/* Chat Response Area */}
            {(isChatLoading || chatResponse) && (
              <div style={{ 
                padding: 14, 
                borderRadius: 12, 
                background: isChatLoading ? "transparent" : "#F3F7FF", 
                border: isChatLoading ? `1px dashed ${C.border}` : `1px solid ${C.blueGlow}`,
                fontSize: 13, 
                lineHeight: 1.5,
                color: "#2C3E50" 
              }}>
                {isChatLoading ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "10px 0" }}>
                    <Loader2 size={16} className="ax-spin" style={{ animation: "ax-spin 1s linear infinite", color: C.blue }} />
                    <span className="ax-mono" style={{ fontSize: 11.5, color: "#8A93A6" }}>Analyzing spatial signals...</span>
                  </div>
                ) : (
                  <div>
                    <div className="ax-mono" style={{ fontSize: 9.5, fontWeight: 700, color: C.blue, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <Sparkles size={10} /> AI ANALYSIS
                    </div>
                    {chatResponse}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Ranked Matches & Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Matches List */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="ax-mono" style={{ fontSize: 12, color: "#5B6270" }}>
                Ranked Matches ({scoredProperties.length})
              </div>
              <span className="ax-mono" style={{ fontSize: 11.5, color: C.purple }}>
                Sorted by AI match score
              </span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {scoredProperties.length === 0 ? (
                <div className="ax-glass" style={{ borderRadius: 16, padding: "30px 20px", textAlign: "center", color: "#5B6270" }}>
                  No matching properties found within your budget. Try adjusting priorities or expanding your budget range.
                </div>
              ) : (
                scoredProperties.map((p, i) => {
                  const isSelected = selectedProperty && selectedProperty.id === p.id;
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => setSelectedProperty(p)}
                      className="ax-glass" 
                      style={{
                        borderRadius: 16, 
                        padding: "16px 20px", 
                        display: "grid", 
                        gridTemplateColumns: "40px 1.5fr 1.2fr 120px", 
                        gap: 16, 
                        alignItems: "center",
                        cursor: "pointer",
                        border: isSelected ? `1px solid ${C.blue}` : "1px solid rgba(255,255,255,0.8)",
                        boxShadow: isSelected ? `0 10px 30px -10px rgba(91,140,255,0.3)` : "0 4px 20px -10px rgba(17,24,39,0.08)",
                        transform: isSelected ? "translateY(-1px)" : "none",
                        transition: "all 0.25s ease",
                      }}
                    >
                      <div style={{ fontFamily: "'Inter Tight',sans-serif", fontSize: 20, fontWeight: 800, color: isSelected ? C.blue : "#9BA1B0", textAlign: "center" }}>
                        {i + 1}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, backgroundImage: `url(${p.img})`, backgroundSize: "cover", backgroundPosition: "center", flex: "none" }} />
                        <div>
                          <div style={{ fontFamily: "'Inter Tight',sans-serif", fontSize: 15.5, fontWeight: 700 }}>{p.name}</div>
                          <div className="ax-mono" style={{ fontSize: 11.5, color: "#5B6270" }}>{p.area} · {p.price >= 100 ? `₹${(p.price/100).toFixed(2)}Cr` : `₹${p.price}L`}</div>
                        </div>
                      </div>
                      {/* Metrics preview */}
                      <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ textAlign: "center", flex: 1 }}>
                          <div className="ax-mono" style={{ fontSize: 12.5, fontWeight: 600, color: C.blue }}>{p.safety}%</div>
                          <div style={{ fontSize: 9, color: "#8A93A6", textTransform: "uppercase" }}>Safety</div>
                        </div>
                        <div style={{ textAlign: "center", flex: 1 }}>
                          <div className="ax-mono" style={{ fontSize: 12.5, fontWeight: 600, color: C.purple }}>{p.school}%</div>
                          <div style={{ fontSize: 9, color: "#8A93A6", textTransform: "uppercase" }}>Schools</div>
                        </div>
                        <div style={{ textAlign: "center", flex: 1 }}>
                          <div className="ax-mono" style={{ fontSize: 12.5, fontWeight: 600, color: "#2EBE7B" }}>{p.investment}%</div>
                          <div style={{ fontSize: 9, color: "#8A93A6", textTransform: "uppercase" }}>Growth</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="bl-mono" style={{ fontSize: 20, fontWeight: 800, color: isSelected ? C.purple : C.text }}>
                          {p.score}%
                        </div>
                        <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9BA1B0" }}>Match Score</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Property Details Panel */}
          {selectedProperty && (
            <div className="ax-glass" style={{ borderRadius: 20, padding: "26px 24px", animation: "ax-fadeup 0.4s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="bl-console">
                <div>
                  <div style={{ width: "100%", height: 180, borderRadius: 14, backgroundImage: `url(${selectedProperty.img})`, backgroundSize: "cover", backgroundPosition: "center", marginBottom: 16 }} />
                  <h3 style={{ fontSize: 20, fontWeight: 800 }}>{selectedProperty.name}</h3>
                  <div className="ax-mono" style={{ fontSize: 12.5, color: C.blue, marginTop: 4 }}>
                    {selectedProperty.area} · Ahmedabad
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#5B6270", marginTop: 12 }}>
                    {selectedProperty.desc}
                  </p>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h4 className="ax-mono" style={{ fontSize: 11, color: "#8A93A6", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                    Granular Spatial Scores
                  </h4>
                  
                  {/* Detailed Scores Bars */}
                  {[
                    { label: "School Access Proximity", val: selectedProperty.school, color: C.blue },
                    { label: "Commute Efficiency", val: selectedProperty.traffic, color: C.purple },
                    { label: "Safety and Foot Traffic Index", val: selectedProperty.safety, color: C.blue },
                    { label: "Future Investment Growth Signal", val: selectedProperty.investment, color: "#2EBE7B" }
                  ].map((sc, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                        <span style={{ fontWeight: 500 }}>{sc.label}</span>
                        <span className="ax-mono" style={{ fontWeight: 700, color: sc.color }}>{sc.val}/100</span>
                      </div>
                      <div style={{ width: "100%", height: 6, borderRadius: 10, background: "#E8ECF3", overflow: "hidden" }}>
                        <div style={{ width: `${sc.val}%`, height: "100%", borderRadius: 10, background: sc.color, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  ))}
                  
                  <div style={{ height: 1, background: C.border, margin: "6px 0" }} />
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 10.5, color: "#8A93A6" }} className="ax-mono">TARGET BUDGET FIT</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }} className="ax-mono">
                        {selectedProperty.budgetScore}% Fit
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, color: "#8A93A6" }} className="ax-mono">ESTIMATED PRICE</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: C.purple }} className="ax-mono">
                        {selectedProperty.price >= 100 ? `₹${(selectedProperty.price/100).toFixed(2)}Cr` : `₹${selectedProperty.price}L`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
