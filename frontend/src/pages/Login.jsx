import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BsLockFill, BsEnvelopeFill, BsEyeFill, BsEyeSlashFill } from 'react-icons/bs';
import Logo from '../components/Logo';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(formData);
      login(res.data);
      navigate('/home');
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Server is waking up, please wait a moment and try again.');
      } else {
        const data = err.response?.data;
        if (data?.errors && typeof data.errors === 'object') {
          const errorMessages = Object.entries(data.errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(' | ');
          setError(errorMessages);
        } else {
          setError(data?.message || 'Login failed. Please check credentials.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#0b141a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111b21] border border-[#222d34] rounded-2xl shadow-2xl p-8 text-gray-100">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 mb-3 p-1 rounded-2xl flex items-center justify-center shadow-lg">
            <Logo className="w-full h-full" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100">Welcome Back</h2>
          <p className="text-xs text-gray-400 mt-1">Sign in to continue to PulseChat</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded-xl mb-6 text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address</label>
            <div className="relative flex items-center bg-[#202c33] border border-[#222d34] rounded-xl px-3.5 py-2.5 focus-within:border-teal-500">
              <BsEnvelopeFill className="text-gray-500 mr-3" size={16} />
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

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Password</label>
            <div className="relative flex items-center bg-[#202c33] border border-[#222d34] rounded-xl px-3.5 py-2.5 focus-within:border-teal-500">
              <BsLockFill className="text-gray-500 mr-3 flex-shrink-0" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-teal-400 transition-colors cursor-pointer p-1"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <BsEyeSlashFill size={16} /> : <BsEyeFill size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="accent-teal-500 rounded"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-teal-400 font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </div>

      {/* ── Premium Creator Badge ──────────────────────────── */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center select-none pointer-events-none">
        <div className="creator-badge">
          <div className="creator-badge-inner">
            {/* Pulsing dot */}
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>

            {/* Code bracket prefix */}
            <span className="text-purple-400 font-mono font-bold text-xs opacity-80">&lt;/&gt;</span>

            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-white/35">
              created by
            </span>

            {/* Shimmering name */}
            <span className="
              text-sm font-black tracking-widest
              bg-gradient-to-r from-teal-300 via-cyan-200 via-purple-300 to-pink-300
              bg-[length:300%_auto] bg-clip-text text-transparent
              animate-[shimmer_2s_linear_infinite]
            ">
              Vitthal
            </span>

            {/* Stars */}
            <span className="text-pink-400 animate-pulse text-xs">✦</span>
            <span className="text-cyan-400 animate-pulse text-xs" style={{ animationDelay: '0.5s' }}>✦</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
