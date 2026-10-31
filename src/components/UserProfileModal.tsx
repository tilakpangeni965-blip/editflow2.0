import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PaymentTransaction } from '../types';
import { formatCurrency, toNepaliNumerals } from '../utils/formatters';
import {
  X,
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Save,
  LogOut,
  Receipt,
  ExternalLink,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPricing: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenPricing,
}) => {
  const { language, t } = useLanguage();
  const { user, token, logout, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'payments'>('profile');
  const [fullName, setFullName] = useState(user?.name || '');
  const [instituteName, setInstituteName] = useState(user?.instituteName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Payments from PostgreSQL
  const [paymentsList, setPaymentsList] = useState<PaymentTransaction[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setInstituteName(user.instituteName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && token) {
      fetchUserPayments();
    }
  }, [isOpen, token]);

  const fetchUserPayments = async () => {
    if (!token) return;
    setLoadingPayments(true);
    try {
      const res = await fetch('/api/payments/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.transactions) {
          setPaymentsList(data.transactions);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          instituteName,
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const isSubscriptionActive = user.plan !== 'free' && (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#041534]/70 backdrop-blur-sm animate-in fade-in duration-150 font-bilingual">
      <div className="relative w-full max-w-2xl bg-white border border-[#dde9ff] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#0f1c2d] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#75777f] hover:text-[#0f1c2d] hover:bg-[#eff4ff] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header & Avatar */}
        <div className="flex items-center gap-4 pb-6 border-b border-[#dde9ff]">
          <div className="w-14 h-14 rounded-2xl bg-[#1b2a4a] text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-[#dde9ff]">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#0f1c2d] font-heading">{user.name}</h2>
              {isSubscriptionActive ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {user.plan === 'institute_unlimited' ? 'Unlimited' : 'Pro Active'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#eff4ff] text-[#45464e] border border-[#dde9ff]">
                  Free Tier (Pending/Inactive)
                </span>
              )}
            </div>
            <p className="text-xs text-[#45464e]">{user.email}</p>
            <p className="text-xs text-[#75777f] flex items-center gap-1.5 mt-0.5">
              <Building className="w-3.5 h-3.5 text-[#b6152e]" />
              <span>{user.instituteName || 'नेपाल शिक्षा मञ्च'}</span>
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-[#dde9ff]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-[#1b2a4a] text-white shadow-sm'
                : 'text-[#45464e] hover:bg-[#eff4ff]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>व्यक्तिगत विवरण (Profile)</span>
          </button>

          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'subscription'
                ? 'bg-[#1b2a4a] text-white shadow-sm'
                : 'text-[#45464e] hover:bg-[#eff4ff]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>सदस्यता स्थिति (Subscription)</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'bg-[#1b2a4a] text-white shadow-sm'
                : 'text-[#45464e] hover:bg-[#eff4ff]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>भुक्तानी इतिहास (Payments)</span>
          </button>
        </div>

        {/* Tab 1: Profile Information */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4">
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>तपाईंको विवरण सफलतापूर्वक सुरक्षित गरियो!</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                  पुरा नाम (Full Name):
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                  इमेल ठेगाना (Email):
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-gray-100 border border-[#c5c6cf] rounded-xl text-xs text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                  इन्स्टिच्युट / विद्यालयको नाम:
                </label>
                <input
                  type="text"
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  placeholder="श्री ज्ञानोदय माध्यमिक विद्यालय / PEA"
                  className="w-full px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                  सम्पर्क फोन / मोबाइल:
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#dde9ff]">
              <span className="text-[11px] text-[#75777f]">
                दर्ता मिति: {new Date(user.createdAt).toLocaleDateString('ne-NP')}
              </span>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[#1b2a4a] hover:bg-[#041534] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 font-heading"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'सुरक्षित गर्दै...' : 'विवरण सुरक्षित गर्नुहोस्'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Subscription Details */}
        {activeTab === 'subscription' && (
          <div className="space-y-4 pt-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#eff4ff] border border-[#dde9ff] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#45464e] uppercase font-bold tracking-wider">हालको योजना</span>
                  <h3 className="text-lg font-bold text-[#1b2a4a] font-heading">
                    {user.plan === 'institute_unlimited'
                      ? 'इन्स्टिच्युट अनलिमिटेड (Institute Unlimited)'
                      : user.plan === 'teacher_pro'
                      ? 'शिक्षक प्रो (Teacher Pro)'
                      : 'नि:शुल्क (Free Tier)'}
                  </h3>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    isSubscriptionActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {isSubscriptionActive ? 'सक्रिय (ACTIVE)' : 'सक्रिय छैन (PENDING)'}
                  </span>
                </div>
              </div>

              {user.planExpiresAt && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#dde9ff]/80">
                  <span className="text-[#45464e]">म्याद सकिने मिति:</span>
                  <span className="font-mono font-bold text-[#0f1c2d]">
                    {new Date(user.planExpiresAt).toLocaleDateString('ne-NP')} ({new Date(user.planExpiresAt).toLocaleDateString()})
                  </span>
                </div>
              )}
            </div>

            {/* Access Control Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#e07a1e]" />
                <span>सुरक्षित पहुँच नियम (Subscription Access Policy):</span>
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                खाता सिर्जना गर्दैमा सशुल्क सुविधाहरू स्वतः सक्रिय हुँदैनन्। केवल माछापुच्छ्रे बैंक वा वालेटबाट रकम प्रमाणित भएको र OTP पुष्टि भएको खण्डमा मात्र प्रो फिचर उपलब्ध हुन्छन्।
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  onClose();
                  onOpenPricing();
                }}
                className="px-6 py-2.5 rounded-xl bg-[#e07a1e] hover:bg-[#c96815] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all font-heading"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>योजना अपग्रेड वा नवीकरण गर्नुहोस्</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Payment History */}
        {activeTab === 'payments' && (
          <div className="space-y-4 pt-4 text-xs">
            {loadingPayments ? (
              <div className="py-8 text-center text-[#75777f]">
                <div className="w-5 h-5 rounded-full border-2 border-[#1b2a4a] border-t-transparent animate-spin mx-auto mb-2" />
                <span>डेटाबेसमा भुक्तानी खोज्दै...</span>
              </div>
            ) : paymentsList.length === 0 ? (
              <div className="py-8 text-center text-[#75777f] space-y-2">
                <Receipt className="w-8 h-8 text-[#c5c6cf] mx-auto" />
                <p>अहिलेसम्म कुनै भुक्तानी रेकर्ड छैन।</p>
              </div>
            ) : (
              <div className="divide-y divide-[#dde9ff] border border-[#dde9ff] rounded-2xl overflow-hidden bg-white">
                {paymentsList.map((txn) => (
                  <div key={txn.id} className="p-3.5 flex items-center justify-between hover:bg-[#eff4ff]/40 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0f1c2d]">{txn.invoiceNumber}</span>
                        <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 font-mono">
                          {txn.gateway}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#75777f]">
                        {new Date(txn.createdAt).toLocaleDateString('ne-NP')} • {txn.payerName}
                      </p>
                      {txn.bankUtrReference && (
                        <p className="text-[10px] text-emerald-700 font-mono">
                          Bank UTR: {txn.bankUtrReference}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <span className="font-mono font-black text-sm text-[#b6152e] block">
                        {formatCurrency(txn.amountNpr, language)}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        txn.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : txn.status === 'OTP_SENT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {txn.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer with Logout */}
        <div className="mt-6 pt-4 border-t border-[#dde9ff] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="px-4 py-2 rounded-xl text-[#b6152e] hover:bg-[#ffdad9]/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>सुरक्षित लगआउट (Sign Out)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-[#dde9ff] text-[#45464e] hover:bg-[#eff4ff] text-xs font-medium"
          >
            बन्द गर्नुहोस्
          </button>
        </div>
      </div>
    </div>
  );
};
