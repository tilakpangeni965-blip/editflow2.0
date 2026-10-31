import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  CheckCircle,
  Mail,
  Lock,
  Building,
  Phone,
  User,
  KeyRound,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'verify' | 'forgot_password';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { language, t } = useLanguage();
  const {
    loginWithEmailPassword,
    signupWithEmailPassword,
    loginWithGoogle,
    sendResetPassword,
    verifyEmail,
    resendVerificationCode,
    latestVerificationCode,
    switchDemoUser,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'verify' | 'forgot_password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'teacher' | 'institute_admin' | 'tutor'>('teacher');
  const [instituteName, setInstituteName] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const res = await loginWithEmailPassword(email, password);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || (language === 'ne' ? 'लगइन असफल भयो। इमेल र पासवर्ड जाँच गर्नुहोस्।' : 'Login failed. Please check your credentials.'));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const res = await signupWithEmailPassword({
      email,
      password,
      name,
      role,
      instituteName,
      phone,
    });
    setLoading(false);

    if (res.success) {
      setMode('verify');
      setSuccessMsg(
        language === 'ne'
          ? 'खाता सफलतापूर्वक सिर्जना भयो! प्रमाणीकरण इमेल पठाइएको छ।'
          : 'Account created! Verification link and security code have been sent.'
      );
    } else {
      setErrorMsg(res.error || (language === 'ne' ? 'दर्ता असफल भयो वा इमेल पहिल्यै प्रयोगमा छ।' : 'Signup failed.'));
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await loginWithGoogle();
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Google login failed');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg(language === 'ne' ? 'कृपया आफ्नो इमेल ठेगाना लेख्नुहोस्' : 'Please enter your email address');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await sendResetPassword(email);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(
        language === 'ne'
          ? 'पासवर्ड रिसेट लिङ्क तपाईंको इमेलमा पठाइएको छ।'
          : 'Password reset link sent to your email.'
      );
    } else {
      setErrorMsg(res.error || 'Password reset request failed');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const res = await verifyEmail(verificationCode);
    setLoading(false);
    if (res.success) {
      setSuccessMsg(language === 'ne' ? 'इमेल सफलतापूर्वक प्रमाणित भयो!' : 'Email successfully verified!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || (language === 'ne' ? 'अवैध प्रमाणीकरण कोड' : 'Invalid code'));
    }
  };

  const handleResend = async () => {
    const code = await resendVerificationCode();
    setSuccessMsg(
      language === 'ne'
        ? `नयाँ प्रमाणीकरण इमेल पठाइयो। (कोड: ${code || '123456'})`
        : `Verification email resent. (Code: ${code || '123456'})`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#041534]/70 backdrop-blur-sm animate-in fade-in duration-150 font-bilingual">
      <div className="relative w-full max-w-md bg-white border border-[#dde9ff] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#0f1c2d] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#75777f] hover:text-[#0f1c2d] hover:bg-[#eff4ff] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#ffdad9] text-[#b6152e] border border-[#ffb3b2] flex items-center justify-center shadow-sm">
            {mode === 'verify' ? (
              <KeyRound className="w-6 h-6" />
            ) : mode === 'forgot_password' ? (
              <Lock className="w-6 h-6" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#0f1c2d] font-heading">
            {mode === 'login'
              ? (language === 'ne' ? 'एडिटफ्लोमा लगइन गर्नुहोस्' : 'Log In to Editflow')
              : mode === 'signup'
              ? (language === 'ne' ? 'नयाँ खाता सिर्जना गर्नुहोस्' : 'Create an Account')
              : mode === 'forgot_password'
              ? (language === 'ne' ? 'पासवर्ड रिसेट गर्नुहोस्' : 'Reset Your Password')
              : t('authVerifyTitle')}
          </h2>
          <p className="text-xs text-[#45464e] mt-1">
            {mode === 'login'
              ? (language === 'ne' ? 'आफ्ना सुरक्षित भिडियो तथा पाठ्य-सामग्रीहरू व्यवस्थापन गर्नुहोस्' : 'Access your private lectures and exam packs')
              : mode === 'signup'
              ? (language === 'ne' ? 'नेपालका शिक्षक तथा परीक्षा कोचिङ इन्स्टिच्युटहरूका लागि' : 'For educators and coaching academies in Nepal')
              : mode === 'forgot_password'
              ? (language === 'ne' ? 'आफ्नो दर्ता गरिएको इमेल ठेगाना हाल्नुहोस्' : 'Enter your registered email address')
              : t('authVerifySub')}
          </p>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google OAuth Quick Sign-in */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-[#c5c6cf] hover:bg-[#eff4ff] text-xs font-bold text-[#0f1c2d] flex items-center justify-center gap-2.5 transition-all shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{mode === 'login' ? 'Google बाट लगइन गर्नुहोस्' : 'Google बाट दर्ता गर्नुहोस्'}</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#dde9ff]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-[#75777f]">
                <span className="bg-white px-2">वा इमेल पासवर्ड प्रयोग गर्नुहोस्</span>
              </div>
            </div>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                इमेल ठेगाना (Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#75777f]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@shikshya.edu.np"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[#0f1c2d] font-heading">
                  पासवर्ड (Password)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setMode('forgot_password');
                  }}
                  className="text-[11px] text-[#b6152e] hover:underline"
                >
                  पासवर्ड बिर्सनुभयो?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#75777f]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-[#1b2a4a] hover:bg-[#041534] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 font-heading"
            >
              {loading ? 'प्रमाणीकरण गर्दै...' : 'लगइन गर्नुहोस् (Log In)'}
            </button>

            {/* Quick Demo Logins */}
            <div className="pt-3 border-t border-[#dde9ff] text-center">
              <span className="text-[11px] text-[#75777f] block mb-1.5 font-medium">
                द्रुत परीक्षणका लागि नमुना खाता रोज्नुहोस्:
              </span>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    switchDemoUser(0);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#dde9ff] text-[#1b2a4a] text-[11px] font-semibold border border-[#dde9ff]"
                >
                  शिक्षक खाता (SEE/+2)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    switchDemoUser(1);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#dde9ff] text-[#5c2d91] text-[11px] font-semibold border border-[#dde9ff]"
                >
                  इन्स्टिच्युट खाता (Lok Sewa)
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-[#45464e] pt-2">
              खाता छैन?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('signup');
                }}
                className="font-bold text-[#b6152e] hover:underline"
              >
                नयाँ खाता खोल्नुहोस्
              </button>
            </p>
          </form>
        )}

        {/* 2. SIGNUP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                पुरा नाम (Full Name)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-[#75777f]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="रमेश अधिकारी"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                इमेल ठेगाना (Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#75777f]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@shikshya.edu.np"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                पासवर्ड (Password)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#75777f]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="न्यूनतम ६ अक्षर"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                  भूमिका (Role)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d]"
                >
                  <option value="teacher">शिक्षक (Teacher)</option>
                  <option value="institute_admin">इन्स्टिच्युट प्रमुख</option>
                  <option value="tutor">ट्युटर / क्रिएटर</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                  मोबाइल (फोन)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full px-3 py-2 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                इन्स्टिच्युट वा कलेजको नाम
              </label>
              <input
                type="text"
                value={instituteName}
                onChange={(e) => setInstituteName(e.target.value)}
                placeholder="श्री ज्ञानोदय माध्यमिक विद्यालय / PEA Academy"
                className="w-full px-3.5 py-2 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-[#b6152e] hover:bg-[#92001f] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 font-heading"
            >
              {loading ? 'दर्ता गर्दै...' : 'खाता सिर्जना गर्नुहोस् (Sign Up)'}
            </button>

            <p className="text-center text-xs text-[#45464e] pt-2">
              पहिल्यै खाता छ?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('login');
                }}
                className="font-bold text-[#1b2a4a] hover:underline"
              >
                लगइन गर्नुहोस्
              </button>
            </p>
          </form>
        )}

        {/* 3. FORGOT PASSWORD */}
        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                दर्ता गरिएको इमेल ठेगाना:
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#75777f]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@shikshya.edu.np"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#1b2a4a] hover:bg-[#041534] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 font-heading"
            >
              {loading ? 'पठाउँदै...' : 'रिसेट लिङ्क पठाउनुहोस् (Send Reset Link)'}
            </button>

            <p className="text-center text-xs text-[#45464e] pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('login');
                }}
                className="font-bold text-[#1b2a4a] hover:underline"
              >
                ← लगइनमा फर्कनुहोस्
              </button>
            </p>
          </form>
        )}

        {/* 4. VERIFY EMAIL FORM */}
        {mode === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
              <p className="font-semibold">इमेल प्रमाणीकरण (Email Verification):</p>
              <p className="text-[11px] text-blue-800 mt-0.5">
                हामीले तपाईंको इमेलमा प्रमाणीकरण लिङ्क र ६-अङ्कको सुरक्षा कोड पठाएका छौँ। इमेलको लिङ्कमा क्लिक गर्न सक्नुहुन्छ वा तल कोड हाल्न सक्नुहुन्छ:
              </p>
              {latestVerificationCode && (
                <div className="mt-2 font-mono text-[11px] font-bold text-blue-950">
                  परीक्षण कोड (Demo Code): <strong>{latestVerificationCode}</strong>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                ६-अङ्कको सुरक्षा कोड:
              </label>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="१२३४५६"
                className="w-full px-3.5 py-3 bg-[#f8f9ff] border-2 border-[#1b2a4a] rounded-xl text-lg font-mono font-black text-center tracking-widest text-[#0f1c2d] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 font-heading"
            >
              {loading ? 'जाँच गर्दै...' : 'इमेल प्रमाणित गर्नुहोस्'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={handleResend}
                className="text-[#b6152e] hover:underline font-semibold"
              >
                कोड पुनः पठाउनुहोस्
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#45464e] hover:underline"
              >
                लगइनमा फर्कनुहोस्
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
