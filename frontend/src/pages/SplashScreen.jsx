import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem('token');
      if (token) {
        navigate('/home');
      } else {
        navigate('/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="w-screen h-screen bg-[#111b21] flex flex-col items-center justify-between py-12 text-gray-100 select-none">
      <div />

      <div className="flex flex-col items-center gap-4 animate-bounce">
        <div className="w-24 h-24 p-1 rounded-3xl flex items-center justify-center shadow-2xl">
          <Logo className="w-full h-full" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-rose-400 bg-clip-text text-transparent">
          PulseChat
        </h1>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Secured by End-to-End Encryption</span>
      </div>
    </div>
  );
};

export default SplashScreen;
