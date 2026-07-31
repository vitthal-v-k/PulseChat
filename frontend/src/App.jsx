import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

import SplashScreen from './pages/SplashScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Logo from './components/Logo';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0b141a] text-gray-100 p-6 select-none">
          <div className="bg-[#111b21] border border-[#222d34] p-6 rounded-2xl max-w-md text-center shadow-xl space-y-4">
            <div className="w-14 h-14 mx-auto mb-2 p-1 flex items-center justify-center">
              <Logo className="w-full h-full" />
            </div>
            <h2 className="text-lg font-bold text-gray-100">PulseChat</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Something went wrong while rendering the view.
            </p>
            {this.state.error && (
              <div className="text-left bg-black/50 p-3 rounded-xl border border-red-500/30 text-red-400 text-xs font-mono break-all max-h-40 overflow-y-auto">
                <p className="font-bold text-red-300 mb-1">Error Details:</p>
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#0b141a] text-teal-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <Routes>
                <Route path="/" element={<SplashScreen />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                  path="/home/*"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
