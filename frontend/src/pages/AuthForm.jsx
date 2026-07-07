import React, { useState } from "react";
import { User, ArrowRight, CheckCircle2 } from "lucide-react";
import { C, API_BASE_URL } from "../config/constants";
import { getCsrfToken } from "../utils/api";
import LiquidButton from "../components/LiquidButton";
import EmailField from "../components/EmailField";
import PasswordField from "../components/PasswordField";

export default function AuthForm({ mode, onDone }) {
  const [flow, setFlow] = useState(mode);
  const [signupStep, setSignupStep] = useState(1);
  const [resetStep, setResetStep] = useState(1);
  const [name, setName] = useState("");
  const [role, setRole] = useState("buyer");
  
  // Separate email states by flow
  const [loginEmail, setLoginEmail] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [completeMode, setCompleteMode] = useState(null);
  const [error, setError] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [resetToken, setResetToken] = useState("");

  const loginEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail);
  const signupEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail);
  const resetEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail);
  
  const passwordValid = password.length >= 8;
  const totalSignupSteps = 4;
  const totalResetSteps = 3;

  const resetState = (nextFlow) => {
    setLoading(false);
    setSuccess(false);
    setCompleteMode(null);
    setError("");
    setCode("");
    setPassword("");
    setConfirm("");
    setVerificationToken("");
    setResetToken("");
    
    // Clear all email states on tab/flow change
    setLoginEmail("");
    setSignupEmail("");
    setResetEmail("");
    
    if (nextFlow === "signup") {
      setSignupStep(1);
    }
    if (nextFlow === "forgot") {
      setResetStep(1);
    }
  };

  const enterFlow = (nextFlow) => {
    setFlow(nextFlow);
    resetState(nextFlow);
  };

  const completeFlow = (nextMode) => {
    setSuccess(true);
    setCompleteMode(nextMode);
    setTimeout(() => onDone(nextMode), 1000);
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    if (!loginEmailValid || !passwordValid || loading) {
      setError("Enter a valid email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRFToken": csrf,
        },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user_name", data.user.name);
      localStorage.setItem("user_email", data.user.email);
      completeFlow("login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendSignupCode = async (e) => {
    e.preventDefault();
    if (!name.trim() || !signupEmailValid || loading) {
      setError("Add your name and a valid email first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_BASE_URL}/auth/register/send-code/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRFToken": csrf,
        },
        credentials: "include",
        body: JSON.stringify({ email: signupEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }
      setSignupStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifySignupCode = async (e) => {
    e.preventDefault();
    if (!code.trim() || loading) {
      setError("Verification code is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_BASE_URL}/auth/register/verify-code/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRFToken": csrf,
        },
        credentials: "include",
        body: JSON.stringify({ email: signupEmail, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Code verification failed.");
      }
      setVerificationToken(data.verification_token);
      setSignupStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitSignupPassword = async (e) => {
    e.preventDefault();
    if (!passwordValid || confirm !== password || loading) {
      setError("Set and confirm a password with at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_BASE_URL}/auth/register/complete/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRFToken": csrf,
        },
        credentials: "include",
        body: JSON.stringify({
          verification_token: verificationToken,
          name,
          password,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Signup failed.");
      }
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user_name", data.user.name);
      localStorage.setItem("user_email", data.user.email);
      completeFlow("signup");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendResetCode = async (e) => {
    e.preventDefault();
    if (!resetEmailValid || loading) {
      setError("Add a valid email to continue.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_BASE_URL}/auth/forgot/send-code/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRFToken": csrf,
        },
        credentials: "include",
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset code.");
      }
      setResetStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyResetCode = async (e) => {
    e.preventDefault();
    if (!code.trim() || loading) {
      setError("Verification code is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_BASE_URL}/auth/forgot/verify-code/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRFToken": csrf,
        },
        credentials: "include",
        body: JSON.stringify({ email: resetEmail, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed.");
      }
      setResetToken(data.reset_token);
      setResetStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitResetPassword = async (e) => {
    e.preventDefault();
    if (!passwordValid || confirm !== password || loading) {
      setError("Set and confirm a new password with at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_BASE_URL}/auth/forgot/reset-password/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRFToken": csrf,
        },
        credentials: "include",
        body: JSON.stringify({
          reset_token: resetToken,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user_name", data.user.name);
      localStorage.setItem("user_email", data.user.email);
      completeFlow("forgot");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSuccess = () => (
    <div style={{ textAlign: "center", padding: "28px 0" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.blueGlow, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", animation: "ax-pop .5s cubic-bezier(.2,.8,.3,1) both" }}>
        <CheckCircle2 size={30} color={C.blue} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 800, marginTop: 20 }}>
        {completeMode === "signup" ? "Verification complete" : completeMode === "forgot" ? "Password updated" : "Welcome back"}
      </h3>
      <p style={{ fontSize: 14, color: "#5B6270", marginTop: 8 }}>
        {completeMode === "signup"
          ? "Taking you to onboarding..."
          : "Taking you to your dashboard..."}
      </p>
    </div>
  );

  const renderLogin = () => (
    <form onSubmit={submitLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 2 }}>Welcome back</h2>
      <p className="ax-auth-note">Log in to continue your property search.</p>
      <EmailField value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
      <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#5B6270", cursor: "pointer" }}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ accentColor: C.blue }} />
          Remember me
        </label>
        <button type="button" className="ax-inline-link" onClick={() => enterFlow("forgot")}>Forgot password?</button>
      </div>
      {error && <div className="ax-auth-note" style={{ color: "#B42318" }}>{error}</div>}
      <LiquidButton loading={loading} type="submit">
        {loading ? null : <>Log in <ArrowRight size={16} /></>}
      </LiquidButton>
      <p style={{ textAlign: "center", fontSize: 13.5, color: "#5B6270", marginTop: 4 }}>
        Don’t have an account?{" "}
        <button type="button" className="ax-inline-link" onClick={() => enterFlow("signup")}>Sign up</button>
      </p>
    </form>
  );

  const renderSignup = () => (
    <form style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="ax-stepper">
        {Array.from({ length: totalSignupSteps }, (_, index) => (
          <span key={index} className={index + 1 === signupStep ? "active" : "inactive"} />
        ))}
      </div>
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 2 }}>Create your account</h2>
        <p className="ax-auth-note">Step {signupStep} of {totalSignupSteps}. Start with your details, then verify your email.</p>
      </div>

      {signupStep === 1 && (
        <>
          <div>
            <label className="ax-label">Name</label>
            <div style={{ position: "relative" }}>
              <User size={16} color="#8A93A6" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="ax-input" style={{ paddingLeft: 38 }} />
            </div>
          </div>
          <div>
            <label className="ax-label">I am a</label>
            <div className="ax-role-grid">
              {[{ key: "buyer", label: "Buyer" }, { key: "seller", label: "Seller" }].map((item) => (
                <div key={item.key} className={`ax-role-card ${role === item.key ? "selected" : ""}`} onClick={() => setRole(item.key)}>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
          {error && <div className="ax-auth-note" style={{ color: "#B42318" }}>{error}</div>}
          <LiquidButton type="button" loading={loading} onClick={() => {
            if (!name.trim()) {
              setError("Add your name to continue.");
              return;
            }
            setError("");
            setSignupStep(2);
          }}>
            Continue <ArrowRight size={16} />
          </LiquidButton>
        </>
      )}

      {signupStep === 2 && (
        <>
          <EmailField value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
          <p className="ax-auth-note">We’ll send a verification code to this email. You can change it on the next screen if needed.</p>
          {error && <div className="ax-auth-note" style={{ color: "#B42318" }}>{error}</div>}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={() => { setError(""); setSignupStep(1); }} className="ax-btn-secondary" style={{ width: "auto", padding: "13px 22px" }}>Back</button>
            <div style={{ flex: 1 }}>
              <LiquidButton type="button" loading={loading} onClick={sendSignupCode}>Send verification code <ArrowRight size={16} /></LiquidButton>
            </div>
          </div>
        </>
      )}

      {signupStep === 3 && (
        <>
          <div>
            <label className="ax-label">Verification code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" className="ax-input" inputMode="numeric" maxLength={6} />
          </div>
          <p className="ax-auth-note">Enter the 6-digit verification code sent to your email.</p>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <button type="button" className="ax-inline-link" onClick={() => { setError(""); setSignupStep(2); }}>Change email</button>
          </div>
          {error && <div className="ax-auth-note" style={{ color: "#B42318" }}>{error}</div>}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={() => { setError(""); setSignupStep(2); }} className="ax-btn-secondary" style={{ width: "auto", padding: "13px 22px" }}>Back</button>
            <div style={{ flex: 1 }}>
              <LiquidButton type="button" loading={loading} onClick={verifySignupCode}>Verify code <ArrowRight size={16} /></LiquidButton>
            </div>
          </div>
        </>
      )}

      {signupStep === 4 && (
        <>
          <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" showStrengthHint />
          <PasswordField label="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
          {error && <div className="ax-auth-note" style={{ color: "#B42318" }}>{error}</div>}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={() => { setError(""); setSignupStep(3); }} className="ax-btn-secondary" style={{ width: "auto", padding: "13px 22px" }}>Back</button>
            <div style={{ flex: 1 }}>
              <LiquidButton type="button" loading={loading} onClick={submitSignupPassword}>Set password <ArrowRight size={16} /></LiquidButton>
            </div>
          </div>
        </>
      )}
    </form>
  );

  const renderForgot = () => (
    <form style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="ax-stepper">
        {Array.from({ length: totalResetSteps }, (_, index) => (
          <span key={index} className={index + 1 === resetStep ? "active" : "inactive"} />
        ))}
      </div>
      <div>
        <button type="button" className="ax-inline-link" onClick={() => enterFlow("login")} style={{ marginBottom: 10 }}>Back to login</button>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 2 }}>Reset password</h2>
        <p className="ax-auth-note">Step {resetStep} of {totalResetSteps}. Verify your email before choosing a new password.</p>
      </div>

      {resetStep === 1 && (
        <>
          <EmailField value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
          <p className="ax-auth-note">If your email has changed, enter the new one here before requesting the code.</p>
          {error && <div className="ax-auth-note" style={{ color: "#B42318" }}>{error}</div>}
          <LiquidButton type="button" loading={loading} onClick={sendResetCode}>Send verification code <ArrowRight size={16} /></LiquidButton>
        </>
      )}

      {resetStep === 2 && (
        <>
          <div>
            <label className="ax-label">Verification code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" className="ax-input" inputMode="numeric" maxLength={6} />
          </div>
          <p className="ax-auth-note">Code sent to <b style={{ color: C.text }}>{resetEmail || "your email"}</b>. Need a different address? Change it now.</p>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <button type="button" className="ax-inline-link" onClick={() => { setError(""); setResetStep(1); }}>Change email</button>
          </div>
          {error && <div className="ax-auth-note" style={{ color: "#B42318" }}>{error}</div>}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={() => { setError(""); setResetStep(1); }} className="ax-btn-secondary" style={{ width: "auto", padding: "13px 22px" }}>Back</button>
            <div style={{ flex: 1 }}>
              <LiquidButton type="button" loading={loading} onClick={verifyResetCode}>Verify code <ArrowRight size={16} /></LiquidButton>
            </div>
          </div>
        </>
      )}

      {resetStep === 3 && (
        <>
          <PasswordField label="New password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" showStrengthHint />
          <PasswordField label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
          {error && <div className="ax-auth-note" style={{ color: "#B42318" }}>{error}</div>}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={() => { setError(""); setResetStep(2); }} className="ax-btn-secondary" style={{ width: "auto", padding: "13px 22px" }}>Back</button>
            <div style={{ flex: 1 }}>
              <LiquidButton type="button" loading={loading} onClick={submitResetPassword}>Set new password <ArrowRight size={16} /></LiquidButton>
            </div>
          </div>
        </>
      )}
    </form>
  );

  return (
    <div className="ax-auth-panel" style={{ width: "100%" }}>
      <div className="ax-auth-panel-inner">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
          <div className="ax-auth-switcher" role="tablist" aria-label="Authentication mode">
            {[{ key: "login", label: "Log In" }, { key: "signup", label: "Sign Up" }].map((item) => (
              <button key={item.key} type="button" className={flow === item.key ? "active" : ""} onClick={() => enterFlow(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {success ? renderSuccess() : flow === "signup" ? renderSignup() : flow === "forgot" ? renderForgot() : renderLogin()}
      </div>
    </div>
  );
}
