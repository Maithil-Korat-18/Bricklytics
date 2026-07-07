import React, { useState, useEffect } from "react";
import GlobalStyles from "./styles/GlobalStyles";
import AuthShell, { LeftVisual } from "./pages/AuthShell";
import AuthForm from "./pages/AuthForm";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";

export default function AuthExperience({ initialMode = "login", initialPhase = "auth", onNavigate, userProfile, setUserProfile }) {
  const [mode, setMode] = useState(initialMode);
  const [phase, setPhase] = useState(initialPhase);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setPhase(initialPhase);
  }, [initialPhase]);

  const handleDone = (finishedMode) => {
    if (finishedMode === "signup") {
      setPhase("onboarding");
      if (onNavigate) onNavigate("onboarding");
    } else {
      setPhase("dashboard");
      if (onNavigate) onNavigate("dashboard");
    }
  };

  const handleFinishOnboarding = (profile) => {
    if (setUserProfile) {
      setUserProfile(profile);
    }
    setPhase("dashboard");
    if (onNavigate) onNavigate("dashboard");
  };

  const handleReset = () => {
    setPhase("auth");
    setMode("login");
    if (onNavigate) onNavigate("login");
  };

  return (
    <div className="ax-root" style={{ minHeight: "100vh" }}>
      <GlobalStyles />
      {phase === "auth" && (
        <AuthShell onNavigate={onNavigate} mode={mode} setMode={setMode}>
          <LeftVisual />
          <AuthForm mode={mode} onDone={handleDone} />
        </AuthShell>
      )}
      {phase === "onboarding" && <Onboarding onFinish={handleFinishOnboarding} onNavigate={onNavigate} />}
      {phase === "dashboard" && (
        <Dashboard 
          userProfile={userProfile} 
          onReset={handleReset} 
          onNavigate={onNavigate} 
        />
      )}
    </div>
  );
}
