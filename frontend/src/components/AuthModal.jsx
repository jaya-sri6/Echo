import { useState } from 'react';
import { authLogin, authSignup } from '../services/api';

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('ankit@echo.ai');
  const [password, setPassword] = useState('echo123');
  const [name, setName] = useState('Ankit (Support Lead)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await authLogin(email, password);
      } else {
        res = await authSignup(email, password, name);
      }
      localStorage.setItem('echo_token', res.access_token);
      localStorage.setItem('echo_user', JSON.stringify(res.user));
      onSuccess(res.user, res.access_token);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickDemo() {
    setEmail('ankit@echo.ai');
    setPassword('echo123');
    setMode('login');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans select-none">
      <div className="w-full max-w-md bg-[#171717] border border-[#2e2e2e] rounded-lg shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#737373] hover:text-[#fafafa] text-sm p-1 transition"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-6 rounded bg-[#10a37f] flex items-center justify-center text-white font-bold text-xs">
            E
          </div>
          <span className="font-mono text-sm font-semibold text-[#fafafa]">ECHO AUTHENTICATION</span>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-1 bg-[#0d0d0d] p-1 rounded border border-[#2e2e2e] mb-5 text-xs font-mono">
          <button
            type="button"
            className={`py-1.5 rounded transition ${
              mode === 'login' ? 'bg-[#212121] text-[#fafafa] font-semibold' : 'text-[#737373] hover:text-[#ececec]'
            }`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`py-1.5 rounded transition ${
              mode === 'signup' ? 'bg-[#212121] text-[#fafafa] font-semibold' : 'text-[#737373] hover:text-[#ececec]'
            }`}
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded bg-[#2a1215] border border-[#ef4444]/40 text-[#ef4444] text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-mono text-[#a3a3a3] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Support Lead"
                className="w-full rounded bg-[#0d0d0d] border border-[#2e2e2e] px-3 py-2 text-xs text-[#fafafa] focus:border-[#10a37f] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-[#a3a3a3] mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lead@echo.ai"
              className="w-full rounded bg-[#0d0d0d] border border-[#2e2e2e] px-3 py-2 text-xs text-[#fafafa] focus:border-[#10a37f] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#a3a3a3] mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded bg-[#0d0d0d] border border-[#2e2e2e] px-3 py-2 text-xs text-[#fafafa] focus:border-[#10a37f] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded bg-[#10a37f] hover:bg-[#1a7f64] text-white font-medium text-xs transition duration-150 active:scale-98 shadow-sm flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="font-mono">Authenticating...</span>
            ) : (
              <span>{mode === 'login' ? 'Sign In to Echo' : 'Create Echo Account'}</span>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-[#2e2e2e] flex items-center justify-between text-[11px] font-mono text-[#737373]">
          <span>Seeded default: ankit@echo.ai</span>
          <button
            type="button"
            onClick={handleQuickDemo}
            className="text-[#10a37f] hover:underline"
          >
            Use Lead Profile
          </button>
        </div>
      </div>
    </div>
  );
}
