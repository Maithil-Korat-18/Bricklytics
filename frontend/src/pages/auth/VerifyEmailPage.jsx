import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/authApi';
import { useToast } from '../../components/common/ToastContext';
import Logo from '../../components/common/Logo';
import { ROUTES } from '../../constants/routes';

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes timer in seconds

  useEffect(() => {
    if (timeLeft > 0 && !isVerified) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isVerified]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) value = value[0];
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus next input box
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await verifyEmail(email, fullCode);
      setIsVerified(true);
      showSuccess(res.message || 'Email verified successfully!');

      setTimeout(() => {
        const role = res.user?.role?.toLowerCase();
        if (role === 'seller') {
          navigate(ROUTES.SELLER_DASHBOARD, { replace: true });
        } else {
          navigate(ROUTES.BUYER_DASHBOARD, { replace: true });
        }
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification failed. Check your code.';
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      showError('Please enter your email address.');
      return;
    }

    setResending(true);
    setErrorMsg('');
    try {
      const res = await authApi.resendCode({ email });
      showSuccess(res.message || 'New verification code sent!');
      setTimeLeft(600);
      setCode(['', '', '', '', '', '']);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code.';
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block mb-4">
          <Logo imgClassName="w-12 h-12 object-contain" textClassName="text-2xl font-bold text-slate-900 tracking-tight" />
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Verify Your Email Address
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
          We sent a 6-digit verification code to <span className="font-semibold text-slate-800">{email || 'your email'}</span>.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-card-soft sm:rounded-2xl border border-slate-200/80 sm:px-10 text-center">
          {isVerified ? (
            <div className="space-y-4 py-4 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Email Verified!</h3>
              <p className="text-sm text-slate-500">Your account is active. Redirecting to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {!email && (
                <div>
                  <label className="block text-left text-sm font-semibold text-slate-700 mb-1">Enter your email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center space-x-2 text-left">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Enter 6-Digit Code
                </label>
                <div className="flex justify-between gap-2">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-input-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-extrabold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Code expires in: <strong className="text-blue-600">{formatTime(timeLeft)}</strong></span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-colors flex items-center space-x-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>Resend Code</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || code.join('').length !== 6}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
