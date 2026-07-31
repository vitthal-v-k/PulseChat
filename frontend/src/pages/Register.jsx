import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BsLockFill, BsEnvelopeFill, BsPersonFill } from 'react-icons/bs';
import Logo from '../components/Logo';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.register(formData);
      login(res.data);
      navigate('/home');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && typeof data.errors === 'object') {
        const errorMessages = Object.entries(data.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(' | ');
        setError(errorMessages);
      } else {
        setError(data?.message || 'Registration failed. Check input details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#0b141a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111b21] border border-[#222d34] rounded-2xl shadow-2xl p-8 text-gray-100">
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 mb-3 p-1 rounded-2xl flex items-center justify-center shadow-lg">
            <Logo className="w-full h-full" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100">Create Account</h2>
          <p className="text-xs text-gray-400 mt-1">Join PulseChat community today</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded-xl mb-6 text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Username</label>
            <div className="relative flex items-center bg-[#202c33] border border-[#222d34] rounded-xl px-3.5 py-2.5 focus-within:border-teal-500">
              <BsPersonFill className="text-gray-500 mr-3" size={16} />
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

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name</label>
            <div className="relative flex items-center bg-[#202c33] border border-[#222d34] rounded-xl px-3.5 py-2.5 focus-within:border-teal-500">
              <BsPersonFill className="text-gray-500 mr-3" size={16} />
              <input
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Email Address</label>
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
            <label className="block text-xs font-semibold text-gray-400 mb-1">Password</label>
            <div className="relative flex items-center bg-[#202c33] border border-[#222d34] rounded-xl px-3.5 py-2.5 focus-within:border-teal-500">
              <BsLockFill className="text-gray-500 mr-3" size={16} />
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Register'}
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
