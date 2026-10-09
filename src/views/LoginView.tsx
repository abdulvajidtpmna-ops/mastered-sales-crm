import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setSubmitting(true);
    try {
      await login(email, password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col justify-center items-center px-4 py-12">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-[#072A4A] to-[#0B3A66] -z-0" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Logo & Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C9A227] text-[#072A4A] font-black text-3xl shadow-xl mb-3 border-2 border-[#E7D58A]">
            M
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            MASTERED CRM
          </h1>
          <p className="text-xs font-medium text-[#E7D58A] uppercase tracking-widest mt-1">
            Mastered Skill Academy
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-xl border border-slate-200/80 p-7 sm:p-8 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#17212B]">Sign in to your account</h2>
            <p className="text-xs text-[#64748B] mt-1">
              Enter your authorized staff email and password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@masteredacademy.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66] focus:border-transparent transition-all shadow-xs"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3A66] focus:border-transparent transition-all shadow-xs"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-[#0B3A66] hover:bg-[#072A4A] text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-98"
            >
              {submitting || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#E7D58A]" />
                </>
              )}
            </button>
          </form>

          {/* Secure Backend Note */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Authenticated with Mastered Skill Academy Database</span>
          </div>
        </div>

        {/* Brand Footer */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          © {new Date().getFullYear()} Mastered Skill Academy. All rights reserved.
        </p>
      </div>
    </div>
  );
};
