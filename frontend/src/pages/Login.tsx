import { useState, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ShieldCheck, User, Lock, Eye, EyeOff } from "lucide-react";
import { API_BASE_URL } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/bG9naW4`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("user", JSON.stringify({ 
          username: data.username, 
          role: data.role, 
          modules: data.modules 
        }));
        // Save JWT token for API authentication
        if (data.token) {
          localStorage.setItem("auth_token", data.token);
        }
        window.location.href = "/";
      } else {
        setLoading(false);
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setLoading(false);
      setError("Network error. Please try again later.");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-50">
      {/* LEFT PANEL - BRANDING (Matches Sidebar style) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center bg-[#1e293b] p-12 text-white relative overflow-hidden shadow-2xl z-10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-400 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col items-center max-w-md text-center">
          <div className="bg-white p-4 rounded-full shadow-lg mb-8">
            <img src="/logo.png" alt="Civic Connect" className="w-24 h-24 object-contain rounded-full" />
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Civic <span className="text-cyan-400">Connect</span>
          </h1>
          
          {/* Removed descriptive text per user request */}

          <div className="w-full mt-4 flex items-center justify-center">
            <p className="text-cyan-400/80 text-sm font-semibold tracking-[0.2em] uppercase">
              One App â€¢ One City â€¢ Better Together
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10">
          
          {/* Mobile Logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <div className="bg-slate-50 p-3 rounded-full shadow-sm border border-slate-100">
              <img src="/logo.png" alt="Civic Connect" className="w-16 h-16 object-contain rounded-full" />
            </div>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 mb-6">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">Secure Login</span>
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Please sign in to access your dashboard.</p>
          </div>

          <div className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#1e293b] hover:bg-slate-800 text-white font-medium text-sm py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Sign In"
              )}
            </button>
          </div>

          {/* Removed demo credentials block per user request */}
          
        </div>
      </div>
    </div>
  );
};

export default Login;

