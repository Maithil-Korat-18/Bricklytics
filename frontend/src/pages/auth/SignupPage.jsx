import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, ShieldCheck, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/ToastContext';
import Logo from '../../components/common/Logo';
import { ROUTES } from '../../constants/routes';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    role: 'buyer',
    terms_accepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const calculatePasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 10) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pass)) score += 25;
    return score;
  };

  const strength = calculatePasswordStrength(formData.password);

  const getStrengthText = () => {
    if (strength === 0) return '';
    if (strength <= 25) return 'Weak';
    if (strength <= 50) return 'Fair';
    if (strength <= 75) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (strength <= 25) return 'bg-red-500';
    if (strength <= 50) return 'bg-amber-500';
    if (strength <= 75) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required.';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required.';
    if (!formData.email.trim()) newErrors.email = 'Email address is required.';
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone number is required.';
    if (!formData.password) newErrors.password = 'Password is required.';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';

    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match.';
    }

    if (!formData.terms_accepted) {
      newErrors.terms_accepted = 'You must accept the terms and conditions.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        password: formData.password,
        role: formData.role,
      };

      const res = await signup(payload);
      showSuccess(res.message || 'Account created! Please verify your email.');
      
      // Redirect to Email Verification screen
      navigate(ROUTES.VERIFY_EMAIL, { state: { email: formData.email } });
    } catch (err) {
      const apiErrors = err.response?.data?.errors || {};
      const msg = err.response?.data?.message || err.message || 'Signup failed.';
      setErrors(apiErrors);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block mb-4">
          <Logo imgClassName="w-12 h-12 object-contain" textClassName="text-2xl font-bold text-slate-900 tracking-tight" />
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Create your Bricklytics account
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-card-soft sm:rounded-2xl border border-slate-200/80 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Role Selection Toggle */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                I want to register as a
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: 'buyer' }))}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
                    formData.role === 'buyer'
                      ? 'border-blue-600 bg-blue-50 text-blue-600 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Buyer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: 'seller' }))}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
                    formData.role === 'seller'
                      ? 'border-blue-600 bg-blue-50 text-blue-600 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Seller</span>
                </button>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
                {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
                {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>}
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
                {errors.phone_number && <p className="mt-1 text-xs text-red-600">{errors.phone_number}</p>}
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
                {errors.confirm_password && <p className="mt-1 text-xs text-red-600">{errors.confirm_password}</p>}
              </div>
            </div>

            {/* Password Strength Meter */}
            {formData.password && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Password strength:</span>
                  <span className="font-semibold">{getStrengthText()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${getStrengthColor()}`} style={{ width: `${strength}%` }} />
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2 pt-2">
              <input
                id="terms_accepted"
                name="terms_accepted"
                type="checkbox"
                checked={formData.terms_accepted}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded mt-0.5"
              />
              <label htmlFor="terms_accepted" className="text-xs text-slate-600 leading-normal">
                I agree to the{' '}
                <a href="#" className="text-blue-600 font-semibold hover:underline">Terms & Conditions</a>{' '}
                and <a href="#" className="text-blue-600 font-semibold hover:underline">Privacy Policy</a>.
              </label>
            </div>
            {errors.terms_accepted && <p className="text-xs text-red-600">{errors.terms_accepted}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
