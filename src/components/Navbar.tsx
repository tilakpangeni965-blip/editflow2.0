import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  GraduationCap,
  Sparkles,
  Globe,
  Upload,
  CreditCard,
  User as UserIcon,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Film,
  ChevronDown,
  Sun,
  Moon,
  Home,
} from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'projects' | 'workbench' | 'billing' | 'ai_editor';
  onNavigate: (view: 'landing' | 'projects' | 'billing' | 'ai_editor') => void;
  onOpenUpload: () => void;
  onOpenAuth: () => void;
  onOpenPricing: () => void;
  onOpenVerifyModal: () => void;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenUpload,
  onOpenAuth,
  onOpenPricing,
  onOpenVerifyModal,
  onOpenProfile,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, logout, switchDemoUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPlanBadge = () => {
    if (!user) return null;
    if (user.plan === 'institute_unlimited') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#5c2d91]/20 text-[#d6e3fb] border border-[#5c2d91]/40">
          <Sparkles className="w-3 h-3 text-[#d6e3fb]" />
          {language === 'ne' ? 'इन्स्टिच्युट अनलिमिटेड' : 'Institute Unlimited'}
        </span>
      );
    }
    if (user.plan === 'teacher_pro') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e07a1e]/20 text-[#ffdcc5] border border-[#e07a1e]/40">
          <Sparkles className="w-3 h-3 text-[#e07a1e]" />
          {language === 'ne' ? 'शिक्षक प्रो (Pro)' : 'Teacher Pro'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1b2a4a]/80 text-[#8392b7] border border-[#8392b7]/30">
        {language === 'ne' ? 'नि:शुल्क' : 'Free Starter'}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1b2a4a] text-white shadow-md border-b border-[#041534]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 text-left group focus:outline-none"
            title="Editflow Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#b6152e] to-[#dc3545] flex items-center justify-center shadow-md shadow-[#041534]/50 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white tracking-tight font-heading">
                  Editflow
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#b6152e]/30 text-[#ffdad9] border border-[#b6152e]/50 font-semibold tracking-wide">
                  {language === 'ne' ? 'शिक्षा स्टुडियो' : 'Nepal'}
                </span>
              </div>
              <p className="text-[11px] text-[#8392b7] hidden sm:block truncate max-w-xs font-bilingual">
                {t('brandTagline')}
              </p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#243143]">
            <button
              onClick={() => onNavigate('landing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'landing'
                  ? 'bg-[#041534] text-white shadow-inner font-bold'
                  : 'text-[#cddbf2] hover:text-white hover:bg-[#041534]/50'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-[#ffdad9]" />
              <span>{language === 'ne' ? 'अवलोकन' : 'Overview'}</span>
            </button>
            <button
              onClick={() => onNavigate('projects')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'projects' || currentView === 'workbench'
                  ? 'bg-[#041534] text-white shadow-inner font-bold'
                  : 'text-[#cddbf2] hover:text-white hover:bg-[#041534]/50'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-[#ffdad9]" />
              <span>{t('navProjects')}</span>
            </button>
            <button
              onClick={() => onNavigate('ai_editor')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'ai_editor'
                  ? 'bg-[#041534] text-white shadow-inner font-bold border border-[#b6152e]/60'
                  : 'text-[#cddbf2] hover:text-white hover:bg-[#041534]/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ffdcc5]" />
              <span>{language === 'ne' ? 'AI सम्पादन' : 'AI Editor'}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#b6152e] text-white font-bold">New</span>
            </button>
            <button
              onClick={onOpenPricing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#cddbf2] hover:text-white hover:bg-[#041534]/50 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#ffdcc5]" />
              <span>{t('navPricing')}</span>
            </button>
            <button
              onClick={() => onNavigate('billing')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentView === 'billing'
                  ? 'bg-[#041534] text-white shadow-inner font-bold'
                  : 'text-[#cddbf2] hover:text-white hover:bg-[#041534]/50'
              }`}
            >
              <span>{t('navBilling')}</span>
            </button>
          </nav>
        </div>


        {/* Right Action Items */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-2 rounded-lg bg-[#041534] hover:bg-[#243143] border border-[#384668] text-[#eaf1ff] transition-colors shadow-sm"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#ffe500]" />
            ) : (
              <Moon className="w-4 h-4 text-[#ffdcc5]" />
            )}
          </button>

          {/* Language Toggle (Nepali / English) */}
          <button
            onClick={toggleLanguage}
            title={language === 'ne' ? 'Switch to English' : 'नेपाली भाषामा बदल्नुहोस्'}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#041534] hover:bg-[#243143] border border-[#384668] text-xs font-semibold text-[#eaf1ff] transition-colors shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-[#ffb3b2]" />
            <span>{language === 'ne' ? 'English' : 'नेपाली'}</span>
          </button>

          {/* Upload CTA (Rhododendron Red) */}
          <button
            onClick={onOpenUpload}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#b6152e] hover:bg-[#92001f] text-white text-xs font-semibold shadow-md shadow-[#041534]/40 transition-all active:scale-95 font-heading"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t('navUpload')}</span>
          </button>

          {/* User Profile / Auth State */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#041534] hover:bg-[#243143] border border-[#384668] text-left transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-[#b6152e] text-white flex items-center justify-center font-bold text-xs border border-[#ffdad9]/30">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden xl:block">
                  <p className="text-xs font-semibold text-white truncate max-w-[120px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-[#8392b7] truncate max-w-[120px]">
                    {user.instituteName || user.email}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#8392b7] ml-0.5" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#dde9ff] text-[#0f1c2d] shadow-2xl p-3 z-50 text-sm animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="pb-3 border-b border-[#e2e8f0]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#0f1c2d]">{user.name}</span>
                      {user.plan === 'institute_unlimited' ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#5c2d91]/15 text-[#5c2d91] border border-[#5c2d91]/30">
                          Unlimited
                        </span>
                      ) : user.plan === 'teacher_pro' ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#e07a1e]/15 text-[#e07a1e] border border-[#e07a1e]/30">
                          Pro
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#45464e]">
                          Free
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#45464e] truncate">{user.email}</p>
                    <p className="text-xs text-[#45464e] mt-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-[#b6152e] shrink-0" />
                      <span className="truncate">{user.instituteName}</span>
                    </p>
                  </div>

                  {/* Verification Status */}
                  <div className="py-2.5 border-b border-[#e2e8f0]">
                    {user.isEmailVerified ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{t('navVerified')}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenVerifyModal();
                        }}
                        className="w-full flex items-center justify-between text-xs text-[#a35200] bg-[#fff8ed] hover:bg-[#ffeed3] px-2.5 py-1.5 rounded-lg border border-[#ffdcc5] transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-[#e07a1e] shrink-0" />
                          <span>{t('navUnverified')}</span>
                        </span>
                        <span className="underline font-semibold text-[#b6152e]">
                          {language === 'ne' ? 'कोड हाल्नुहोस्' : 'Verify'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Quick Demo Account Switcher */}
                  <div className="py-2.5 border-b border-[#e2e8f0] text-xs">
                    <p className="text-[11px] font-bold text-[#45464e] uppercase tracking-wider mb-2">
                      {t('authDemoLoginPrompt')}
                    </p>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          switchDemoUser(0);
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#eff4ff] text-[#0f1c2d] flex items-center justify-between"
                      >
                        <span>रमेश अधिकारी (Teacher)</span>
                        <span className="text-[10px] bg-[#e07a1e]/15 text-[#e07a1e] px-1.5 py-0.5 rounded font-bold">
                          Pro
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          switchDemoUser(1);
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#eff4ff] text-[#0f1c2d] flex items-center justify-between"
                      >
                        <span>PEA Academy (Institute)</span>
                        <span className="text-[10px] bg-[#5c2d91]/15 text-[#5c2d91] px-1.5 py-0.5 rounded font-bold">
                          Unlimited
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Plan Upgrade & Logout */}
                  <div className="pt-2 space-y-1">
                    {onOpenProfile && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenProfile();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#0f1c2d] hover:bg-[#eff4ff] transition-colors font-medium text-xs"
                      >
                        <UserIcon className="w-4 h-4 text-[#1b2a4a]" />
                        <span>{language === 'ne' ? 'मेरो खाता तथा प्रोफाइल (Profile)' : 'My Account & Profile'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenPricing();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#0f1c2d] hover:bg-[#eff4ff] transition-colors font-medium text-xs"
                    >
                      <Sparkles className="w-4 h-4 text-[#e07a1e]" />
                      <span>{t('billingTitle').slice(0, 24)}...</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#b6152e] hover:bg-[#ffdad9]/30 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('navLogout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#041534] hover:bg-[#243143] text-white text-xs font-semibold border border-[#384668] shadow-sm transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#ffb3b2]" />
              <span>{t('navLogin')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
