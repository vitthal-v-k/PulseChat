import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BsLockFill, BsEnvelopeFill, BsPersonFill, BsEyeFill, BsEyeSlashFill, BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';
import Logo from '../components/Logo';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

// ── Password strength engine ──────────────────────────────────────────────────
const CHECKS = [
  { key: 'length',    label: 'At least 8 characters',           test: (p) => p.length >= 8 },
  { key: 'upper',     label: 'At least one uppercase letter',    test: (p) => /[A-Z]/.test(p) },
  { key: 'lower',     label: 'At least one lowercase letter',    test: (p) => /[a-z]/.test(p) },
  { key: 'number',    label: 'At least one number',              test: (p) => /[0-9]/.test(p) },
  { key: 'special',   label: 'At least one special character',   test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const getStrength = (password) => {
  const passed = CHECKS.filter((c) => c.test(password)).length;
  if (passed === 0) return { score: 0, label: '',         color: 'bg-gray-700',   text: 'text-gray-400' };
  if (passed === 1) return { score: 1, label: 'Weak',     color: 'bg-red-500',    text: 'text-red-400'  };
  if (passed === 2) return { score: 2, label: 'Fair',     color: 'bg-orange-400', text: 'text-orange-400' };
  if (passed === 3) return { score: 3, label: 'Good',     color: 'bg-yellow-400', text: 'text-yellow-400' };
  if (passed === 4) return { score: 4, label: 'Strong',   color: 'bg-teal-400',   text: 'text-teal-400' };
  return               { score: 5, label: 'Very Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
};

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', fullName: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const strength = useMemo(() => getStrength(formData.password), [formData.password]);
  const allPassed = CHECKS.every((c) => c.test(formData.password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side strong-password guard
    if (!allPassed) {
      setError('Please create a stronger password that meets all requirements below.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register(formData);
      login(res.data);
      navigate('/home');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && typeof data.errors === 'object') {
        setError(Object.entries(data.errors).map(([f, m]) => `${f}: ${m}`).join(' | '));
      } else {
        setError(data?.message || 'Registration failed. Check input details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen bg-[#0b141a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111b21] border border-[#222d34] rounded-2xl shadow-2xl p-8 text-gray-100">

        {/* Logo + heading */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 mb-3 p-1 rounded-2xl flex items-center justify-center shadow-lg">
            <Logo className="w-full h-full" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100">Create Account</h2>
          <p className="text-xs text-gray-400 mt-1">Join PulseChat community today</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded-xl mb-5 text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Username</label>
            <div className="flex items-center bg-[#202c33] border border-[#222d34] rounded-xl px-3.5 py-2.5 focus-within:border-teal-500">
              <BsPersonFill className="text-gray-500 mr-3 shrink-0" size={16} />
              <input
                type="text"
                required
                placeholder="johndoe"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name</label>
            <div className="flex items-center bg-[#202c33] border border-[#222d34] rounded-xl px-3.5 py-2.5 focus-within:border-teal-500">
              <BsPersonFill className="text-gray-500 mr-3 shrink-0" size={16} />
              <input
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Email Address</label>
            <div className="flex items-center bg-[#202c33] border border-[#222d34] rounded-xl px-3.5 py-2.5 focus-within:border-teal-500">
              <BsEnvelopeFill className="text-gray-500 mr-3 shrink-0" size={16} />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Password</label>
            <div className="relative flex items-center bg-[#202c33] border border-[#222d34] rounded-xl px-3.5 py-2.5 focus-within:border-teal-500">
              <BsLockFill className="text-gray-500 mr-3 shrink-0" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setPasswordFocused(true)}
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 text-gray-400 hover:text-teal-400 transition-colors cursor-pointer p-1"
                tabIndex={-1}
              >
                {showPassword ? <BsEyeSlashFill size={15} /> : <BsEyeFill size={15} />}
              </button>
            </div>

            {/* Strength bar — only shown once user starts typing */}
            {formData.password.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {/* Bar */}
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.score ? strength.color : 'bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                {/* Label */}
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-bold ${strength.text}`}>{strength.label}</span>
                  <span className="text-[10px] text-gray-500">
                    {CHECKS.filter((c) => c.test(formData.password)).length}/{CHECKS.length} requirements met
                  </span>
                </div>
              </div>
            )}

            {/* Requirements checklist — shown when field is focused or has a value */}
            {(passwordFocused || formData.password.length > 0) && (
              <ul className="mt-2 space-y-1 bg-[#0d1f27] border border-[#222d34] rounded-xl p-3">
                {CHECKS.map((c) => {
                  const ok = c.test(formData.password);
                  return (
                    <li key={c.key} className="flex items-center gap-2">
                      {ok
                        ? <BsCheckCircleFill size={11} className="text-emerald-400 shrink-0" />
                        : <BsXCircleFill    size={11} className="text-gray-600 shrink-0" />}
                      <span className={`text-[11px] ${ok ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {c.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? 'Creating Account…' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          Already registered?{' '}
          <Link to="/login" className="text-teal-400 font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
